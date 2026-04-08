"""LemonSqueezy billing operations.

Handles checkout URL generation, customer portal, and webhook processing
for subscription lifecycle events.
"""

import hashlib
import hmac
import json
import logging
import urllib.error
import urllib.request
from datetime import datetime, timezone

from ..config import settings
from ..db.supabase_client import get_supabase

logger = logging.getLogger(__name__)

LS_API = "https://api.lemonsqueezy.com/v1"

# Map plan tier + billing period to LemonSqueezy Variant IDs
VARIANT_MAP: dict[str, dict[str, str]] = {
    "starter": {
        "monthly": settings.ls_starter_monthly_variant,
        "yearly": settings.ls_starter_yearly_variant,
    },
    "pro": {
        "monthly": settings.ls_pro_monthly_variant,
        "yearly": settings.ls_pro_yearly_variant,
    },
    "business": {
        "monthly": settings.ls_business_monthly_variant,
        "yearly": settings.ls_business_yearly_variant,
    },
}

# Reverse map: variant_id -> plan_tier
VARIANT_TO_TIER: dict[str, str] = {}
for tier, variants in VARIANT_MAP.items():
    for period, vid in variants.items():
        VARIANT_TO_TIER[vid] = tier


def _ls_request(method: str, endpoint: str, data: dict | None = None) -> dict:
    """Make authenticated request to LemonSqueezy API."""
    url = f"{LS_API}{endpoint}"
    body = json.dumps(data).encode() if data else None

    api_key = settings.lemonsqueezy_api_key
    if not api_key:
        raise RuntimeError("LEMONSQUEEZY_API_KEY is not configured")

    req = urllib.request.Request(url, data=body, method=method, headers={
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
    })

    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode() if e.fp else ""
        logger.error("LemonSqueezy API error %s %s: %s %s", method, endpoint, e.code, error_body[:500])
        raise


async def create_checkout_url(
    user_id: str,
    email: str,
    plan_tier: str,
    billing_period: str = "monthly",
) -> str:
    """Create a LemonSqueezy Checkout URL for a plan subscription.

    Returns the checkout URL for redirect.
    """
    tier_lower = plan_tier.lower()
    period_lower = billing_period.lower()

    if tier_lower not in VARIANT_MAP:
        raise ValueError(f"Invalid plan tier '{plan_tier}'")
    if period_lower not in ("monthly", "yearly"):
        raise ValueError(f"Invalid billing period '{billing_period}'")

    variant_id = VARIANT_MAP[tier_lower][period_lower]

    payload = {
        "data": {
            "type": "checkouts",
            "attributes": {
                "checkout_data": {
                    "email": email,
                    "custom": {
                        "user_id": user_id,
                        "plan_tier": tier_lower,
                    },
                },
                "product_options": {
                    "redirect_url": "https://shelfready.app/billing?status=success",
                },
            },
            "relationships": {
                "store": {
                    "data": {
                        "type": "stores",
                        "id": settings.lemonsqueezy_store_id,
                    }
                },
                "variant": {
                    "data": {
                        "type": "variants",
                        "id": variant_id,
                    }
                },
            },
        }
    }

    try:
        result = _ls_request("POST", "/checkouts", payload)
        checkout_url = result["data"]["attributes"]["url"]
        logger.info("Created LemonSqueezy checkout for user %s, plan %s/%s", user_id, tier_lower, period_lower)
        return checkout_url
    except Exception as exc:
        logger.error("LemonSqueezy checkout creation failed for %s/%s: %s", tier_lower, period_lower, exc)
        raise RuntimeError(f"Failed to create checkout session: {exc}") from exc


async def get_customer_portal_url(ls_customer_id: str) -> str:
    """Get the LemonSqueezy customer portal URL.

    LemonSqueezy provides a built-in customer portal at:
    https://STORE.lemonsqueezy.com/billing
    """
    # LemonSqueezy customer portal is accessible via their hosted URL
    return f"https://shelf-ready.lemonsqueezy.com/billing"


def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """Verify LemonSqueezy webhook signature using HMAC-SHA256."""
    if not settings.lemonsqueezy_webhook_secret:
        logger.warning("No webhook secret configured, skipping verification")
        return True

    expected = hmac.new(
        settings.lemonsqueezy_webhook_secret.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected, signature)


async def handle_webhook_event(event: dict) -> None:
    """Process a LemonSqueezy webhook event.

    Handles:
    - subscription_created: Activate subscription
    - subscription_updated: Sync plan changes
    - subscription_cancelled: Flag cancellation
    - subscription_expired: Downgrade to free
    - subscription_payment_success: Confirm payment
    - subscription_payment_failed: Flag failed payment
    """
    event_name = event.get("meta", {}).get("event_name", "")
    data = event.get("data", {})
    attrs = data.get("attributes", {})
    custom_data = event.get("meta", {}).get("custom_data", {})

    logger.info("Processing LemonSqueezy webhook: %s", event_name)

    try:
        if event_name == "subscription_created":
            await _handle_subscription_created(attrs, custom_data)
        elif event_name == "subscription_updated":
            await _handle_subscription_updated(attrs, custom_data)
        elif event_name in ("subscription_cancelled", "subscription_expired"):
            await _handle_subscription_ended(attrs, custom_data, event_name)
        elif event_name == "subscription_payment_success":
            await _handle_payment_success(attrs)
        elif event_name == "subscription_payment_failed":
            await _handle_payment_failed(attrs)
        else:
            logger.debug("Unhandled LemonSqueezy event: %s", event_name)
    except Exception as exc:
        logger.exception("Error processing webhook %s: %s", event_name, exc)
        raise


