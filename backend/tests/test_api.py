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


def test_lead_rejects_a_name_of_only_spaces(client):
    assert client.post("/api/leads", json={"name": "   ", "phone": "0722111222"}).status_code == 422


def test_lead_rejects_a_bad_email_and_a_phone_without_digits(client):
    r = client.post("/api/leads", json={"name": "A", "phone": "0722111222", "email": "abc"})
    assert r.status_code == 422
    r = client.post("/api/leads", json={"name": "A", "phone": "call me!"})
    assert r.status_code == 422


def test_lead_accepts_a_blank_email(client):
    assert client.post("/api/leads", json={"name": "A", "phone": "+254 722 111 222", "email": ""}).status_code == 201


def test_lead_honeypot_is_dropped_quietly(client, auth):
    r = client.post("/api/leads", json={"name": "Bot Botson", "phone": "0722111222", "website": "http://spam"})
    assert r.status_code == 201
    leads = client.get("/api/leads", headers=auth).json()
    assert not any(l["name"] == "Bot Botson" for l in leads)


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


PNG = bytes.fromhex("89504e470d0a1a0a") + b"\x00" * 64


def test_upload_is_refused_without_cloudinary(client, auth, tmp_path, monkeypatch):
    """No silent fallback to a disk the host will wipe."""
    from app.settings import settings

    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    r = client.post("/api/media/image", headers=auth,
                    files={"file": ("wall.png", PNG, "image/png")})
    assert r.status_code == 503
    assert "CLOUDINARY_API_KEY" in r.json()["detail"]
    assert list(tmp_path.iterdir()) == []


def test_upload_sends_the_image_to_cloudinary(client, auth, monkeypatch):
    """The real upload is stubbed: tests must not write to the client's account."""
    from app.routers import upload
    from app.settings import settings

    for field in ("cloudinary_cloud_name", "cloudinary_api_key", "cloudinary_api_secret"):
        monkeypatch.setattr(settings, field, "set")
    sent = {}

    def fake_store(data, filename, folder=""):
        sent.update(filename=filename, folder=folder, size=len(data))
        return {"url": "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/wall.png",
                "public_id": "premierpower/wall", "width": 1, "height": 1,
                "storage": "cloudinary"}

    monkeypatch.setattr(upload, "_store_cloudinary", fake_store)
    r = client.post("/api/media/image", headers=auth, data={"folder": "projects"},
                    files={"file": ("wall.png", PNG, "image/png")})
    assert r.status_code == 201, r.text
    assert r.json()["storage"] == "cloudinary"
    assert r.json()["url"].startswith("https://res.cloudinary.com/")
    assert sent == {"filename": "wall.png", "folder": "projects", "size": len(PNG)}


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


def test_database_url_gets_the_psycopg3_driver():
    """Render's connection string must not select the missing psycopg2."""
    from app.settings import Settings

    for given in ("postgres://u:p@h:5432/d", "postgresql://u:p@h:5432/d",
                  "postgresql+psycopg://u:p@h:5432/d"):
        s = Settings(database_url=given, secret_key="x" * 40)
        assert s.database_url == "postgresql+psycopg://u:p@h:5432/d"


# ── sitemap ─────────────────────────────────────────────────────────────
def test_sitemap_lists_full_service_pages_and_articles_only(client, auth):
    long_body = "A full description of the service line. " * 20   # well over 600 characters
    r = client.post("/api/services", headers=auth, json={
        "slug": "sitemap-long", "title": "Long", "lede": "Long one.", "body": long_body, "published": True,
    })
    assert r.status_code == 201, r.text
    r = client.post("/api/services", headers=auth, json={
        "slug": "sitemap-short", "title": "Short", "lede": "Short one.", "body": "Two lines.", "published": True,
    })
    assert r.status_code == 201, r.text
    r = client.post("/api/blog", headers=auth, json={
        "slug": "sitemap-article", "title": "An article", "body": "Text.", "published": True,
    })
    assert r.status_code == 201, r.text
    # Saving as published stamps the date, not only the publish toggle.
    assert r.json()["published_at"]

    xml = client.get("/sitemap.xml").text
    assert "/services/sitemap-long</loc>" in xml
    assert "/services/sitemap-short</loc>" not in xml
    assert "/insights/sitemap-article</loc>" in xml
    assert "/insights</loc>" in xml
    assert "/admin" not in xml

    reviews = client.get("/api/testimonials").json()
    assert ("/testimonials</loc>" in xml) == bool(reviews)


