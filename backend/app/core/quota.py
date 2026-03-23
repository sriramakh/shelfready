from datetime import datetime, timedelta, timezone

from ..config import settings
from ..core.exceptions import GlobalBudgetExceededException, QuotaExceededException
from ..db.supabase_client import get_supabase
from ..models.enums import PLAN_QUOTAS, Feature, GenerationType, PlanTier
from ..models.schemas import UsageCurrent


class QuotaManager:
    """Sliding window quota management for per-user and global budgets."""

    async def get_window_usage(self, user_id: str) -> int:
        """Get total requests consumed by user in current 5-hour window."""
        window_start = datetime.now(timezone.utc) - timedelta(hours=5)
        supabase = get_supabase()

        result = (
            supabase.table("usage_logs")
            .select("request_count")
            .eq("user_id", user_id)
            .gte("created_at", window_start.isoformat())
            .execute()
        )

        return sum(row["request_count"] for row in (result.data or []))

    async def get_global_usage(self) -> int:
        """Get total requests consumed across ALL users in current 5-hour window."""
        window_start = datetime.now(timezone.utc) - timedelta(hours=5)
        supabase = get_supabase()

        result = (
            supabase.table("usage_logs")
            .select("request_count")
            .gte("created_at", window_start.isoformat())
            .execute()
        )

        return sum(row["request_count"] for row in (result.data or []))

    async def check_quota(self, user_id: str, plan: str, cost: int) -> UsageCurrent:
        """Check if user has enough quota. Raises if exceeded."""
        plan_tier = PlanTier(plan)
        plan_config = PLAN_QUOTAS[plan_tier]
        limit = plan_config["requests_per_5h"]

        used = await self.get_window_usage(user_id)
        remaining = max(0, limit - used)

        if cost > remaining:
            raise QuotaExceededException(used=used, limit=limit, remaining=remaining)

        # Also check global budget
        global_used = await self.get_global_usage()
        if global_used + cost > settings.global_budget_limit:
            raise GlobalBudgetExceededException()

        window_resets_at = datetime.now(timezone.utc) + timedelta(hours=5)

        return UsageCurrent(
            used=used,
            limit=limit,
            remaining=remaining,
            window_resets_at=window_resets_at,
            plan=plan,
        )

    async def consume(
        self,
        user_id: str,
        generation_type: GenerationType,
        feature: Feature,
        cost: int,
        metadata: dict | None = None,
    ) -> None:
        """Log quota consumption."""
        supabase = get_supabase()

        supabase.table("usage_logs").insert(
            {
                "user_id": user_id,
                "generation_type": generation_type.value,
                "feature": feature.value,
                "request_count": cost,
                "metadata": metadata or {},
            }
        ).execute()

    async def get_current_usage(self, user_id: str, plan: str) -> UsageCurrent:
        """Get current usage status without checking cost."""
        plan_tier = PlanTier(plan)
        plan_config = PLAN_QUOTAS[plan_tier]
        limit = plan_config["requests_per_5h"]

        used = await self.get_window_usage(user_id)
        remaining = max(0, limit - used)
        window_resets_at = datetime.now(timezone.utc) + timedelta(hours=5)

        return UsageCurrent(
            used=used,
            limit=limit,
            remaining=remaining,
            window_resets_at=window_resets_at,
            plan=plan,
        )


quota_manager = QuotaManager()
