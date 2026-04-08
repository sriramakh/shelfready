"""Ad copy generation orchestrator.

Builds platform-specific prompts for Facebook or Google ads,
calls MiniMax to generate multiple ad variants, parses the response,
and persists each variant to the database.
"""

import json
import logging
import re
from datetime import datetime, timezone
from uuid import UUID

from ..db.repositories import ads_repo
from ..models.enums import AdPlatform
from ..models.schemas import (
    AdCopyVariant,
    AdGenerateRequest,
    AdGenerateResponse,
)
from .minimax_text import generate_text

logger = logging.getLogger(__name__)


# ── Prompt builders ──────────────────────────────────────────────────────────

def _get_ad_system_prompt(ad_platform: AdPlatform) -> str:
    """Return the system prompt for ad copy generation."""
    platform_guidance = {
        AdPlatform.FACEBOOK: (
            "You are an expert Facebook/Meta ads copywriter. "
            "Write high-converting Facebook ad copy following Meta's best practices:\n"
            "- Headlines: 25-40 characters, attention-grabbing\n"
            "- Primary text: 125-250 characters, benefit-focused with emotional hooks\n"
            "- Description: 30-90 characters, supporting the headline\n"
            "- CTA: One of: Shop Now, Learn More, Sign Up, Get Offer, Buy Now\n"
            "Each variant should test a different angle (e.g., benefit, social proof, urgency, curiosity)."
        ),
        AdPlatform.GOOGLE: (
            "You are an expert Google Ads copywriter. "
            "Write high-converting Google Search ad copy following Google's guidelines:\n"
            "- Headlines: Up to 30 characters each, keyword-rich\n"
            "- Primary text (Description): Up to 90 characters, include a value proposition\n"
            "- Description: Additional supporting text, up to 90 characters\n"
            "- CTA: Embedded naturally in the text\n"
            "Each variant should test a different keyword angle or value proposition."
        ),
    }

    base = platform_guidance.get(
        ad_platform,
        "You are an expert digital advertising copywriter.",
    )

    return (
        f"{base}\n\n"
        "IMPORTANT: Respond ONLY with a valid JSON object in this exact format, "
        "with no additional text, markdown, or explanation:\n"
        "{\n"
        '  "variants": [\n'
        "    {\n"
        '      "headline": "Ad headline",\n'
        '      "primary_text": "Primary ad copy text",\n'
        '      "description": "Supporting description",\n'
        '      "cta": "Call to action",\n'
        '      "variant_label": "Angle tested (e.g., Benefit, Urgency, Social Proof)"\n'
        "    }\n"
        "  ]\n"
        "}"
    )


def _get_ad_user_prompt(request: AdGenerateRequest) -> str:
    """Build the user prompt from the ad generation request."""
    parts = [
        f"Product: {request.product_name}",
        f"Details: {request.product_details}",
    ]

    if request.target_audience:
        parts.append(f"Target Audience: {request.target_audience}")

    parts.append(
        f"\nGenerate {request.num_variants} ad copy variants for "
        f"{request.ad_platform.value} ads."
    )

    return "\n".join(parts)


# ── JSON parsing ─────────────────────────────────────────────────────────────

def _parse_ad_json(raw: str) -> list[dict]:
    """Parse the LLM response into a list of ad variant dicts.

    Handles markdown code fences and extraneous text.
    """
    text = raw.strip()

    parsed = _try_parse_json(text)

    if parsed is None:
        raise ValueError(
            f"Unable to parse ad copy JSON from LLM response: {text[:500]}"
        )

    # Normalize: the model may return {"variants": [...]} or just [...]
    if isinstance(parsed, dict):
        variants = parsed.get("variants", [])
    elif isinstance(parsed, list):
        variants = parsed
    else:
        raise ValueError(f"Unexpected JSON structure in ad response: {type(parsed)}")

    if not isinstance(variants, list) or len(variants) == 0:
        raise ValueError("No ad variants found in LLM response.")

    return variants


def _try_parse_json(text: str):
    """Try multiple strategies to extract JSON from text."""
    # Direct parse
    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError):
        pass

    # Markdown code block
    code_block_match = re.search(
        r"```(?:json)?\s*\n?(.*?)\n?\s*```",
        text,
        re.DOTALL,
    )
    if code_block_match:
        try:
            return json.loads(code_block_match.group(1).strip())
        except (json.JSONDecodeError, ValueError):
            pass

    # First { ... } or [ ... ] block
    for pattern in [r"\{.*\}", r"\[.*\]"]:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except (json.JSONDecodeError, ValueError):
                continue

    return None


# ── Main orchestrator ────────────────────────────────────────────────────────

async def generate_ad_copy(
    request: AdGenerateRequest,
    user_id: str,
) -> AdGenerateResponse:
    """Generate ad copy variants end-to-end.

    1. Build platform-specific system and user prompts.
    2. Call MiniMax to generate the requested number of variants.
    3. Parse the JSON response into AdCopyVariant models.
    4. Save each variant to the ad_copies table.
    5. Return an AdGenerateResponse.

    Args:
        request: The ad copy generation request.
        user_id: The authenticated user's ID.

    Returns:
        AdGenerateResponse with a list of generated ad variants.

    Raises:
        RuntimeError: On generation failure.
        ValueError: If the LLM response cannot be parsed.
    """
    system_prompt = _get_ad_system_prompt(request.ad_platform)
    user_prompt = _get_ad_user_prompt(request)

    logger.info(
        "Generating %d %s ad variants for user %s: %s",
        request.num_variants,
        request.ad_platform.value,
        user_id,
        request.product_name,
    )

    raw_response = await generate_text(
        system_prompt=system_prompt,
        user_message=user_prompt,
        max_tokens=4096,
        temperature=0.8,
    )

    variant_dicts = _parse_ad_json(raw_response)

    # Build validated AdCopyVariant models
    variants: list[AdCopyVariant] = []
    for i, v in enumerate(variant_dicts[: request.num_variants]):
        variant = AdCopyVariant(
            headline=v.get("headline", ""),
            primary_text=v.get("primary_text", ""),
            description=v.get("description", ""),
            cta=v.get("cta", ""),
            variant_label=v.get("variant_label", f"Variant {i + 1}"),
        )
        variants.append(variant)

        # Persist each variant to the database
        ads_repo.create(
            {
                "user_id": user_id,
                "ad_platform": request.ad_platform.value,
                "headline": variant.headline,
                "primary_text": variant.primary_text,
                "description": variant.description,
                "cta": variant.cta,
                "variant_label": variant.variant_label,
                "target_audience": request.target_audience,
                "listing_id": str(request.listing_id) if request.listing_id else None,
            }
        )

    now = datetime.now(timezone.utc)

    logger.info(
        "Generated %d ad variants for user %s",
        len(variants),
        user_id,
    )

    return AdGenerateResponse(
        variants=variants,
        ad_platform=request.ad_platform.value,
        created_at=now,
    )
