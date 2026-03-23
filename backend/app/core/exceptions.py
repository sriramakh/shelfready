from fastapi import HTTPException, status


class QuotaExceededException(HTTPException):
    def __init__(self, used: int, limit: int, remaining: int):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "quota_exceeded",
                "message": f"Quota exceeded. Used {used}/{limit} requests. {remaining} remaining.",
                "used": used,
                "limit": limit,
                "remaining": remaining,
            },
        )


class GlobalBudgetExceededException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "global_budget_exceeded",
                "message": "Service is temporarily at capacity. Please try again shortly.",
            },
            headers={"Retry-After": "300"},
        )


class FeatureNotAvailableException(HTTPException):
    def __init__(self, feature: str, required_plan: str):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "feature_not_available",
                "message": f"'{feature}' requires {required_plan} plan or above.",
                "required_plan": required_plan,
            },
        )


class InvalidAuthException(HTTPException):
    def __init__(self, message: str = "Invalid or expired token"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "unauthorized", "message": message},
            headers={"WWW-Authenticate": "Bearer"},
        )
