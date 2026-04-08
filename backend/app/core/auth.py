import logging

from fastapi import Depends, Request

from ..core.exceptions import InvalidAuthException
from ..db.supabase_client import get_supabase
from ..models.schemas import UserProfile

logger = logging.getLogger(__name__)


def _extract_token(request: Request) -> str:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise InvalidAuthException("Missing Bearer token")
    return auth_header[7:]


async def get_current_user(request: Request) -> UserProfile:
    """Verify Supabase token via Supabase Auth API and return user profile."""
    token = _extract_token(request)

    supabase = get_supabase()

    # Use Supabase's own auth.get_user() to verify the token
    # This works with both legacy JWT secrets and new signing keys
    try:
        auth_response = supabase.auth.get_user(token)
    except Exception as exc:
        logger.warning("Supabase token verification failed: %s", exc)
        raise InvalidAuthException("Invalid or expired token")

    if not auth_response or not auth_response.user:
        raise InvalidAuthException("Invalid or expired token")

    user_id = auth_response.user.id

    # Fetch user profile from profiles table
    result = (
        supabase.table("profiles")
        .select("*")
        .eq("id", str(user_id))
        .single()
        .execute()
    )

    if not result.data:
        raise InvalidAuthException("User profile not found")

    return UserProfile(**result.data)


CurrentUser = Depends(get_current_user)
