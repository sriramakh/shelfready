"""Stripe billing operations.

Handles checkout session creation, customer portal, customer management,
and webhook processing for subscription lifecycle events.
"""

import logging
from datetime import datetime, timezone

import stripe

from ..config import settings
from ..db.supabase_client import get_supabase

logger = logging.getLogger(__name__)

stripe.api_key = settings.stripe_secret_key

# Map plan tier + billing period to Stripe Price IDs
PRICE_MAP: dict[str, dict[str, str]] = {
    "starter": {
        "monthly": settings.stripe_starter_price_id,
        "yearly": settings.stripe_starter_price_id,  # Configure separate yearly prices as needed
    },
    "pro": {
        "monthly": settings.stripe_pro_price_id,
        "yearly": settings.stripe_pro_price_id,
    },
    "business": {
        "monthly": settings.stripe_business_price_id,
        "yearly": settings.stripe_business_price_id,
    },
}


async def create_checkout_session(
    user_id: str,
    email: str,
    plan_tier: str,
    billing_period: str = "monthly",
    success_url: str = "https://app.shelfready.app/billing?status=success",
    cancel_url: str = "https://app.shelfready.app/billing?status=cancelled",
) -> str:
    """Create a Stripe Checkout Session for a plan subscription.

    Args:
        user_id: The user's internal ID (stored in metadata).
        email: The customer's email address.
        plan_tier: One of "starter", "pro", "business".
        billing_period: "monthly" or "yearly".
        success_url: Redirect URL on successful payment.
        cancel_url: Redirect URL on cancellation.

    Returns:
        The Checkout Session URL for redirect.

    Raises:
        ValueError: If the plan tier or billing period is invalid.
        RuntimeError: If Stripe API call fails.
    """
    tier_lower = plan_tier.lower()
    period_lower = billing_period.lower()

    if tier_lower not in PRICE_MAP:
        raise ValueError(
            f"Invalid plan tier '{plan_tier}'. Must be one of: "
            f"{', '.join(PRICE_MAP.keys())}"
        )

    if period_lower not in ("monthly", "yearly"):
        raise ValueError(
            f"Invalid billing period '{billing_period}'. Must be 'monthly' or 'yearly'."
        )

    price_id = PRICE_MAP[tier_lower][period_lower]
    if not price_id:
        raise ValueError(
            f"No Stripe Price ID configured for {plan_tier}/{billing_period}."
        )

    customer_id = await get_or_create_customer(user_id, email)

    try:
        session = stripe.checkout.Session.create(
            customer=customer_id,
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": user_id,
                "plan_tier": tier_lower,
                "billing_period": period_lower,
            },
            subscription_data={
                "metadata": {
                    "user_id": user_id,
                    "plan_tier": tier_lower,
                },
            },
        )
    except stripe.StripeError as exc:
        logger.error("Stripe checkout session creation failed: %s", exc)
        raise RuntimeError(
            "Failed to create checkout session. Please try again."
        ) from exc

    return session.url


async def create_portal_session(
    stripe_customer_id: str,
    return_url: str = "https://app.shelfready.app/billing",
) -> str:
    """Create a Stripe Customer Portal session for subscription management.

    Args:
        stripe_customer_id: The Stripe customer ID.
        return_url: URL to redirect back to after portal.

    Returns:
        The Customer Portal URL.

    Raises:
        RuntimeError: If Stripe API call fails.
    """
    try:
        session = stripe.billing_portal.Session.create(
            customer=stripe_customer_id,
            return_url=return_url,
        )
    except stripe.StripeError as exc:
        logger.error("Stripe portal session creation failed: %s", exc)
        raise RuntimeError(
            "Failed to create billing portal session. Please try again."
        ) from exc

    return session.url


async def get_or_create_customer(user_id: str, email: str) -> str:
    """Get existing Stripe customer ID or create a new customer.

    Checks the profiles table first. If no customer exists, creates one
    in Stripe and stores the ID in the user's profile.

    Args:
        user_id: The user's internal ID.
        email: The user's email address.

    Returns:
        The Stripe customer ID.
    """
    supabase = get_supabase()

    # Check if the user already has a Stripe customer ID
    result = (
        supabase.table("profiles")
        .select("stripe_customer_id")
        .eq("id", user_id)
        .single()
        .execute()
    )

    if result.data and result.data.get("stripe_customer_id"):
        return result.data["stripe_customer_id"]

    # Create a new Stripe customer
    try:
        customer = stripe.Customer.create(
            email=email,
            metadata={"user_id": user_id},
        )
    except stripe.StripeError as exc:
        logger.error("Stripe customer creation failed: %s", exc)
        raise RuntimeError("Failed to create billing account.") from exc

    # Store the customer ID in the user's profile
    supabase.table("profiles").update(
        {"stripe_customer_id": customer.id}
    ).eq("id", user_id).execute()

    logger.info(
        "Created Stripe customer %s for user %s", customer.id, user_id
    )

    return customer.id


async def handle_webhook_event(event: dict) -> None:
    """Process a Stripe webhook event.

    Handles the following event types:
    - checkout.session.completed: Activate subscription
    - invoice.paid: Confirm successful payment
    - invoice.payment_failed: Flag failed payment
    - customer.subscription.updated: Sync plan changes
    - customer.subscription.deleted: Downgrade to free

    Args:
        event: The parsed Stripe webhook event dict.
    """
    event_type = event.get("type", "")
    data_object = event.get("data", {}).get("object", {})

    logger.info("Processing Stripe webhook: %s", event_type)

    try:
        if event_type == "checkout.session.completed":
            await _handle_checkout_completed(data_object)

        elif event_type == "invoice.paid":
            await _handle_invoice_paid(data_object)

        elif event_type == "invoice.payment_failed":
            await _handle_invoice_payment_failed(data_object)

        elif event_type == "customer.subscription.updated":
            await _handle_subscription_updated(data_object)

        elif event_type == "customer.subscription.deleted":
            await _handle_subscription_deleted(data_object)

        else:
            logger.debug("Unhandled Stripe event type: %s", event_type)

    except Exception as exc:
        logger.exception("Error processing Stripe webhook %s: %s", event_type, exc)
        raise


