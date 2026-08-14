from unittest.mock import patch

from app.rate_limit import InMemoryRateLimiter


def test_allows_requests_up_to_limit() -> None:
    limiter = InMemoryRateLimiter()
    assert limiter.allow("user", 2, 60) == (True, 0)
    assert limiter.allow("user", 2, 60) == (True, 0)
    allowed, retry_after = limiter.allow("user", 2, 60)
    assert allowed is False
    assert 1 <= retry_after <= 61


def test_keys_have_independent_limits() -> None:
    limiter = InMemoryRateLimiter()
    assert limiter.allow("first", 1, 60)[0] is True
    assert limiter.allow("first", 1, 60)[0] is False
    assert limiter.allow("second", 1, 60)[0] is True


def test_expired_requests_leave_window() -> None:
    limiter = InMemoryRateLimiter()
    with patch("app.rate_limit.monotonic", side_effect=[0.0, 1.0, 61.0]):
        assert limiter.allow("user", 2, 60)[0] is True
        assert limiter.allow("user", 2, 60)[0] is True
        assert limiter.allow("user", 2, 60)[0] is True
