"""Small in-process rate limiter.

Enough to blunt credential stuffing and bored bots on a single instance. It is
not a distributed limiter: behind more than one replica, move this to Redis or
the edge.
"""

import time

_hits: dict[str, list[float]] = {}
_last_prune = 0.0


def _prune(now: float, window: float) -> None:
    """Drop addresses with no recent activity. Without this the dict grows for
    every IP ever seen, which is a slow memory leak on a long-lived process."""
    global _last_prune
    if now - _last_prune < 60:
        return
    for key in [k for k, v in _hits.items() if not v or now - v[-1] > window]:
        _hits.pop(key, None)
    _last_prune = now


def too_many(key: str, *, limit: int, window: float) -> bool:
    """Record an attempt and report whether the caller is over the limit."""
    now = time.time()
    _prune(now, window)
    recent = [t for t in _hits.get(key, []) if now - t < window]
    recent.append(now)
    _hits[key] = recent
    return len(recent) > limit
