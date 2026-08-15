from __future__ import annotations

import base64
from math import ceil

import cv2
import numpy as np

from app.errors import OmrError
from app.omr.models import GradeResult

MAX_IMAGE_DIMENSION = 6000
WARP_WIDTH = 1000
REFERENCE_GRID_WIDTH_POINTS = 533
def _question_layout(questions: int, exam_type: str) -> tuple[int, int, list[int]]:
    if exam_type == "JEE":
        slots = [
            *range(0, 20),
            *range(25, 45),
            *range(50, 70),
        ]
        return 3, 25, slots
    columns = ceil(questions / 30)
    return columns, min(30, questions), list(range(questions))




def decode_image(content: bytes) -> np.ndarray:
    encoded = np.frombuffer(content, dtype=np.uint8)
    image = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
    if image is None:
        raise OmrError("The uploaded file is not a readable image.", code="INVALID_IMAGE", status_code=415)
    if max(image.shape[:2]) > MAX_IMAGE_DIMENSION:
        raise OmrError(
            f"Image dimensions cannot exceed {MAX_IMAGE_DIMENSION}px.",
            code="IMAGE_TOO_LARGE",
            status_code=413,
        )
    return image


def decode_document(content: bytes, media_type: str = "") -> np.ndarray:
    if media_type == "application/pdf" or content.lstrip().startswith(b"%PDF"):
        try:
            import fitz

            document = fitz.open(stream=content, filetype="pdf")
            if document.needs_pass:
                raise OmrError(
                    "Password-protected PDFs are not supported.",
                    code="PROTECTED_PDF",
                    status_code=415,
                )
            if document.page_count == 0:
                raise OmrError("The PDF has no pages.", code="INVALID_PDF", status_code=415)
            page = document.load_page(0)
            pixmap = page.get_pixmap(dpi=180, alpha=False)
            image = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(
                pixmap.height,
                pixmap.width,
                pixmap.n,
            )
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
            document.close()
            if max(image.shape[:2]) > MAX_IMAGE_DIMENSION:
                raise OmrError(
                    f"PDF page dimensions cannot exceed {MAX_IMAGE_DIMENSION}px.",
                    code="IMAGE_TOO_LARGE",
                    status_code=413,
                )
            return image
        except OmrError:
            raise
        except Exception as error:
            raise OmrError(
                "The uploaded PDF could not be read.",
                code="INVALID_PDF",
                status_code=415,
            ) from error
    return decode_image(content)


def _order_points(points: np.ndarray) -> np.ndarray:
    points = points.reshape(4, 2).astype(np.float32)
    ordered = np.zeros((4, 2), dtype=np.float32)
    coordinate_sum = points.sum(axis=1)
    coordinate_diff = np.diff(points, axis=1).reshape(-1)
    ordered[0] = points[np.argmin(coordinate_sum)]
    ordered[2] = points[np.argmax(coordinate_sum)]
    ordered[1] = points[np.argmin(coordinate_diff)]
    ordered[3] = points[np.argmax(coordinate_diff)]
    return ordered


def _find_answer_area(image: np.ndarray, questions: int = 30) -> np.ndarray:
    detection_image = image
    scale = 1.0
    if max(image.shape[:2]) > 1600:
        scale = 1600 / max(image.shape[:2])
        detection_image = cv2.resize(
            image,
            None,
            fx=scale,
            fy=scale,
            # Linear interpolation preserves the thin printed rectangle better
            # than area resampling on high-resolution phone photos.
            interpolation=cv2.INTER_LINEAR,
        )

    gray = cv2.cvtColor(detection_image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 1)
    # Low-contrast phone photos need a permissive edge threshold. The area
    # and four-corner checks below filter the additional small contours.
    edges = cv2.Canny(blurred, 10, 70)
    retrieval_mode = cv2.RETR_LIST if questions > 30 else cv2.RETR_EXTERNAL
    contours, _ = cv2.findContours(edges, retrieval_mode, cv2.CHAIN_APPROX_SIMPLE)
    minimum_area = detection_image.shape[0] * detection_image.shape[1] * 0.08

    rectangles: list[tuple[float, np.ndarray]] = []
    for contour in contours:
        area = cv2.contourArea(contour)
        if area < minimum_area:
            continue
        perimeter = cv2.arcLength(contour, True)
        approximation = cv2.approxPolyDP(contour, 0.02 * perimeter, True)
        if len(approximation) == 4:
            rectangles.append((area, approximation))

    if not rectangles:
        # Scans and folded sheets often contain small gaps in the outer border.
        # Isolate long horizontal/vertical lines, bridge those gaps, then use
        # their combined extent as the answer-area quadrilateral.
        inverted = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
        horizontal_width = max(20, round(detection_image.shape[1] * 0.08))
        vertical_height = max(20, round(detection_image.shape[0] * 0.08))
        horizontal = cv2.morphologyEx(
            inverted,
            cv2.MORPH_OPEN,
            cv2.getStructuringElement(cv2.MORPH_RECT, (horizontal_width, 1)),
        )
        vertical = cv2.morphologyEx(
            inverted,
            cv2.MORPH_OPEN,
            cv2.getStructuringElement(cv2.MORPH_RECT, (1, vertical_height)),
        )
        lines = cv2.bitwise_or(horizontal, vertical)
        lines = cv2.morphologyEx(
            lines,
            cv2.MORPH_CLOSE,
            cv2.getStructuringElement(
                cv2.MORPH_RECT,
                (max(5, horizontal_width), max(5, vertical_height)),
            ),
        )
        points = cv2.findNonZero(lines)
        if points is not None:
            box = cv2.boxPoints(cv2.minAreaRect(points))
            area = cv2.contourArea(box.astype(np.float32))
            if area >= minimum_area:
                rectangles.append((area, box.reshape(4, 1, 2)))

    if not rectangles:
        raise OmrError(
            "Could not find the answer area. Upload the generated OMR sheet with all four edges visible and minimal glare.",
            code="ANSWER_AREA_NOT_FOUND",
        )
    def rectangle_score(item: tuple[float, np.ndarray]) -> float:
        area, corners = item
        ordered = _order_points(corners)
        width = max(
            np.linalg.norm(ordered[1] - ordered[0]),
            np.linalg.norm(ordered[2] - ordered[3]),
        )
        height = max(
            np.linalg.norm(ordered[3] - ordered[0]),
            np.linalg.norm(ordered[2] - ordered[1]),
        )
        squareness = min(width, height) / max(width, height, 1.0)
        return area * squareness**4

    corners = max(
        rectangles,
        key=rectangle_score if questions > 30 else lambda item: item[0],
    )[1].astype(np.float32)
    return corners / scale


