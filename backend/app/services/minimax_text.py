"""MiniMax text generation via Anthropic-compatible SDK."""

import logging

import anthropic

from ..config import settings
from ..core.rate_limiter import rate_limiter

logger = logging.getLogger(__name__)

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

    Args:
        system_prompt: System-level instruction for the model.
        user_message: The user-facing prompt content.
        max_tokens: Maximum tokens in the response.
        temperature: Sampling temperature (0.0 - 1.0).

    Returns:
        The generated text content.

    Raises:
        RuntimeError: If rate limit cannot be acquired or the API call fails.
    """
    acquired = await rate_limiter.acquire_text()
    if not acquired:
        raise RuntimeError(
            "Text generation rate limit exceeded. Please try again shortly."
        )

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
        logger.error("MiniMax API connection error: %s", exc)
        raise RuntimeError(
            "Unable to connect to the AI service. Please try again later."
        ) from exc
    except anthropic.RateLimitError as exc:
        logger.warning("MiniMax API rate limit hit: %s", exc)
        raise RuntimeError(
            "AI service is temporarily overloaded. Please try again in a moment."
        ) from exc
    except anthropic.APIStatusError as exc:
        logger.error("MiniMax API error (status %s): %s", exc.status_code, exc.message)
        raise RuntimeError(
            f"AI service returned an error (HTTP {exc.status_code}). Please try again."
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error during text generation")
        raise RuntimeError(
            "An unexpected error occurred during text generation."
        ) from exc
