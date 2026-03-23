"""Demo-mode API routes — bypass auth/DB, call MiniMax directly.

Active only when ENVIRONMENT=demo in .env.
"""

import base64
import json
import re
import uuid
from datetime import datetime, timezone

import anthropic
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ...config import settings
from ...models.enums import AdPlatform, Platform, SocialPlatform
from ...models.schemas import (
    AdGenerateRequest,
    ListingGenerateRequest,
    SocialGenerateRequest,
)
from ...prompts.listing_prompts import get_listing_system_prompt, get_listing_user_prompt
from ...prompts.image_prompts import build_image_prompt
from ...prompts.social_prompts import get_social_system_prompt, get_social_user_prompt
from ...prompts.ad_prompts import get_ad_system_prompt, get_ad_user_prompt

router = APIRouter(prefix="/demo", tags=["demo"])

_client = anthropic.Anthropic(
    api_key=settings.minimax_api_key,
    base_url=settings.minimax_base_url,
)


def _extract_text(response) -> str:
    """Extract text from MiniMax response, skipping ThinkingBlocks."""
    for block in response.content:
        if hasattr(block, "text") and block.text:
            return block.text
    return ""


def _parse_json(text: str) -> dict:
    """Parse JSON from LLM response, handling code fences."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass
    raise ValueError("Could not parse JSON from response")


# ── Listing Generation ────────────────────────────────────────────────

class ListingRequest(BaseModel):
    platform: str
    product_name: str
    product_details: str
    target_audience: str = ""
    price_range: str = ""
    category: str = ""


@router.post("/listings/generate")
async def generate_listing(req: ListingRequest):
    try:
        system = get_listing_system_prompt(req.platform)
        # Wrap in proper schema so prompt functions work with .platform.value
        schema_req = ListingGenerateRequest(
            platform=Platform(req.platform),
            product_name=req.product_name,
            product_details=req.product_details,
            target_audience=req.target_audience,
            price_range=req.price_range,
            category=req.category,
        )
        user_msg = get_listing_user_prompt(schema_req)

        response = _client.messages.create(
            model=settings.minimax_model,
            max_tokens=4096,
            system=system,
            messages=[{"role": "user", "content": user_msg}],
        )

        raw = _extract_text(response)
        if not raw:
            raise HTTPException(500, "AI model returned no text")

        parsed = _parse_json(raw)

        return {
            "id": str(uuid.uuid4()),
            "platform": req.platform,
            "product_name": req.product_name,
            "generated_title": parsed.get("title", ""),
            "generated_bullets": parsed.get("bullets", []),
            "generated_description": parsed.get("description", ""),
            "generated_keywords": parsed.get("keywords", []),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to generate listing: {str(e)[:200]}")


# ── Image Generation ─────────────────────────────────────────────────

class ImageRequest(BaseModel):
    description: str
    aspect_ratio: str = "1:1"
    image_type: str = "lifestyle"
    style: str = "photorealistic"


@router.post("/images/generate")
async def generate_image(req: ImageRequest):
    try:
        prompt = build_image_prompt(req.description, req.image_type, req.style, req.aspect_ratio)

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                settings.minimax_image_url,
                headers={
                    "Authorization": f"Bearer {settings.minimax_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "image-01",
                    "prompt": prompt,
                    "aspect_ratio": req.aspect_ratio,
                    "response_format": "base64",
                },
            )
            resp.raise_for_status()

        data = resp.json()
        img_data = data.get("data", {}).get("image_base64", [])
        if isinstance(img_data, list) and img_data:
            b64 = img_data[0]
        elif isinstance(img_data, str):
            b64 = img_data
        else:
            raise HTTPException(500, "No image data returned")

        return {
            "id": str(uuid.uuid4()),
            "public_url": f"data:image/jpeg;base64,{b64}",
            "prompt": prompt,
            "aspect_ratio": req.aspect_ratio,
            "image_type": req.image_type,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to generate image: {str(e)[:200]}")


# ── Social Post Generation ───────────────────────────────────────────

class SocialRequest(BaseModel):
    platform: str
    product_name: str
    product_details: str
    tone: str = "professional"
    generate_image: bool = False


@router.post("/social/generate")
async def generate_social(req: SocialRequest):
    try:
        system = get_social_system_prompt(req.platform, req.tone)
        schema_req = SocialGenerateRequest(
            platform=SocialPlatform(req.platform),
            product_name=req.product_name,
            product_details=req.product_details,
            tone=req.tone,
            generate_image=req.generate_image,
        )
        user_msg = get_social_user_prompt(schema_req)

        response = _client.messages.create(
            model=settings.minimax_model,
            max_tokens=2048,
            system=system,
            messages=[{"role": "user", "content": user_msg}],
        )

        raw = _extract_text(response)
        parsed = _parse_json(raw)

        return {
            "id": str(uuid.uuid4()),
            "platform": req.platform,
            "caption": parsed.get("caption", ""),
            "hashtags": parsed.get("hashtags", []),
            "cta_text": parsed.get("cta_text", ""),
            "image_url": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to generate social post: {str(e)[:200]}")


# ── Ad Copy Generation ───────────────────────────────────────────────

class AdRequest(BaseModel):
    ad_platform: str
    product_name: str
    product_details: str
    target_audience: str = ""
    num_variants: int = 3


@router.post("/ads/generate")
async def generate_ads(req: AdRequest):
    try:
        system = get_ad_system_prompt(req.ad_platform, req.num_variants)
        schema_req = AdGenerateRequest(
            ad_platform=AdPlatform(req.ad_platform),
            product_name=req.product_name,
            product_details=req.product_details,
            target_audience=req.target_audience,
            num_variants=req.num_variants,
        )
        user_msg = get_ad_user_prompt(schema_req)

        response = _client.messages.create(
            model=settings.minimax_model,
            max_tokens=3000,
            system=system,
            messages=[{"role": "user", "content": user_msg}],
        )

        raw = _extract_text(response)
        parsed = _parse_json(raw)

        variants = parsed.get("variants", [])
        if not variants and isinstance(parsed, list):
            variants = parsed

        return {
            "variants": variants,
            "ad_platform": req.ad_platform,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to generate ad copy: {str(e)[:200]}")


# ── Research ──────────────────────────────────────────────────────────

class ResearchRequest(BaseModel):
    query: str
    platform: str | None = None


@router.post("/research/search")
async def research(req: ResearchRequest):
    try:
        # Use DuckDuckGo for live search
        from ...services.search_provider import web_search
        results = await web_search(req.query, max_results=10, use_searxng=False)

        # Analyze with MiniMax
        results_text = "\n".join(
            f"- {r['title']}: {r['snippet']}" for r in results
        )

        system = (
            "You are an e-commerce competitive analyst. Analyze these search results "
            "and return valid JSON with keys: analysis (string, 300+ words), "
            "keywords_found (array of strings, 15+), "
            "competitors (array of objects with name, strengths, weaknesses, price_range)"
        )

        response = _client.messages.create(
            model=settings.minimax_model,
            max_tokens=4096,
            system=system,
            messages=[{"role": "user", "content": f"Research: {req.query}\n\nSearch results:\n{results_text}"}],
        )

        raw = _extract_text(response)
        parsed = _parse_json(raw)

        return {
            "id": str(uuid.uuid4()),
            "query": req.query,
            "analysis": parsed.get("analysis", ""),
            "keywords_found": parsed.get("keywords_found", []),
            "competitors": parsed.get("competitors", []),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to perform research: {str(e)[:200]}")


# ── Product Photoshoot (Grok) ─────────────────────────────────────────

class PhotoshootRequest(BaseModel):
    image_base64: str  # base64-encoded product image
    themes: list[str]  # e.g. ["studio", "outdoor", "model", "context", "outdoor"]
    aspect_ratio: str = "1:1"


GROK_CHAT_URL = "https://api.x.ai/v1/chat/completions"
GROK_IMAGE_URL = "https://api.x.ai/v1/images/edits"


def _grok_headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.grok_api_key}",
        "Content-Type": "application/json",
    }


@router.post("/photoshoot/generate")
async def generate_photoshoot(req: PhotoshootRequest):
    if len(req.themes) > 5:
        raise HTTPException(400, "Maximum 5 images per run")
    if len(req.themes) < 1:
        raise HTTPException(400, "Select at least 1 theme")

    # Ensure at least one context-driven image
    has_context = "context" in req.themes
    themes = list(req.themes)
    if not has_context:
        # Replace last non-context theme with context
        themes[-1] = "context"

    # Step 1: Analyze product with Grok 4 vision
    async with httpx.AsyncClient(timeout=60.0) as client:
        analysis_resp = await client.post(
            GROK_CHAT_URL,
            headers=_grok_headers(),
            json={
                "model": "grok-4-1-fast-non-reasoning",
                "messages": [{
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/png;base64,{req.image_base64}"},
                        },
                        {
                            "type": "text",
                            "text": f"""Analyze this product for an e-commerce photoshoot. Return ONLY valid JSON:
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
}}"""
                        },
                    ],
                }],
                "temperature": 0.3,
            },
        )

    analysis_data = analysis_resp.json()
    raw_analysis = analysis_data["choices"][0]["message"]["content"]

    # Parse analysis JSON
    try:
        analysis = json.loads(raw_analysis)
    except json.JSONDecodeError:
        match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', raw_analysis, re.DOTALL)
        if match:
            analysis = json.loads(match.group(1))
        else:
            start_idx = raw_analysis.find('{')
            end_idx = raw_analysis.rfind('}')
            analysis = json.loads(raw_analysis[start_idx:end_idx + 1])

    prompts_dict = analysis.get("prompts", {})

    # Step 2: Generate images with Grok Imagine
    results = []
    async with httpx.AsyncClient(timeout=120.0) as client:
        for i, theme in enumerate(themes):
            prompt_key = f"shot_{i+1}"
            prompt = prompts_dict.get(prompt_key, f"Professional {theme} photo of this product")

            try:
                # Model shots get portrait aspect ratio to avoid face cropping
                shot_ratio = "3:4" if theme == "model" else req.aspect_ratio

                img_resp = await client.post(
                    GROK_IMAGE_URL,
                    headers=_grok_headers(),
                    json={
                        "model": "grok-imagine-image",
                        "prompt": prompt,
                        "image": {
                            "url": f"data:image/png;base64,{req.image_base64}",
                            "type": "image_url",
                        },
                        "aspect_ratio": shot_ratio,
                        "n": 1,
                        "response_format": "b64_json",
                    },
                )

                img_data = img_resp.json()
                b64 = img_data["data"][0]["b64_json"]

                results.append({
                    "id": str(uuid.uuid4()),
                    "theme": theme,
                    "prompt_used": prompt,
                    "image_base64": b64,
                    "success": True,
                })
            except Exception as e:
                results.append({
                    "id": str(uuid.uuid4()),
                    "theme": theme,
                    "prompt_used": prompt,
                    "image_base64": None,
                    "success": False,
                    "error": str(e)[:200],
                })

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


# ── Ad Creative with Image (Grok) ────────────────────────────────────

class AdCreativeRequest(BaseModel):
    image_base64: str  # base64-encoded product image
    product_name: str
    product_details: str
    target_audience: str = ""
    ad_platform: str = "facebook"  # facebook or google
    creative_sizes: list[str]  # e.g. ["1080x1080", "1200x628", "1080x1920"]
    content_direction: str = ""  # optional user input on what the creative should convey
    template_id: str | None = None  # optional template to use as style reference
    template_base64: str | None = None  # base64 of the template image


# Template definitions — must match frontend
CREATIVE_TEMPLATES = {
    "flash_sale": {
        "name": "Flash Sale",
        "style_instruction": (
            "Recreate the EXACT visual layout, typography style, color scheme, and design of the first image "
            "(flash sale ad with dark gradient background, bold white headline at top, large yellow discount "
            "percentage in center, info bar at bottom, red urgency badge). Replace the product with the one "
            "from the second image. Customize all text messaging with the provided details."
        ),
    },
    "new_arrival": {
        "name": "New Arrival",
        "style_instruction": (
            "Recreate the EXACT visual layout and design of the first image (elegant product launch ad with "
            "cream/beige marble background, soft window light, thin serif header, elegant script collection "
            "name, small caps subtitle, bottom info bar). Replace the product with the one from the second "
            "image. Customize all text messaging with the provided details."
        ),
    },
    "seasonal": {
        "name": "Seasonal / Summer",
        "style_instruction": (
            "Recreate the EXACT visual layout and design of the first image (vibrant seasonal ad with bright "
            "colored background, bold chunky headline, colored banner ribbon with offer, promo code badge, "
            "brand URL at bottom). Replace products with the one from the second image and add contextually "
            "relevant props. Customize all text messaging with the provided details."
        ),
    },
    "premium": {
        "name": "Premium Lifestyle",
        "style_instruction": (
            "Recreate the EXACT visual layout and design of the first image (premium moody ad with dark wood "
            "surface, warm left-side lighting, gold serif headline at top, white pricing text in center, "
            "italic feature list, dark bottom banner with offer). Replace the product/surface with the one "
            "from the second image. Customize all text messaging with the provided details."
        ),
    },
    "app_download": {
        "name": "App / Tech",
        "style_instruction": (
            "Recreate the EXACT visual layout and design of the first image (modern tech ad with dark "
            "purple-to-black gradient, glowing energy effects, bold condensed white headline, gradient "
            "subtitle, social proof with stars, green CTA button at bottom). Replace the product with "
            "the one from the second image. Customize all text messaging with the provided details."
        ),
    },
}

@router.post("/ads/creative")
async def generate_ad_creative(req: AdCreativeRequest):
    """Generate visual ad creatives using Grok — product image + AI scene."""

    if len(req.creative_sizes) > 5:
        raise HTTPException(400, "Maximum 5 creatives per run")

    # Map creative sizes to Grok aspect ratios
    SIZE_TO_RATIO = {
        "1080x1080": "1:1",      # Feed square
        "1200x628": "16:9",      # Facebook feed landscape
        "1080x1920": "9:16",     # Story/Reel
        "1200x1200": "1:1",      # Square
        "1080x1350": "3:4",      # Portrait feed
        "1920x1080": "16:9",     # Landscape
        "600x600": "1:1",        # Small square
        "1200x900": "4:3",       # Standard
    }

    # Determine if template-based or freestyle
    # For any template_id, use a generic style instruction since we have the template image
    template = None
    if req.template_id and req.template_base64:
        template = CREATIVE_TEMPLATES.get(req.template_id) or {
            "name": req.template_id,
            "style_instruction": (
                "Recreate the EXACT visual layout, typography style, color scheme, element placement, "
                "and overall design of the first image (the template). Replace the product shown with "
                "the product from the second image. Keep all design elements: background style, text "
                "hierarchy, badge positions, CTA placement, color palette, and mood. Customize the "
                "text content with the provided product details and messaging."
            ),
        }

    # Step 1: Analyze product with Grok 4 vision and generate prompts
    if template:
        # Template mode: instruct Grok to follow the template style
        prompt_instruction = (
            f"{template['style_instruction']} "
            f"Product name: {req.product_name}. "
            f"Product details: {req.product_details}. "
            f"{f'Offer/messaging: {req.content_direction}. ' if req.content_direction else ''}"
            f"{f'Target audience: {req.target_audience}. ' if req.target_audience else ''}"
            f"Generate a prompt for each requested size that follows the template layout exactly "
            f"but with this product and customized messaging."
        )
    else:
        prompt_instruction = ""

    async with httpx.AsyncClient(timeout=60.0) as client:
        analysis_resp = await client.post(
            GROK_CHAT_URL,
            headers=_grok_headers(),
            json={
                "model": "grok-4-1-fast-non-reasoning",
                "messages": [{
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/png;base64,{req.image_base64}"},
                        },
                        {
                            "type": "text",
                            "text": f"""Analyze this product for ad creatives. Return ONLY valid JSON:
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
}}"""
                        },
                    ],
                }],
                "temperature": 0.3,
            },
        )

    analysis_data = analysis_resp.json()
    raw_analysis = analysis_data["choices"][0]["message"]["content"]

    # Parse JSON
    try:
        analysis = json.loads(raw_analysis)
    except json.JSONDecodeError:
        match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', raw_analysis, re.DOTALL)
        if match:
            analysis = json.loads(match.group(1))
        else:
            start_idx = raw_analysis.find('{')
            end_idx = raw_analysis.rfind('}')
            analysis = json.loads(raw_analysis[start_idx:end_idx + 1])

    prompts_dict = analysis.get("prompts", {})

    # Step 2: Generate creatives with Grok Imagine
    results = []
    async with httpx.AsyncClient(timeout=120.0) as client:
        for i, size in enumerate(req.creative_sizes):
            prompt_key = f"creative_{i+1}"
            prompt = prompts_dict.get(prompt_key, f"Professional {req.ad_platform} ad for this product")
            aspect_ratio = SIZE_TO_RATIO.get(size, "1:1")

            try:
                # Build image payload: dual-image (template + product) or single (product only)
                if template and req.template_base64:
                    image_payload = {
                        "images": [
                            {"url": f"data:image/png;base64,{req.template_base64}", "type": "image_url"},
                            {"url": f"data:image/png;base64,{req.image_base64}", "type": "image_url"},
                        ],
                    }
                else:
                    image_payload = {
                        "image": {
                            "url": f"data:image/png;base64,{req.image_base64}",
                            "type": "image_url",
                        },
                    }

                img_resp = await client.post(
                    GROK_IMAGE_URL,
                    headers=_grok_headers(),
                    json={
                        "model": "grok-imagine-image",
                        "prompt": prompt,
                        **image_payload,
                        "aspect_ratio": aspect_ratio,
                        "n": 1,
                        "response_format": "b64_json",
                    },
                )

                img_data = img_resp.json()
                b64 = img_data["data"][0]["b64_json"]

                results.append({
                    "id": str(uuid.uuid4()),
                    "size": size,
                    "aspect_ratio": aspect_ratio,
                    "prompt_used": prompt,
                    "template_used": req.template_id,
                    "image_base64": b64,
                    "success": True,
                })
            except Exception as e:
                results.append({
                    "id": str(uuid.uuid4()),
                    "size": size,
                    "aspect_ratio": aspect_ratio,
                    "prompt_used": prompt,
                    "template_used": req.template_id,
                    "image_base64": None,
                    "success": False,
                    "error": str(e)[:200],
                })

    return {
        "product_analysis": {
            "product_name": analysis.get("product_name", req.product_name),
            "product_category": analysis.get("product_category", ""),
            "color": analysis.get("color", ""),
        },
        "creatives": results,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


# ── Usage (mock) ──────────────────────────────────────────────────────

@router.get("/usage/current")
async def get_usage():
    return {
        "used": 0,
        "limit": 15000,
        "remaining": 15000,
        "window_resets_at": datetime.now(timezone.utc).isoformat(),
        "plan": "business",
    }
