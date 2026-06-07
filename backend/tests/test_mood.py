from unittest.mock import MagicMock, patch
from .conftest import TEST_USER_ID, TEST_BOOK_ID


def _book_ready(user_id=TEST_USER_ID):
    m = MagicMock()
    m.data = {"id": TEST_BOOK_ID, "user_id": user_id, "status": "ready"}
    return m


def _timeline_rows():
    m = MagicMock()
    m.data = [
        {"chunk_index": 0, "emotion": "Joy", "confidence": 0.91, "text": "She laughed."},
        {"chunk_index": 1, "emotion": "Fear", "confidence": 0.78, "text": "He ran fast."},
    ]
    return m


def test_get_mood_timeline_ok(client, mock_supabase):
    sb = mock_supabase["mood"]
    sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = _book_ready()
    sb.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = _timeline_rows()

    res = client.get(f"/mood/{TEST_BOOK_ID}")
    assert res.status_code == 200
    data = res.json()
    assert data["book_id"] == TEST_BOOK_ID
    assert data["total_chunks"] == 2
    assert data["timeline"][0]["emotion"] == "Joy"
    assert data["timeline"][0]["text"] == "She laughed."


def test_get_mood_timeline_wrong_owner(client, mock_supabase):
    sb = mock_supabase["mood"]
    wrong = MagicMock()
    wrong.data = {"id": TEST_BOOK_ID, "user_id": "someone-else", "status": "ready"}
    sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = wrong

    res = client.get(f"/mood/{TEST_BOOK_ID}")
    assert res.status_code == 403


def test_get_mood_timeline_not_ready(client, mock_supabase):
    sb = mock_supabase["mood"]
    pending = MagicMock()
    pending.data = {"id": TEST_BOOK_ID, "user_id": TEST_USER_ID, "status": "processing"}
    sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = pending

    res = client.get(f"/mood/{TEST_BOOK_ID}")
    assert res.status_code == 409


def test_get_mood_timeline_not_found(client, mock_supabase):
    sb = mock_supabase["mood"]
    none = MagicMock()
    none.data = None
    sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = none

    res = client.get(f"/mood/{TEST_BOOK_ID}")
    assert res.status_code == 404
