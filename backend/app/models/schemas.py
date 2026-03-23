from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from .enums import (
    AdPlatform,
    Feature,
    GenerationType,
    ImageStyle,
    ImageType,
    Platform,
    SocialPlatform,
)


# ── Auth ──────────────────────────────────────────────────────────────
class UserProfile(BaseModel):
    id: UUID
    email: str
    full_name: str | None = None
    current_plan: str = "free"
    stripe_customer_id: str | None = None
    onboarding_completed: bool = False


# ── Listing ───────────────────────────────────────────────────────────
class ListingGenerateRequest(BaseModel):
    platform: Platform
    product_name: str = Field(..., min_length=2, max_length=200)
    product_details: str = Field(..., min_length=10, max_length=5000)
    target_audience: str = Field(default="", max_length=500)
    price_range: str = Field(default="", max_length=100)
    category: str = Field(default="", max_length=200)


class ListingGenerateResponse(BaseModel):
    id: UUID
    platform: str
    product_name: str
    generated_title: str
    generated_bullets: list[str]
    generated_description: str
    generated_keywords: list[str]
    created_at: datetime


class ListingUpdate(BaseModel):
    generated_title: str | None = None
    generated_bullets: list[str] | None = None
    generated_description: str | None = None
    generated_keywords: list[str] | None = None
    is_favorite: bool | None = None
    status: str | None = None


class ListingSummary(BaseModel):
    id: UUID
    platform: str
    product_name: str
    generated_title: str | None
    status: str
    is_favorite: bool
    created_at: datetime


# ── Image ─────────────────────────────────────────────────────────────
class ImageGenerateRequest(BaseModel):
    description: str = Field(..., min_length=5, max_length=2000)
    listing_id: UUID | None = None
    aspect_ratio: str = "1:1"
    image_type: ImageType = ImageType.LIFESTYLE
    style: ImageStyle = ImageStyle.PHOTOREALISTIC


class ImageGenerateResponse(BaseModel):
    id: UUID
    public_url: str
    prompt: str
    aspect_ratio: str
    image_type: str
    created_at: datetime


class ImageSummary(BaseModel):
    id: UUID
    public_url: str
    image_type: str
    aspect_ratio: str
    created_at: datetime


# ── Social ────────────────────────────────────────────────────────────
class SocialGenerateRequest(BaseModel):
    platform: SocialPlatform
    product_name: str = Field(..., min_length=2, max_length=200)
    product_details: str = Field(..., min_length=10, max_length=3000)
    listing_id: UUID | None = None
    generate_image: bool = False
    tone: str = Field(default="professional", max_length=50)


class SocialGenerateResponse(BaseModel):
    id: UUID
    platform: str
    caption: str
    hashtags: list[str]
    cta_text: str | None
    image_url: str | None = None
    created_at: datetime


# ── Ad Copy ───────────────────────────────────────────────────────────
class AdGenerateRequest(BaseModel):
    ad_platform: AdPlatform
    product_name: str = Field(..., min_length=2, max_length=200)
    product_details: str = Field(..., min_length=10, max_length=3000)
    target_audience: str = Field(default="", max_length=500)
    listing_id: UUID | None = None
    num_variants: int = Field(default=3, ge=1, le=5)


class AdCopyVariant(BaseModel):
    headline: str
    primary_text: str
    description: str
    cta: str
    variant_label: str


class AdGenerateResponse(BaseModel):
    variants: list[AdCopyVariant]
    ad_platform: str
    created_at: datetime


# ── Research ──────────────────────────────────────────────────────────
class ResearchRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=500)
    platform: Platform | None = None


class ResearchResponse(BaseModel):
    id: UUID
    query: str
    analysis: str
    keywords_found: list[str]
    competitors: list[dict]
    created_at: datetime


# ── Usage ─────────────────────────────────────────────────────────────
class UsageCurrent(BaseModel):
    used: int
    limit: int
    remaining: int
    window_resets_at: datetime
    plan: str


class UsageLogEntry(BaseModel):
    generation_type: GenerationType
    feature: Feature
    request_count: int
    created_at: datetime


# ── Billing ───────────────────────────────────────────────────────────
class PlanInfo(BaseModel):
    tier: str
    name: str
    price_monthly: float
    price_yearly: float
    requests_per_5h: int
    max_listings_per_month: int
    max_images_per_month: int
    max_photoshoots_per_month: int
    research_enabled: bool


class CheckoutRequest(BaseModel):
    plan_tier: str
    billing_period: str = "monthly"  # "monthly" or "yearly"


class CheckoutResponse(BaseModel):
    checkout_url: str


class PortalResponse(BaseModel):
    portal_url: str


class SubscriptionInfo(BaseModel):
    plan_tier: str
    status: str
    current_period_end: datetime
    cancel_at_period_end: bool


# ── Generic ───────────────────────────────────────────────────────────
class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    per_page: int


class MessageResponse(BaseModel):
    message: str
