"""API tests. Run with: .venv/bin/pytest

Runs against a throwaway PostgreSQL database — the same engine as production.
conftest.py creates and drops it; `docker compose up -d db` is enough to have
one available.
"""

import os

import pytest


# ── meta ────────────────────────────────────────────────────────────────
def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


# ── auth ────────────────────────────────────────────────────────────────
def test_login_rejects_wrong_password(client):
    r = client.post("/api/admin/login", data={"username": os.environ["ADMIN_EMAIL"], "password": "nope"})
    assert r.status_code == 401


def test_login_reveals_nothing_about_unknown_accounts(client):
    unknown = client.post("/api/admin/login", data={"username": "ghost@premierpower.test", "password": "nope"})
    wrong = client.post("/api/admin/login", data={"username": os.environ["ADMIN_EMAIL"], "password": "nope"})
    assert unknown.status_code == wrong.status_code == 401
    assert unknown.json() == wrong.json()


def test_me_requires_a_token(client):
    assert client.get("/api/admin/me").status_code == 401


def test_me_returns_the_seeded_superuser(client, auth):
    body = client.get("/api/admin/me", headers=auth).json()
    assert body["email"] == os.environ["ADMIN_EMAIL"]
    assert body["is_superuser"] is True


def test_garbage_token_is_rejected(client):
    r = client.get("/api/admin/me", headers={"Authorization": "Bearer not-a-jwt"})
    assert r.status_code == 401


# ── writes are protected ────────────────────────────────────────────────
@pytest.mark.parametrize("path", ["/api/services", "/api/projects", "/api/testimonials",
                                  "/api/faqs", "/api/blog", "/api/team", "/api/banners"])
def test_create_requires_auth(client, path):
    assert client.post(path, json={}).status_code == 401


@pytest.mark.parametrize("path", ["/api/services/all", "/api/projects/all", "/api/settings/all",
                                  "/api/leads", "/api/audit", "/api/stats",
                                  "/api/media/library", "/api/newsletter/subscribers"])
def test_admin_reads_require_auth(client, path):
    assert client.get(path).status_code == 401


# ── content lifecycle ───────────────────────────────────────────────────
def test_service_crud_round_trip(client, auth):
    created = client.post("/api/services", headers=auth, json={
        "slug": "rewiring", "title": "Full rewiring",
        "lede": "Old wiring replaced to current standard.",
        "signs": "Red and black conductors\nRubber sheathing",
        "published": True,
    })
    assert created.status_code == 201, created.text
    sid = created.json()["id"]
    # Multi-line `signs` is exposed to the frontend as a list.
    assert created.json()["signs"] == ["Red and black conductors", "Rubber sheathing"]

    assert client.get("/api/services/rewiring").status_code == 200

    updated = client.put(f"/api/services/{sid}", headers=auth, json={
        "slug": "rewiring", "title": "Full rewiring (updated)", "lede": "x", "published": True,
    })
    assert updated.json()["title"] == "Full rewiring (updated)"

    assert client.delete(f"/api/services/{sid}", headers=auth).status_code == 204
    assert client.get("/api/services/rewiring").status_code == 404


def test_duplicate_slug_is_a_conflict(client, auth):
    payload = {"slug": "dupe", "title": "One", "lede": "x", "published": True}
    assert client.post("/api/services", headers=auth, json=payload).status_code == 201
    assert client.post("/api/services", headers=auth, json=payload).status_code == 409


def test_unpublished_content_is_hidden_from_the_public(client, auth):
    client.post("/api/projects", headers=auth, json={
        "slug": "draft-job", "title": "Draft", "published": False,
    })
    slugs = [p["slug"] for p in client.get("/api/projects").json()]
    assert "draft-job" not in slugs
    # But an authenticated admin sees it. /all is paged, so the rows are under
    # "items" alongside the total the CMS pager needs.
    page = client.get("/api/projects/all", headers=auth).json()
    assert "draft-job" in [p["slug"] for p in page["items"]]
    assert page["total"] >= 1


def test_draft_is_visible_through_a_preview_token(client, auth):
    """The one route by which unpublished content reaches the public site."""
    client.post("/api/projects", headers=auth, json={
        "slug": "preview-me", "title": "Preview me", "published": False,
    })
    token = client.post("/api/preview/token", headers=auth).json()["token"]
    slugs = [p["slug"] for p in client.get(f"/api/projects?preview={token}").json()]
    assert "preview-me" in slugs
    # A wrong token is simply not a preview — it must not fail open.
    slugs = [p["slug"] for p in client.get("/api/projects?preview=nonsense").json()]
    assert "preview-me" not in slugs


def test_reorder_rewrites_positions(client, auth):
    made = []
    for i, name in enumerate(("alpha", "beta", "gamma")):
        r = client.post("/api/sectors", headers=auth, json={
            "slug": f"order-{name}", "title": name.title(), "position": i, "published": True})
        made.append(r.json()["id"])
    reversed_ids = list(reversed(made))
    assert client.post("/api/sectors/reorder", headers=auth,
                       json={"ids": reversed_ids}).status_code == 204
    page = client.get("/api/sectors/all", headers=auth).json()
    got = {row["id"]: row["position"] for row in page["items"]}
    assert [got[i] for i in reversed_ids] == [0, 1, 2]


def test_publish_toggle_flips_public_visibility(client, auth):
    r = client.post("/api/sectors", headers=auth, json={
        "slug": "toggle-me", "title": "Toggle", "published": False})
    sector_id = r.json()["id"]
    assert "toggle-me" not in [s["slug"] for s in client.get("/api/sectors").json()]
    client.patch(f"/api/sectors/{sector_id}/publish", headers=auth, json={"value": True})
    assert "toggle-me" in [s["slug"] for s in client.get("/api/sectors").json()]


