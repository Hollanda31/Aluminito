"""Backend tests for Aluminito admin panel: track, auth, admin stats."""
import os
import time
from pathlib import Path

import pytest
import requests
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[1]
load_dotenv(ROOT_DIR / ".env")
load_dotenv(ROOT_DIR.parent / "frontend" / ".env")

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
ORIGIN = BASE_URL


@pytest.fixture
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Origin": ORIGIN})
    return s


@pytest.fixture
def auth_client(client):
    r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return client


# --- /api/track ---
def test_track_unauth_accepted(client):
    r = client.post(f"{API}/track", json={"grupo": "TEST_grupo", "item": "TEST_item", "origem": "pytest"})
    assert r.status_code == 201
    assert r.json().get("ok") is True


def test_admin_stats_requires_auth(client):
    r = client.get(f"{API}/admin/stats")
    assert r.status_code == 401



def test_admin_reviews_require_auth(client):
    assert client.get(f"{API}/admin/reviews").status_code == 401
    assert client.patch(
        f"{API}/admin/reviews/review-inexistente/status",
        json={"status": "hidden"},
    ).status_code == 401
    assert client.delete(f"{API}/admin/reviews/review-inexistente").status_code == 401
    assert client.patch(
        f"{API}/admin/reviews/review-inexistente/featured",
        json={"featured": True},
    ).status_code == 401


# --- Auth flows ---
def test_login_invalid(client):
    r = client.post(
        f"{API}/auth/login",
        json={"email": "invalid_login_test@aluminito.local", "password": "WRONG_PASSWORD_xx"},
    )
    assert r.status_code == 401


def test_brute_force_lockout():
    """Use unique email to avoid locking real admin / interfering with other tests."""
    import pymongo
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Origin": ORIGIN,
                      "X-Forwarded-For": "203.0.113.42"})
    bad_email = "bruteforce_test@aluminito.com.br"
    statuses = []
    for i in range(6):
        r = s.post(f"{API}/auth/login", json={"email": bad_email, "password": "nope"})
        statuses.append(r.status_code)
    assert statuses[:5] == [401]*5, f"expected 5x 401 got {statuses}"
    assert statuses[5] == 429, f"expected 429 on 6th, got {statuses}"
    # Cleanup
    try:
        mc = pymongo.MongoClient(os.environ["MONGO_URL"])
        mc[os.environ["DB_NAME"]].login_attempts.delete_many(
            {"identifier": {"$regex": bad_email}}
        )
    except Exception as e:
        print(f"cleanup warn: {e}")


def test_login_valid_sets_cookies(client):
    r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == ADMIN_EMAIL
    cookies = {c.name: c for c in client.cookies}
    assert "access_token" in cookies
    assert "refresh_token" in cookies


def test_me_requires_cookie():
    s = requests.Session()
    r = s.get(f"{API}/auth/me")
    assert r.status_code == 401


