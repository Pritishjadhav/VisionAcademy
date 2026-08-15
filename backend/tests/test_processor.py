from __future__ import annotations

import base64

import cv2
import numpy as np
import pytest

from app.errors import OmrError
from app.omr.processor import (
    _question_layout,
    _order_points,
    _warp_answer_area,
    decode_document,
    decode_image,
    encode_jpeg_data_url,
    grade_image,
)
from app.omr.sheet_generator import generate_sheet_pdf


def make_sheet(
    answers: list[int | None | tuple[int, int]],
    choices: int,
    *,
    perspective: bool = False,
) -> np.ndarray:
    questions = len(answers)
    width, height = 800, 800
    image = np.full((height, width, 3), 255, dtype=np.uint8)
    left, top, right, bottom = 80, 60, 720, 740
    cv2.rectangle(image, (left, top), (right, bottom), (0, 0, 0), 5)
    cell_width = (right - left) / choices
    cell_height = (bottom - top) / questions

    for row, answer in enumerate(answers):
        for column in range(choices):
            center = (
                round(left + (column + 0.5) * cell_width),
                round(top + (row + 0.5) * cell_height),
            )
            cv2.circle(image, center, 24, (0, 0, 0), 3)
        marked_answers = answer if isinstance(answer, tuple) else (() if answer is None else (answer,))
        for marked_answer in marked_answers:
            selected_center = (
                round(left + (marked_answer - 0.5) * cell_width),
                round(top + (row + 0.5) * cell_height),
            )
            cv2.circle(image, selected_center, 20, (0, 0, 0), cv2.FILLED)

    if perspective:
        source = np.float32([[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]])
        destination = np.float32([[45, 25], [755, 70], [785, 760], [20, 790]])
        matrix = cv2.getPerspectiveTransform(source, destination)
        image = cv2.warpPerspective(image, matrix, (width, height), borderValue=(255, 255, 255))
    return image


def test_grades_a_clear_sheet() -> None:
    answers = [1, 3, 4, 2]
    result = grade_image(make_sheet(answers, 4), 4, 4, answers)
    assert result.score == 100
    assert result.selected_answers == answers
    assert result.correct_count == 4


def test_calculates_partial_score_and_wrong_answers() -> None:
    answer_key = [1, 2, 3, 4]
    marked_answers = [1, 4, 3, 1]
    result = grade_image(make_sheet(marked_answers, 4), 4, 4, answer_key)
    assert result.score == 50
    assert result.correct_count == 2
    assert result.grading == [True, False, True, False]
    assert result.selected_answers == marked_answers


def test_unanswered_rows_are_not_guessed() -> None:
    answer_key = [1, 2, 3, 4]
    result = grade_image(make_sheet([1, None, 3, None], 4), 4, 4, answer_key)
    assert result.selected_answers == [1, None, 3, None]
    assert result.score == 50
    assert result.confidence[1] == 0
    assert result.confidence[3] == 0


def test_completely_blank_sheet_has_no_selected_answers() -> None:
    result = grade_image(make_sheet([None, None, None, None], 4), 4, 4, [1, 2, 3, 4])
    assert result.selected_answers == [None, None, None, None]
    assert result.correct_count == 0
    assert result.score == 0


def test_multiple_marks_are_treated_as_ambiguous() -> None:
    answer_key = [1, 2, 3, 4]
    result = grade_image(make_sheet([1, (2, 4), 3, 4], 4), 4, 4, answer_key)
    assert result.selected_answers[1] is None
    assert result.correct_count == 3
    assert result.score == 75


def test_perspective_photo_is_rectified_and_graded() -> None:
    answers = [4, 1, 3, 2, 2]
    result = grade_image(make_sheet(answers, 4, perspective=True), 5, 4, answers)
    assert result.selected_answers == answers
    assert result.score == 100


def test_wide_upright_answer_area_is_not_rotated() -> None:
    image = np.full((500, 800, 3), 255, dtype=np.uint8)
    cv2.circle(image, (145, 145), 28, (0, 0, 0), cv2.FILLED)
    corners = np.float32([[[100, 100]], [[700, 100]], [[700, 400]], [[100, 400]]])

    warped, ordered = _warp_answer_area(image, corners, 40, 5)

    assert np.array_equal(ordered, _order_points(corners))
    assert warped[:250, :250].mean() < warped[-250:, :250].mean()


@pytest.mark.parametrize(
    ("answers", "choices"),
    [
        ([1, 2, 3, 4, 5], 5),
        ([2, 1, 2, 1, 2, 1], 2),
        ([7, 1, 4], 7),
    ],
)
def test_supports_configured_choice_counts(answers: list[int], choices: int) -> None:
    result = grade_image(make_sheet(answers, choices), len(answers), choices, answers)
    assert result.selected_answers == answers
    assert result.score == 100


def test_graded_output_has_expected_shape() -> None:
    answers = [1, 2, 3, 4]
    result = grade_image(make_sheet(answers, 4), 4, 4, answers)
    assert result.annotated_image.shape[1] == 1000
    assert result.annotated_image.shape[0] >= 600
    assert result.annotated_image.dtype == np.uint8