def test_search_narrows_the_admin_list(client, auth):
    client.post("/api/sectors", headers=auth, json={
        "slug": "findable-sector", "title": "Distinctive Warehousing", "published": True})
    page = client.get("/api/sectors/all?q=Distinctive", headers=auth).json()
    assert [row["slug"] for row in page["items"]] == ["findable-sector"]


def test_writes_need_more_than_a_viewer_role(client, auth):
    """A viewer can read the CMS and change nothing in it."""
    client.post("/api/admin/users", headers=auth, json={
        "email": "viewer@example.com", "name": "Viewer",
        "password": "viewer-password-1234", "role": "viewer",
    })
    r = client.post("/api/admin/login", data={
        "username": "viewer@example.com", "password": "viewer-password-1234"})
    viewer = {"Authorization": f"Bearer {r.json()['access_token']}"}

    assert client.get("/api/sectors/all", headers=viewer).status_code == 200
    assert client.post("/api/sectors", headers=viewer, json={
        "slug": "viewer-made-this", "title": "Nope"}).status_code == 403
    assert client.delete("/api/sectors/1", headers=viewer).status_code == 403
    # Account management is owner-only, above editor.
    assert client.get("/api/admin/users", headers=viewer).status_code == 403


def test_safety_testimonials_sort_first(client, auth):
    client.post("/api/testimonials", headers=auth, json={
        "name": "Plain", "quote": "Tidy work.", "published": True, "position": 1})
    client.post("/api/testimonials", headers=auth, json={
        "name": "Safety", "quote": "They found a dangerous joint.",
        "mentions_safety": True, "published": True, "position": 2})
    names = [t["name"] for t in client.get("/api/testimonials").json()]
    assert names[0] == "Safety"


# ── settings ────────────────────────────────────────────────────────────
def test_settings_are_seeded_but_empty(client):
    assert client.get("/api/settings").json() == {}


def test_setting_upsert_then_exposed(client, auth):
    r = client.put("/api/settings/phone", headers=auth, json={"key": "phone", "value": "0722 000 111"})
    assert r.status_code == 200
    assert client.get("/api/settings").json()["phone"] == "0722 000 111"


# ── leads ───────────────────────────────────────────────────────────────
def test_lead_round_trip(client, auth):
    r = client.post("/api/leads", json={
        "name": "Jane Wanjiru", "phone": "0722111222",
        "area": "Kilimani", "property": "apartment", "message": "Breakers tripping.",
    })
    assert r.status_code == 201
    leads = client.get("/api/leads", headers=auth).json()
    assert any(l["name"] == "Jane Wanjiru" for l in leads)


def test_lead_rejects_missing_fields(client):
    assert client.post("/api/leads", json={"name": "", "phone": "x"}).status_code == 422


# ── newsletter ──────────────────────────────────────────────────────────
def test_subscribe_is_idempotent(client):
    assert client.post("/api/newsletter/subscribe", json={"email": "a@b.com"}).status_code == 201
    assert client.post("/api/newsletter/subscribe", json={"email": "a@b.com"}).status_code == 201


def test_subscribe_rejects_a_bad_address(client):
    assert client.post("/api/newsletter/subscribe", json={"email": "not-an-email"}).status_code == 422


# ── media ───────────────────────────────────────────────────────────────
def test_upload_rejects_non_images(client, auth):
    r = client.post("/api/media/image", headers=auth,
                    files={"file": ("note.txt", b"hello", "text/plain")})
    assert r.status_code == 415


def test_upload_stores_an_image(client, auth):
    png = bytes.fromhex("89504e470d0a1a0a") + b"\x00" * 64
    r = client.post("/api/media/image", headers=auth,
                    files={"file": ("wall.png", png, "image/png")})
    assert r.status_code == 201, r.text
    assert r.json()["url"].startswith("/uploads/")
    assert r.json()["storage"] == "local"


# ── audit & stats ───────────────────────────────────────────────────────
def test_writes_are_audited(client, auth):
    entries = client.get("/api/audit", headers=auth).json()
    actions = {(e["entity"], e["action"]) for e in entries}
    assert ("service", "create") in actions
    assert ("service", "delete") in actions


def test_stats_report_pending_settings(client, auth):
    """Pending is counted, not hard-coded.

    This asserted the exact seeded total, so adding one setting broke a test
    that has nothing to do with how many there are. What matters is that the
    count is real and that filling one in moves it.
    """
    body = client.get("/api/stats", headers=auth).json()
    settings_rows = client.get("/api/settings/all", headers=auth).json()
    blank = sum(1 for r in settings_rows if not str(r["value"]).strip())

    assert body["settings"]["total"] == len(settings_rows)
    assert body["settings"]["pending"] == blank
    # At least one was filled in by an earlier test, so pending trails total.
    assert body["settings"]["pending"] < body["settings"]["total"]
    assert body["leads"]["total"] >= 1


# ── sqladmin ────────────────────────────────────────────────────────────
# Mounted at /sqladmin, not /admin: /admin is the CMS the client uses, which
# is part of the frontend. This is the unlinked raw-table escape hatch.
def test_raw_admin_requires_auth(client):
    assert client.get("/sqladmin/", follow_redirects=False).status_code == 302


def test_raw_admin_login_page_renders(client):
    assert client.get("/sqladmin/login").status_code == 200


def test_raw_admin_no_longer_answers_on_the_cms_path(client):
    """/admin belongs to the CMS. If the backend ever claims it again, the
    client's admin panel is replaced by a Bootstrap table view."""
    assert client.get("/admin/", follow_redirects=False).status_code == 404
