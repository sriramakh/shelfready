from fastapi import Depends

from .core.auth import get_current_user
from .core.quota import quota_manager
from .models.enums import Feature
from .models.schemas import UserProfile


async def require_text_quota(
    user: UserProfile = Depends(get_current_user),
) -> UserProfile:
    """Dependency that checks text generation quota."""
    await quota_manager.check_quota(str(user.id), user.current_plan, feature=Feature.LISTING)
    return user


async def require_image_quota(
    user: UserProfile = Depends(get_current_user),
) -> UserProfile:
    """Dependency that checks image generation quota."""
    await quota_manager.check_quota(str(user.id), user.current_plan, feature=Feature.IMAGE)
    return user


async def require_search_quota(
    user: UserProfile = Depends(get_current_user),
) -> UserProfile:
    """Dependency that checks search quota."""
    await quota_manager.check_quota(str(user.id), user.current_plan, feature=Feature.RESEARCH)
    return user
