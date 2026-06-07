import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.auth import get_current_user

TEST_USER_ID = "test-user-id-1234"
TEST_BOOK_ID = "test-book-id-5678"


def override_auth():
    return TEST_USER_ID


app.dependency_overrides[get_current_user] = override_auth


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def mock_supabase():
    with patch("backend.routers.mood.supabase") as mock_mood, \
         patch("backend.routers.progress.supabase") as mock_progress:
        yield {"mood": mock_mood, "progress": mock_progress}