def _warp_answer_area(image: np.ndarray, corners: np.ndarray, questions: int, choices: int) -> tuple[np.ndarray, np.ndarray]:
    ordered = _order_points(corners)
    # Keep the submitted orientation. Inferring rotation from the answer-area
    # aspect ratio is unsafe because multi-column generated grids are wider
    # than they are tall and were being rotated despite upright uploads.
    # A square normalized grid matches the legacy scanner and keeps bubble
    # outlines at a stable pixel thickness across different question counts.
    target_height = WARP_WIDTH
    destination = np.float32(
        [[0, 0], [WARP_WIDTH - 1, 0], [WARP_WIDTH - 1, target_height - 1], [0, target_height - 1]]
    )
    matrix = cv2.getPerspectiveTransform(ordered, destination)
    return cv2.warpPerspective(image, matrix, (WARP_WIDTH, target_height)), ordered


def _cell_ink_counts(
    threshold: np.ndarray,
    questions: int,
    choices: int,
    reference_layout: bool = False,
    exam_type: str = "NEET",
) -> np.ndarray:
    height, width = threshold.shape
    counts = np.zeros((questions, choices), dtype=np.float32)
    columns, rows, slots = _question_layout(questions, exam_type)
    block_width = width / columns
    label_fraction = min(15 * columns / REFERENCE_GRID_WIDTH_POINTS, 0.18) if reference_layout else 0
    trailing_fraction = 5 * columns / REFERENCE_GRID_WIDTH_POINTS if reference_layout else 0
    header_height = round(height * 0.044) if reference_layout else 0
    answer_height = height - header_height
    for question, slot in enumerate(slots):
        question_column, row = divmod(slot, rows)
        y1 = header_height + round(row * answer_height / rows)
        y2 = header_height + round((row + 1) * answer_height / rows)
        choices_left = (question_column + label_fraction) * block_width
        choices_width = block_width * (1 - label_fraction - trailing_fraction)
        for column in range(choices):
            x1 = round(choices_left + column * choices_width / choices)
            x2 = round(choices_left + (column + 1) * choices_width / choices)
            cell = threshold[y1:y2, x1:x2]
            if cell.size:
                counts[question, column] = cv2.countNonZero(cell)
    return counts


def _cell_fill_ratios(
    threshold: np.ndarray,
    questions: int,
    choices: int,
    reference_layout: bool = False,
    exam_type: str = "NEET",
) -> np.ndarray:
    height, width = threshold.shape
    ratios = np.zeros((questions, choices), dtype=np.float32)
    columns, rows, slots = _question_layout(questions, exam_type)
    block_width = width / columns
    label_fraction = min(15 * columns / REFERENCE_GRID_WIDTH_POINTS, 0.18) if reference_layout else 0
    trailing_fraction = 5 * columns / REFERENCE_GRID_WIDTH_POINTS if reference_layout else 0
    header_height = round(height * 0.044) if reference_layout else 0
    answer_height = height - header_height
    for question, slot in enumerate(slots):
        question_column, row = divmod(slot, rows)
        y1 = header_height + round(row * answer_height / rows)
        y2 = header_height + round((row + 1) * answer_height / rows)
        choices_left = (question_column + label_fraction) * block_width
        choices_width = block_width * (1 - label_fraction - trailing_fraction)
        for column in range(choices):
            x1 = round(choices_left + column * choices_width / choices)
            x2 = round(choices_left + (column + 1) * choices_width / choices)
            cell = threshold[y1:y2, x1:x2]
            margin_y = max(2, int(cell.shape[0] * 0.2))
            margin_x = max(2, int(cell.shape[1] * 0.2))
            core = cell[margin_y:-margin_y, margin_x:-margin_x]
            if core.size:
                ratios[question, column] = cv2.countNonZero(core) / core.size
    return ratios


