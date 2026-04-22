from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from ...core.auth import get_current_user
from ...core.quota import quota_manager
from ...db.supabase_client import get_supabase
from ...models.schemas import UsageLogEntry, UserProfile

router = APIRouter(prefix="/usage", tags=["usage"])


def _next_month_start_utc() -> str:
    """Return ISO timestamp of when the monthly quota window resets."""
    now = datetime.now(timezone.utc)
    # First day of next month at 00:00 UTC
    if now.month == 12:
        next_reset = now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        next_reset = now.replace(month=now.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)
    return next_reset.isoformat()


@router.get("/current")
async def get_current_usage(
    user: UserProfile = Depends(get_current_user),
):
    """Get monthly usage summary per feature plus an aggregate total."""
    features = await quota_manager.get_usage_summary(str(user.id), user.current_plan)

    total_used = sum(f["used"] for f in features.values())
    # Unlimited features (limit == -1) don't contribute to the total cap;
    # we sum only limited features, treating unlimited as "not counted".
    limited = [f for f in features.values() if f["limit"] not in (-1, None)]
    total_limit = sum(f["limit"] for f in limited) if limited else -1
    total_remaining = (
        max(0, total_limit - sum(f["used"] for f in limited))
        if total_limit != -1
        else -1
    )

    return {
        "plan": user.current_plan,
        "features": features,
        "total": {
            "used": total_used,
            "limit": total_limit,
            "remaining": total_remaining,
        },
        "period_resets_at": _next_month_start_utc(),
    }


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
