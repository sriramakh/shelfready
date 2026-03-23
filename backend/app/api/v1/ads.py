from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from ...core.auth import get_current_user
from ...core.quota import quota_manager
from ...db.repositories import ads_repo
from ...models.enums import REQUEST_COSTS, Feature, GenerationType
from ...models.schemas import (
    AdGenerateRequest,
    AdGenerateResponse,
    MessageResponse,
    UserProfile,
)
from ...services.ad_generator import generate_ad_copy

router = APIRouter(prefix="/ads", tags=["ads"])


@router.post("/generate", response_model=AdGenerateResponse)
async def create_ad_copy(
    request: AdGenerateRequest,
    user: UserProfile = Depends(get_current_user),
):
    """Generate ad copy variants for Facebook or Google ads."""
    cost = REQUEST_COSTS[GenerationType.TEXT]

    await quota_manager.check_quota(str(user.id), user.current_plan, cost)

    result = await generate_ad_copy(request, str(user.id))

    await quota_manager.consume(
        str(user.id),
        GenerationType.TEXT,
        Feature.AD,
        cost,
        metadata={
            "ad_platform": request.ad_platform.value,
            "num_variants": request.num_variants,
        },
    )

    return result


@router.get("")
async def list_ad_copies(
    user: UserProfile = Depends(get_current_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """List all ad copies for the current user."""
    items, total = ads_repo.list_by_user(str(user.id), page, per_page)
    return {"items": items, "total": total, "page": page, "per_page": per_page}


@router.delete("/{ad_id}", response_model=MessageResponse)
async def delete_ad_copy(
    ad_id: UUID,
    user: UserProfile = Depends(get_current_user),
):
    """Delete an ad copy."""
    deleted = ads_repo.delete(ad_id, str(user.id))
    if not deleted:
        raise HTTPException(status_code=404, detail="Ad copy not found")
    return MessageResponse(message="Ad copy deleted")
