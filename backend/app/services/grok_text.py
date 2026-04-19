"""Grok (xAI) text generation via OpenAI-compatible chat-completions API."""

import asyncio
import logging

import httpx

from ..config import settings
from ..core.rate_limiter import rate_limiter

logger = logging.getLogger(__name__)

MAX_RETRIES = 2
RETRY_DELAY = 2.0
REQUEST_TIMEOUT = httpx.Timeout(120.0, connect=10.0)


async def generate_text(
    system_prompt: str,
    user_message: str,
    max_tokens: int = 4096,
    temperature: float = 0.7,
) -> str:
    """Generate text using Grok via xAI's OpenAI-compatible API.

    Signature matches minimax_text.generate_text so research_service can swap
    providers without touching call sites. Retries once on transient 5xx errors.
    """
    if not settings.grok_api_key:
        raise RuntimeError("GROK_API_KEY is not configured.")

    acquired = await rate_limiter.acquire_text()
    if not acquired:
        raise RuntimeError(
            "Text generation rate limit exceeded. Please try again shortly."
        )

    url = f"{settings.grok_base_url.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.grok_api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.grok_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "max_tokens": max_tokens,
        "temperature": temperature,
    }

    last_error: Exception | None = None

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                resp = await client.post(url, headers=headers, json=payload)

                if resp.status_code >= 500:
                    last_error = RuntimeError(f"Grok 5xx: {resp.status_code} {resp.text[:200]}")
                    logger.warning("Grok 5xx error (attempt %d/%d): %s", attempt, MAX_RETRIES, last_error)
                elif resp.status_code == 429:
                    last_error = RuntimeError(f"Grok rate limit: {resp.text[:200]}")
                    logger.warning("Grok rate limit (attempt %d/%d)", attempt, MAX_RETRIES)
                elif resp.status_code >= 400:
                    raise RuntimeError(
                        f"Grok returned HTTP {resp.status_code}: {resp.text[:300]}"
                    )
                else:
                    data = resp.json()
                    choices = data.get("choices") or []
                    if not choices:
                        raise RuntimeError("Grok returned no choices.")
                    message = choices[0].get("message") or {}
                    content = message.get("content")
                    if not content:
                        raise RuntimeError("Grok returned empty content.")
                    return content

            except httpx.ConnectError as exc:
                last_error = exc
                logger.warning("Grok connection error (attempt %d/%d): %s", attempt, MAX_RETRIES, exc)
            except httpx.ReadTimeout as exc:
                last_error = exc
                logger.warning("Grok timeout (attempt %d/%d): %s", attempt, MAX_RETRIES, exc)
            except RuntimeError:
                raise
            except Exception as exc:
                last_error = exc
                logger.warning("Grok unexpected error (attempt %d/%d): %s", attempt, MAX_RETRIES, exc)

            if attempt < MAX_RETRIES:
                await asyncio.sleep(RETRY_DELAY * attempt)

    logger.error("Grok failed after %d attempts: %s", MAX_RETRIES, last_error)
    raise RuntimeError(
        "AI service is temporarily unavailable. Please try again in a moment."
    ) from last_error
