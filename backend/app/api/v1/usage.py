from fastapi import APIRouter, Depends

from ...core.auth import get_current_user
from ...core.quota import quota_manager
from ...db.supabase_client import get_supabase
from ...models.schemas import UsageLogEntry, UserProfile

router = APIRouter(prefix="/usage", tags=["usage"])


@router.get("/current")
async def get_current_usage(
    user: UserProfile = Depends(get_current_user),
):
    """Get monthly usage summary per feature."""
    summary = await quota_manager.get_usage_summary(str(user.id), user.current_plan)
    return {"plan": user.current_plan, "features": summary}


@router.get("/history", response_model=list[UsageLogEntry])
async def get_usage_history(
    user: UserProfile = Depends(get_current_user),
    limit: int = 50,
):
    """Get recent usage log entries."""
    supabase = get_supabase()

    result = (
        supabase.table("usage_logs")
        .select("generation_type, feature, request_count, created_at")
        .eq("user_id", str(user.id))
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )

    return [UsageLogEntry(**row) for row in (result.data or [])]
