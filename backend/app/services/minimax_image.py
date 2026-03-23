"""MiniMax image generation via direct HTTP API."""

import base64
import logging

import httpx

from ..config import settings
from ..core.rate_limiter import rate_limiter

logger = logging.getLogger(__name__)

# Reusable async client with generous timeouts for image generation
_http_client: httpx.AsyncClient | None = None


def _get_http_client() -> httpx.AsyncClient:
    """Lazily initialize the shared async HTTP client."""
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(connect=10.0, read=60.0, write=10.0, pool=10.0),
        )
    return _http_client


async def generate_image(
    prompt: str,
    aspect_ratio: str = "1:1",
    model: str = "image-01",
) -> bytes:
    """Generate an image using the MiniMax image generation API.

    Args:
        prompt: Detailed text description of the desired image.
        aspect_ratio: Output aspect ratio (e.g. "1:1", "16:9", "9:16").
        model: MiniMax image model identifier.

    Returns:
        Raw image bytes (PNG).

    Raises:
        RuntimeError: If rate limit cannot be acquired, the API errors,
                      or the response is malformed.
    """
    acquired = await rate_limiter.acquire_image()
    if not acquired:
        raise RuntimeError(
            "Image generation rate limit exceeded. Please try again shortly."
        )

    client = _get_http_client()

    headers = {
        "Authorization": f"Bearer {settings.minimax_api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "prompt": prompt,
        "aspect_ratio": aspect_ratio,
        "response_format": "base64",
    }

    try:
        response = await client.post(
            settings.minimax_image_url,
            headers=headers,
            json=payload,
        )
        response.raise_for_status()

    except httpx.TimeoutException as exc:
        logger.error("MiniMax image API timeout: %s", exc)
        raise RuntimeError(
            "Image generation timed out. Please try again."
        ) from exc
    except httpx.HTTPStatusError as exc:
        logger.error(
            "MiniMax image API error (status %s): %s",
            exc.response.status_code,
            exc.response.text[:500],
        )
        raise RuntimeError(
            f"Image generation failed (HTTP {exc.response.status_code}). "
            "Please try again."
        ) from exc
    except httpx.HTTPError as exc:
        logger.error("MiniMax image API HTTP error: %s", exc)
        raise RuntimeError(
            "Unable to connect to the image generation service."
        ) from exc

    # Parse response and decode base64 image data
    try:
        data = response.json()
    except ValueError as exc:
        logger.error("MiniMax image API returned non-JSON response")
        raise RuntimeError("Image generation returned an invalid response.") from exc

    # The API returns: data.data.image_base64 as a LIST of base64 strings
    b64_data: str | None = None

    if isinstance(data, dict):
        inner = data.get("data")
        if isinstance(inner, dict):
            img_field = inner.get("image_base64")
            if isinstance(img_field, list) and img_field:
                b64_data = img_field[0]
            elif isinstance(img_field, str):
                b64_data = img_field
        elif isinstance(inner, list):
            for item in inner:
                if isinstance(item, dict):
                    b64_data = item.get("b64_json") or item.get("image_base64")
                    if b64_data:
                        break
        # Fallback: top-level
        if b64_data is None:
            b64_data = data.get("image_base64")

    if not b64_data:
        logger.error("No base64 image data found in response: %s", str(data)[:500])
        raise RuntimeError("Image generation returned no image data.")

    try:
        return base64.b64decode(b64_data)
    except Exception as exc:
        logger.error("Failed to decode base64 image data")
        raise RuntimeError("Image generation returned corrupt data.") from exc
