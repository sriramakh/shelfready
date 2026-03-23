from fastapi import APIRouter, Depends, HTTPException

from ...core.auth import get_current_user
from ...models.enums import PLAN_QUOTAS, PlanTier
from ...models.schemas import (
    CheckoutRequest,
    CheckoutResponse,
    PlanInfo,
    PortalResponse,
    SubscriptionInfo,
    UserProfile,
)
from ...services.stripe_service import (
    create_checkout_session,
    create_portal_session,
)
from ...db.supabase_client import get_supabase

router = APIRouter(prefix="/billing", tags=["billing"])

PLAN_DETAILS = {
    "starter": {"name": "Starter", "price_monthly": 29.0, "price_yearly": 278.0},
    "pro": {"name": "Pro", "price_monthly": 79.0, "price_yearly": 758.0},
    "business": {"name": "Business", "price_monthly": 149.0, "price_yearly": 1430.0},
}


@router.get("/plans", response_model=list[PlanInfo])
async def get_plans():
    """Get all available subscription plans."""
    plans = []
    for tier_str, details in PLAN_DETAILS.items():
        tier = PlanTier(tier_str)
        quota = PLAN_QUOTAS[tier]
        plans.append(
            PlanInfo(
                tier=tier_str,
                name=details["name"],
                price_monthly=details["price_monthly"],
                price_yearly=details["price_yearly"],
                requests_per_5h=quota["requests_per_5h"],
                max_listings_per_month=quota["max_listings_per_month"],
                max_images_per_month=quota["max_images_per_month"],
                max_photoshoots_per_month=quota["max_photoshoots_per_month"],
                research_enabled=quota["research_enabled"],
            )
        )
    return plans


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    request: CheckoutRequest,
    user: UserProfile = Depends(get_current_user),
):
    """Create a Stripe Checkout session for plan upgrade."""
    if request.plan_tier not in PLAN_DETAILS:
        raise HTTPException(status_code=400, detail="Invalid plan tier")

    checkout_url = await create_checkout_session(
        user_id=str(user.id),
        email=user.email,
        plan_tier=request.plan_tier,
        billing_period=request.billing_period,
    )

    return CheckoutResponse(checkout_url=checkout_url)


@router.post("/portal", response_model=PortalResponse)
async def create_billing_portal(
    user: UserProfile = Depends(get_current_user),
):
    """Create a Stripe Customer Portal session for managing subscription."""
    if not user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No active subscription")

    portal_url = await create_portal_session(user.stripe_customer_id)
    return PortalResponse(portal_url=portal_url)


@router.get("/subscription", response_model=SubscriptionInfo | None)
async def get_subscription(
    user: UserProfile = Depends(get_current_user),
):
    """Get current subscription details."""
    supabase = get_supabase()

    result = (
        supabase.table("subscriptions")
        .select("*")
        .eq("user_id", str(user.id))
        .eq("status", "active")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not result.data:
        return None

    sub = result.data[0]
    return SubscriptionInfo(
        plan_tier=sub["plan_tier"],
        status=sub["status"],
        current_period_end=sub["current_period_end"],
        cancel_at_period_end=sub["cancel_at_period_end"],
    )
