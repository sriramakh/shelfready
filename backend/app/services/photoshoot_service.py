"""Grok-powered product photoshoot generation."""

import json
import logging
import re
import uuid
from datetime import datetime, timezone

import httpx
from pydantic import BaseModel

from ..config import settings

logger = logging.getLogger(__name__)

GROK_CHAT_URL = "https://api.x.ai/v1/chat/completions"
GROK_IMAGE_URL = "https://api.x.ai/v1/images/edits"


class PhotoshootRequest(BaseModel):
    image_base64: str
    themes: list[str]
    aspect_ratio: str = "1:1"


def _grok_headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.grok_api_key}",
        "Content-Type": "application/json",
    }


def _parse_json(raw: str) -> dict:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', raw, re.DOTALL)
    if match:
        return json.loads(match.group(1))
    start = raw.find('{')
    end = raw.rfind('}')
    if start != -1 and end != -1:
        return json.loads(raw[start:end + 1])
    raise ValueError("Could not parse JSON")


async def generate_photoshoot(req: PhotoshootRequest) -> dict:
    """Generate photoshoot images using Grok vision + Grok Imagine."""
    if len(req.themes) > 5:
        raise ValueError("Maximum 5 images per run")
    if len(req.themes) < 1:
        raise ValueError("Select at least 1 theme")

    themes = list(req.themes)
    if "context" not in themes:
        themes[-1] = "context"

    # Step 1: Analyze product with Grok 4 vision
    async with httpx.AsyncClient(timeout=60.0) as client:
        analysis_resp = await client.post(
            GROK_CHAT_URL,
            headers=_grok_headers(),
            json={
                "model": "grok-4-1-fast-non-reasoning",
                "messages": [{"role": "user", "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{req.image_base64}"}},
                    {"type": "text", "text": f"""Analyze this product for an e-commerce photoshoot. Return ONLY valid JSON:
{{
  "product_name": "specific product name",
  "product_category": "category",
  "color": "primary color",
  "key_features": "2-3 notable features",
  "model_gender": "male or female — based on the product's target demographic, color, and typical buyer",
  "model_gender_reasoning": "one sentence why",
  "prompts": {{
{chr(10).join(f'    "shot_{i+1}": "Detailed photoshoot prompt for a {t.upper()} shot of this exact product. ' +
    ('Include a human model naturally using/wearing/carrying the product. IMPORTANT: Frame the shot to show the model FULL BODY from head to toe — never crop the face or head. Use a portrait composition with enough headroom. Describe model outfit, pose, setting. ' if t == 'model' else '') +
    ('Show the product being actively USED in its intended context — e.g. food being prepared on a cutting board, clothes being worn at an event, a bag packed for travel. The product must be the hero but shown in action. ' if t == 'context' else '') +
    ('Clean professional studio backdrop, perfect lighting, e-commerce hero angle. ' if t == 'studio' else '') +
    ('Beautiful outdoor/environmental setting matching the product category. ' if t == 'outdoor' else '') +
    'Emphasize preserving the EXACT product appearance — same color, shape, texture, hardware. Be specific about lighting, angle, props, mood."'
    for i, t in enumerate(themes))}
  }}
}}"""},
                ]}],
                "temperature": 0.3,
            },
        )

    analysis = _parse_json(analysis_resp.json()["choices"][0]["message"]["content"])
    prompts_dict = analysis.get("prompts", {})

    # Step 2: Generate images with Grok Imagine
    results = []
    async with httpx.AsyncClient(timeout=120.0) as client:
        for i, theme in enumerate(themes):
            prompt = prompts_dict.get(f"shot_{i+1}", f"Professional {theme} photo of this product")
            shot_ratio = "3:4" if theme == "model" else req.aspect_ratio

            try:
                img_resp = await client.post(
                    GROK_IMAGE_URL,
                    headers=_grok_headers(),
                    json={
                        "model": "grok-imagine-image",
                        "prompt": prompt,
                        "image": {"url": f"data:image/png;base64,{req.image_base64}", "type": "image_url"},
                        "aspect_ratio": shot_ratio,
                        "n": 1,
                        "response_format": "b64_json",
                    },
                )
                b64 = img_resp.json()["data"][0]["b64_json"]
                results.append({"id": str(uuid.uuid4()), "theme": theme, "prompt_used": prompt, "image_base64": b64, "success": True})
            except Exception as e:
                results.append({"id": str(uuid.uuid4()), "theme": theme, "prompt_used": prompt, "image_base64": None, "success": False, "error": str(e)[:200]})

    return {
        "product_analysis": {
            "product_name": analysis.get("product_name", ""),
            "product_category": analysis.get("product_category", ""),
            "color": analysis.get("color", ""),
            "model_gender": analysis.get("model_gender", ""),
            "model_gender_reasoning": analysis.get("model_gender_reasoning", ""),
        },
        "images": results,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
