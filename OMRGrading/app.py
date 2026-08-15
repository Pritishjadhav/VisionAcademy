from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import base64
import utils

app = FastAPI()

# Allow Next.js frontend to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def process_omr_image(img_bytes, answers, num_questions, num_choices):
    # Check if the uploaded file is a PDF
    if img_bytes.startswith(b'%PDF'):
        import fitz
        doc = fitz.open(stream=img_bytes, filetype="pdf")
        page = doc.load_page(0)
        pix = page.get_pixmap(dpi=200) # Render at 200 DPI for good quality
        img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
        if pix.n == 4:
            img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
        elif pix.n == 3:
            img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
        elif pix.n == 1:
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    else:
        # Decode as standard image
        print(f"[DEBUG] Processing standard image. Decoding array...")
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
    if img is None or img.size == 0:
        print("[ERROR] Decoded image is None or empty.")
        raise ValueError("Invalid image or PDF file")
    
    print(f"[DEBUG] Image decoded successfully. Shape: {img.shape}")

    heightImg = 700
    widthImg = 700
    img = cv2.resize(img, (widthImg, heightImg))
    imgFinal = img.copy()
    imgGray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    imgBlur = cv2.GaussianBlur(imgGray, (5, 5), 1)
    imgCanny = cv2.Canny(imgBlur, 10, 70)

    contours, hierarchy = cv2.findContours(imgCanny, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    rectCon = utils.rectContour(contours)
    print(f"[DEBUG] Found {len(rectCon)} rectangular contours.")
    
    if len(rectCon) < 2:
        print("[ERROR] Could not detect at least 2 rectangular contours (answer sheet and grade box).")
        raise ValueError("Could not detect the answer sheet or grade box.")

    biggestPoints = utils.getCornerPoints(rectCon[0])
    gradePoints = utils.getCornerPoints(rectCon[1])
    print(f"[DEBUG] Biggest points (sheet): {biggestPoints.shape if hasattr(biggestPoints, 'shape') else 'None'}")
    print(f"[DEBUG] Grade points (grade box): {gradePoints.shape if hasattr(gradePoints, 'shape') else 'None'}")

    if biggestPoints.size != 0 and gradePoints.size != 0:
        biggestPoints = utils.reorder(biggestPoints)
        pts1 = np.float32(biggestPoints)
        pts2 = np.float32([[0, 0], [widthImg, 0], [0, heightImg], [widthImg, heightImg]])
        matrix = cv2.getPerspectiveTransform(pts1, pts2)
        imgWarpColored = cv2.warpPerspective(img, matrix, (widthImg, heightImg))

        gradePoints = utils.reorder(gradePoints)
        
        imgWarpGray = cv2.cvtColor(imgWarpColored, cv2.COLOR_BGR2GRAY)
        imgThresh = cv2.threshold(imgWarpGray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]

        MAX_ROWS = 30
        import math
        num_columns = math.ceil(num_questions / MAX_ROWS)
        if num_columns == 0: num_columns = 1

        ans_w_mm = 170
        col_spacing_mm = 10
        total_spacing_mm = (num_columns - 1) * col_spacing_mm
        col_w_mm = (ans_w_mm - total_spacing_mm) / num_columns
        
        col_w_px = int((col_w_mm / ans_w_mm) * widthImg)
        
        myIndex = []
        imgRawDrawings = np.zeros_like(imgWarpColored)

        for c_idx in range(num_columns):
            questions_in_this_col = min(MAX_ROWS, num_questions - (c_idx * MAX_ROWS))
            if questions_in_this_col <= 0:
                continue
                
            start_x = int(((c_idx * (col_w_mm + col_spacing_mm)) / ans_w_mm) * widthImg)
            end_x = start_x + col_w_px
            
            col_img = imgThresh[:, start_x:end_x]
            # Ensure dimensions are perfectly divisible
            safe_h = (col_img.shape[0] // MAX_ROWS) * MAX_ROWS
            safe_w = (col_img.shape[1] // num_choices) * num_choices
            if safe_h == 0: safe_h = MAX_ROWS
            if safe_w == 0: safe_w = num_choices
            col_img = cv2.resize(col_img, (safe_w, safe_h))
            
            boxes = utils.splitBoxes(col_img, MAX_ROWS, num_choices)
            
            myPixelVal = np.zeros((MAX_ROWS, num_choices))
            countR, countC = 0, 0
            for box in boxes:
                totalPixels = cv2.countNonZero(box)
                myPixelVal[countR][countC] = totalPixels
                countC += 1
                if countC == num_choices:
                    countC = 0
                    countR += 1

            colIndex = []
            for x in range(questions_in_this_col):
                arr = myPixelVal[x]
                myIndexVal = np.where(arr == np.amax(arr))
                idx = myIndexVal[0][0]
                colIndex.append(idx)
                myIndex.append(idx)
                
            col_ans = answers[c_idx*MAX_ROWS : c_idx*MAX_ROWS + questions_in_this_col]
            col_grading = [1 if col_ans[i] == colIndex[i] else 0 for i in range(questions_in_this_col)]
            
            secW = int(col_w_px / num_choices)
            secH = int(heightImg / MAX_ROWS)
            for x in range(questions_in_this_col):
                myAns = colIndex[x]
                cX = start_x + (myAns * secW) + secW // 2
                cY = (x * secH) + secH // 2
                if col_grading[x] == 1:
                    cv2.circle(imgRawDrawings, (cX, cY), 15, (0, 255, 0), cv2.FILLED)
                else:
                    cv2.circle(imgRawDrawings, (cX, cY), 15, (0, 0, 255), cv2.FILLED)
                    correctAns = col_ans[x]
                    cv2.circle(imgRawDrawings, (start_x + (correctAns * secW) + secW // 2, cY),
                               15, (0, 255, 0), cv2.FILLED)

        invMatrix = cv2.getPerspectiveTransform(pts2, pts1)
        imgInvWarp = cv2.warpPerspective(imgRawDrawings, invMatrix, (widthImg, heightImg))
        imgFinal = cv2.addWeighted(imgFinal, 1, imgInvWarp, 1, 0)

        grading = []
        for x in range(num_questions):
            if answers[x] == myIndex[x]:
                grading.append(1)
            else:
                grading.append(0)
        score = (sum(grading) / num_questions) * 100
        print(f"[DEBUG] Computed grading array: {grading}")
        print(f"[DEBUG] Final Score: {score}")

        x, y, w, h = cv2.boundingRect(gradePoints)
        centerX = x + w // 2
        centerY = y + h // 2
        offsetX, offsetY = 15, 10

        if int(score) < 50:
            cv2.putText(imgFinal, f"{int(score)}%", (centerX - 50 + offsetX, centerY + offsetY),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3, cv2.LINE_AA)
        else:
            cv2.putText(imgFinal, f"{int(score)}%", (centerX - 50 + offsetX, centerY + offsetY),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 3, cv2.LINE_AA)
        
        _, buffer = cv2.imencode('.jpg', imgFinal)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return {
            "score": score,
            "graded_image_base64": f"data:image/jpeg;base64,{img_base64}"
        }
    else:
        raise ValueError("Grade and/or answer area not detected properly.")

from fastapi.responses import FileResponse
from generate_pdf import create_omr_pdf
import os

@app.post("/grade")
async def grade_endpoint(
    file: UploadFile = File(...),
    num_questions: int = Form(20),
    num_choices: int = Form(4),
    answer_key: str = Form("1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1")
):
    print(f"[DEBUG] ====== NEW GRADING REQUEST ======")
    print(f"[DEBUG] Filename: {file.filename}")
    print(f"[DEBUG] num_questions: {num_questions}, num_choices: {num_choices}")
    print(f"[DEBUG] raw answer_key: {answer_key}")
    try:
        # Parse answer key
        answers = [int(x.strip()) for x in answer_key.split(",")]
        
        if len(answers) != num_questions:
            print(f"[ERROR] Answer key length mismatch. Expected {num_questions}, got {len(answers)}")
            return {"success": False, "error": f"Answer key must have {num_questions} answers (got {len(answers)})."}

        contents = await file.read()
        print(f"[DEBUG] Read {len(contents)} bytes from file upload.")
        result = process_omr_image(contents, answers, num_questions, num_choices)
        print(f"[DEBUG] Grade processing successful.")
        return {"success": True, "data": result}
    except Exception as e:
        print(f"[ERROR] Exception during grading: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}

@app.get("/generate-omr")
async def generate_omr_endpoint(questions: int = 20, choices: int = 4, title: str = "Vision Academy - OMR Sheet"):
    filename = f"omr_sheet_{questions}q.pdf"
    create_omr_pdf(questions, choices, filename, title)
    return FileResponse(path=filename, filename=filename, media_type='application/pdf')

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
