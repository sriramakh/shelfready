"""Social media content generation orchestrator.

Builds platform-specific prompts, calls MiniMax for caption generation,
optionally generates an accompanying image, and persists the post.
"""

import json
import logging
import re
from datetime import datetime, timezone
from uuid import UUID

import base64

from ..db.repositories import social_repo
from ..models.enums import SocialPlatform
from ..models.schemas import (
    ImageGenerateRequest,
    SocialGenerateRequest,
    SocialGenerateResponse,
)
from .image_generator import generate_product_image
from .minimax_text import generate_text
from .storage_service import upload_image

logger = logging.getLogger(__name__)


# ── Prompt builders ──────────────────────────────────────────────────────────

def _get_social_system_prompt(platform: SocialPlatform) -> str:
    """Return the system prompt for social media content generation."""
    platform_guidance = {
        SocialPlatform.INSTAGRAM: (
            "You are an expert Instagram content strategist. "
            "Write engaging captions optimized for Instagram's algorithm. "
            "Use line breaks for readability, include a strong hook in the first line, "
            "and suggest 20-30 relevant hashtags mixing popular and niche tags. "
            "Include a clear call-to-action."
        ),
        SocialPlatform.FACEBOOK: (
            "You are an expert Facebook content strategist. "
            "Write conversational, engaging posts optimized for Facebook. "
            "Keep the tone approachable, use questions to drive engagement, "
            "suggest 5-10 relevant hashtags, and include a call-to-action."
        ),
        SocialPlatform.PINTEREST: (
            "You are an expert Pinterest content strategist. "
            "Write SEO-optimized pin descriptions up to 500 characters. "
            "Front-load keywords, use natural language, "
            "suggest 10-15 relevant hashtags, and include a call-to-action."
        ),
    }

    base = platform_guidance.get(
        platform,
        "You are an expert social media content strategist.",
    )

    return (
        f"{base}\n\n"
        "IMPORTANT: Respond ONLY with a valid JSON object in this exact format, "
        "with no additional text, markdown, or explanation:\n"
        "{\n"
        '  "caption": "The full post caption here",\n'
        '  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],\n'
        '  "cta_text": "Call to action text here"\n'
        "}"
    )


def _get_social_user_prompt(request: SocialGenerateRequest) -> str:
    """Build the user prompt from the social generation request."""
    parts = [
        f"Product: {request.product_name}",
        f"Details: {request.product_details}",
        f"Tone: {request.tone}",
        f"\nCreate a {request.platform.value} post for this product.",
    ]

    return "\n".join(parts)


# ── JSON parsing ─────────────────────────────────────────────────────────────

def _parse_social_json(raw: str) -> dict:
    """Parse the LLM response into a structured social post dict.

    Handles markdown code fences and extraneous text.
    """
    text = raw.strip()

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

    # First { ... } block
    brace_match = re.search(r"\{.*\}", text, re.DOTALL)
    if brace_match:
        try:
            return json.loads(brace_match.group(0))
        except (json.JSONDecodeError, ValueError):
            pass

    raise ValueError(
        f"Unable to parse social post JSON from LLM response: {text[:500]}"
    )


# ── Main orchestrator ────────────────────────────────────────────────────────

async def generate_social_post(
    request: SocialGenerateRequest,
    user_id: str,
) -> SocialGenerateResponse:
    """Generate a social media post end-to-end.

    1. Build platform-specific system and user prompts.
    2. Call MiniMax for caption + hashtags + CTA generation.
    3. Parse the structured JSON response.
    4. Optionally generate an accompanying product image.
    5. Save to the social_posts table.
    6. Return a structured response.

    Args:
        request: The social post generation request.
        user_id: The authenticated user's ID.

    Returns:
        SocialGenerateResponse with caption, hashtags, CTA, and optional image.

    Raises:
        RuntimeError: On generation or parsing failure.
    """
    system_prompt = _get_social_system_prompt(request.platform)
    user_prompt = _get_social_user_prompt(request)

    logger.info(
        "Generating %s social post for user %s: %s",
        request.platform.value,
        user_id,
        request.product_name,
    )

    raw_response = await generate_text(
        system_prompt=system_prompt,
        user_message=user_prompt,
        max_tokens=2048,
        temperature=0.8,
    )

    parsed = _parse_social_json(raw_response)

    caption = parsed.get("caption", "")
    hashtags = parsed.get("hashtags", [])
    cta_text = parsed.get("cta_text")

    if not caption:
        raise ValueError("Generated social post is missing a caption.")

    # Normalize hashtags: ensure # prefix, split comma-separated
    if isinstance(hashtags, str):
        hashtags = [h.strip() for h in hashtags.replace(",", " ").split()]
    if not isinstance(hashtags, list):
        hashtags = [str(hashtags)]
    hashtags = [
        h.strip() if h.strip().startswith("#") else f"#{h.strip()}"
        for h in hashtags
        if isinstance(h, str) and h.strip()
    ]

    # Attach an image if one was uploaded or requested.
    # Precedence: uploaded_image_base64 (free) > generate_image (AI, IMAGE quota)
    image_url: str | None = None

    if request.uploaded_image_base64:
        try:
            raw_bytes = base64.b64decode(request.uploaded_image_base64)
            if len(raw_bytes) > 10 * 1024 * 1024:
                raise ValueError("Uploaded image exceeds 10MB.")
            _, image_url = await upload_image(raw_bytes, user_id, "jpg")
            logger.info("Social post using uploaded image for user %s", user_id)
        except Exception as exc:
            logger.warning(
                "Failed to persist uploaded image for social post, proceeding without image: %s",
                exc,
            )
    elif request.generate_image:
        try:
            image_request = ImageGenerateRequest(
                description=(
                    f"Social media product image for {request.product_name}. "
                    f"{request.product_details}"
                ),
                listing_id=request.listing_id,
                aspect_ratio="1:1" if request.platform != SocialPlatform.PINTEREST else "2:3",
            )
            image_response = await generate_product_image(image_request, user_id)
            image_url = image_response.public_url
        except Exception as exc:
            logger.warning(
                "AI image generation failed for social post, proceeding without image: %s",
                exc,
            )

    # Persist to database
    db_data = {
        "user_id": user_id,
        "platform": request.platform.value,
        "caption": caption,
        "hashtags": hashtags,
        "cta_text": cta_text,
    }

    if request.listing_id is not None:
        db_data["listing_id"] = str(request.listing_id)
    if image_url is not None:
        db_data["image_url"] = image_url

    db_record = social_repo.create(db_data)

    logger.info("Social post %s created for user %s", db_record["id"], user_id)

    return SocialGenerateResponse(
        id=UUID(db_record["id"]),
        platform=db_record["platform"],
        caption=db_record["caption"],
        hashtags=db_record["hashtags"],
        cta_text=db_record.get("cta_text"),
        image_url=db_record.get("image_url") or image_url,
        created_at=db_record["created_at"],
    )
