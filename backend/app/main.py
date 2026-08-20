import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .admin import mount_admin
from .core.security import hash_password
from .db import Base, SessionLocal, engine
from .models import (
    Admin, Banner, BlogPost, FAQ, Project, Service, SiteSetting, TeamMember, Testimonial,
)
from .routers import admin_auth, audit, leads, newsletter, settings_router, stats, upload
from .routers.crud import crud_router
from .schemas import (
    BannerIn, BannerOut, BlogPostIn, BlogPostOut, FAQIn, FAQOut,
    ProjectIn, ProjectOut, ServiceIn, ServiceOut,
    TeamMemberIn, TeamMemberOut, TestimonialIn, TestimonialOut,
)
from .settings import settings

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("premierpower")


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    _seed_settings()
    _seed_superuser()
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
app.include_router(crud_router(model=Service, schema_in=ServiceIn, schema_out=ServiceOut,
                               entity="service"), prefix="/api/services")
app.include_router(crud_router(model=Project, schema_in=ProjectIn, schema_out=ProjectOut,
                               entity="project"), prefix="/api/projects")
app.include_router(crud_router(model=Testimonial, schema_in=TestimonialIn, schema_out=TestimonialOut,
                               entity="testimonial", lookup="",
                               order_by=(Testimonial.mentions_safety.desc(),
                                         Testimonial.position, Testimonial.id)),
                   prefix="/api/testimonials")
app.include_router(crud_router(model=FAQ, schema_in=FAQIn, schema_out=FAQOut,
                               entity="faq", lookup=""), prefix="/api/faqs")
app.include_router(crud_router(model=BlogPost, schema_in=BlogPostIn, schema_out=BlogPostOut,
                               entity="post", order_by=(BlogPost.created_at.desc(),)),
                   prefix="/api/blog")
app.include_router(crud_router(model=TeamMember, schema_in=TeamMemberIn, schema_out=TeamMemberOut,
                               entity="team member", lookup=""), prefix="/api/team")
app.include_router(crud_router(model=Banner, schema_in=BannerIn, schema_out=BannerOut,
                               entity="banner", lookup=""), prefix="/api/banners")

# ── everything with its own shape ───────────────────────────────────────
app.include_router(admin_auth.router, prefix="/api/admin")
app.include_router(settings_router.router, prefix="/api/settings")
app.include_router(leads.router, prefix="/api/leads")
app.include_router(newsletter.router, prefix="/api/newsletter")
app.include_router(upload.router, prefix="/api/media")
app.include_router(audit.router, prefix="/api/audit")
app.include_router(stats.router, prefix="/api/stats")

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
        ("phone", "Phone number, as customers should dial it"),
        ("whatsapp", "WhatsApp number, digits only, including 254"),
        ("email", "Contact email address"),
        ("legal_name", "Registered business name"),
        ("street", "Street address for Google/LocalBusiness listing"),
        ("service_area", "Service radius, e.g. 'Nairobi and within 40km'"),
        ("epra_number", "EPRA licence number — LAUNCH BLOCKER"),
        ("epra_class", "EPRA licence class"),
        ("insured", "Insurer name"),
        ("warranty", "Workmanship warranty term, e.g. '2 years'"),
        ("years_licensed", "Years licensed"),
        ("installs_completed", "Installations completed"),
        ("response_time", "Typical response time, e.g. 'same day'"),
    ]
    db = SessionLocal()
    try:
        existing = set(db.scalars(select(SiteSetting.key)).all())
        for key, note in wanted:
            if key not in existing:
                db.add(SiteSetting(key=key, value="", note=note))
        db.commit()
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
