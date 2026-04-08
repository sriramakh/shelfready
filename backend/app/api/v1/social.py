from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from ...core.auth import get_current_user
from ...core.quota import quota_manager
from ...db.repositories import social_repo
from ...models.enums import REQUEST_COSTS, Feature, GenerationType
from ...models.schemas import (
    MessageResponse,
    SocialGenerateRequest,
    SocialGenerateResponse,
    UserProfile,
)
from ...services.social_generator import generate_social_post

router = APIRouter(prefix="/social", tags=["social"])


@router.post("/generate", response_model=SocialGenerateResponse)
async def create_social_post(
    request: SocialGenerateRequest,
    user: UserProfile = Depends(get_current_user),
):
    """Generate a social media post with optional image."""
    text_cost = REQUEST_COSTS[GenerationType.TEXT]
    image_cost = REQUEST_COSTS[GenerationType.IMAGE] if request.generate_image else 0
    total_cost = text_cost + image_cost

    await quota_manager.check_quota(str(user.id), user.current_plan, total_cost, feature=Feature.SOCIAL)

    result = await generate_social_post(request, str(user.id))

    # Consume text quota
    await quota_manager.consume(
        str(user.id),
        GenerationType.TEXT,
        Feature.SOCIAL,
        text_cost,
        metadata={"platform": request.platform.value},
    )

    # Consume image quota if image was generated
    if request.generate_image:
        await quota_manager.consume(
            str(user.id),
            GenerationType.IMAGE,
            Feature.SOCIAL,
            image_cost,
            metadata={"platform": request.platform.value, "with_image": True},
        )

    return result


@router.get("", response_model=list[SocialGenerateResponse])
async def list_social_posts(
    user: UserProfile = Depends(get_current_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """List all social posts for the current user."""
    items, _ = social_repo.list_by_user(str(user.id), page, per_page)
    return items


@router.get("/{post_id}", response_model=SocialGenerateResponse)
async def get_social_post(
    post_id: UUID,
    user: UserProfile = Depends(get_current_user),
):
    """Get a single social post by ID."""
    item = social_repo.get_by_id(post_id, str(user.id))
    if not item:
        raise HTTPException(status_code=404, detail="Social post not found")
    return item


@router.delete("/{post_id}", response_model=MessageResponse)
async def delete_social_post(
    post_id: UUID,
    user: UserProfile = Depends(get_current_user),
):
    """Delete a social post."""
    deleted = social_repo.delete(post_id, str(user.id))
    if not deleted:
        raise HTTPException(status_code=404, detail="Social post not found")
    return MessageResponse(message="Social post deleted")
