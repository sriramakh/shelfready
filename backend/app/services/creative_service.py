"""Grok-powered ad creative generation."""

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

CREATIVE_TEMPLATES = {
    "flash_sale": {"name": "Flash Sale", "style_instruction": "Recreate the EXACT visual layout, typography style, color scheme, and design of the first image (flash sale ad with dark gradient background, bold white headline at top, large yellow discount percentage in center, info bar at bottom, red urgency badge). Replace the product with the one from the second image. Customize all text messaging with the provided details."},
    "new_arrival": {"name": "New Arrival", "style_instruction": "Recreate the EXACT visual layout and design of the first image (elegant product launch ad with cream/beige marble background, soft window light, thin serif header, elegant script collection name, small caps subtitle, bottom info bar). Replace the product with the one from the second image. Customize all text messaging with the provided details."},
    "seasonal": {"name": "Seasonal / Summer", "style_instruction": "Recreate the EXACT visual layout and design of the first image (vibrant seasonal ad with bright colored background, bold chunky headline, colored banner ribbon with offer, promo code badge, brand URL at bottom). Replace products with the one from the second image and add contextually relevant props. Customize all text messaging with the provided details."},
    "premium": {"name": "Premium Lifestyle", "style_instruction": "Recreate the EXACT visual layout and design of the first image (premium moody ad with dark wood surface, warm left-side lighting, gold serif headline at top, white pricing text in center, italic feature list, dark bottom banner with offer). Replace the product/surface with the one from the second image. Customize all text messaging with the provided details."},
    "app_download": {"name": "App / Tech", "style_instruction": "Recreate the EXACT visual layout and design of the first image (modern tech ad with dark purple-to-black gradient, glowing energy effects, bold condensed white headline, gradient subtitle, social proof with stars, green CTA button at bottom). Replace the product with the one from the second image. Customize all text messaging with the provided details."},
}

SIZE_TO_RATIO = {
    "1080x1080": "1:1", "1200x628": "16:9", "1080x1920": "9:16",
    "1200x1200": "1:1", "1080x1350": "3:4", "1920x1080": "16:9",
    "600x600": "1:1", "1200x900": "4:3",
}


class AdCreativeRequest(BaseModel):
    image_base64: str
    product_name: str
    product_details: str
    target_audience: str = ""
    ad_platform: str = "facebook"
    creative_sizes: list[str]
    content_direction: str = ""
    template_id: str | None = None
    template_base64: str | None = None


def _grok_headers() -> dict:
    return {"Authorization": f"Bearer {settings.grok_api_key}", "Content-Type": "application/json"}


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


async def generate_ad_creative(req: AdCreativeRequest) -> dict:
    """Generate visual ad creatives using Grok vision + Grok Imagine."""
    if len(req.creative_sizes) > 5:
        raise ValueError("Maximum 5 creatives per run")

    template = None
    if req.template_id and req.template_base64:
        template = CREATIVE_TEMPLATES.get(req.template_id) or {
            "name": req.template_id,
            "style_instruction": "Recreate the EXACT visual layout, typography style, color scheme, element placement, and overall design of the first image (the template). Replace the product shown with the product from the second image. Keep all design elements: background style, text hierarchy, badge positions, CTA placement, color palette, and mood. Customize the text content with the provided product details and messaging.",
        }

    # Step 1: Analyze product and generate prompts
    async with httpx.AsyncClient(timeout=60.0) as client:
        analysis_resp = await client.post(
            GROK_CHAT_URL,
            headers=_grok_headers(),
            json={
                "model": "grok-4-1-fast-non-reasoning",
                "messages": [{"role": "user", "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{req.image_base64}"}},
                    {"type": "text", "text": f"""Analyze this product for ad creatives. Return ONLY valid JSON:
{{
  "product_name": "detected product",
  "product_category": "category",
  "color": "primary color",
  "prompts": {{
{chr(10).join(f'    "creative_{i+1}": "' + (
    f'{template["style_instruction"]} Product: {req.product_name}. {req.product_details}. {f"Messaging: {req.content_direction}. " if req.content_direction else ""}Adapt the template text to this product and offer. Size: {size}.'
    if template else
    f'Detailed prompt for a {req.ad_platform} ad creative at {size} resolution. {f"User direction: {req.content_direction}. " if req.content_direction else ""}Show this exact product in a compelling advertising scene. Make it scroll-stopping and conversion-focused. Include lifestyle context appropriate for {req.ad_platform} ads. The product must be the hero and clearly visible. Describe lighting, composition, mood, text overlay placement area, and background. Professional advertising photography quality.'
) + '"'
    for i, size in enumerate(req.creative_sizes))}
  }}
}}"""},
                ]}],
                "temperature": 0.3,
            },
        )

    analysis = _parse_json(analysis_resp.json()["choices"][0]["message"]["content"])
    prompts_dict = analysis.get("prompts", {})

    # Step 2: Generate creatives
    results = []
    async with httpx.AsyncClient(timeout=120.0) as client:
        for i, size in enumerate(req.creative_sizes):
            prompt = prompts_dict.get(f"creative_{i+1}", f"Professional {req.ad_platform} ad for this product")
            aspect_ratio = SIZE_TO_RATIO.get(size, "1:1")

            try:
                if template and req.template_base64:
                    image_payload = {"images": [
                        {"url": f"data:image/png;base64,{req.template_base64}", "type": "image_url"},
                        {"url": f"data:image/png;base64,{req.image_base64}", "type": "image_url"},
                    ]}
                else:
                    image_payload = {"image": {"url": f"data:image/png;base64,{req.image_base64}", "type": "image_url"}}

                img_resp = await client.post(
                    GROK_IMAGE_URL,
                    headers=_grok_headers(),
                    json={"model": "grok-imagine-image", "prompt": prompt, **image_payload, "aspect_ratio": aspect_ratio, "n": 1, "response_format": "b64_json"},
                )
                b64 = img_resp.json()["data"][0]["b64_json"]
                results.append({"id": str(uuid.uuid4()), "size": size, "aspect_ratio": aspect_ratio, "prompt_used": prompt, "template_used": req.template_id, "image_base64": b64, "success": True})
            except Exception as e:
                results.append({"id": str(uuid.uuid4()), "size": size, "aspect_ratio": aspect_ratio, "prompt_used": prompt, "template_used": req.template_id, "image_base64": None, "success": False, "error": str(e)[:200]})

    return {
        "product_analysis": {"product_name": analysis.get("product_name", req.product_name), "product_category": analysis.get("product_category", ""), "color": analysis.get("color", "")},
        "creatives": results,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
