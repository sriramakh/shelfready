import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def mock_user():
    return {
        "id": "00000000-0000-0000-0000-000000000001",
        "email": "test@example.com",
        "full_name": "Test User",
        "current_plan": "pro",
        "stripe_customer_id": None,
        "onboarding_completed": True,
    }