def grade_image(
    image: np.ndarray,
    questions: int,
    choices: int,
    answer_key: list[int],
    exam_type: str = "NEET",
) -> GradeResult:
    corners = _find_answer_area(image, questions)
    warped, _ = _warp_answer_area(image, corners, questions, choices)
    gray = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)
    threshold = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
    top_band = threshold[: max(1, round(threshold.shape[0] * 0.1)), :]
    reference_layout = (
        questions > 30
        or cv2.countNonZero(top_band) / top_band.size < 0.1
    )
    ink_counts = _cell_ink_counts(threshold, questions, choices, reference_layout, exam_type)
    fill_ratios = _cell_fill_ratios(threshold, questions, choices, reference_layout, exam_type)
    median_fill = max(float(np.median(fill_ratios)), 0.001)
    maximum_fill = float(np.max(fill_ratios))
    sheet_has_marks = (
        maximum_fill >= (0.10 if exam_type == "CUSTOM" else 0.22)
        if reference_layout
        else maximum_fill / median_fill >= 1.2
        or (questions < 10 and maximum_fill >= 0.12)
    )

    selected: list[int | None] = []
    confidence: list[float] = []
    grading: list[bool] = []
    annotated = warped.copy()
    layout_columns, layout_rows, layout_slots = _question_layout(questions, exam_type)
    block_width = annotated.shape[1] / layout_columns
    label_fraction = (
        min(15 * layout_columns / REFERENCE_GRID_WIDTH_POINTS, 0.18)
        if reference_layout
        else 0
    )
    trailing_fraction = 5 * layout_columns / REFERENCE_GRID_WIDTH_POINTS if reference_layout else 0
    header_height = annotated.shape[0] * 0.044 if reference_layout else 0
    cell_height = (annotated.shape[0] - header_height) / layout_rows
    choices_width = block_width * (1 - label_fraction - trailing_fraction)
    cell_width = choices_width / choices

    for row in range(questions):
        core_ranked = np.argsort(fill_ratios[row])[::-1]
        best_index = int(core_ranked[0])
        best_core = float(fill_ratios[row, best_index])
        second_core = float(fill_ratios[row, core_ranked[1]]) if choices > 1 else 0.0
        core_separation = best_core - second_core
        core_marked = best_core >= 0.08 and core_separation >= 0.025
        core_ambiguous = (
            choices > 2
            and best_core >= 0.20
            and second_core >= 0.20
            and core_separation < 0.025
        )

        ink_ranked = np.argsort(ink_counts[row])[::-1]
        ink_index = int(ink_ranked[0])
        best_ink = float(ink_counts[row, ink_index])
        second_ink = float(ink_counts[row, ink_ranked[1]]) if choices > 1 else 0.0
        relative_strength = best_ink / max(second_ink, 1.0)
        faint_marked = (
            sheet_has_marks
            and questions >= 10
            and (
                (not core_ambiguous and relative_strength >= 1.03)
                or relative_strength >= 1.15
            )
        )

        marked = sheet_has_marks and (core_marked or faint_marked)
        if not core_marked and faint_marked:
            best_index = ink_index
        selected_answer = best_index + 1 if marked else None
        selected.append(selected_answer)
        signal_confidence = (
            core_separation / 0.2
            if core_marked
            else (relative_strength - 1.0) / 0.5
        )
        confidence.append(
            round(max(0.0, min(1.0, signal_confidence)), 3)
            if marked
            else 0.0
        )
        correct = selected_answer == answer_key[row]
        grading.append(correct)

        layout_column, layout_row = divmod(layout_slots[row], layout_rows)
        center_y = round(header_height + (layout_row + 0.5) * cell_height)
        choices_left = (layout_column + label_fraction) * block_width
        if selected_answer is not None:
            center_x = round(choices_left + (selected_answer - 0.5) * cell_width)
            cv2.circle(annotated, (center_x, center_y), 14, (0, 180, 0) if correct else (0, 0, 230), 4)
        if not correct:
            correct_x = round(choices_left + (answer_key[row] - 0.5) * cell_width)
            cv2.circle(annotated, (correct_x, center_y), 10, (0, 180, 0), 3)

    correct_count = sum(grading)
    score = round((correct_count / questions) * 100, 2)
    return GradeResult(
        score=score,
        correct_count=correct_count,
        total_questions=questions,
        selected_answers=selected,
        grading=grading,
        confidence=confidence,
        annotated_image=annotated,
    )


def encode_jpeg_data_url(image: np.ndarray) -> str:
    success, encoded = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, 90])
    if not success:
        raise OmrError("Could not encode the graded image.", code="ENCODING_FAILED", status_code=500)
    payload = base64.b64encode(encoded.tobytes()).decode("ascii")
    return f"data:image/jpeg;base64,{payload}"
