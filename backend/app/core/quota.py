import logging
from datetime import datetime, timedelta, timezone

from ..config import settings
from ..core.exceptions import GlobalBudgetExceededException, QuotaExceededException
from ..db.supabase_client import get_supabase
from ..models.enums import PLAN_QUOTAS, Feature, GenerationType, PlanTier
from ..models.schemas import UsageCurrent

logger = logging.getLogger(__name__)

# Map features to their monthly limit key in PLAN_QUOTAS
FEATURE_MONTHLY_LIMIT_KEY = {
    Feature.LISTING: "max_listings_per_month",
    Feature.IMAGE: "max_images_per_month",
    Feature.RESEARCH: "research_enabled",
}


class QuotaManager:
    """Sliding window + monthly quota management for per-user and global budgets."""

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

    async def get_monthly_feature_usage(self, user_id: str, feature: Feature) -> int:
        """Get number of times a feature was used this calendar month."""
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        supabase = get_supabase()

        result = (
            supabase.table("usage_logs")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .eq("feature", feature.value)
            .gte("created_at", month_start.isoformat())
            .execute()
        )

        return result.count or 0

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

    async def check_quota(
        self, user_id: str, plan: str, cost: int, feature: Feature | None = None,
    ) -> UsageCurrent:
        """Check if user has enough quota. Raises if exceeded.

        Checks:
        1. 5-hour rolling window rate limit
        2. Monthly per-feature limits (listings, images, photoshoots)
        3. Feature gating (e.g. research disabled on free plan)
        4. Global budget cap
        """
        plan_tier = PlanTier(plan)
        plan_config = PLAN_QUOTAS[plan_tier]
        limit = plan_config["requests_per_5h"]

        # 1. Check 5-hour rolling window
        used = await self.get_window_usage(user_id)
        remaining = max(0, limit - used)

        if cost > remaining:
            raise QuotaExceededException(used=used, limit=limit, remaining=remaining)

        # 2. Check monthly per-feature limits
        if feature:
            # Research gating — disabled on free plan
            if feature == Feature.RESEARCH and not plan_config.get("research_enabled", False):
                raise QuotaExceededException(
                    used=0, limit=0, remaining=0,
                    message="Market research is not available on the Free plan. Upgrade to Starter or above.",
                )

            # Monthly feature limits
            limit_key = FEATURE_MONTHLY_LIMIT_KEY.get(feature)
            if limit_key and limit_key != "research_enabled":
                monthly_limit = plan_config.get(limit_key, -1)
                if monthly_limit != -1:  # -1 = unlimited
                    monthly_used = await self.get_monthly_feature_usage(user_id, feature)
                    if monthly_used >= monthly_limit:
                        raise QuotaExceededException(
                            used=monthly_used, limit=monthly_limit, remaining=0,
                            message=f"Monthly {feature.value} limit reached ({monthly_limit}). Resets on the 1st. Upgrade for more.",
                        )

            # Photoshoot limit (images with photoshoot source)
            if feature == Feature.IMAGE:
                photoshoot_limit = plan_config.get("max_photoshoots_per_month", 0)
                if photoshoot_limit == 0 and plan_tier == PlanTier.FREE:
                    raise QuotaExceededException(
                        used=0, limit=0, remaining=0,
                        message="AI photoshoots are not available on the Free plan. Upgrade to Starter or above.",
                    )

        # 3. Check global budget
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
