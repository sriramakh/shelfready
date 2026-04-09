import logging
from datetime import datetime, timezone

from ..core.exceptions import QuotaExceededException
from ..db.supabase_client import get_supabase
from ..models.enums import PLAN_QUOTAS, Feature, GenerationType, PlanTier

logger = logging.getLogger(__name__)

# Admin users bypass all quotas
ADMIN_USER_IDS = {
    "fa96ff9b-0cab-462d-884b-1f67026e8d72",  # sriramakh@gmail.com
}

# Map Feature to the corresponding monthly limit key in PLAN_QUOTAS
FEATURE_LIMIT_KEY = {
    Feature.LISTING: "max_listings_per_month",
    Feature.IMAGE: "max_images_per_month",
    Feature.SOCIAL: "max_social_per_month",
    Feature.AD: "max_ads_per_month",
    Feature.RESEARCH: "max_research_per_month",
}


class QuotaManager:
    """Monthly (and lifetime) per-feature quota management."""

    async def get_monthly_feature_usage(self, user_id: str, feature: Feature) -> int:
        """Count how many times a feature was used this calendar month."""
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

    async def get_lifetime_feature_usage(self, user_id: str, feature: Feature) -> int:
        """Count total lifetime usage of a feature."""
        supabase = get_supabase()

        result = (
            supabase.table("usage_logs")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .eq("feature", feature.value)
            .execute()
        )

        return result.count or 0

    async def check_quota(
        self, user_id: str, plan: str, cost: int = 1, feature: Feature | None = None,
    ) -> None:
        """Check if user has enough quota for this feature. Raises if exceeded."""
        if not feature:
            return

        # Admin users bypass all quotas
        if user_id in ADMIN_USER_IDS:
            return

        plan_tier = PlanTier(plan)
        plan_config = PLAN_QUOTAS[plan_tier]

        # Check for lifetime limit first (e.g. free plan images)
        lifetime_key = f"max_{feature.value}s_lifetime" if feature != Feature.IMAGE else "max_images_lifetime"
        lifetime_limit = plan_config.get(lifetime_key)
        if lifetime_limit is not None:
            used = await self.get_lifetime_feature_usage(user_id, feature)
            if used >= lifetime_limit:
                raise QuotaExceededException(
                    used=used, limit=lifetime_limit, remaining=0,
                    message=f"Free plan limit of {lifetime_limit} images reached. Upgrade to Starter for 100 images/month.",
                )
            logger.debug("Lifetime check: user=%s feature=%s used=%d/%d", user_id, feature.value, used, lifetime_limit)
            return

        # Monthly limit
        limit_key = FEATURE_LIMIT_KEY.get(feature)
        if not limit_key:
            return

        monthly_limit = plan_config.get(limit_key, -1)

        # -1 = unlimited
        if monthly_limit == -1:
            return

        # 0 = feature disabled on this plan
        if monthly_limit == 0:
            feature_labels = {
                Feature.LISTING: "Product listings",
                Feature.IMAGE: "AI images",
                Feature.SOCIAL: "Social posts",
                Feature.AD: "Ad creatives",
                Feature.RESEARCH: "Market research",
            }
            label = feature_labels.get(feature, feature.value)
            raise QuotaExceededException(
                used=0, limit=0, remaining=0,
                message=f"{label} is not available on the Free plan. Upgrade to Starter or above.",
            )

        # Check monthly usage
        used = await self.get_monthly_feature_usage(user_id, feature)

        if used >= monthly_limit:
            raise QuotaExceededException(
                used=used, limit=monthly_limit, remaining=0,
                message=f"Monthly limit reached ({used}/{monthly_limit}). Resets on the 1st. Upgrade for more.",
            )

        logger.debug("Quota check: user=%s feature=%s used=%d/%d", user_id, feature.value, used, monthly_limit)

    async def consume(
        self,
        user_id: str,
        generation_type: GenerationType,
        feature: Feature,
        cost: int = 1,
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

    async def get_usage_summary(self, user_id: str, plan: str) -> dict:
        """Get usage summary for all features this month."""
        plan_tier = PlanTier(plan)
        plan_config = PLAN_QUOTAS[plan_tier]

        summary = {}
        for feature, limit_key in FEATURE_LIMIT_KEY.items():
            monthly_limit = plan_config.get(limit_key, -1)
            used = await self.get_monthly_feature_usage(user_id, feature)
            summary[feature.value] = {
                "used": used,
                "limit": monthly_limit,
                "remaining": max(0, monthly_limit - used) if monthly_limit != -1 else -1,
            }

        return summary


quota_manager = QuotaManager()
