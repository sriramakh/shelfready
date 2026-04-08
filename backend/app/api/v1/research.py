from fastapi import APIRouter, Depends, HTTPException, Query

from ...core.auth import get_current_user
from ...core.quota import quota_manager
from ...db.repositories import research_repo
from ...models.enums import Feature, GenerationType
from ...models.schemas import (
    ResearchRequest,
    ResearchResponse,
    UserProfile,
)
from ...services.research_service import conduct_research

router = APIRouter(prefix="/research", tags=["research"])


@router.post("/search", response_model=ResearchResponse)
async def search_competitors(
    request: ResearchRequest,
    user: UserProfile = Depends(get_current_user),
):
    """Conduct competitor/keyword research using web search + AI analysis."""
    # Quota check handles feature gating (0 = blocked on free plan)
    await quota_manager.check_quota(str(user.id), user.current_plan, feature=Feature.RESEARCH)

    result = await conduct_research(request, str(user.id))

    await quota_manager.consume(
        str(user.id),
        GenerationType.SEARCH,
        Feature.RESEARCH,
        metadata={"query": request.query},
    )

    return result


@router.get("")
async def list_research_sessions(
    user: UserProfile = Depends(get_current_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """List past research sessions."""
    items, total = research_repo.list_by_user(str(user.id), page, per_page)
    return {"items": items, "total": total, "page": page, "per_page": per_page}
