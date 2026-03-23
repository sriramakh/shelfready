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


# Plan quota configuration
PLAN_QUOTAS = {
    PlanTier.FREE: {
        "requests_per_5h": 100,
        "max_listings_per_month": 5,
        "max_images_per_month": 5,
        "max_photoshoots_per_month": 0,
        "research_enabled": False,
    },
    PlanTier.STARTER: {
        "requests_per_5h": 2000,
        "max_listings_per_month": 50,
        "max_images_per_month": 100,
        "max_photoshoots_per_month": 10,
        "research_enabled": True,
    },
    PlanTier.PRO: {
        "requests_per_5h": 5000,
        "max_listings_per_month": 300,
        "max_images_per_month": 300,
        "max_photoshoots_per_month": 30,
        "research_enabled": True,
    },
    PlanTier.BUSINESS: {
        "requests_per_5h": 15000,
        "max_listings_per_month": -1,  # unlimited
        "max_images_per_month": 1000,
        "max_photoshoots_per_month": 100,
        "research_enabled": True,
    },
}

# Request cost per generation type
REQUEST_COSTS = {
    GenerationType.TEXT: 1,
    GenerationType.IMAGE: 75,
    GenerationType.SEARCH: 1,
}
