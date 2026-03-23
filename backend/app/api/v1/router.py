from fastapi import APIRouter

from ...config import settings
from . import ads, billing, health, images, listings, research, social, usage, webhooks

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health.router)

if settings.environment == "demo":
    # Demo mode: bypass auth/DB, call MiniMax directly
    from . import demo
    api_router.include_router(demo.router)
else:
    api_router.include_router(listings.router)
    api_router.include_router(images.router)
    api_router.include_router(social.router)
    api_router.include_router(ads.router)
    api_router.include_router(research.router)
    api_router.include_router(usage.router)
    api_router.include_router(billing.router)
    api_router.include_router(webhooks.router)