async def _handle_subscription_created(attrs: dict, custom_data: dict) -> None:
    """Handle subscription_created: activate the subscription."""
    user_id = custom_data.get("user_id")
    plan_tier = custom_data.get("plan_tier")
    ls_subscription_id = str(attrs.get("first_subscription_item", {}).get("subscription_id", ""))
    ls_customer_id = str(attrs.get("customer_id", ""))
    variant_id = str(attrs.get("variant_id", ""))
    status = attrs.get("status", "active")

    if not user_id:
        logger.warning("subscription_created missing user_id in custom_data")
        return

    # Derive plan tier from variant if not in custom_data
    if not plan_tier:
        plan_tier = VARIANT_TO_TIER.get(variant_id, "starter")

    supabase = get_supabase()

    # Update user profile
    supabase.table("profiles").update({
        "current_plan": plan_tier,
        "stripe_customer_id": f"ls_{ls_customer_id}",  # Reuse column, prefix with ls_
    }).eq("id", user_id).execute()

    # Parse dates
    period_start = attrs.get("created_at", "")
    period_end = attrs.get("renews_at", "")

    # Upsert subscription
    supabase.table("subscriptions").upsert({
        "user_id": user_id,
        "stripe_subscription_id": f"ls_sub_{ls_subscription_id}",  # Reuse column
        "plan_tier": plan_tier,
        "status": status,
        "current_period_start": period_start,
        "current_period_end": period_end,
        "cancel_at_period_end": False,
    }, on_conflict="user_id").execute()

    logger.info("Subscription created for user %s -> plan %s", user_id, plan_tier)


async def _handle_subscription_updated(attrs: dict, custom_data: dict) -> None:
    """Handle subscription_updated: sync plan and status."""
    ls_subscription_id = str(attrs.get("first_subscription_item", {}).get("subscription_id", ""))
    variant_id = str(attrs.get("variant_id", ""))
    status = attrs.get("status", "")
    cancel_at_period_end = status == "cancelled"

    supabase = get_supabase()
    sub_key = f"ls_sub_{ls_subscription_id}"

    update_data: dict = {"status": status if status != "cancelled" else "active"}
    if cancel_at_period_end:
        update_data["cancel_at_period_end"] = True

    period_end = attrs.get("renews_at") or attrs.get("ends_at")
    if period_end:
        update_data["current_period_end"] = period_end

    # Update plan tier if variant changed
    plan_tier = VARIANT_TO_TIER.get(variant_id)
    if plan_tier:
        update_data["plan_tier"] = plan_tier

    supabase.table("subscriptions").update(update_data).eq(
        "stripe_subscription_id", sub_key
    ).execute()

    # Also update profile plan if tier changed
    if plan_tier:
        sub_result = (
            supabase.table("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", sub_key)
            .single()
            .execute()
        )
        if sub_result.data:
            supabase.table("profiles").update(
                {"current_plan": plan_tier}
            ).eq("id", sub_result.data["user_id"]).execute()

    logger.info("Subscription %s updated: status=%s, plan=%s", ls_subscription_id, status, plan_tier)


async def _handle_subscription_ended(attrs: dict, custom_data: dict, event_name: str) -> None:
    """Handle subscription_cancelled/expired: downgrade to free."""
    ls_subscription_id = str(attrs.get("first_subscription_item", {}).get("subscription_id", ""))
    sub_key = f"ls_sub_{ls_subscription_id}"

    supabase = get_supabase()

    # Find user
    sub_result = (
        supabase.table("subscriptions")
        .select("user_id")
        .eq("stripe_subscription_id", sub_key)
        .single()
        .execute()
    )

    if sub_result.data:
        user_id = sub_result.data["user_id"]
        supabase.table("profiles").update(
            {"current_plan": "free"}
        ).eq("id", user_id).execute()
        logger.info("User %s downgraded to free (%s)", user_id, event_name)

    supabase.table("subscriptions").update(
        {"status": "canceled"}
    ).eq("stripe_subscription_id", sub_key).execute()


async def _handle_payment_success(attrs: dict) -> None:
    """Handle subscription_payment_success: confirm active."""
    ls_subscription_id = str(attrs.get("subscription_id", ""))
    sub_key = f"ls_sub_{ls_subscription_id}"

    supabase = get_supabase()
    supabase.table("subscriptions").update(
        {"status": "active"}
    ).eq("stripe_subscription_id", sub_key).execute()

    logger.info("Payment success for subscription %s", ls_subscription_id)


async def _handle_payment_failed(attrs: dict) -> None:
    """Handle subscription_payment_failed: flag as past_due."""
    ls_subscription_id = str(attrs.get("subscription_id", ""))
    sub_key = f"ls_sub_{ls_subscription_id}"

    supabase = get_supabase()
    supabase.table("subscriptions").update(
        {"status": "past_due"}
    ).eq("stripe_subscription_id", sub_key).execute()

    logger.warning("Payment failed for subscription %s", ls_subscription_id)
