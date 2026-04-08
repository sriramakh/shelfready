import json
import logging

from fastapi import APIRouter, HTTPException, Request

from ...services.lemonsqueezy_service import (
    handle_webhook_event,
    verify_webhook_signature,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/lemonsqueezy")
async def lemonsqueezy_webhook(request: Request):
    """Handle LemonSqueezy webhook events. No auth — uses HMAC signature verification."""
    payload = await request.body()
    signature = request.headers.get("x-signature", "")

    if not verify_webhook_signature(payload, signature):
        raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        event = json.loads(payload)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    await handle_webhook_event(event)

    return {"status": "ok"}
