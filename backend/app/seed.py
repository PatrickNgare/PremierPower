"""First-run content.

Everything here is written once, into an empty table, and never again. A table
with even one row in it is the client's — re-seeding would quietly overwrite
whatever they had typed, which is the single worst thing a CMS can do.

The content itself comes from `seed_content.json`, exported from the frontend's
bundled data by `frontend/scripts/export-seed.mjs`. That data is the client's
own — their projects, their NCA service lines — and is also the fallback the
site renders when the API is unreachable, so the two stay in step.
"""

import json
import logging
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import (
    Banner, FAQ, HomepageSection, MenuItem, Project, Sector, SeoMeta, Service,
)

log = logging.getLogger("premierpower.seed")

CONTENT = Path(__file__).resolve().parent / "seed_content.json"

# The homepage, block by block. `key` names a component the frontend knows how
# to draw — the CMS reorders, retitles, hides and shows these, but cannot
# invent a new one, because a key nobody wrote renders as nothing and the
# client has no way to tell why.
HOMEPAGE = [
    dict(key="hero", eyebrow="", title="", subtitle=""),
    dict(key="stats", eyebrow="", title="", subtitle=""),
    dict(key="about", eyebrow="Who we are",
         title="A leading electrical engineering company in the corporate market.",
         subtitle="Premier Power Limited works on installation projects all over the country, "
                  "expanding across Kenya and beyond the border."),
    dict(key="projects", eyebrow="Selected projects",
         title="Delivered with the contractors and architects who designed them.",
         subtitle="Hospitality developments, commercial interiors and residential clusters "
                  "across Kenya — from Nashulai Mara Safari Lodge and Hotel Meru to the "
                  "Maiyan villas at Nanyuki and town houses in Lavington.",
         cta_label="View all installations", cta_href="/portfolio",
         config={"limit": 5}),
    dict(key="solutions", eyebrow="Solutions",
         title="Lighting and electrical solutions designed around you.",
         subtitle="Works undertaken by Premier Power span the corporate, commercial and "
                  "residential markets — delivered with leading contractors in both the "
                  "private and public sectors.",
         config={"align": "center"}),
    dict(key="lighting", eyebrow="", title="", subtitle=""),
    dict(key="safety", eyebrow="", title="", subtitle=""),
    dict(key="services", eyebrow="What we do",
         title="Electrical installation, and the systems that run alongside it.",
         subtitle="Our NCA registration covers eight service lines — installation, security "
                  "and access control, solar photovoltaics, power continuity, vertical "
                  "transport, transmission and distribution, energy retrofitting and gas.",
         cta_label="All services", cta_href="/services"),
    dict(key="why", eyebrow="Why contractors work with us",
         title="One registered contractor, coordinated on one programme.",
         subtitle="Electrical, security, solar, power continuity and vertical transport "
                  "usually arrive as four or five separate subcontractors, each coordinating "
                  "with the others through the main contractor. Our NCA registration covers "
                  "all of them."),
    dict(key="process", eyebrow="How it works",
         title="Four stages, documented at each gate.",
         subtitle="From drawings to commissioning, each stage is signed off before the next "
                  "begins — and the test results and certification come with the handover.",
         config={"align": "center"}),
    dict(key="testimonials", eyebrow="References", title="What clients say",
         subtitle="Weighted toward the ones that speak to delivery and reliability on "
                  "programme.",
         config={"align": "center"}),
    dict(key="cta", eyebrow="", title="", subtitle=""),
]

HEADER_MENU = [
    ("Home", "/"), ("Services", "/services"), ("Installations", "/portfolio"),
    ("Safety", "/safety"), ("About", "/about"), ("Reviews", "/testimonials"),
    ("FAQ", "/faq"), ("Contact", "/contact"),
]

FOOTER_MENU = [
    ("Services", "/services"), ("Installations", "/portfolio"),
    ("Safety & certification", "/safety"), ("About", "/about"),
    ("Reviews", "/testimonials"), ("FAQ", "/faq"), ("Contact", "/contact"),
]

# Titles and descriptions currently hard-coded into each page's <Helmet>.
SEO = [
    ("/", "Premier Power Limited — Electrical engineering & installation contractor, Kenya",
     "Premier Power Limited is an NCA-registered electrical engineering contractor working "
     "across Kenya — banks and commercial interiors, offices, hotels and lodges, institutions, "
     "healthcare, industrial and residential developments."),
    ("/services", "Services — Premier Power Limited",
     "Electrical installation, electronic security, solar photovoltaics, power continuity, "
     "vertical transport, transmission and distribution, energy retrofitting and gas."),
    ("/portfolio", "Installations — Premier Power Limited",
     "Hospitality developments, commercial interiors and residential clusters across Kenya."),
    ("/safety", "Safety & certification — Premier Power Limited",
     "Every installation tested and certified before handover, whatever its size."),
    ("/about", "About — Premier Power Limited",
     "An NCA-registered electrical engineering contractor working in the corporate market "
     "across Kenya."),
    ("/testimonials", "Reviews — Premier Power Limited",
     "What clients say about delivery and reliability on programme."),
    ("/faq", "Frequently asked questions — Premier Power Limited",
     "Registration, coverage, working with main contractors and architects, and what a site "
     "assessment involves."),
    ("/contact", "Contact — Premier Power Limited",
     "Talk to an electrical engineering contractor about your project."),
]


def _empty(db: Session, model) -> bool:
    return (db.scalar(select(func.count()).select_from(model)) or 0) == 0


def seed_content(db: Session) -> None:
    """Populate empty content tables. Safe to call on every boot."""
    if not CONTENT.exists():
        log.warning("no seed_content.json — skipping content seed")
        return
    payload = json.loads(CONTENT.read_text())

    for key, model in (
        ("banners", Banner), ("services", Service), ("projects", Project),
        ("faqs", FAQ), ("sectors", Sector),
    ):
        rows = payload.get(key, [])
        if not rows or not _empty(db, model):
            continue
        db.add_all(model(**row) for row in rows)
        log.info("seeded %d %s", len(rows), key)

    if _empty(db, HomepageSection):
        db.add_all(
            HomepageSection(position=i, enabled=True, **{"config": {}, **row})
            for i, row in enumerate(HOMEPAGE)
        )
        log.info("seeded %d homepage sections", len(HOMEPAGE))

    if _empty(db, MenuItem):
        db.add_all(
            MenuItem(menu=menu, label=label, href=href, position=i, published=True)
            for menu, items in (("header", HEADER_MENU), ("footer", FOOTER_MENU))
            for i, (label, href) in enumerate(items)
        )
        log.info("seeded navigation")

    if _empty(db, SeoMeta):
        db.add_all(
            SeoMeta(path=path, title=title, description=description,
                    canonical=f"https://premierpower.co.ke{path}")
            for path, title, description in SEO
        )
        log.info("seeded %d SEO records", len(SEO))

    db.commit()
