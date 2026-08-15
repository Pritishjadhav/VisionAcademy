from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class GradeResult:
    score: float
    correct_count: int
    total_questions: int
    selected_answers: list[int | None]
    grading: list[bool]
    confidence: list[float]
    annotated_image: np.ndarray