def test_blank_image_reports_missing_answer_area() -> None:
    blank = np.full((600, 600, 3), 255, dtype=np.uint8)
    with pytest.raises(OmrError) as error:
        grade_image(blank, 4, 4, [1, 2, 3, 4])
    assert error.value.code == "ANSWER_AREA_NOT_FOUND"


def test_decode_and_output_encoding_round_trip() -> None:
    source = make_sheet([1, 2], 4)
    success, encoded = cv2.imencode(".png", source)
    assert success
    decoded = decode_image(encoded.tobytes())
    assert decoded.shape == source.shape

    data_url = encode_jpeg_data_url(decoded)
    prefix, payload = data_url.split(",", 1)
    assert prefix == "data:image/jpeg;base64"
    jpeg = base64.b64decode(payload)
    assert cv2.imdecode(np.frombuffer(jpeg, np.uint8), cv2.IMREAD_COLOR) is not None


def test_decode_rejects_corrupt_image() -> None:
    with pytest.raises(OmrError) as error:
        decode_image(b"not an image")
    assert error.value.code == "INVALID_IMAGE"


def test_decodes_first_page_of_pdf() -> None:
    import fitz

    source = make_sheet([1, 2, 3, 4], 4)
    success, encoded = cv2.imencode(".png", source)
    assert success
    document = fitz.open()
    page = document.new_page(width=800, height=800)
    page.insert_image(page.rect, stream=encoded.tobytes())

    decoded = decode_document(document.tobytes(), "application/pdf")
    result = grade_image(decoded, 4, 4, [1, 2, 3, 4])
    assert result.score == 100


def test_finds_answer_area_when_outer_border_has_small_gaps() -> None:
    answers = [1, 3, 4, 2]
    image = make_sheet(answers, 4)
    cv2.rectangle(image, (370, 55), (430, 70), (255, 255, 255), cv2.FILLED)
    cv2.rectangle(image, (370, 730), (430, 745), (255, 255, 255), cv2.FILLED)

    result = grade_image(image, 4, 4, answers)
    assert result.score == 100


def test_generated_180_question_sheet_is_detectable() -> None:
    image = decode_document(
        generate_sheet_pdf(180, 4, "Vision Academy"),
        "application/pdf",
    )
    result = grade_image(image, 180, 4, [1] * 180)
    assert result.total_questions == 180
    assert result.selected_answers == [None] * 180


def test_generated_20_question_sheet_has_no_false_marks() -> None:
    image = decode_document(
        generate_sheet_pdf(20, 4, "Vision Academy"),
        "application/pdf",
    )
    result = grade_image(image, 20, 4, [1] * 20)
    assert result.selected_answers == [None] * 20


def test_generated_custom_40_question_sheet_has_no_false_marks() -> None:
    image = decode_document(
        generate_sheet_pdf(40, 5, "Custom Practice Test", "CUSTOM"),
        "application/pdf",
    )
    result = grade_image(image, 40, 5, [1] * 40, "CUSTOM")
    assert result.selected_answers == [None] * 40


def test_grades_filled_generated_custom_40_question_sheet() -> None:
    from reportlab.lib.pagesizes import A4

    answers = [(index % 5) + 1 for index in range(40)]
    image = decode_document(
        generate_sheet_pdf(40, 5, "Custom Practice Test", "CUSTOM"),
        "application/pdf",
    )
    page_width, page_height = A4
    scale = image.shape[1] / page_width
    left, right = 31, page_width - 31
    bottom, top = 48, page_height - 294
    columns, rows = 2, 30
    block_width = (right - left) / columns
    row_height = (top - bottom - 18) / rows
    label_width = min(15, block_width * 0.18)
    choice_width = (block_width - label_width - 5) / 5

    for question_index, answer in enumerate(answers):
        column, row = divmod(question_index, rows)
        x = left + column * block_width + label_width + (answer - 0.5) * choice_width
        y = top - 22 - row * row_height
        cv2.circle(
            image,
            (round(x * scale), round((page_height - y) * scale)),
            round(4.2 * scale),
            (0, 0, 0),
            cv2.FILLED,
        )

    result = grade_image(image, 40, 5, answers, "CUSTOM")
    assert result.selected_answers == answers
    assert result.score == 100


def test_jee_question_layout_skips_numerical_slots() -> None:
    columns, rows, slots = _question_layout(60, "JEE")
    assert (columns, rows) == (3, 25)
    assert [slot + 1 for slot in slots] == [
        *range(1, 21),
        *range(26, 46),
        *range(51, 71),
    ]


def test_generated_jee_sheet_has_no_false_marks() -> None:
    image = decode_document(
        generate_sheet_pdf(60, 4, "JEE Mock Test", "JEE"),
        "application/pdf",
    )
    result = grade_image(image, 60, 4, [1] * 60, "JEE")
    assert result.selected_answers == [None] * 60
