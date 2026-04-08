"""Listing generation orchestrator.

Builds platform-specific prompts, calls MiniMax for text generation,
parses the structured JSON response, and persists the listing to the database.
"""

import json
import logging
import re
from datetime import datetime, timezone
from uuid import UUID

from ..db.repositories import listings_repo
from ..models.enums import Platform
from ..models.schemas import ListingGenerateRequest, ListingGenerateResponse
from .minimax_text import generate_text

logger = logging.getLogger(__name__)


# ── Prompt builders ──────────────────────────────────────────────────────────

def _get_listing_system_prompt(platform: Platform) -> str:
    """Return the system prompt tailored to the target e-commerce platform."""
    platform_guidelines = {
        Platform.AMAZON: (
            "You are an expert Amazon product listing copywriter. "
            "Follow Amazon's style guide: titles up to 200 characters with key details, "
            "5 concise bullet points (each under 500 characters) highlighting benefits, "
            "an HTML-free product description (up to 2000 characters), "
            "and relevant backend search keywords (comma-separated, no brand names)."
        ),
        Platform.ETSY: (
            "You are an expert Etsy product listing copywriter. "
            "Follow Etsy's best practices: warm, story-driven titles up to 140 characters, "
            "5 bullet points emphasizing craftsmanship and uniqueness, "
            "a conversational product description that tells the item's story, "
            "and 13 relevant Etsy tags (comma-separated)."
        ),
        Platform.SHOPIFY: (
            "You are an expert Shopify product listing copywriter. "
            "Write a compelling SEO-friendly title (under 70 characters), "
            "5 benefit-focused bullet points, "
            "a persuasive product description using clear formatting, "
            "and relevant SEO keywords (comma-separated)."
        ),
    }

    base = platform_guidelines.get(
        platform,
        "You are an expert e-commerce product listing copywriter.",
    )

    return (
        f"{base}\n\n"
        "IMPORTANT: Respond ONLY with a valid JSON object in this exact format, "
        "with no additional text, markdown, or explanation:\n"
        "{\n"
        '  "title": "Product title here",\n'
        '  "bullets": ["Bullet 1", "Bullet 2", "Bullet 3", "Bullet 4", "Bullet 5"],\n'
        '  "description": "Full product description here",\n'
        '  "keywords": ["keyword1", "keyword2", "keyword3"]\n'
        "}"
    )


def _get_listing_user_prompt(request: ListingGenerateRequest) -> str:
    """Build the user prompt from the listing generation request."""
    parts = [
        f"Product: {request.product_name}",
        f"Details: {request.product_details}",
    ]

    if request.target_audience:
        parts.append(f"Target Audience: {request.target_audience}")
    if request.price_range:
        parts.append(f"Price Range: {request.price_range}")
    if request.category:
        parts.append(f"Category: {request.category}")

    parts.append(
        f"\nGenerate an optimized {request.platform.value} product listing."
    )

    return "\n".join(parts)


# ── JSON parsing ─────────────────────────────────────────────────────────────

def _parse_listing_json(raw: str) -> dict:
    """Parse the LLM response into a structured listing dict.

    Handles cases where the model wraps JSON in markdown code fences
    or includes extraneous text before/after the JSON.
    """
    text = raw.strip()

    # Try direct parse
    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError):
        pass

    # Strip markdown code fences
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

    # Try to find the first { ... } block
    brace_match = re.search(r"\{.*\}", text, re.DOTALL)
    if brace_match:
        try:
            return json.loads(brace_match.group(0))
        except (json.JSONDecodeError, ValueError):
            pass

    raise ValueError(f"Unable to parse listing JSON from LLM response: {text[:500]}")


# ── Main orchestrator ────────────────────────────────────────────────────────

async def generate_listing(
    request: ListingGenerateRequest,
    user_id: str,
) -> ListingGenerateResponse:
    """Generate a product listing end-to-end.

    1. Build platform-specific system and user prompts.
    2. Call MiniMax for text generation.
    3. Parse the JSON response.
    4. Persist the listing to the database.
    5. Return a structured response.

    Args:
        request: The listing generation request with product details.
        user_id: The authenticated user's ID.

    Returns:
        ListingGenerateResponse with the generated listing data.

    Raises:
        RuntimeError: On generation or parsing failure.
        ValueError: If the LLM response cannot be parsed.
    """
    system_prompt = _get_listing_system_prompt(request.platform)
    user_prompt = _get_listing_user_prompt(request)

    logger.info(
        "Generating %s listing for user %s: %s",
        request.platform.value,
        user_id,
        request.product_name,
    )

    raw_response = await generate_text(
        system_prompt=system_prompt,
        user_message=user_prompt,
        max_tokens=4096,
        temperature=0.7,
    )

    parsed = _parse_listing_json(raw_response)

    # Validate and normalize fields
    title = parsed.get("title", "")
    bullets = parsed.get("bullets", [])
    description = parsed.get("description", "")
    keywords = parsed.get("keywords", [])

    if not title:
        raise ValueError("Generated listing is missing a title.")
    if not isinstance(bullets, list):
        bullets = [str(bullets)]
    # Filter empty bullets
    bullets = [b for b in bullets if isinstance(b, str) and b.strip()]

    # Normalize keywords: split comma-separated, remove empties
    if isinstance(keywords, str):
        keywords = [k.strip() for k in keywords.split(",") if k.strip()]
    if not isinstance(keywords, list):
        keywords = [str(keywords)]
    normalized_kw = []
    for k in keywords:
        if not isinstance(k, str):
            continue
        if "," in k:
            normalized_kw.extend(part.strip() for part in k.split(",") if part.strip())
        elif k.strip():
            normalized_kw.append(k.strip())
    keywords = normalized_kw

    # Persist to database
    db_record = listings_repo.create(
        {
            "user_id": user_id,
            "platform": request.platform.value,
            "product_name": request.product_name,
            "product_details": request.product_details,
            "target_audience": request.target_audience,
            "price_range": request.price_range,
            "category": request.category,
            "generated_title": title,
            "generated_bullets": bullets,
            "generated_description": description,
            "generated_keywords": keywords,
            "status": "draft",
            "is_favorite": False,
        }
    )

    logger.info("Listing %s created for user %s", db_record["id"], user_id)

    return ListingGenerateResponse(
        id=UUID(db_record["id"]),
        platform=db_record["platform"],
        product_name=db_record["product_name"],
        generated_title=db_record["generated_title"],
        generated_bullets=db_record["generated_bullets"],
        generated_description=db_record["generated_description"],
        generated_keywords=db_record["generated_keywords"],
        created_at=db_record["created_at"],
    )
