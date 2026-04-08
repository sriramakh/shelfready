"""MiniMax text generation via Anthropic-compatible SDK with retry."""

import asyncio
import logging

import anthropic

from ..config import settings
from ..core.rate_limiter import rate_limiter

logger = logging.getLogger(__name__)

MAX_RETRIES = 2
RETRY_DELAY = 2.0

# Anthropic-compatible client pointing at the MiniMax endpoint
_client = anthropic.Anthropic(
    api_key=settings.minimax_api_key,
    base_url=settings.minimax_base_url,
)


async def generate_text(
    system_prompt: str,
    user_message: str,
    max_tokens: int = 4096,
    temperature: float = 0.7,
) -> str:
    """Generate text using MiniMax M2.7 via the Anthropic messages API.

    Retries once on transient 5xx errors.
    """
    acquired = await rate_limiter.acquire_text()
    if not acquired:
        raise RuntimeError(
            "Text generation rate limit exceeded. Please try again shortly."
        )

    last_error = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = _client.messages.create(
                model=settings.minimax_model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_message},
                ],
            )

            # Extract text from response — skip ThinkingBlock, find TextBlock
            if response.content:
                for block in response.content:
                    if hasattr(block, "text"):
                        return block.text

            raise RuntimeError("MiniMax returned an empty response.")

        except anthropic.APIConnectionError as exc:
            last_error = exc
            logger.warning("MiniMax connection error (attempt %d/%d): %s", attempt, MAX_RETRIES, exc)
        except anthropic.RateLimitError as exc:
            last_error = exc
            logger.warning("MiniMax rate limit (attempt %d/%d): %s", attempt, MAX_RETRIES, exc)
        except anthropic.APIStatusError as exc:
            last_error = exc
            if exc.status_code >= 500:
                logger.warning("MiniMax 5xx error (attempt %d/%d): %s", attempt, MAX_RETRIES, exc)
            else:
                # 4xx errors are not retryable
                raise RuntimeError(
                    f"AI service returned an error (HTTP {exc.status_code})."
                ) from exc
        except RuntimeError:
            raise
        except Exception as exc:
            last_error = exc
            logger.warning("MiniMax unexpected error (attempt %d/%d): %s", attempt, MAX_RETRIES, exc)

        # Wait before retry
        if attempt < MAX_RETRIES:
            await asyncio.sleep(RETRY_DELAY * attempt)

    # All retries exhausted
    logger.error("MiniMax failed after %d attempts: %s", MAX_RETRIES, last_error)
    raise RuntimeError(
        "AI service is temporarily unavailable. Please try again in a moment."
    ) from last_error
