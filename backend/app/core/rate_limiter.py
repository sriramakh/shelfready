import asyncio
import time


class TokenBucketLimiter:
    """Token bucket rate limiter for MiniMax API calls."""

    def __init__(self, rate: float, capacity: int):
        self.rate = rate  # tokens per second
        self.capacity = capacity
        self.tokens = capacity
        self.last_refill = time.monotonic()
        self._lock = asyncio.Lock()

    def _refill(self):
        now = time.monotonic()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
        self.last_refill = now

    async def acquire(self, timeout: float = 60.0) -> bool:
        """Wait for a token, returns True if acquired within timeout."""
        deadline = time.monotonic() + timeout

        while True:
            async with self._lock:
                self._refill()
                if self.tokens >= 1:
                    self.tokens -= 1
                    return True

            if time.monotonic() >= deadline:
                return False

            # Wait a bit before retrying
            await asyncio.sleep(0.1)


class MiniMaxRateLimiter:
    """Manages rate limits for different MiniMax API endpoints."""

    def __init__(self):
        # Text: 500 RPM = ~8.33 RPS
        self.text_limiter = TokenBucketLimiter(rate=8.0, capacity=20)
        # Image: 10 RPM = ~0.167 RPS
        self.image_limiter = TokenBucketLimiter(rate=0.167, capacity=3)
        # Search: shares text limit
        self.search_limiter = self.text_limiter

    async def acquire_text(self, timeout: float = 30.0) -> bool:
        return await self.text_limiter.acquire(timeout)

    async def acquire_image(self, timeout: float = 120.0) -> bool:
        return await self.image_limiter.acquire(timeout)

    async def acquire_search(self, timeout: float = 30.0) -> bool:
        return await self.search_limiter.acquire(timeout)


rate_limiter = MiniMaxRateLimiter()
