from uuid import UUID

from fastapi import APIRouter, Depends, Query

from ...core.auth import get_current_user
from ...core.quota import quota_manager
from ...db.repositories import listings_repo
from ...models.enums import REQUEST_COSTS, Feature, GenerationType
from ...models.schemas import (
    ListingGenerateRequest,
    ListingGenerateResponse,
    ListingSummary,
    ListingUpdate,
    MessageResponse,
    UserProfile,
)
from ...services.listing_generator import generate_listing

router = APIRouter(prefix="/listings", tags=["listings"])


@router.post("/generate", response_model=ListingGenerateResponse)
async def create_listing(
    request: ListingGenerateRequest,
    user: UserProfile = Depends(get_current_user),
):
    """Generate an optimized product listing using AI."""
    cost = REQUEST_COSTS[GenerationType.TEXT]

    # Check quota
    await quota_manager.check_quota(str(user.id), user.current_plan, cost, feature=Feature.LISTING)

    # Generate
    result = await generate_listing(request, str(user.id))

    # Consume quota
    await quota_manager.consume(
        str(user.id),
        GenerationType.TEXT,
        Feature.LISTING,
        cost,
        metadata={"platform": request.platform.value, "product": request.product_name},
    )

    return result


@router.get("", response_model=list[ListingSummary])
async def list_listings(
    user: UserProfile = Depends(get_current_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """List all listings for the current user."""
    items, total = listings_repo.list_by_user(str(user.id), page, per_page)
    return [ListingSummary(**item) for item in items]


@router.get("/{listing_id}", response_model=ListingGenerateResponse)
async def get_listing(
    listing_id: UUID,
    user: UserProfile = Depends(get_current_user),
):
    """Get a single listing by ID."""
    item = listings_repo.get_by_id(listing_id, str(user.id))
    if not item:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Listing not found")
    return ListingGenerateResponse(**item)


@router.put("/{listing_id}", response_model=ListingGenerateResponse)
async def update_listing(
    listing_id: UUID,
    update: ListingUpdate,
    user: UserProfile = Depends(get_current_user),
):
    """Update a listing (manual edits)."""
    data = update.model_dump(exclude_none=True)
    if not data:
        from fastapi import HTTPException

        raise HTTPException(status_code=400, detail="No fields to update")

    result = listings_repo.update(listing_id, str(user.id), data)
    if not result:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Listing not found")
    return ListingGenerateResponse(**result)


@router.delete("/{listing_id}", response_model=MessageResponse)
async def delete_listing(
    listing_id: UUID,
    user: UserProfile = Depends(get_current_user),
):
    """Delete a listing."""
    deleted = listings_repo.delete(listing_id, str(user.id))
    if not deleted:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Listing not found")
    return MessageResponse(message="Listing deleted")


@router.post("/{listing_id}/regenerate", response_model=ListingGenerateResponse)
async def regenerate_listing(
    listing_id: UUID,
    user: UserProfile = Depends(get_current_user),
):
    """Regenerate a listing from its original input."""
    item = listings_repo.get_by_id(listing_id, str(user.id))
    if not item:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Listing not found")

    cost = REQUEST_COSTS[GenerationType.TEXT]
    await quota_manager.check_quota(str(user.id), user.current_plan, cost, feature=Feature.LISTING)

    # Rebuild request from stored input
    request = ListingGenerateRequest(
        platform=item["platform"],
        product_name=item["product_name"],
        product_details=item["input_details"].get("product_details", ""),
        target_audience=item["input_details"].get("target_audience", ""),
        price_range=item["input_details"].get("price_range", ""),
        category=item["input_details"].get("category", ""),
    )

    result = await generate_listing(request, str(user.id))

    await quota_manager.consume(
        str(user.id),
        GenerationType.TEXT,
        Feature.LISTING,
        cost,
        metadata={"platform": request.platform.value, "regenerate": True},
    )

    return result