def test_robots_points_at_the_sitemap_and_keeps_admin_out(client):
    txt = client.get("/robots.txt").text
    assert "Disallow: /admin" in txt
    assert "Sitemap: " in txt and txt.strip().endswith("/sitemap.xml")


def test_rebuild_is_off_without_a_hook_and_debounced_with_one(monkeypatch):
    from app.core import rebuild
    calls = []
    monkeypatch.setattr(rebuild, "_fire", lambda: calls.append(1))
    monkeypatch.setattr(rebuild, "REBUILD_DELAY", 0.05)

    monkeypatch.setattr(rebuild.settings, "vercel_deploy_hook", "")
    rebuild.schedule_rebuild("service")
    import time
    time.sleep(0.2)
    assert calls == []

    monkeypatch.setattr(rebuild.settings, "vercel_deploy_hook", "https://example.invalid/hook")
    for _ in range(5):
        rebuild.schedule_rebuild("post")
    rebuild.schedule_rebuild("lead")   # not a page-affecting entity
    time.sleep(0.3)
    assert calls == [1]


# ── roles ───────────────────────────────────────────────────────────────
@pytest.fixture(scope="module")
def viewer(client, auth):
    email, password = "viewer-roles@example.com", "viewer-password-1"
    r = client.post("/api/admin/users", headers=auth, json={
        "email": email, "name": "Viewer", "password": password, "role": "viewer",
    })
    assert r.status_code in (201, 409), r.text
    r = client.post("/api/admin/login", data={"username": email, "password": password})
    assert r.status_code == 200, r.text
    return {"headers": {"Authorization": f"Bearer {r.json()['access_token']}"},
            "email": email, "password": password}


def test_a_viewer_reads_but_cannot_change_leads_settings_or_see_the_audit_log(client, auth, viewer):
    client.post("/api/leads", json={"name": "Role Check", "phone": "0722333444"})
    lead = next(l for l in client.get("/api/leads", headers=auth).json() if l["name"] == "Role Check")
    v = viewer["headers"]
    assert client.get(f"/api/leads/{lead['id']}", headers=v).status_code == 200
    assert client.patch(f"/api/leads/{lead['id']}", headers=v, json={"status": "won"}).status_code == 403
    assert client.delete(f"/api/leads/{lead['id']}", headers=v).status_code == 403
    assert client.put("/api/settings/phone", headers=v, json={"key": "phone", "value": "0"}).status_code == 403
    assert client.get("/api/audit", headers=v).status_code == 403
    # An owner still can.
    assert client.get("/api/audit", headers=auth).status_code == 200


def test_sqladmin_refuses_anyone_but_an_owner(client, viewer):
    r = client.post("/sqladmin/login", data={"username": viewer["email"], "password": viewer["password"]},
                    follow_redirects=False)
    # A refused login re-renders the form (400); an accepted one redirects.
    assert r.status_code != 302
    assert client.get("/sqladmin/", follow_redirects=False).status_code == 302


