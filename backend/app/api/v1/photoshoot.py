"""Production photoshoot endpoint — persists to DB & Supabase Storage.

Quota accounting:
- 1 PHOTOSHOOT slot per run (gates max_photoshoots_per_month — free plan has 0
  here so free users are blocked before any image is generated).
- N IMAGE slots per run where N = number of themes requested (each theme is a
  separate Grok Imagine call, so each costs us money and must count separately).
"""

import base64
import logging

from fastapi import APIRouter, Depends

from ...core.auth import get_current_user
from ...core.quota import quota_manager
from ...db.repositories import images_repo
from ...models.enums import Feature, GenerationType
from ...models.schemas import UserProfile
from ...services.storage_service import upload_image
from ...services.photoshoot_service import PhotoshootRequest, generate_photoshoot

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/photoshoot", tags=["photoshoot"])


@router.post("/generate")
async def generate_photoshoot_prod(
    req: PhotoshootRequest,
    user: UserProfile = Depends(get_current_user),
):
    """Generate AI photoshoot images — persists to DB and Supabase Storage."""
    num_images = max(1, len(req.themes or []))

    # Atomic reserve: photoshoot run + each image as a separate IMAGE slot.
    # If either fails, neither is charged.
    log_ids = await quota_manager.reserve_many(
        str(user.id),
        user.current_plan,
        [
            {
                "feature": Feature.PHOTOSHOOT,
                "generation_type": GenerationType.IMAGE,
                "cost": 1,
                "metadata": {"themes": req.themes, "num_images": num_images},
            },
            {
                "feature": Feature.IMAGE,
                "generation_type": GenerationType.IMAGE,
                "cost": num_images,
                "metadata": {"source": "photoshoot", "themes": req.themes},
            },
        ],
    )

    try:
        result = await generate_photoshoot(req)
    except Exception:
        await quota_manager.release_all(log_ids, str(user.id))
        raise

    saved_images = []
    for img in result["images"]:
        if not img.get("success") or not img.get("image_base64"):
            saved_images.append(img)
            continue

        try:
            image_bytes = base64.b64decode(img["image_base64"])
            storage_path, public_url = await upload_image(image_bytes, str(user.id), "png")

            db_record = images_repo.create({
                "user_id": str(user.id),
                "prompt": img.get("prompt_used", ""),
                "storage_path": storage_path,
                "public_url": public_url,
                "aspect_ratio": req.aspect_ratio if img["theme"] != "model" else "3:4",
                "image_type": img["theme"],
                "metadata": {"source": "photoshoot", "product_name": result["product_analysis"].get("product_name", ""), "theme": img["theme"]},
            })

            img["id"] = db_record["id"]
            img["public_url"] = public_url
            img["storage_path"] = storage_path
        except Exception as e:
            logger.error("Failed to persist photoshoot image: %s", e)

        saved_images.append(img)

    result["images"] = saved_images
    return result
