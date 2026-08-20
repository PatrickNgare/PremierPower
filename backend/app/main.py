import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .admin import mount_admin
from .db import Base, engine
from .routers import content, leads
from .settings import settings

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="PremierPower API", version="1.0.0", docs_url="/api/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(content.router, prefix="/api")
app.include_router(leads.router, prefix="/api")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(engine)
    _seed_settings()


def _seed_settings() -> None:
    """Create the setting rows the client needs to fill in, each with a note
    saying what it is. Values stay empty until they supply them."""
    from sqlalchemy import select

    from .db import SessionLocal
    from .models import SiteSetting

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


mount_admin(app, engine)