def test_upload_over_the_limit_is_refused_before_cloudinary(client, auth, monkeypatch):
    from app.routers import upload
    from app.settings import settings

    for field in ("cloudinary_cloud_name", "cloudinary_api_key", "cloudinary_api_secret"):
        monkeypatch.setattr(settings, field, "set")
    monkeypatch.setattr(settings, "max_upload_mb", 1)
    monkeypatch.setattr(upload, "_store_cloudinary", lambda *a, **k: pytest.fail("should not upload"))
    big = PNG + b"\0" * (1024 * 1024 + 10)
    r = client.post("/api/media/image", headers=auth, files={"file": ("big.png", big, "image/png")})
    assert r.status_code == 413


def test_upload_folder_cannot_escape_into_another_cloudinary_folder():
    from app.routers.upload import _folder
    assert _folder("../../other/Place") == "other-place"
    assert "/" not in _folder("a/b/c")


def test_lead_email_subject_survives_a_line_break_in_the_name():
    from types import SimpleNamespace
    from app.core.mailer import lead_notification
    lead = SimpleNamespace(name="Jane\nDoe", company="Acme\r\nLtd", kind="enquiry", phone="0722",
                           email="", project_type="", area="", property="", message="")
    subject, _ = lead_notification(lead)
    assert "\n" not in subject and "\r" not in subject
    assert subject == "New enquiry: Jane Doe · Acme Ltd"


def test_sqladmin_still_admits_an_owner_over_https(database):
    import os
    from fastapi.testclient import TestClient
    from app.main import app
    with TestClient(app, base_url="https://testserver") as c:
        r = c.post("/sqladmin/login", data={
            "username": os.environ["ADMIN_EMAIL"], "password": os.environ["ADMIN_PASSWORD"],
        }, follow_redirects=False)
        assert r.status_code == 302, r.text[:200]
        assert c.get("/sqladmin/", follow_redirects=False).status_code == 200


# ── enquiry attachments ─────────────────────────────────────────────────
PDF = b"%PDF-1.4\n%test drawing\n"


@pytest.fixture(autouse=True)
def _fresh_rate_limits():
    """Every test client shares one address, so the enquiry limit (five an
    hour) is reached partway through the suite and later submissions are
    quietly accepted without being checked, exactly as a throttled bot's would."""
    from app.core import throttle
    throttle._hits.clear()
    yield


def test_enquiry_with_a_drawing_is_stored_privately_and_downloadable_by_staff(client, auth, tmp_path, monkeypatch):
    from app.settings import settings
    monkeypatch.setattr(settings, "private_dir", str(tmp_path))
    r = client.post("/api/leads/with-files", data={"name": "Drawing Sender", "phone": "0722555666"},
                    files=[("files", ("Ground floor plan.pdf", PDF, "application/pdf"))])
    assert r.status_code == 201, r.text
    lead = next(l for l in client.get("/api/leads", headers=auth).json() if l["name"] == "Drawing Sender")
    assert lead["attachments"] == [{"name": "Ground floor plan.pdf", "bytes": len(PDF), "type": "application/pdf"}]
    # Where it is stored is never part of the response.
    assert "key" not in str(lead["attachments"]) and str(tmp_path) not in r.text

    assert client.get(f"/api/leads/{lead['id']}/attachments/0").status_code == 401
    got = client.get(f"/api/leads/{lead['id']}/attachments/0", headers=auth)
    assert got.status_code == 200 and got.content == PDF
    assert got.headers["content-type"] == "application/pdf"
    assert client.get(f"/api/leads/{lead['id']}/attachments/1", headers=auth).status_code == 404
    # Not reachable through the public uploads mount either.
    assert list(tmp_path.iterdir())

    assert client.delete(f"/api/leads/{lead['id']}", headers=auth).status_code == 204
    assert not list(tmp_path.iterdir())


