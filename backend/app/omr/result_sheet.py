from io import BytesIO

from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas


def generate_result_sheet_pdf(test: dict[str, object], results: list[dict[str, object]]) -> bytes:
    output = BytesIO()
    pdf = canvas.Canvas(output, pagesize=landscape(A4))
    width, height = landscape(A4)
    rows_per_page = 28
    pages = max(1, (len(results) + rows_per_page - 1) // rows_per_page)

    for page_index in range(pages):
        start = page_index * rows_per_page
        page_results = results[start : start + rows_per_page]
        pdf.setFont("Helvetica-Bold", 17)
        pdf.drawString(36, height - 38, str(test["testName"]))
        pdf.setFont("Helvetica", 9)
        pdf.drawString(36, height - 55, f'Batch: {test["batch"]}  |  Date: {test["testDate"]}  |  Exam: {test["examType"]}')
        pdf.drawRightString(width - 36, height - 55, f"Page {page_index + 1} of {pages}")

        headers = ("Rank", "Student", "Marks", "Correct", "Wrong", "Unattempted", "Percentage")
        widths = (42, 260, 80, 70, 70, 90, 90)
        left = 36
        top = height - 82
        row_height = 18
        pdf.setFillColorRGB(0.92, 0.95, 0.98)
        pdf.rect(left, top - row_height, sum(widths), row_height, stroke=0, fill=1)
        pdf.setFillColorRGB(0, 0, 0)
        pdf.setFont("Helvetica-Bold", 8)
        x = left
        for header, column_width in zip(headers, widths):
            pdf.drawString(x + 5, top - 12, header)
            x += column_width

        pdf.setFont("Helvetica", 8)
        for row_index, result in enumerate(page_results):
            y = top - (row_index + 2) * row_height
            if row_index % 2:
                pdf.setFillColorRGB(0.97, 0.98, 0.99)
                pdf.rect(left, y, sum(widths), row_height, stroke=0, fill=1)
                pdf.setFillColorRGB(0, 0, 0)
            values = (
                str(start + row_index + 1),
                str(result["studentName"]),
                f'{result["marksObtained"]} / {test["maxMarks"]}',
                str(result["correctAnswers"]),
                str(result["wrongAnswers"]),
                str(result["unattempted"]),
                f'{result["percentage"]}%',
            )
            x = left
            for value, column_width in zip(values, widths):
                pdf.drawString(x + 5, y + 5, value[:48])
                x += column_width

        pdf.setLineWidth(0.4)
        pdf.rect(left, top - (len(page_results) + 1) * row_height, sum(widths), (len(page_results) + 1) * row_height)
        pdf.showPage()

    pdf.save()
    return output.getvalue()