async def _handle_checkout_completed(session: dict) -> None:
    """Handle checkout.session.completed: activate the subscription."""
    metadata = session.get("metadata", {})
    user_id = metadata.get("user_id")
    plan_tier = metadata.get("plan_tier")
    subscription_id = session.get("subscription")
    customer_id = session.get("customer")

    if not user_id or not plan_tier:
        logger.warning("Checkout completed but missing user_id or plan_tier in metadata")
        return

    supabase = get_supabase()

    # Update user's plan in profiles
    supabase.table("profiles").update(
        {
            "current_plan": plan_tier,
            "stripe_customer_id": customer_id,
        }
    ).eq("id", user_id).execute()

    # Upsert subscription record
    if subscription_id:
        try:
            sub = stripe.Subscription.retrieve(subscription_id)
            supabase.table("subscriptions").upsert(
                {
                    "user_id": user_id,
                    "stripe_subscription_id": subscription_id,
                    "stripe_customer_id": customer_id,
                    "plan_tier": plan_tier,
                    "status": sub.status,
                    "current_period_start": datetime.fromtimestamp(
                        sub.current_period_start, tz=timezone.utc
                    ).isoformat(),
                    "current_period_end": datetime.fromtimestamp(
                        sub.current_period_end, tz=timezone.utc
                    ).isoformat(),
                    "cancel_at_period_end": sub.cancel_at_period_end,
                },
                on_conflict="user_id",
            ).execute()
        except stripe.StripeError as exc:
            logger.error("Failed to retrieve subscription %s: %s", subscription_id, exc)

    logger.info("Checkout completed for user %s -> plan %s", user_id, plan_tier)


async def _handle_invoice_paid(invoice: dict) -> None:
    """Handle invoice.paid: confirm subscription is active."""
    subscription_id = invoice.get("subscription")
    if not subscription_id:
        return

    supabase = get_supabase()

    # Update subscription status to active
    supabase.table("subscriptions").update(
        {"status": "active"}
    ).eq("stripe_subscription_id", subscription_id).execute()

    logger.info("Invoice paid for subscription %s", subscription_id)


async def _handle_invoice_payment_failed(invoice: dict) -> None:
    """Handle invoice.payment_failed: flag the subscription."""
    subscription_id = invoice.get("subscription")
    customer_id = invoice.get("customer")

    if not subscription_id:
        return

    supabase = get_supabase()

    # Mark subscription as past_due
    supabase.table("subscriptions").update(
        {"status": "past_due"}
    ).eq("stripe_subscription_id", subscription_id).execute()

    logger.warning(
        "Payment failed for subscription %s (customer %s)",
        subscription_id,
        customer_id,
    )


async def _handle_subscription_updated(subscription: dict) -> None:
    """Handle customer.subscription.updated: sync plan and status changes."""
    subscription_id = subscription.get("id")
    status = subscription.get("status")
    cancel_at_period_end = subscription.get("cancel_at_period_end", False)

    # Extract plan tier from metadata or items
    metadata = subscription.get("metadata", {})
    plan_tier = metadata.get("plan_tier")

    if not subscription_id:
        return

    supabase = get_supabase()

    update_data: dict = {
        "status": status,
        "cancel_at_period_end": cancel_at_period_end,
    }

    if plan_tier:
        update_data["plan_tier"] = plan_tier

    period_end = subscription.get("current_period_end")
    if period_end:
        update_data["current_period_end"] = datetime.fromtimestamp(
            period_end, tz=timezone.utc
        ).isoformat()

    period_start = subscription.get("current_period_start")
    if period_start:
        update_data["current_period_start"] = datetime.fromtimestamp(
            period_start, tz=timezone.utc
        ).isoformat()

    supabase.table("subscriptions").update(update_data).eq(
        "stripe_subscription_id", subscription_id
    ).execute()

    # Also update profile plan if plan_tier changed
    if plan_tier:
        # Find user_id from subscription record
        sub_result = (
            supabase.table("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", subscription_id)
            .single()
            .execute()
        )
        if sub_result.data:
            supabase.table("profiles").update(
                {"current_plan": plan_tier}
            ).eq("id", sub_result.data["user_id"]).execute()

    logger.info(
        "Subscription %s updated: status=%s, plan=%s, cancel_at_end=%s",
        subscription_id,
        status,
        plan_tier,
        cancel_at_period_end,
    )


async def _handle_subscription_deleted(subscription: dict) -> None:
    """Handle customer.subscription.deleted: downgrade user to free plan."""
    subscription_id = subscription.get("id")

    if not subscription_id:
        return

    supabase = get_supabase()

    # Find the user from the subscription
    sub_result = (
        supabase.table("subscriptions")
        .select("user_id")
        .eq("stripe_subscription_id", subscription_id)
        .single()
        .execute()
    )

    if sub_result.data:
        user_id = sub_result.data["user_id"]

        # Downgrade to free
        supabase.table("profiles").update(
            {"current_plan": "free"}
        ).eq("id", user_id).execute()

        logger.info("User %s downgraded to free (subscription deleted)", user_id)

    # Update subscription record
    supabase.table("subscriptions").update(
        {"status": "canceled"}
    ).eq("stripe_subscription_id", subscription_id).execute()

    logger.info("Subscription %s deleted/canceled", subscription_id)
