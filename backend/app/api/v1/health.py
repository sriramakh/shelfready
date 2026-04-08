from fastapi import APIRouter

from ...config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "shelfready-api", "version": "0.1.0"}


@router.post("/health/test-creative")
async def test_creative(data: dict):
    """Temporary: test creative service on Railway without auth."""
    try:
        from ...services.creative_service import AdCreativeRequest, generate_ad_creative
        req = AdCreativeRequest(
            image_base64=data.get("image_base64", ""),
            product_name=data.get("product_name", "Test"),
            product_details=data.get("product_details", "Test"),
            creative_sizes=data.get("creative_sizes", ["1080x1080"]),
            ad_platform="facebook",
        )
        result = await generate_ad_creative(req)
        ok = sum(1 for c in result.get("creatives", []) if c.get("success"))
        return {"status": "ok", "creatives": ok, "total": len(result.get("creatives", []))}
    except Exception as e:
        import traceback
        return {"status": "error", "type": type(e).__name__, "detail": str(e)[:500], "trace": traceback.format_exc()[-500:]}