def test_enquiry_files_are_checked_by_content_count_and_size(client, tmp_path, monkeypatch):
    from app.core import attachments
    from app.settings import settings
    monkeypatch.setattr(settings, "private_dir", str(tmp_path))
    base = {"name": "File Checks", "phone": "0722555777"}
    r = client.post("/api/leads/with-files", data=base,
                    files=[("files", ("plan.pdf", b"<html>not a pdf</html>", "application/pdf"))])
    assert r.status_code == 415
    r = client.post("/api/leads/with-files", data=base,
                    files=[("files", (f"p{i}.pdf", PDF, "application/pdf")) for i in range(4)])
    assert r.status_code == 422
    monkeypatch.setattr(attachments, "MAX_BYTES", 10)
    r = client.post("/api/leads/with-files", data=base,
                    files=[("files", ("big.pdf", PDF, "application/pdf"))])
    assert r.status_code == 413
    assert not list(tmp_path.iterdir())


def test_enquiry_with_files_validates_like_the_plain_form(client, auth):
    r = client.post("/api/leads/with-files", data={"name": "", "phone": "12"})
    assert r.status_code == 422
    fields = {e["loc"][-1] for e in r.json()["detail"]}
    assert {"name", "phone"} <= fields
    r = client.post("/api/leads/with-files", data={"name": "Bot", "phone": "0722555888", "website": "x"})
    assert r.status_code == 201
    assert not any(l["name"] == "Bot" and l["phone"] == "0722555888"
                   for l in client.get("/api/leads", headers=auth).json())


def test_sitemap_lists_projects_only_once_they_have_a_write_up_and_a_photo(client, auth):
    body = "What was installed, where, and how it was tested. " * 15
    for slug, extra in (("case-full", {"body": body, "image_open_url": "https://x/y.jpg"}),
                        ("case-no-photo", {"body": body}),
                        ("case-thin", {"image_open_url": "https://x/y.jpg"})):
        r = client.post("/api/projects", headers=auth, json={"slug": slug, "title": slug, "published": True, **extra})
        assert r.status_code == 201, r.text
    r = client.post("/api/projects", headers=auth, json={
        "slug": "case-gallery", "title": "g", "published": True, "body": body,
        "gallery": [{"url": "https://x/1.jpg", "alt": "Board"}, {"url": "https://x/2.jpg"}]})
    assert r.status_code == 201 and r.json()["gallery"][0] == {"url": "https://x/1.jpg", "alt": "Board"}
    xml = client.get("/sitemap.xml").text
    assert "/portfolio/case-full</loc>" in xml and "/portfolio/case-gallery</loc>" in xml
    assert "/portfolio/case-no-photo</loc>" not in xml and "/portfolio/case-thin</loc>" not in xml


def test_seed_retires_only_untouched_placeholder_seo_and_hero_label(client, auth):
    from app.db import SessionLocal
    from app.models import PageSection, SeoMeta
    from app.seed import NEW_HERO_LABEL, OLD_HERO_LABEL, RETIRED_SEO, seed_content
    from sqlalchemy import select

    db = SessionLocal()
    try:
        about = db.scalar(select(SeoMeta).where(SeoMeta.path == "/about"))
        faq = db.scalar(select(SeoMeta).where(SeoMeta.path == "/faq"))
        about.title, about.description = RETIRED_SEO["/about"]
        faq.title, faq.description = RETIRED_SEO["/faq"][0], "Our own words, typed in the CMS."
        hero = db.scalar(select(PageSection).where(PageSection.page == "/", PageSection.key == "hero"))
        hero.eyebrow = OLD_HERO_LABEL
        db.commit()

        seed_content(db)
        db.commit()
        db.refresh(about); db.refresh(faq); db.refresh(hero)
        assert (about.title, about.description) == ("", "")          # untouched placeholder: cleared
        assert faq.description == "Our own words, typed in the CMS."  # edited: kept
        assert faq.title == RETIRED_SEO["/faq"][0]
        assert hero.eyebrow == NEW_HERO_LABEL

        hero.eyebrow = "Our own label"
        db.commit()
        seed_content(db); db.commit(); db.refresh(hero)
        assert hero.eyebrow == "Our own label"
    finally:
        db.close()
