import base64
import json
import subprocess
import sys
from pathlib import Path

import cv2

from tests.test_processor import make_sheet

BACKEND_ROOT = Path(__file__).parents[1]
CLI = BACKEND_ROOT / "omr_cli.py"


def run_cli(payload: dict[str, object]) -> tuple[int, dict[str, object]]:
    result = subprocess.run(
        [sys.executable, str(CLI)],
        cwd=BACKEND_ROOT,
        input=json.dumps(payload),
        capture_output=True,
        text=True,
        check=False,
    )
    return result.returncode, json.loads(result.stdout)


def test_generates_pdf_without_http_service() -> None:
    code, response = run_cli(
        {"operation": "generate", "questions": 21, "choices": 4, "title": "Vision Academy"}
    )
    pdf = base64.b64decode(response["data"]["pdf_base64"])
    assert code == 0
    assert response["success"] is True
    assert pdf.startswith(b"%PDF")


def test_generates_180_question_pdf_in_reference_layout() -> None:
    import fitz

    code, response = run_cli(
        {"operation": "generate", "questions": 180, "choices": 4, "title": "Final Exam"}
    )
    pdf = fitz.open(stream=base64.b64decode(response["data"]["pdf_base64"]), filetype="pdf")
    assert code == 0
    assert response["success"] is True
    assert pdf.page_count == 1
    text = pdf[0].get_text()
    assert "OMR ANSWER SHEET" in text
    assert "ROLL NO." in text
    assert "TEST ID" in text
    assert "180" in text


def test_grades_image_without_http_service() -> None:
    success, encoded = cv2.imencode(".jpg", make_sheet([1, 3, 4, 2], 4))
    assert success
    code, response = run_cli(
        {
            "operation": "grade",
            "questions": 4,
            "choices": 4,
            "answer_key": "1,3,4,2",
            "image_base64": base64.b64encode(encoded.tobytes()).decode("ascii"),
        }
    )
    assert code == 0
    assert response["success"] is True
    assert response["data"]["score"] == 100


def test_grades_pdf_without_http_service() -> None:
    import fitz

    success, encoded = cv2.imencode(".png", make_sheet([1, 3, 4, 2], 4))
    assert success
    document = fitz.open()
    page = document.new_page(width=800, height=800)
    page.insert_image(page.rect, stream=encoded.tobytes())
    code, response = run_cli(
        {
            "operation": "grade",
            "questions": 4,
            "choices": 4,
            "answer_key": "1,3,4,2",
            "image_base64": base64.b64encode(document.tobytes()).decode("ascii"),
            "media_type": "application/pdf",
        }
    )
    assert code == 0
    assert response["success"] is True
    assert response["data"]["score"] == 100


def test_returns_structured_validation_error() -> None:
    code, response = run_cli(
        {"operation": "generate", "questions": 0, "choices": 4, "title": "Invalid"}
    )
    assert code == 2
    assert response == {
        "success": False,
        "error": "Questions must be between 1 and 200.",
        "code": "INVALID_QUESTIONS",
        "status_code": 422,
    }
