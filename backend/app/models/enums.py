from enum import Enum


class Platform(str, Enum):
    AMAZON = "amazon"
    ETSY = "etsy"
    SHOPIFY = "shopify"


class PlanTier(str, Enum):
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    BUSINESS = "business"


class GenerationType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    SEARCH = "search"


class Feature(str, Enum):
    LISTING = "listing"
    SOCIAL = "social"
    AD = "ad"
    IMAGE = "image"
    RESEARCH = "research"


class AdPlatform(str, Enum):
    FACEBOOK = "facebook"
    GOOGLE = "google"


class SocialPlatform(str, Enum):
    INSTAGRAM = "instagram"
    FACEBOOK = "facebook"
    PINTEREST = "pinterest"


class ImageType(str, Enum):
    LIFESTYLE = "lifestyle"
    FLAT_LAY = "flat_lay"
    IN_USE = "in_use"
    STUDIO = "studio"


class ImageStyle(str, Enum):
    PHOTOREALISTIC = "photorealistic"
    MINIMALIST = "minimalist"
    VIBRANT = "vibrant"


# Plan quota configuration — monthly limits per feature (-1 = unlimited)
PLAN_QUOTAS = {
    PlanTier.FREE: {
        "max_listings_per_month": 5,
        "max_images_lifetime": 5,  # lifetime cap, not monthly
        "max_photoshoots_per_month": 0,
        "max_social_per_month": 5,
        "max_ads_per_month": 5,
        "max_research_per_month": 0,
    },
    PlanTier.STARTER: {
        "max_listings_per_month": 50,
        "max_images_per_month": 100,
        "max_photoshoots_per_month": 10,
        "max_social_per_month": 50,
        "max_ads_per_month": 50,
        "max_research_per_month": 20,
    },
    PlanTier.PRO: {
        "max_listings_per_month": 300,
        "max_images_per_month": 300,
        "max_photoshoots_per_month": 30,
        "max_social_per_month": 300,
        "max_ads_per_month": 300,
        "max_research_per_month": 100,
    },
    PlanTier.BUSINESS: {
        "max_listings_per_month": -1,
        "max_images_per_month": 1000,
        "max_photoshoots_per_month": 100,
        "max_social_per_month": -1,
        "max_ads_per_month": -1,
        "max_research_per_month": -1,
    },
}
