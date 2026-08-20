"""API tests. Run with: .venv/bin/pytest

Uses a throwaway SQLite database, so no Postgres is needed to run them.
"""

import os

os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SECRET_KEY"] = "test-key"

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_lead_round_trip(client):
    r = client.post(
        "/api/leads",
        json={
            "name": "Jane Wanjiru",
            "phone": "0722111222",
            "area": "Kilimani",
            "property": "apartment",
            "message": "Breakers tripping.",
        },
    )
    assert r.status_code == 201
    assert r.json() == {"ok": True}


def test_lead_rejects_missing_fields(client):
    assert client.post("/api/leads", json={"name": "", "phone": "x"}).status_code == 422


def test_settings_seeded_but_empty(client):
    """Every setting row exists with a note, but no value ships invented."""
    assert client.get("/api/settings").json() == {}


def test_unpublished_content_is_not_served(client):
    assert client.get("/api/services").json() == []
    assert client.get("/api/projects").json() == []
    assert client.get("/api/testimonials").json() == []


def test_admin_requires_auth(client):
    r = client.get("/admin/", follow_redirects=False)
    assert r.status_code == 302


def test_admin_login_page_renders(client):
    assert client.get("/admin/login").status_code == 200
