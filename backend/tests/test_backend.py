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
        db.login_attempts.delete_many({"identifier": {"$regex": "bruteforce_test|invalid_login_test"}})
    except Exception as e:
        print(f"cleanup warn: {e}")
