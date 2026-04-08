"""Production photoshoot endpoint — wraps demo logic + persists to DB & Storage."""

import base64
import logging

from fastapi import APIRouter, Depends, HTTPException

from ...core.auth import get_current_user
from ...core.quota import quota_manager
from ...db.repositories import images_repo
from ...models.enums import REQUEST_COSTS, Feature, GenerationType
from ...models.schemas import UserProfile
from ...services.storage_service import upload_image
from .demo import PhotoshootRequest, generate_photoshoot as _demo_photoshoot

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/photoshoot", tags=["photoshoot"])


@router.post("/generate")
async def generate_photoshoot_prod(
    req: PhotoshootRequest,
    user: UserProfile = Depends(get_current_user),
):
    """Generate AI photoshoot images — persists results to DB and Supabase Storage."""
    cost = REQUEST_COSTS[GenerationType.IMAGE] * len(req.themes)
    await quota_manager.check_quota(str(user.id), user.current_plan, cost, feature=Feature.IMAGE)

    # Run the same generation logic as demo
    result = await _demo_photoshoot(req)

    # Persist each successful image to Supabase Storage + DB
    saved_images = []
    for img in result["images"]:
        if not img.get("success") or not img.get("image_base64"):
            saved_images.append(img)
            continue

        try:
            image_bytes = base64.b64decode(img["image_base64"])
            storage_path, public_url = await upload_image(
                image_bytes, str(user.id), "png"
            )

            # Save to generated_images table
            db_record = images_repo.create({
                "user_id": str(user.id),
                "prompt": img.get("prompt_used", ""),
                "storage_path": storage_path,
                "public_url": public_url,
                "aspect_ratio": req.aspect_ratio if img["theme"] != "model" else "3:4",
                "image_type": img["theme"],
                "metadata": {
                    "source": "photoshoot",
                    "product_name": result["product_analysis"].get("product_name", ""),
                    "theme": img["theme"],
                },
            })

            img["id"] = db_record["id"]
            img["public_url"] = public_url
            img["storage_path"] = storage_path
        except Exception as e:
            logger.error("Failed to persist photoshoot image: %s", e)

        saved_images.append(img)

    # Consume quota
    await quota_manager.consume(
        str(user.id),
        GenerationType.IMAGE,
        Feature.IMAGE,
        cost,
        metadata={
            "source": "photoshoot",
            "themes": req.themes,
            "product": result["product_analysis"].get("product_name", ""),
        },
    )

    result["images"] = saved_images
    return result
