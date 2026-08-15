from io import BytesIO

from fastapi import FastAPI, File, Form, Query, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from app.config import get_settings
from app.errors import OmrError
from app.omr.processor import decode_image, encode_jpeg_data_url, grade_image
from app.omr.sheet_generator import generate_sheet_pdf
from app.omr.validation import parse_answer_key, validate_layout
from app.rate_limit import InMemoryRateLimiter

settings = get_settings()
limiter = InMemoryRateLimiter()
app = FastAPI(title="Vision Academy OMR API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


def error_response(message: str, code: str, status_code: int) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"success": False, "error": message, "code": code})


@app.exception_handler(OmrError)
async def handle_omr_error(_: Request, error: OmrError) -> JSONResponse:
    return error_response(error.message, error.code, error.status_code)


@app.exception_handler(RequestValidationError)
async def handle_validation_error(_: Request, __: RequestValidationError) -> JSONResponse:
    return error_response("The request contains invalid or missing fields.", "INVALID_REQUEST", 422)


def enforce_rate_limit(request: Request, operation: str, limit: int) -> None:
    client_ip = request.client.host if request.client else "unknown"
    allowed, retry_after = limiter.allow(
        f"{operation}:{client_ip}",
        limit,
        settings.rate_window_seconds,
    )
    if not allowed:
        raise OmrError(
            f"Too many requests. Try again in {retry_after} seconds.",
            code="RATE_LIMITED",
            status_code=429,
        )


def enforce_internal_auth(request: Request) -> None:
    if settings.internal_api_key and request.headers.get("x-internal-api-key") != settings.internal_api_key:
        raise OmrError("Invalid service credentials.", code="UNAUTHORIZED", status_code=401)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/grade")
async def grade(
    request: Request,
    file: UploadFile = File(...),
    num_questions: int = Form(...),
    num_choices: int = Form(...),
    answer_key: str = Form(...),
) -> dict[str, object]:
    enforce_internal_auth(request)
    enforce_rate_limit(request, "grade", settings.grade_limit)
    validate_layout(num_questions, num_choices)
    answers = parse_answer_key(answer_key, num_questions, num_choices)

    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise OmrError("Upload a JPEG, PNG, or WebP image.", code="UNSUPPORTED_FILE_TYPE", status_code=415)
    content = await file.read(settings.max_upload_bytes + 1)
    if len(content) > settings.max_upload_bytes:
        raise OmrError("The uploaded image exceeds the size limit.", code="UPLOAD_TOO_LARGE", status_code=413)

    result = grade_image(decode_image(content), num_questions, num_choices, answers)
    return {
        "success": True,
        "data": {
            "score": result.score,
            "correct_count": result.correct_count,
            "total_questions": result.total_questions,
            "selected_answers": result.selected_answers,
            "confidence": result.confidence,
            "graded_image_base64": encode_jpeg_data_url(result.annotated_image),
        },
    }


@app.get("/generate-omr")
async def generate_omr(
    request: Request,
    questions: int = Query(20),
    choices: int = Query(4),
    title: str = Query("Vision Academy - OMR Sheet", max_length=100),
) -> StreamingResponse:
    enforce_internal_auth(request)
    enforce_rate_limit(request, "generate", settings.generate_limit)
    validate_layout(questions, choices)
    pdf = generate_sheet_pdf(questions, choices, title)
    return StreamingResponse(
        BytesIO(pdf),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="vision-academy-omr.pdf"'},
    )