def test_me_with_cookie(auth_client):
    r = auth_client.get(f"{API}/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == ADMIN_EMAIL


def test_refresh(auth_client):
    old_access = auth_client.cookies.get("access_token")
    time.sleep(1)
    r = auth_client.post(f"{API}/auth/refresh")
    assert r.status_code == 200
    new_access = auth_client.cookies.get("access_token")
    assert new_access is not None


def test_stats_week_and_month(auth_client):
    # Create a known event
    auth_client.post(f"{API}/track", json={"grupo": "TEST_stats_grupo", "item": "TEST_stats_item", "origem": "pytest"})
    for periodo in ("semana", "mes"):
        r = auth_client.get(f"{API}/admin/stats", params={"periodo": periodo})
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("total", "hoje", "por_dia", "por_grupo", "por_item", "ultimos"):
            assert k in d
        # Our test event should appear
        grupos = [g["grupo"] for g in d["por_grupo"]]
        assert "TEST_stats_grupo" in grupos



def test_admin_review_moderation(auth_client, client):
    review_id = None
    try:
        created = client.post(
            f"{API}/reviews",
            json={
                "name": "TEST Moderacao",
                "role": "Cliente",
                "place": "Serra",
                "rating": 5,
                "text": "Avaliação criada para testar a moderação do painel.",
            },
        )
        assert created.status_code == 201, created.text
        review = created.json()
        review_id = review["id"]
        assert review["status"] == "visible"

        admin_list = auth_client.get(f"{API}/admin/reviews")
        assert admin_list.status_code == 200
        assert review_id in [r["id"] for r in admin_list.json()]

        hidden = auth_client.patch(
            f"{API}/admin/reviews/{review_id}/status",
            json={"status": "hidden"},
        )
        assert hidden.status_code == 200, hidden.text
        assert hidden.json()["status"] == "hidden"

        public_hidden = client.get(f"{API}/reviews")
        assert public_hidden.status_code == 200
        assert review_id not in [r["id"] for r in public_hidden.json()]

        visible = auth_client.patch(
            f"{API}/admin/reviews/{review_id}/status",
            json={"status": "visible"},
        )
        assert visible.status_code == 200, visible.text

        public_visible = client.get(f"{API}/reviews")
        assert review_id in [r["id"] for r in public_visible.json()]

        deleted = auth_client.delete(f"{API}/admin/reviews/{review_id}")
        assert deleted.status_code == 204
        review_id = None
    finally:
        if review_id:
            auth_client.delete(f"{API}/admin/reviews/{review_id}")


def test_public_reviews_includes_legacy_and_visible(auth_client, client):
    """Legacy reviews (no status field) should be returned by public GET; hidden should not."""
    import pymongo
    import uuid as _uuid
    from datetime import datetime, timezone

    mc = pymongo.MongoClient(os.environ["MONGO_URL"])
    coll = mc[os.environ["DB_NAME"]].reviews
    legacy_id = f"TEST_legacy_{_uuid.uuid4()}"
    coll.insert_one({
        "id": legacy_id,
        "name": "TEST Legacy",
        "role": "",
        "place": "",
        "rating": 4,
        "text": "Avaliacao antiga sem campo status.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        # intentionally no "status" field
    })
    try:
        r = client.get(f"{API}/reviews")
        assert r.status_code == 200
        ids = [x["id"] for x in r.json()]
        assert legacy_id in ids, "Legacy review (no status) should appear in public GET"
    finally:
        coll.delete_one({"id": legacy_id})


def test_admin_review_featured_order(auth_client, client):
    created_ids = []

    def create_review(name):
        r = client.post(
            f"{API}/reviews",
            json={
                "name": name,
                "role": "Cliente",
                "place": "Serra",
                "rating": 5,
                "text": f"Avaliação temporária de ordenação: {name}",
            },
        )
        assert r.status_code == 201, r.text
        created_ids.append(r.json()["id"])
        return r.json()["id"]

    try:
        first_id = create_review("TEST Destaque A")
        second_id = create_review("TEST Destaque B")

        r = auth_client.patch(
            f"{API}/admin/reviews/{first_id}/featured",
            json={"featured": True},
        )
        assert r.status_code == 200, r.text
        assert r.json()["featured"] is True
        assert r.json()["featured_at"]

        public = client.get(f"{API}/reviews")
        assert public.status_code == 200
        assert public.json()[0]["id"] == first_id

        time.sleep(0.01)
        r = auth_client.patch(
            f"{API}/admin/reviews/{second_id}/featured",
            json={"featured": True},
        )
        assert r.status_code == 200, r.text

        public = client.get(f"{API}/reviews")
        assert public.json()[0]["id"] == second_id

        r = auth_client.patch(
            f"{API}/admin/reviews/{second_id}/featured",
            json={"featured": False},
        )
        assert r.status_code == 200, r.text
        assert r.json()["featured"] is False
        assert r.json()["featured_at"] is None

        public = client.get(f"{API}/reviews")
        assert public.json()[0]["id"] == first_id
    finally:
        for review_id in created_ids:
            auth_client.delete(f"{API}/admin/reviews/{review_id}")


def test_logout(auth_client):
    r = auth_client.post(f"{API}/auth/logout")
    assert r.status_code == 200
    # After logout, /me should 401
    r2 = auth_client.get(f"{API}/auth/me")
    assert r2.status_code == 401


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    yield
    try:
        import pymongo
        mc = pymongo.MongoClient(os.environ["MONGO_URL"])
        db = mc[os.environ["DB_NAME"]]
        res = db.lead_events.delete_many({"grupo": {"$regex": "^TEST_"}})
        print(f"Cleaned up {res.deleted_count} test lead_events")
        res2 = db.reviews.delete_many({"name": {"$regex": "^TEST"}})
        print(f"Cleaned up {res2.deleted_count} test reviews")
        db.login_attempts.delete_many({"identifier": {"$regex": "bruteforce_test|invalid_login_test"}})
    except Exception as e:
        print(f"cleanup warn: {e}")
