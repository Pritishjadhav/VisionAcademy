from app.omr.models import GradeResult


def test_union_annotations_are_deferred_for_python_39() -> None:
    assert GradeResult.__annotations__["selected_answers"] == "list[int | None]"
