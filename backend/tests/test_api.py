from io import BytesIO

import cv2
import numpy as np
from fastapi.testclient import TestClient

from app.main import app, limiter, settings
from tests.test_processor import make_sheet

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_generate_sheet_returns_pdf() -> None:
    response = client.get("/generate-omr?questions=20&choices=4&title=Physics")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")


def test_grade_rejects_invalid_answer_key() -> None:
    image = np.full((300, 300, 3), 255, dtype=np.uint8)
    success, encoded = cv2.imencode(".png", image)
    assert success
    response = client.post(
        "/grade",
        data={"num_questions": "2", "num_choices": "4", "answer_key": "1"},
        files={"file": ("sheet.png", BytesIO(encoded.tobytes()), "image/png")},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "INVALID_ANSWER_KEY"


def test_grade_rejects_non_image() -> None:
    response = client.post(
        "/grade",
        data={"num_questions": "2", "num_choices": "4", "answer_key": "1,2"},
        files={"file": ("sheet.pdf", BytesIO(b"%PDF"), "application/pdf")},
    )
    assert response.status_code == 415
    assert response.json()["code"] == "UNSUPPORTED_FILE_TYPE"


def test_grade_endpoint_returns_complete_result() -> None:
    image = make_sheet([1, 3, 4, 2], 4)
    success, encoded = cv2.imencode(".png", image)
    assert success
    response = client.post(
        "/grade",
        data={"num_questions": "4", "num_choices": "4", "answer_key": "1,3,4,2"},
        files={"file": ("sheet.png", BytesIO(encoded.tobytes()), "image/png")},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["score"] == 100
    assert payload["data"]["correct_count"] == 4
    assert payload["data"]["selected_answers"] == [1, 3, 4, 2]
    assert payload["data"]["graded_image_base64"].startswith("data:image/jpeg;base64,")


def test_grade_endpoint_reports_sheet_without_border() -> None:
    image = np.full((300, 300, 3), 255, dtype=np.uint8)
    success, encoded = cv2.imencode(".png", image)
    assert success
    response = client.post(
        "/grade",
        data={"num_questions": "2", "num_choices": "4", "answer_key": "1,2"},
        files={"file": ("blank.png", BytesIO(encoded.tobytes()), "image/png")},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "ANSWER_AREA_NOT_FOUND"


def test_grade_rejects_corrupt_image_with_image_mime_type() -> None:
    response = client.post(
        "/grade",
        data={"num_questions": "2", "num_choices": "4", "answer_key": "1,2"},
        files={"file": ("fake.png", BytesIO(b"not an image"), "image/png")},
    )
    assert response.status_code == 415
    assert response.json()["code"] == "INVALID_IMAGE"


def test_missing_form_fields_return_structured_error() -> None:
    response = client.post("/grade", files={"file": ("sheet.png", BytesIO(b"x"), "image/png")})
    assert response.status_code == 422
    assert response.json() == {
        "success": False,
        "error": "The request contains invalid or missing fields.",
        "code": "INVALID_REQUEST",
    }


def test_generate_sheet_rejects_unsupported_page_length() -> None:
    response = client.get("/generate-omr?questions=61&choices=4")
    assert response.status_code == 422
    assert response.json()["code"] == "SHEET_TOO_LONG"


def test_internal_api_key_is_enforced() -> None:
    original_key = settings.internal_api_key
    settings.internal_api_key = "test-secret"
    try:
        unauthorized = client.get("/generate-omr?questions=10&choices=4")
        authorized = client.get(
            "/generate-omr?questions=10&choices=4",
            headers={"X-Internal-API-Key": "test-secret"},
        )
        assert unauthorized.status_code == 401
        assert authorized.status_code == 200
    finally:
        settings.internal_api_key = original_key


def test_upload_size_limit_is_enforced() -> None:
    original_limit = settings.max_upload_bytes
    settings.max_upload_bytes = 4
    try:
        response = client.post(
            "/grade",
            data={"num_questions": "2", "num_choices": "4", "answer_key": "1,2"},
            files={"file": ("sheet.png", BytesIO(b"12345"), "image/png")},
        )
        assert response.status_code == 413
        assert response.json()["code"] == "UPLOAD_TOO_LARGE"
    finally:
        settings.max_upload_bytes = original_limit


def test_generate_rate_limit_returns_429() -> None:
    original_limit = settings.generate_limit
    settings.generate_limit = 1
    limiter._requests.clear()
    try:
        first = client.get("/generate-omr?questions=10&choices=4")
        second = client.get("/generate-omr?questions=10&choices=4")
        assert first.status_code == 200
        assert second.status_code == 429
        assert second.json()["code"] == "RATE_LIMITED"
    finally:
        settings.generate_limit = original_limit
        limiter._requests.clear()
