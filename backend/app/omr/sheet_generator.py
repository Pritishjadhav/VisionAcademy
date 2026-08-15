from io import BytesIO
from math import ceil

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from app.errors import OmrError

QUESTIONS_PER_COLUMN = 30
MAX_PRINTABLE_QUESTIONS = 180


def _bubble(pdf: canvas.Canvas, x: float, y: float, radius: float, label: str = "") -> None:
    pdf.circle(x, y, radius, stroke=1, fill=0)
    if label:
        pdf.setFont("Helvetica", max(3.5, radius * 1.15))
        pdf.drawCentredString(x, y - radius * 0.38, label)


def _draw_registration_marks(pdf: canvas.Canvas, width: float, height: float) -> None:
    inset = 23
    size = 5
    for x in (inset, width - inset - size):
        for y in (inset, height - inset - size):
            pdf.rect(x, y, size, size, stroke=0, fill=1)
    pdf.setLineWidth(0.6)
    pdf.rect(27, 31, width - 54, height - 62)


def _draw_header(pdf: canvas.Canvas, width: float, height: float, title: str) -> None:
    left, right = 31, width - 31
    pdf.setLineWidth(0.6)
    pdf.rect(left, height - 111, right - left, 61)
    pdf.setFont("Helvetica-Bold", 15)
    pdf.drawCentredString(width / 2, height - 78, title)
    pdf.setFillColorRGB(0.12, 0.12, 0.12)
    pdf.roundRect(width / 2 - 50, height - 99, 100, 13, 4, stroke=0, fill=1)
    pdf.setFillColorRGB(1, 1, 1)
    pdf.setFont("Helvetica-Bold", 6)
    pdf.drawCentredString(width / 2, height - 95, "OMR ANSWER SHEET")
    pdf.setFillColorRGB(0, 0, 0)


def _draw_candidate_panel(pdf: canvas.Canvas, width: float, height: float) -> None:
    left, right = 31, width - 31
    top, bottom = height - 118, height - 286
    pdf.setLineWidth(0.5)
    pdf.rect(left, bottom, right - left, top - bottom)

    roll_width = 170
    test_width = 72
    details_left = left + roll_width + test_width
    pdf.line(left + roll_width, bottom, left + roll_width, top)
    pdf.line(details_left, bottom, details_left, top)

    pdf.setFont("Helvetica-Bold", 6)
    pdf.drawString(left + 7, top - 10, "ROLL NO.")
    box_y = top - 27
    box_size = 14
    for column in range(8):
        x = left + 8 + column * 19
        pdf.rect(x, box_y, box_size, 14)
        for digit in range(10):
            _bubble(pdf, x + box_size / 2, box_y - 10 - digit * 11.5, 4.1, str(digit))

    test_left = left + roll_width
    pdf.drawString(test_left + 8, top - 10, "TEST ID")
    for column in range(3):
        x = test_left + 9 + column * 19
        pdf.rect(x, box_y, box_size, 14)
        for digit in range(10):
            _bubble(pdf, x + box_size / 2, box_y - 10 - digit * 11.5, 4.1, str(digit))

    x = details_left + 8
    line_right = right - 8
    pdf.setFont("Helvetica", 6)
    for index, label in enumerate(("Name", "Batch", "Roll No.", "Candidate Sign", "Invigilator Sign")):
        y = top - 13 - index * 25
        pdf.drawString(x, y, label)
        pdf.setDash(1, 1)
        pdf.line(x + 52, y - 1, line_right, y - 1)
        pdf.setDash()

    instruction_top = top - 132
    pdf.setFont("Helvetica-Bold", 5.5)
    pdf.drawString(x, instruction_top, "INSTRUCTIONS FOR FILLING THE SHEET")
    pdf.setFont("Helvetica", 4.7)
    instructions = (
        "1. Use blue or black ballpoint pen only.",
        "2. Fill each bubble completely and neatly.",
        "3. Use the question number printed beside each row.",
        "4. Do not fold, staple, tear, or mark the registration border.",
        "5. Keep the full sheet visible while scanning.",
    )
    for index, instruction in enumerate(instructions):
        pdf.drawString(x, instruction_top - 8 - index * 7, instruction)

    pdf.setFont("Helvetica-Bold", 5)
    pdf.drawString(line_right - 93, bottom + 7, "CORRECT")
    pdf.drawString(line_right - 48, bottom + 7, "WRONG")
    pdf.circle(line_right - 68, bottom + 9, 4, stroke=1, fill=1)
    pdf.circle(line_right - 17, bottom + 9, 4, stroke=1, fill=0)


def _draw_answer_grid(
    pdf: canvas.Canvas,
    width: float,
    height: float,
    questions: int,
    choices: int,
) -> None:
    left, right = 31, width - 31
    bottom, top = 48, height - 294
    columns = ceil(questions / QUESTIONS_PER_COLUMN)
    rows = min(QUESTIONS_PER_COLUMN, questions)
    block_width = (right - left) / columns
    row_height = (top - bottom - 18) / rows
    label_width = min(15, block_width * 0.18)
    choice_width = (block_width - label_width - 5) / choices
    radius = min(4.2, choice_width * 0.31, row_height * 0.31)

    pdf.setLineWidth(1.2)
    pdf.rect(left, bottom, right - left, top - bottom)
    pdf.setLineWidth(0.35)

    for column in range(columns):
        block_left = left + column * block_width
        if column:
            pdf.line(block_left, bottom, block_left, top)
        bubbles_left = block_left + label_width
        for choice in range(choices):
            x = bubbles_left + (choice + 0.5) * choice_width
            pdf.setFont("Helvetica-Bold", 5)
            pdf.drawCentredString(x, top - 11, chr(65 + choice))

        for row in range(rows):
            question = column * QUESTIONS_PER_COLUMN + row + 1
            if question > questions:
                break
            y = top - 22 - row * row_height
            pdf.setFont("Helvetica-Bold", 4.8)
            pdf.drawRightString(bubbles_left - 2, y - 1.5, str(question))
            for choice in range(choices):
                x = bubbles_left + (choice + 0.5) * choice_width
                _bubble(pdf, x, y, radius)

    pdf.setFillColorRGB(0.82, 0.08, 0.33)
    pdf.setFont("Helvetica-Bold", 6)
    pdf.drawCentredString(width / 2, 35, "VISION ACADEMY  |  OMR ANSWER SHEET")
    pdf.setFillColorRGB(0, 0, 0)


def generate_sheet_pdf(questions: int, choices: int, title: str) -> bytes:
    clean_title = " ".join(title.split()).strip()[:100] or "Vision Academy"
    if questions > MAX_PRINTABLE_QUESTIONS:
        raise OmrError(
            f"Printable sheets support up to {MAX_PRINTABLE_QUESTIONS} questions.",
            code="SHEET_TOO_LONG",
        )

    output = BytesIO()
    pdf = canvas.Canvas(output, pagesize=A4)
    width, height = A4
    pdf.setTitle(clean_title)
    _draw_registration_marks(pdf, width, height)
    _draw_header(pdf, width, height, clean_title)
    _draw_candidate_panel(pdf, width, height)
    _draw_answer_grid(pdf, width, height, questions, choices)
    pdf.showPage()
    pdf.save()
    return output.getvalue()
