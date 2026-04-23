from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from ...core.auth import get_current_user
from ...core.quota import quota_manager
from ...db.repositories import social_repo
from ...models.enums import Feature, GenerationType
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
    """Generate a social media post, optionally with an image.

    Image options and their quota impact:
      - uploaded_image_base64 present  → user's own image, no IMAGE quota
      - generate_image=True (no upload) → AI generates, consumes IMAGE quota
      - neither                         → text-only post

    An upload always wins over generate_image so a user can't be charged for
    AI generation when they've already supplied their own image.
    """
    wants_ai_image = request.generate_image and not request.uploaded_image_base64

    reservations = [{
        "feature": Feature.SOCIAL,
        "generation_type": GenerationType.TEXT,
        "cost": 1,
        "metadata": {"platform": request.platform.value},
    }]
    if wants_ai_image:
        reservations.append({
            "feature": Feature.IMAGE,
            "generation_type": GenerationType.IMAGE,
            "cost": 1,
            "metadata": {"source": "social", "platform": request.platform.value},
        })

    log_ids = await quota_manager.reserve_many(
        str(user.id), user.current_plan, reservations,
    )

    try:
        result = await generate_social_post(request, str(user.id))
    except Exception:
        await quota_manager.release_all(log_ids, str(user.id))
        raise

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
