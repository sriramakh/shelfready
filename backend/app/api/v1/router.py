from fastapi import APIRouter
from ...config import settings
from . import ad_creative, ads, billing, health, images, listings, photoshoot, research, social, usage, webhooks

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health.router)
api_router.include_router(listings.router)    # /api/v1/listings/*
api_router.include_router(images.router)
api_router.include_router(social.router)
api_router.include_router(ads.router)
api_router.include_router(ad_creative.router) # /api/v1/ads/creative (persisted)
api_router.include_router(photoshoot.router)  # /api/v1/photoshoot/* (persisted)
api_router.include_router(research.router)
api_router.include_router(usage.router)
api_router.include_router(billing.router)
api_router.include_router(webhooks.router)
