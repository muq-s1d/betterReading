from unittest.mock import MagicMock
from .conftest import TEST_USER_ID, TEST_BOOK_ID


def _book_row(user_id=TEST_USER_ID):
    m = MagicMock()
    m.data = {"id": TEST_BOOK_ID, "user_id": user_id}
    return m


def _no_book():
    m = MagicMock()
    m.data = None
    return m


def test_save_progress_ok(client, mock_supabase):
    sb = mock_supabase["progress"]
    sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = _book_row()
    sb.table.return_value.upsert.return_value.execute.return_value = MagicMock()

    res = client.post(f"/progress/{TEST_BOOK_ID}", json={"scroll_percent": 42.5})
    assert res.status_code == 200
    data = res.json()
    assert data["book_id"] == TEST_BOOK_ID
    assert data["scroll_percent"] == 42.5


def test_save_progress_clamps_to_100(client, mock_supabase):
    sb = mock_supabase["progress"]
    sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = _book_row()
    sb.table.return_value.upsert.return_value.execute.return_value = MagicMock()

    res = client.post(f"/progress/{TEST_BOOK_ID}", json={"scroll_percent": 150.0})
    assert res.status_code == 200
    assert res.json()["scroll_percent"] == 100.0


def test_save_progress_clamps_to_0(client, mock_supabase):
    sb = mock_supabase["progress"]
    sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = _book_row()
    sb.table.return_value.upsert.return_value.execute.return_value = MagicMock()

    res = client.post(f"/progress/{TEST_BOOK_ID}", json={"scroll_percent": -10.0})
    assert res.status_code == 200
    assert res.json()["scroll_percent"] == 0.0


def test_save_progress_wrong_owner(client, mock_supabase):
    sb = mock_supabase["progress"]
    wrong = MagicMock()
    wrong.data = {"id": TEST_BOOK_ID, "user_id": "someone-else"}
    sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = wrong

    res = client.post(f"/progress/{TEST_BOOK_ID}", json={"scroll_percent": 50.0})
    assert res.status_code == 404


def test_get_progress_returns_saved(client, mock_supabase):
    sb = mock_supabase["progress"]
    sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = _book_row()
    prog = MagicMock()
    prog.data = {"scroll_percent": 73.2}
    sb.table.return_value.select.return_value.eq.return_value.eq.return_value.maybe_single.return_value.execute.return_value = prog

    res = client.get(f"/progress/{TEST_BOOK_ID}")
    assert res.status_code == 200
    assert res.json()["scroll_percent"] == 73.2


def test_get_progress_defaults_to_zero(client, mock_supabase):
    sb = mock_supabase["progress"]
    sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = _book_row()
    no_row = MagicMock()
    no_row.data = None
    sb.table.return_value.select.return_value.eq.return_value.eq.return_value.maybe_single.return_value.execute.return_value = no_row

    res = client.get(f"/progress/{TEST_BOOK_ID}")
    assert res.status_code == 200
    assert res.json()["scroll_percent"] == 0.0
