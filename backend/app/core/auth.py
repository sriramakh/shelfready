from fastapi import Depends, Request
from jose import JWTError, jwt

from ..config import settings
from ..core.exceptions import InvalidAuthException
from ..db.supabase_client import get_supabase
from ..models.schemas import UserProfile


def _extract_token(request: Request) -> str:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise InvalidAuthException("Missing Bearer token")
    return auth_header[7:]


async def get_current_user(request: Request) -> UserProfile:
    """Verify Supabase JWT and return user profile."""
    token = _extract_token(request)

    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except JWTError:
        raise InvalidAuthException()

    user_id = payload.get("sub")
    if not user_id:
        raise InvalidAuthException("Token missing subject")

    supabase = get_supabase()
    result = (
        supabase.table("profiles")
        .select("*")
        .eq("id", user_id)
        .single()
        .execute()
    )

    if not result.data:
        raise InvalidAuthException("User profile not found")

    return UserProfile(**result.data)


CurrentUser = Depends(get_current_user)
