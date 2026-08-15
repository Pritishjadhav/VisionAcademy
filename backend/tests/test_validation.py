import pytest

from app.errors import OmrError
from app.omr.validation import parse_answer_key, validate_layout


def test_answer_key_is_one_indexed() -> None:
    assert parse_answer_key("1, 4,2", 3, 4) == [1, 4, 2]


@pytest.mark.parametrize("raw", ["", "1,2", "0,1,2", "1,2,5", "a,2,3"])
def test_invalid_answer_keys_are_rejected(raw: str) -> None:
    with pytest.raises(OmrError):
        parse_answer_key(raw, 3, 4)


def test_layout_limits_are_enforced() -> None:
    with pytest.raises(OmrError):
        validate_layout(201, 4)
    with pytest.raises(OmrError):
        validate_layout(20, 8)
