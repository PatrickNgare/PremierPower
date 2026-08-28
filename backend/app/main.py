import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .admin import mount_admin
from .core.security import hash_password
from .db import SessionLocal, engine
from .models import (
    Admin, Banner, BlogPost, Document, FAQ, HomepageSection, MenuItem, Product,
    ProductCategory, Project, Sector, SeoMeta, Service, SiteSetting, SocialLink,
    TeamMember, Testimonial,
)
from .routers import (
    admin_auth, audit, leads, newsletter, notifications, preview,
    settings_router, stats, upload,
)
from .routers.crud import crud_router
from .schemas import (
    BannerIn, BannerOut, BlogPostIn, BlogPostOut, DocumentIn, DocumentOut,
    FAQIn, FAQOut, HomepageSectionIn, HomepageSectionOut, MenuItemIn, MenuItemOut,
    ProductCategoryIn, ProductCategoryOut, ProductIn, ProductOut,
    ProjectIn, ProjectOut, SectorIn, SectorOut, SeoMetaIn, SeoMetaOut,
    ServiceIn, ServiceOut,
    SocialLinkIn, SocialLinkOut, TeamMemberIn, TeamMemberOut,
    TestimonialIn, TestimonialOut,
)
from .settings import settings

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("premierpower")


def _migrate() -> None:
    """Bring the database to head.

    create_all() only ever creates missing tables — it cannot add a column to
    a table that already exists, which is how the schema silently drifted from
    the models once fields were added. Alembic owns the schema from here.
    """
    from alembic import command
    from alembic.config import Config

    cfg = Config(str(Path(__file__).resolve().parent.parent / "alembic.ini"))
    cfg.set_main_option("script_location", str(Path(__file__).resolve().parent.parent / "alembic"))
    cfg.set_main_option("sqlalchemy.url", settings.database_url)
    command.upgrade(cfg, "head")


@asynccontextmanager
async def lifespan(_: FastAPI):
    _migrate()
    _seed_settings()
    _seed_superuser()
    _seed_content()
    yield


app = FastAPI(
    title="Premier Power API",
    version="2.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)

# ── content resources, one shape each ───────────────────────────────────
# `search` names the columns the CMS search box looks in; `filters` the ones a
# dropdown can narrow by. Everything else — paging, reordering, publishing,
# preview and the audit trail — comes from the factory.
app.include_router(crud_router(model=Service, schema_in=ServiceIn, schema_out=ServiceOut,
                               entity="service", search=("title", "slug", "lede")),
                   prefix="/api/services")
app.include_router(crud_router(model=Project, schema_in=ProjectIn, schema_out=ProjectOut,
                               entity="project", search=("title", "location", "summary")),
                   prefix="/api/projects")
app.include_router(crud_router(model=Testimonial, schema_in=TestimonialIn, schema_out=TestimonialOut,
                               entity="testimonial", lookup="",
                               search=("name", "job", "quote"),
                               order_by=(Testimonial.mentions_safety.desc(),
                                         Testimonial.position, Testimonial.id)),
                   prefix="/api/testimonials")
app.include_router(crud_router(model=FAQ, schema_in=FAQIn, schema_out=FAQOut,
                               entity="faq", lookup="", search=("question", "answer"),
                               filters={"category": FAQ.category}), prefix="/api/faqs")
app.include_router(crud_router(model=BlogPost, schema_in=BlogPostIn, schema_out=BlogPostOut,
                               entity="post", search=("title", "excerpt", "author"),
                               order_by=(BlogPost.created_at.desc(),)),
                   prefix="/api/blog")
app.include_router(crud_router(model=TeamMember, schema_in=TeamMemberIn, schema_out=TeamMemberOut,
                               entity="team member", lookup="", search=("name", "role")),
                   prefix="/api/team")
app.include_router(crud_router(model=Banner, schema_in=BannerIn, schema_out=BannerOut,
                               entity="banner", lookup="", search=("headline", "eyebrow")),
                   prefix="/api/banners")

app.include_router(crud_router(model=Sector, schema_in=SectorIn, schema_out=SectorOut,
                               entity="sector", search=("title", "slug")),
                   prefix="/api/sectors")

# ── catalogue ───────────────────────────────────────────────────────────
app.include_router(crud_router(model=ProductCategory, schema_in=ProductCategoryIn,
                               schema_out=ProductCategoryOut, entity="category",
                               search=("name", "slug")), prefix="/api/product-categories")
app.include_router(crud_router(model=Product, schema_in=ProductIn, schema_out=ProductOut,
                               entity="product", search=("name", "slug", "brand", "summary"),
                               filters={"category_id": Product.category_id}),
                   prefix="/api/products")

# ── site structure ──────────────────────────────────────────────────────
app.include_router(crud_router(model=HomepageSection, schema_in=HomepageSectionIn,
                               schema_out=HomepageSectionOut, entity="section",
                               lookup="key", search=("key", "title")),
                   prefix="/api/homepage-sections")
app.include_router(crud_router(model=MenuItem, schema_in=MenuItemIn, schema_out=MenuItemOut,
                               entity="menu item", lookup="", search=("label", "href"),
                               filters={"menu": MenuItem.menu}), prefix="/api/menu")
app.include_router(crud_router(model=SocialLink, schema_in=SocialLinkIn, schema_out=SocialLinkOut,
                               entity="social link", lookup="", search=("platform", "url")),
                   prefix="/api/social")
app.include_router(crud_router(model=SeoMeta, schema_in=SeoMetaIn, schema_out=SeoMetaOut,
                               entity="seo", lookup="", search=("path", "title")),
                   prefix="/api/seo")
app.include_router(crud_router(model=Document, schema_in=DocumentIn, schema_out=DocumentOut,
                               entity="document", lookup="", search=("title", "filename"),
                               filters={"category": Document.category}), prefix="/api/documents")

# ── everything with its own shape ───────────────────────────────────────
app.include_router(admin_auth.router, prefix="/api/admin")
app.include_router(settings_router.router, prefix="/api/settings")
app.include_router(leads.router, prefix="/api/leads")
app.include_router(newsletter.router, prefix="/api/newsletter")
app.include_router(upload.router, prefix="/api/media")
app.include_router(audit.router, prefix="/api/audit")
app.include_router(stats.router, prefix="/api/stats")
app.include_router(notifications.router, prefix="/api/notifications")
app.include_router(preview.router, prefix="/api/preview")

# Locally stored uploads. Cloudinary serves its own when configured.
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/api/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}


