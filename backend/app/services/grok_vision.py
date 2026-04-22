"""Grok vision — extract product info from an uploaded image."""

import json
import logging
import re

import httpx

from ..config import settings

logger = logging.getLogger(__name__)

GROK_CHAT_URL = "https://api.x.ai/v1/chat/completions"
# Vision uses the non-reasoning variant (faster, sufficient for extraction)
GROK_VISION_MODEL = "grok-4-1-fast-non-reasoning"


def _parse_json(raw: str) -> dict:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1:
        return json.loads(raw[start:end + 1])
    raise ValueError(f"Could not parse JSON from Grok vision: {raw[:200]}")


async def extract_product_info(
    image_base64: str,
    user_description: str = "",
) -> dict:
    """Use Grok vision to extract structured product info from an image.

    Returns a dict with:
      product_name, product_category, key_features (list of str),
      target_audience, suggested_platforms (list of str), description

    Falls back to user_description and generic values on extraction failure.
    """
    if not settings.grok_api_key:
        raise RuntimeError("GROK_API_KEY is not configured.")

    headers = {
        "Authorization": f"Bearer {settings.grok_api_key}",
        "Content-Type": "application/json",
    }

    user_hint = (
        f"\n\nThe seller provided this extra context: {user_description}"
        if user_description.strip()
        else ""
    )

    prompt = f"""Analyze this product image for an e-commerce seller. Return ONLY valid JSON:
{{
  "product_name": "specific, searchable product name (3-8 words)",
  "product_category": "marketplace category (e.g., 'Kitchen & Dining', 'Baby Products', 'Home Decor')",
  "key_features": ["3-5 concrete observable features or benefits"],
  "target_audience": "who would buy this (1 sentence, demographic + use case)",
  "suggested_platforms": ["amazon" | "etsy" | "shopify" — pick 1-2 best fits],
  "description": "2-3 sentence product description suitable for a listing — focus on what's visible in the image",
  "color": "primary color",
  "materials": "apparent materials if visible, else ''"
}}{user_hint}

Be specific and grounded in what you actually see. If you can't determine a field, use an empty string or empty list."""

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            GROK_CHAT_URL,
            headers=headers,
            json={
                "model": GROK_VISION_MODEL,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}",
                                },
                            },
                            {"type": "text", "text": prompt},
                        ],
                    }
                ],
                "temperature": 0.2,
            },
        )

        if resp.status_code >= 400:
            raise RuntimeError(
                f"Grok vision returned HTTP {resp.status_code}: {resp.text[:300]}"
            )

        content = resp.json()["choices"][0]["message"]["content"]

    try:
        data = _parse_json(content)
    except Exception as exc:
        logger.warning("Grok vision JSON parse failed: %s", exc)
        raise RuntimeError("Could not parse product info from image.") from exc

    # Normalize + fill defaults so downstream code never sees missing keys
    return {
        "product_name": str(data.get("product_name", "")).strip() or "Product",
        "product_category": str(data.get("product_category", "")).strip(),
        "key_features": [
            str(f).strip() for f in (data.get("key_features") or []) if str(f).strip()
        ],
        "target_audience": str(data.get("target_audience", "")).strip(),
        "suggested_platforms": [
            str(p).strip().lower()
            for p in (data.get("suggested_platforms") or [])
            if str(p).strip()
        ],
        "description": str(data.get("description", "")).strip(),
        "color": str(data.get("color", "")).strip(),
        "materials": str(data.get("materials", "")).strip(),
    }
