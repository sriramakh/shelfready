from fastapi import APIRouter
from ...config import settings
from . import ads, billing, demo, health, images, listings, research, social, usage, webhooks

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health.router)
api_router.include_router(demo.router)       # /api/v1/demo/*
api_router.include_router(listings.router)    # /api/v1/listings/*
api_router.include_router(images.router)
api_router.include_router(social.router)
api_router.include_router(ads.router)
api_router.include_router(research.router)
api_router.include_router(usage.router)
api_router.include_router(billing.router)
api_router.include_router(webhooks.router)
