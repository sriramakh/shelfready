"""Master suite — vision extraction helper.

The frontend calls POST /master/extract to get structured product info
from an uploaded image, then fans out to each feature's existing endpoint
in parallel. This keeps per-feature loading states independent so a slow
research call doesn't block listings/social/ads reveals.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ...core.auth import get_current_user
from ...models.schemas import UserProfile
from ...services.grok_vision import extract_product_info

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/master", tags=["master"])


class ExtractRequest(BaseModel):
    image_base64: str = Field(..., min_length=16)
    description: str = Field(default="", max_length=2000)


@router.post("/extract")
async def master_extract(
    req: ExtractRequest,
    _user: UserProfile = Depends(get_current_user),
):
    """Analyze an uploaded product image and return structured info.

    Returns: { product_name, product_category, key_features, target_audience,
    suggested_platforms, description, color, materials }
    """
    try:
        product = await extract_product_info(req.image_base64, req.description)
    except Exception as exc:
        logger.exception("Master extract failed")
        raise HTTPException(
            502,
            f"Couldn't analyze the image: {str(exc)[:200]}. Try a clearer product photo.",
        )
    return {"product": product}
