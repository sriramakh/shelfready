from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from ...core.auth import get_current_user
from ...core.quota import quota_manager
from ...db.repositories import images_repo
from ...models.enums import REQUEST_COSTS, Feature, GenerationType
from ...models.schemas import (
    ImageGenerateRequest,
    ImageGenerateResponse,
    ImageSummary,
    MessageResponse,
    UserProfile,
)
from ...services.image_generator import generate_product_image

router = APIRouter(prefix="/images", tags=["images"])


@router.post("/generate", response_model=ImageGenerateResponse)
async def create_image(
    request: ImageGenerateRequest,
    user: UserProfile = Depends(get_current_user),
):
    """Generate a lifestyle/product image using AI."""
    cost = REQUEST_COSTS[GenerationType.IMAGE]  # 75 requests

    await quota_manager.check_quota(str(user.id), user.current_plan, cost, feature=Feature.IMAGE)

    result = await generate_product_image(request, str(user.id))

    await quota_manager.consume(
        str(user.id),
        GenerationType.IMAGE,
        Feature.IMAGE,
        cost,
        metadata={"image_type": request.image_type.value, "style": request.style.value},
    )

    return result


@router.get("", response_model=list[ImageSummary])
async def list_images(
    user: UserProfile = Depends(get_current_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """List all generated images for the current user."""
    items, total = images_repo.list_by_user(str(user.id), page, per_page)
    return [ImageSummary(**item) for item in items]


@router.get("/{image_id}", response_model=ImageGenerateResponse)
async def get_image(
    image_id: UUID,
    user: UserProfile = Depends(get_current_user),
):
    """Get a single image by ID."""
    item = images_repo.get_by_id(image_id, str(user.id))
    if not item:
        raise HTTPException(status_code=404, detail="Image not found")
    return ImageGenerateResponse(**item)


@router.delete("/{image_id}", response_model=MessageResponse)
async def delete_image(
    image_id: UUID,
    user: UserProfile = Depends(get_current_user),
):
    """Delete a generated image."""
    deleted = images_repo.delete(image_id, str(user.id))
    if not deleted:
        raise HTTPException(status_code=404, detail="Image not found")
    return MessageResponse(message="Image deleted")
