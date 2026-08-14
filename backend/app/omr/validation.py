from app.errors import OmrError

MIN_QUESTIONS = 1
MAX_QUESTIONS = 200
MIN_CHOICES = 2
MAX_CHOICES = 7


def validate_layout(num_questions: int, num_choices: int) -> None:
    if not MIN_QUESTIONS <= num_questions <= MAX_QUESTIONS:
        raise OmrError(f"Questions must be between {MIN_QUESTIONS} and {MAX_QUESTIONS}.", code="INVALID_QUESTIONS")
    if not MIN_CHOICES <= num_choices <= MAX_CHOICES:
        raise OmrError(f"Choices must be between {MIN_CHOICES} and {MAX_CHOICES}.", code="INVALID_CHOICES")


def parse_answer_key(raw: str, num_questions: int, num_choices: int) -> list[int]:
    try:
        answers = [int(value.strip()) for value in raw.split(",")]
    except ValueError as error:
        raise OmrError("Answer key must contain comma-separated numbers.", code="INVALID_ANSWER_KEY") from error

    if len(answers) != num_questions:
        raise OmrError("Answer key length must match the number of questions.", code="INVALID_ANSWER_KEY")
    if any(answer < 1 or answer > num_choices for answer in answers):
        raise OmrError(f"Every answer must be between 1 and {num_choices}.", code="INVALID_ANSWER_KEY")
    return answers
