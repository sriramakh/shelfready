from fastapi import APIRouter

from ...config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "shelfready-api", "version": "0.1.0"}


@router.get("/health/debug-auth")
async def debug_auth(token: str = ""):
    """Debug JWT token verification."""
    from jose import jwt as jose_jwt
    if not token:
        return {"error": "Pass ?token=YOUR_TOKEN"}
    try:
        payload = jose_jwt.decode(
            token,
            settings.lemonsqueezy_api_key,  # wrong key on purpose
            algorithms=["HS256"],
            audience="authenticated",
        )
        return {"status": "ok_wrong_key???", "payload": payload}
    except Exception:
        pass

    # Try with the actual JWT secret
    jwt_secret = settings.supabase_jwt_secret
    result = {"jwt_secret_length": len(jwt_secret), "jwt_secret_prefix": jwt_secret[:8] + "..."}
    try:
        payload = jose_jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        result["status"] = "ok"
        result["sub"] = payload.get("sub")
        result["exp"] = payload.get("exp")
    except Exception as e:
        result["status"] = "failed"
        result["error"] = str(e)
        # Try without audience check
        try:
            payload = jose_jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            result["without_aud_check"] = "ok"
            result["actual_aud"] = payload.get("aud")
            result["sub"] = payload.get("sub")
        except Exception as e2:
            result["without_aud_check"] = f"also failed: {e2}"
    return result


@router.get("/health/test-checkout")
async def test_checkout():
    """Test creating a real LemonSqueezy checkout — no auth required."""
    from ...services.lemonsqueezy_service import create_checkout_url
    try:
        url = await create_checkout_url("test-health-check", "test@shelfready.app", "starter", "monthly")
        return {"status": "ok", "checkout_url": url}
    except Exception as e:
        return {"status": "error", "detail": str(e), "type": type(e).__name__}


@router.get("/health/billing")
async def billing_health():
    """Check if LemonSqueezy is configured and reachable."""
    import json, urllib.request, urllib.error

    api_key = settings.lemonsqueezy_api_key
    if not api_key:
        return {"status": "error", "detail": "LEMONSQUEEZY_API_KEY not set"}

    try:
        req = urllib.request.Request("https://api.lemonsqueezy.com/v1/stores", headers={
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/vnd.api+json",
        })
        resp = urllib.request.urlopen(req)
        data = json.loads(resp.read())
        store_name = data["data"][0]["attributes"]["name"] if data.get("data") else "unknown"
        return {
            "status": "ok",
            "store": store_name,
            "api_key_length": len(api_key),
            "store_id": settings.lemonsqueezy_store_id,
            "starter_variant": settings.ls_starter_monthly_variant,
        }
    except urllib.error.HTTPError as e:
        return {"status": "error", "code": e.code, "detail": e.read().decode()[:200]}
    except Exception as e:
        return {"status": "error", "detail": str(e)[:200]}
