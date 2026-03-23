"""Product image generation orchestrator.

Builds a detailed image prompt, calls MiniMax image generation,
uploads the result to Supabase Storage, and persists the record.
"""

import logging
from datetime import datetime, timezone
from uuid import UUID

from ..db.repositories import images_repo
from ..models.enums import ImageStyle, ImageType
from ..models.schemas import ImageGenerateRequest, ImageGenerateResponse
from .minimax_image import generate_image
from .storage_service import upload_image

logger = logging.getLogger(__name__)


# ── Prompt builder ───────────────────────────────────────────────────────────

def _build_image_prompt(request: ImageGenerateRequest) -> str:
    """Construct a detailed image generation prompt from the request fields."""

    style_descriptions = {
        ImageStyle.PHOTOREALISTIC: (
            "photorealistic, high-resolution product photography, "
            "natural lighting, sharp focus, professional studio quality"
        ),
        ImageStyle.MINIMALIST: (
            "minimalist style, clean background, soft shadows, "
            "simple composition, modern aesthetic"
        ),
        ImageStyle.VIBRANT: (
            "vibrant colors, bold composition, energetic mood, "
            "eye-catching, high contrast, lifestyle feel"
        ),
    }

    type_descriptions = {
        ImageType.LIFESTYLE: (
            "lifestyle setting showing the product in everyday use, "
            "relatable context, warm and inviting atmosphere"
        ),
        ImageType.FLAT_LAY: (
            "flat lay arrangement, top-down perspective, "
            "neatly organized with complementary props on a clean surface"
        ),
        ImageType.IN_USE: (
            "product being actively used by a person, "
            "action shot, demonstrating functionality and benefits"
        ),
        ImageType.STUDIO: (
            "professional studio shot, solid neutral background, "
            "perfect lighting, product centered with no distractions"
        ),
    }

    style_text = style_descriptions.get(
        request.style,
        "high quality, professional product image",
    )
    type_text = type_descriptions.get(
        request.image_type,
        "product photography",
    )

    prompt = (
        f"{request.description}. "
        f"Image type: {type_text}. "
        f"Style: {style_text}. "
        "E-commerce product photo suitable for online marketplace listings. "
        "No text overlays, no watermarks, no logos."
    )

    return prompt


# ── Main orchestrator ────────────────────────────────────────────────────────

async def generate_product_image(
    request: ImageGenerateRequest,
    user_id: str,
) -> ImageGenerateResponse:
    """Generate a product image end-to-end.

    1. Build a detailed image prompt from the request.
    2. Call MiniMax image generation.
    3. Upload the generated image bytes to Supabase Storage.
    4. Save a record in the generated_images table.
    5. Return a structured response with the public URL.

    Args:
        request: The image generation request with description and style.
        user_id: The authenticated user's ID.

    Returns:
        ImageGenerateResponse with the generated image URL and metadata.

    Raises:
        RuntimeError: On generation, upload, or storage failure.
    """
    prompt = _build_image_prompt(request)

    logger.info(
        "Generating %s/%s image for user %s",
        request.image_type.value,
        request.style.value,
        user_id,
    )

    # Generate image bytes
    image_bytes = await generate_image(
        prompt=prompt,
        aspect_ratio=request.aspect_ratio,
    )

    # Upload to Supabase Storage
    storage_path, public_url = await upload_image(
        image_bytes=image_bytes,
        user_id=user_id,
        file_extension="png",
    )

    # Build database record
    db_data = {
        "user_id": user_id,
        "prompt": prompt,
        "storage_path": storage_path,
        "public_url": public_url,
        "aspect_ratio": request.aspect_ratio,
        "image_type": request.image_type.value,
        "style": request.style.value,
    }

    if request.listing_id is not None:
        db_data["listing_id"] = str(request.listing_id)

    db_record = images_repo.create(db_data)

    logger.info("Image %s created for user %s", db_record["id"], user_id)

    return ImageGenerateResponse(
        id=UUID(db_record["id"]),
        public_url=db_record["public_url"],
        prompt=db_record["prompt"],
        aspect_ratio=db_record["aspect_ratio"],
        image_type=db_record["image_type"],
        created_at=db_record["created_at"],
    )
