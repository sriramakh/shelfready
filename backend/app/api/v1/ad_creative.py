"""Production ad creative endpoint — persists to DB & Supabase Storage."""

import base64
import logging

from fastapi import APIRouter, Depends, HTTPException

from ...core.auth import get_current_user
from ...core.quota import quota_manager
from ...db.repositories import images_repo
from ...models.enums import Feature, GenerationType
from ...models.schemas import UserProfile
from ...services.storage_service import upload_image
from ...services.creative_service import AdCreativeRequest, generate_ad_creative

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/creatives", tags=["ad-creatives"])


@router.post("/generate")
async def generate_ad_creative_prod(
    req: AdCreativeRequest,
    user: UserProfile = Depends(get_current_user),
):
    """Generate visual ad creatives — persists to DB and Supabase Storage.

    Each creative size is a separate Grok Imagine call, so each image counts
    as a single IMAGE slot. (Prior behavior counted the whole run as 1 AD
    slot, which under-counted and also used the wrong bucket.)
    """
    num_creatives = max(1, len(req.creative_sizes or []))

    log_id = await quota_manager.reserve(
        str(user.id),
        user.current_plan,
        feature=Feature.IMAGE,
        generation_type=GenerationType.IMAGE,
        cost=num_creatives,
        metadata={
            "source": "ad_creative",
            "sizes": req.creative_sizes,
            "product": req.product_name,
            "ad_platform": req.ad_platform,
        },
    )

    try:
        result = await generate_ad_creative(req)
    except HTTPException:
        await quota_manager.release(log_id, str(user.id))
        raise
    except Exception as exc:
        await quota_manager.release(log_id, str(user.id))
        logger.exception("Ad creative generation failed")
        raise HTTPException(status_code=500, detail=f"Creative generation failed: {str(exc)[:200]}")

    saved_creatives = []
    for creative in result["creatives"]:
        if not creative.get("success") or not creative.get("image_base64"):
            saved_creatives.append(creative)
            continue

        try:
            image_bytes = base64.b64decode(creative["image_base64"])
            storage_path, public_url = await upload_image(image_bytes, str(user.id), "png")

            db_record = images_repo.create({
                "user_id": str(user.id),
                "prompt": creative.get("prompt_used", ""),
                "storage_path": storage_path,
                "public_url": public_url,
                "aspect_ratio": creative.get("aspect_ratio", "1:1"),
                "image_type": "ad_creative",
                "metadata": {"source": "ad_creative", "size": creative.get("size", ""), "template_used": creative.get("template_used"), "product_name": result["product_analysis"].get("product_name", req.product_name), "ad_platform": req.ad_platform},
            })

            creative["id"] = db_record["id"]
            creative["public_url"] = public_url
            creative["storage_path"] = storage_path
        except Exception as e:
            logger.error("Failed to persist ad creative: %s", e)

        saved_creatives.append(creative)

    result["creatives"] = saved_creatives
    return result
