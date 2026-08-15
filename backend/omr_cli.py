import base64
import binascii
import json
import sys

from app.errors import OmrError
from app.omr.processor import decode_image, encode_jpeg_data_url, grade_image
from app.omr.sheet_generator import generate_sheet_pdf
from app.omr.validation import parse_answer_key, validate_layout


def grade(payload: dict[str, object]) -> dict[str, object]:
    questions = int(payload["questions"])
    choices = int(payload["choices"])
    validate_layout(questions, choices)
    answers = parse_answer_key(str(payload["answer_key"]), questions, choices)
    content = base64.b64decode(str(payload["image_base64"]), validate=True)
    result = grade_image(decode_image(content), questions, choices, answers)
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
    pdf = generate_sheet_pdf(questions, choices, str(payload["title"]))
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
