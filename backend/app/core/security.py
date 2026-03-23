import hashlib
import hmac

from ..config import settings


def verify_stripe_signature(payload: bytes, signature: str) -> bool:
    """Verify Stripe webhook signature."""
    try:
        import stripe

        stripe.Webhook.construct_event(
            payload, signature, settings.stripe_webhook_secret
        )
        return True
    except Exception:
        return False
