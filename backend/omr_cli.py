import base64
import binascii
import json
import sys

from app.errors import OmrError
from app.omr.processor import decode_document, encode_jpeg_data_url, grade_image
from app.omr.result_sheet import generate_result_sheet_pdf
from app.omr.sheet_generator import generate_sheet_pdf
from app.omr.validation import parse_answer_key, validate_layout


def grade(payload: dict[str, object]) -> dict[str, object]:
    questions = int(payload["questions"])
    choices = int(payload["choices"])
    validate_layout(questions, choices)
    answers = parse_answer_key(str(payload["answer_key"]), questions, choices)
    content = base64.b64decode(str(payload["image_base64"]), validate=True)
    numerical = int(payload.get("numerical", 0))
    result = grade_image(
        decode_document(content, str(payload.get("media_type", ""))),
        questions,
        choices,
        answers,
        str(payload.get("exam_type", "NEET")),
        numerical,
    )
    return {
        "score": result.score,
        "correct_count": result.correct_count,
        "total_questions": result.total_questions,
        "selected_answers": result.selected_answers,
        "confidence": result.confidence,
        "graded_image_base64": encode_jpeg_data_url(result.annotated_image),
    }


def generate(payload: dict[str, object]) -> dict[str, str]:
    questions = int(payload["questions"])
    choices = int(payload["choices"])
    validate_layout(questions, choices)
    numerical = int(payload.get("numerical", 0))
    pdf = generate_sheet_pdf(
        questions,
        choices,
        str(payload["title"]),
        str(payload.get("exam_type", "NEET")),
        numerical,
    )
    return {"pdf_base64": base64.b64encode(pdf).decode("ascii")}


def generate_report(payload: dict[str, object]) -> dict[str, str]:
    pdf = generate_result_sheet_pdf(
        dict(payload["test"]),
        list(payload["results"]),
    )
    return {"pdf_base64": base64.b64encode(pdf).decode("ascii")}


def main() -> None:
    try:
        request = json.load(sys.stdin)
        operation = request.get("operation")
        if operation == "grade":
            data = grade(request)
        elif operation == "generate":
            data = generate(request)
        elif operation == "health":
            data = {"ready": True}
        elif operation == "report":
            data = generate_report(request)
        else:
            raise OmrError("Unsupported OMR operation.", code="INVALID_OPERATION")
        json.dump({"success": True, "data": data}, sys.stdout, separators=(",", ":"))
    except OmrError as error:
        json.dump(
            {
                "success": False,
                "error": error.message,
                "code": error.code,
                "status_code": error.status_code,
            },
            sys.stdout,
            separators=(",", ":"),
        )
        raise SystemExit(2) from error
    except (KeyError, TypeError, ValueError, binascii.Error, json.JSONDecodeError) as error:
        json.dump(
            {
                "success": False,
                "error": "The OMR request is invalid.",
                "code": "INVALID_REQUEST",
                "status_code": 422,
            },
            sys.stdout,
            separators=(",", ":"),
        )
        raise SystemExit(2) from error


if __name__ == "__main__":
    main()
