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
    Feature.VISION: "max_vision_per_month",
    Feature.PHOTOSHOOT: "max_photoshoots_per_month",
}

# Friendly label used in quota-exceeded messages.
FEATURE_DISPLAY = {
    Feature.LISTING: "Product listings",
    Feature.IMAGE: "AI images",
    Feature.SOCIAL: "Social posts",
    Feature.AD: "Ad creatives",
    Feature.RESEARCH: "Market research",
    Feature.VISION: "Vision extractions",
    Feature.PHOTOSHOOT: "Photoshoot runs",
}


def _month_start_utc() -> datetime:
    now = datetime.now(timezone.utc)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


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
        """Log quota consumption. Failures are logged but never raised —
        we don't want a usage-log insert failure to abort a successful
        generation. If this ever spikes, investigate via logs.
        """
        supabase = get_supabase()
        try:
            result = (
                supabase.table("usage_logs")
                .insert({
                    "user_id": user_id,
                    "generation_type": generation_type.value,
                    "feature": feature.value,
                    "request_count": cost,
                    "metadata": metadata or {},
                })
                .execute()
            )
            if not result.data:
                logger.warning(
                    "Quota consume: empty response for user=%s feature=%s",
                    user_id, feature.value,
                )
            else:
                logger.info(
                    "Quota consumed: user=%s feature=%s type=%s cost=%d",
                    user_id, feature.value, generation_type.value, cost,
                )
        except Exception as exc:
            logger.error(
                "Quota consume FAILED for user=%s feature=%s: %s",
                user_id, feature.value, exc,
            )

    async def reserve(
        self,
        user_id: str,
        plan: str,
        feature: Feature,
        generation_type: GenerationType,
        cost: int = 1,
        metadata: dict | None = None,
    ) -> str | None:
        """Atomically check limit and insert a usage_logs row.

        Returns the inserted row's id (as str) on success — caller passes it
        to release() if the generation fails. Raises QuotaExceededException
        if the insert would exceed the user's plan limit.

        Falls back to the old non-atomic pattern if the Postgres RPC is
        missing (e.g. the migration hasn't been applied yet). This is logged
        as a WARNING exactly once per process so it's visible.
        """
        metadata = metadata or {}
        supabase = get_supabase()

        # Admin users bypass the limit check but still get their usage logged
        # so /usage shows their activity.
        if user_id in ADMIN_USER_IDS:
            return await self._direct_insert(user_id, feature, generation_type, cost, metadata)

        plan_tier = PlanTier(plan)
        plan_config = PLAN_QUOTAS[plan_tier]

        # Lifetime-capped features (free plan images) need a non-atomic check
        # because the cap spans all time, not just the current month. Race
        # risk is lower because lifetime caps are hit once per user.
        if feature == Feature.IMAGE and "max_images_lifetime" in plan_config:
            lifetime_limit = plan_config["max_images_lifetime"]
            used = await self.get_lifetime_feature_usage(user_id, feature)
            if used >= lifetime_limit:
                raise QuotaExceededException(
                    used=used, limit=lifetime_limit, remaining=0,
                    message=f"Free plan limit of {lifetime_limit} images reached. Upgrade to Starter for monthly quota.",
                )
            return await self._direct_insert(user_id, feature, generation_type, cost, metadata)

        limit_key = FEATURE_LIMIT_KEY.get(feature)
        monthly_limit = plan_config.get(limit_key, -1) if limit_key else -1

        # 0 = feature disabled on this plan.
        if monthly_limit == 0:
            label = FEATURE_DISPLAY.get(feature, feature.value)
            raise QuotaExceededException(
                used=0, limit=0, remaining=0,
                message=f"{label} are not available on the Free plan. Upgrade to Starter or above.",
            )

        period_start = _month_start_utc().isoformat()

        # Call atomic RPC. If it fails (RPC missing, connection error), fall back.
        try:
            result = supabase.rpc(
                "try_consume_quota",
                {
                    "p_user_id": user_id,
                    "p_feature": feature.value,
                    "p_generation_type": generation_type.value,
                    "p_cost": cost,
                    "p_metadata": metadata,
                    "p_limit": monthly_limit,
                    "p_period_start": period_start,
                },
            ).execute()
            data = result.data
        except Exception as exc:
            # Fall back to old non-atomic pattern with a warning.
            if not getattr(self, "_rpc_fallback_warned", False):
                logger.warning(
                    "Atomic quota RPC unavailable (%s). Falling back to non-atomic check+insert. "
                    "Apply migration 00011_atomic_quota.sql to enable race-free enforcement.",
                    exc,
                )
                self._rpc_fallback_warned = True
            # Non-atomic: count + insert separately.
            used = await self.get_monthly_feature_usage(user_id, feature)
            if monthly_limit != -1 and used + cost > monthly_limit:
                raise QuotaExceededException(
                    used=used, limit=monthly_limit, remaining=0,
                    message=f"Monthly limit reached ({used}/{monthly_limit}). Resets on the 1st. Upgrade for more.",
                )
            return await self._direct_insert(user_id, feature, generation_type, cost, metadata)

        # RPC succeeded.
        if not data or not data.get("reserved"):
            used = (data or {}).get("used", 0)
            limit = (data or {}).get("limit", monthly_limit)
            raise QuotaExceededException(
                used=used, limit=limit, remaining=max(0, limit - used) if limit != -1 else -1,
                message=f"Monthly limit reached ({used}/{limit}). Resets on the 1st. Upgrade for more.",
            )

        log_id = data.get("id")
        logger.info(
            "Quota reserved: user=%s feature=%s type=%s log_id=%s used=%s/%s",
            user_id, feature.value, generation_type.value, log_id, data.get("used"), data.get("limit"),
        )
        return str(log_id) if log_id else None

    async def reserve_many(
        self,
        user_id: str,
        plan: str,
        reservations: list[dict],
    ) -> list[str | None]:
        """Reserve multiple quota slots. If any fails, release all prior.

        Each reservation dict must contain: feature, generation_type.
        Optional: cost (default 1), metadata (default {}).
        """
        log_ids: list[str | None] = []
        try:
            for r in reservations:
                log_id = await self.reserve(
                    user_id=user_id,
                    plan=plan,
                    feature=r["feature"],
                    generation_type=r["generation_type"],
                    cost=r.get("cost", 1),
                    metadata=r.get("metadata"),
                )
                log_ids.append(log_id)
            return log_ids
        except Exception:
            # Roll back in reverse order.
            for log_id in reversed(log_ids):
                await self.release(log_id, user_id)
            raise

    async def release_all(self, log_ids: list[str | None], user_id: str) -> None:
        """Release every log_id in the list, safe to call with Nones."""
        for log_id in reversed(log_ids):
            await self.release(log_id, user_id)

    async def release(self, log_id: str | None, user_id: str) -> None:
        """Release a previously reserved quota slot (generation failed).

        Swallows errors: a failed release is a minor quota drift, not worth
        crashing the caller's error-handling path.
        """
        if not log_id:
            return
        supabase = get_supabase()
        try:
            result = supabase.rpc(
                "release_quota",
                {"p_log_id": log_id, "p_user_id": user_id},
            ).execute()
            if result.data:
                logger.info("Quota released: user=%s log_id=%s", user_id, log_id)
            else:
                logger.warning("Quota release missed: user=%s log_id=%s (already gone?)", user_id, log_id)
        except Exception as exc:
            # Last-resort direct delete if the RPC isn't available.
            try:
                supabase.table("usage_logs").delete().eq("id", log_id).eq("user_id", user_id).execute()
                logger.info("Quota released via direct delete: user=%s log_id=%s", user_id, log_id)
            except Exception as exc2:
                logger.error(
                    "Quota release FAILED for log_id=%s user=%s (rpc=%s, direct=%s)",
                    log_id, user_id, exc, exc2,
                )

    async def _direct_insert(
        self,
        user_id: str,
        feature: Feature,
        generation_type: GenerationType,
        cost: int,
        metadata: dict,
    ) -> str | None:
        """Insert a usage_logs row and return its id. No limit checks."""
        supabase = get_supabase()
        try:
            result = (
                supabase.table("usage_logs")
                .insert({
                    "user_id": user_id,
                    "feature": feature.value,
                    "generation_type": generation_type.value,
                    "request_count": cost,
                    "metadata": metadata,
                })
                .execute()
            )
            if result.data and len(result.data) > 0:
                return str(result.data[0].get("id"))
            return None
        except Exception as exc:
            logger.error(
                "Direct usage_logs insert FAILED for user=%s feature=%s: %s",
                user_id, feature.value, exc,
            )
            return None

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
