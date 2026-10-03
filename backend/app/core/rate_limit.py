import time
from collections import defaultdict
from typing import Dict, List, Tuple
from app.core.config import settings


class SlidingWindowRateLimiter:
    """
    Sliding-window counter for rate limiting (Layer 3: Traffic Control / Anti-DoS).
    Maintains timestamp logs per key and purges expired entries outside the window.
    """

    def __init__(self) -> None:
        self._requests: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, key: str, max_requests: int, window_seconds: int = 60) -> Tuple[bool, int]:
        """
        Checks if the request is within rate limits.
        Returns: (is_allowed, remaining_requests)
        """
        now = time.time()
        cutoff = now - window_seconds

        # Prune old request timestamps
        timestamps = [ts for ts in self._requests[key] if ts > cutoff]
        self._requests[key] = timestamps

        if len(timestamps) >= max_requests:
            return False, 0

        self._requests[key].append(now)
        remaining = max_requests - len(self._requests[key])
        return True, remaining

    def reset(self) -> None:
        """Clear all rate limit state."""
        self._requests.clear()


rate_limiter = SlidingWindowRateLimiter()
