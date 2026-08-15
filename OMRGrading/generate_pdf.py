from fpdf import FPDF
import math
import os

def create_omr_pdf(num_questions: int, num_choices: int = 4, filename: str = "omr_sheet.pdf", title: str = "Vision Academy - OMR Sheet"):
    pdf = FPDF(unit="mm", format="A4")
    pdf.add_page()
    pdf.set_auto_page_break(False)
    
    # Optional Logo
    logo_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "logo.jpeg")
    if os.path.exists(logo_path):
        try:
            pdf.image(logo_path, x=15, y=10, w=35)
        except Exception:
            pass

    # 1. Draw Title
    pdf.set_font("helvetica", "B", 16)
    pdf.set_xy(50, 25)
    pdf.cell(90, 10, title, align="C")
    
    # 2. Draw Grade Box (Must be the second largest contour!)
    # Area = 50 * 30 = 1500
    grade_x, grade_y = 140, 20
    grade_w, grade_h = 50, 30
    pdf.set_line_width(1.0) # Thick border
    pdf.rect(grade_x, grade_y, grade_w, grade_h)
    pdf.set_font("helvetica", "", 10)
    pdf.set_xy(grade_x, grade_y)
    pdf.cell(grade_w, 10, "Grade / Score", align="C")
    
    # 3. Draw Answers Boxes
    ans_x, ans_y = 20, 60
    total_ans_w = 170
    ans_h = 220
    
    MAX_ROWS = 30
    num_columns = math.ceil(num_questions / MAX_ROWS)
    if num_columns == 0:
        num_columns = 1
        
    col_spacing = 10 # mm
    total_spacing = (num_columns - 1) * col_spacing
    col_w = (total_ans_w - total_spacing) / num_columns
    
    pdf.set_line_width(1.0)
    pdf.rect(ans_x, ans_y, total_ans_w, ans_h)

    row_height = ans_h / MAX_ROWS
    col_width_bubble = col_w / num_choices
    
    # The bubble should fit inside the cell
    bubble_radius = min(row_height, col_width_bubble) * 0.3
    
    pdf.set_line_width(0.3)
    pdf.set_font("helvetica", "", max(6, int(bubble_radius * 2)))
    
    labels = ["A", "B", "C", "D", "E", "F", "G"]
    
    for q_idx in range(num_questions):
        c_idx = q_idx // MAX_ROWS
        r_idx = q_idx % MAX_ROWS
        
        col_start_x = ans_x + c_idx * (col_w + col_spacing)
        
        # Draw question number just outside the box to the left
        num_x = col_start_x - 12
        num_y = ans_y + (r_idx * row_height) + (row_height/2) - 3
        pdf.set_xy(num_x, num_y)
        pdf.cell(10, 6, f"{q_idx + 1}.", align="R")
        
        for col in range(num_choices):
            # Center of the cell
            cx = col_start_x + (col * col_width_bubble) + (col_width_bubble / 2)
            cy = ans_y + (r_idx * row_height) + (row_height / 2)
            
            # Draw circle
            pdf.ellipse(cx - bubble_radius, cy - bubble_radius, bubble_radius * 2, bubble_radius * 2)
            
            # Draw text inside circle
            pdf.set_xy(cx - bubble_radius, cy - bubble_radius)
            pdf.cell(bubble_radius * 2, bubble_radius * 2, labels[col % len(labels)], align="C")

    # Save PDF
    pdf.output(filename)
    return filename

if __name__ == "__main__":
    create_omr_pdf(20)
