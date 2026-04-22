from fastapi import APIRouter
from ...config import settings
from . import ad_creative, ads, billing, health, images, listings, master, photoshoot, research, social, usage, webhooks

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health.router)
api_router.include_router(listings.router)    # /api/v1/listings/*
api_router.include_router(images.router)
api_router.include_router(social.router)
api_router.include_router(ad_creative.router) # /api/v1/ads/creative — MUST be before ads.router
api_router.include_router(ads.router)         # /api/v1/ads/* (has {ad_id} catch-all)
api_router.include_router(photoshoot.router)  # /api/v1/photoshoot/* (persisted)
api_router.include_router(research.router)
api_router.include_router(master.router)     # /api/v1/master/generate — fan-out to all features
api_router.include_router(usage.router)
api_router.include_router(billing.router)
api_router.include_router(webhooks.router)