def _seed_settings() -> None:
    """Create the setting rows the client needs to fill in, each with a note
    saying what it is. Values stay empty until they supply them."""
    from sqlalchemy import select

    wanted = [
        ("phone", "Primary phone number, as clients should dial it"),
        ("phone_secondary", "Second phone number"),
        ("whatsapp", "WhatsApp number, digits only, including 254"),
        ("email", "Contact email address"),
        ("legal_name", "Registered business name"),
        ("street", "Street address for Google/LocalBusiness listing"),
        ("service_area", "Area served, e.g. 'Nairobi and nationwide'"),
        ("nca_number", "NCA registration number — LAUNCH BLOCKER. The certificates in the company profile are blank templates, so this must come from the client."),
        ("nca_category", "NCA category, e.g. 'Electrical Engineering Service Contractor'"),
        ("insured", "Insurer name"),
        ("warranty", "Workmanship warranty term, e.g. '2 years'"),
        ("years_trading", "Years trading"),
        ("projects_completed", "Projects completed"),
        ("response_time", "Typical response time, e.g. 'same day'"),
    ]
    # Keys that were renamed. Seeding only ever adds, so without this an
    # existing database keeps the old rows forever and the client sees
    # "EPRA licence number" in the CMS long after the site stopped using it.
    retired = {
        "epra_number": "nca_number",
        "epra_class": "nca_category",
        "years_licensed": "years_trading",
        "installs_completed": "projects_completed",
    }

    db = SessionLocal()
    try:
        rows = {r.key: r for r in db.scalars(select(SiteSetting)).all()}
        for old, new in retired.items():
            row = rows.get(old)
            if row is None:
                continue
            # Carry a value across rather than discarding the client's work.
            target = rows.get(new)
            if row.value.strip() and target is not None and not target.value.strip():
                target.value = row.value
            db.delete(row)
            rows.pop(old)

        for key, note in wanted:
            if key not in rows:
                db.add(SiteSetting(key=key, value="", note=note))
        db.commit()
    finally:
        db.close()


def _seed_content() -> None:
    """Fill empty content tables on first run. Never touches a table that
    already holds rows — see app/seed.py."""
    from .seed import seed_content

    db = SessionLocal()
    try:
        seed_content(db)
    except Exception:
        # Never fatal. A seed that cannot write leaves the site without its
        # starting content, which an admin can fix by hand; a seed that takes
        # the process down leaves nobody able to log in and fix anything, and
        # Docker restarts straight back into the same failure.
        db.rollback()
        log.exception("content seed failed — the API is starting without it")
    finally:
        db.close()


def _seed_superuser() -> None:
    """Create the first admin from the environment. Never overwrites an
    existing account, so rotating ADMIN_PASSWORD in .env does not silently
    reset a password someone already changed."""
    from sqlalchemy import select

    db = SessionLocal()
    try:
        if db.scalar(select(Admin).limit(1)):
            return
        if settings.admin_password in ("", "change-me"):
            log.warning("No admin exists and ADMIN_PASSWORD is unset — skipping superuser seed")
            return
        db.add(Admin(
            email=settings.admin_email,
            name=settings.admin_username,
            password_hash=hash_password(settings.admin_password),
            is_superuser=True,
        ))
        db.commit()
        log.info("Seeded superuser %s", settings.admin_email)
    finally:
        db.close()


mount_admin(app, engine)
