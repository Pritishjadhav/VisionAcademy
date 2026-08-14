from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from app.errors import OmrError


def generate_sheet_pdf(questions: int, choices: int, title: str) -> bytes:
    clean_title = " ".join(title.split()).strip()[:100] or "Vision Academy - OMR Sheet"
    if questions > 60:
        raise OmrError(
            "Printable sheets currently support up to 60 questions per page.",
            code="SHEET_TOO_LONG",
        )

    output = BytesIO()
    pdf = canvas.Canvas(output, pagesize=A4)
    page_width, page_height = A4
    margin = 42

    pdf.setTitle(clean_title)
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawCentredString(page_width / 2, page_height - 42, clean_title)
    pdf.setFont("Helvetica", 9)
    pdf.drawString(margin, page_height - 68, "Student name: __________________________________")
    pdf.drawRightString(page_width - margin, page_height - 68, "Roll no: __________________")

    top = page_height - 92
    bottom = 45
    grid_height = top - bottom
    row_height = grid_height / questions
    number_width = 32
    number_left = margin
    bubbles_left = number_left + number_width
    grid_right = page_width - margin
    choice_width = (grid_right - bubbles_left) / choices

    pdf.setLineWidth(2)
    pdf.rect(bubbles_left, bottom, grid_right - bubbles_left, grid_height)
    pdf.setLineWidth(0.5)
    for choice in range(choices):
        x_center = bubbles_left + (choice + 0.5) * choice_width
        pdf.setFont("Helvetica-Bold", 8)
        pdf.drawCentredString(x_center, top + 4, chr(65 + choice))

    for row in range(questions):
        y_top = top - row * row_height
        y_center = y_top - row_height / 2
        if row:
            pdf.line(bubbles_left, y_top, grid_right, y_top)
        pdf.setFont("Helvetica-Bold", min(9, max(5, row_height * 0.45)))
        pdf.drawRightString(bubbles_left - 8, y_center - 3, str(row + 1))
        for choice in range(choices):
            x_center = bubbles_left + (choice + 0.5) * choice_width
            radius = min(8, max(3, row_height * 0.28))
            pdf.circle(x_center, y_center, radius, stroke=1, fill=0)

    pdf.setFont("Helvetica", 7)
    pdf.drawCentredString(page_width / 2, 25, "Fill one bubble completely for each question. Keep the outer border visible when scanning.")
    pdf.showPage()
    pdf.save()
    return output.getvalue()
