"""Production ad creative endpoint — wraps demo logic + persists to DB & Storage."""

import base64
import logging

from fastapi import APIRouter, Depends, HTTPException

from ...core.auth import get_current_user
from ...core.quota import quota_manager
from ...db.repositories import images_repo
from ...models.enums import REQUEST_COSTS, Feature, GenerationType
from ...models.schemas import UserProfile
from ...services.storage_service import upload_image
from .demo import AdCreativeRequest, generate_ad_creative as _demo_creative

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ads", tags=["ad-creatives"])


@router.post("/creative")
async def generate_ad_creative_prod(
    req: AdCreativeRequest,
    user: UserProfile = Depends(get_current_user),
):
    """Generate visual ad creatives — persists results to DB and Supabase Storage."""
    cost = REQUEST_COSTS[GenerationType.IMAGE] * len(req.creative_sizes)
    await quota_manager.check_quota(str(user.id), user.current_plan, cost, feature=Feature.IMAGE)

    # Run the same generation logic as demo
    result = await _demo_creative(req)

    # Persist each successful creative to Supabase Storage + DB
    saved_creatives = []
    for creative in result["creatives"]:
        if not creative.get("success") or not creative.get("image_base64"):
            saved_creatives.append(creative)
            continue

        try:
            image_bytes = base64.b64decode(creative["image_base64"])
            storage_path, public_url = await upload_image(
                image_bytes, str(user.id), "png"
            )

            # Save to generated_images table
            db_record = images_repo.create({
                "user_id": str(user.id),
                "prompt": creative.get("prompt_used", ""),
                "storage_path": storage_path,
                "public_url": public_url,
                "aspect_ratio": creative.get("aspect_ratio", "1:1"),
                "image_type": "ad_creative",
                "metadata": {
                    "source": "ad_creative",
                    "size": creative.get("size", ""),
                    "template_used": creative.get("template_used"),
                    "product_name": result["product_analysis"].get("product_name", req.product_name),
                    "ad_platform": req.ad_platform,
                },
            })

            creative["id"] = db_record["id"]
            creative["public_url"] = public_url
            creative["storage_path"] = storage_path
        except Exception as e:
            logger.error("Failed to persist ad creative: %s", e)

        saved_creatives.append(creative)

    # Consume quota
    await quota_manager.consume(
        str(user.id),
        GenerationType.IMAGE,
        Feature.AD_COPY,
        cost,
        metadata={
            "source": "ad_creative",
            "sizes": req.creative_sizes,
            "product": req.product_name,
            "template": req.template_id,
        },
    )

    result["creatives"] = saved_creatives
    return result
