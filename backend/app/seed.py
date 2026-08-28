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
    Banner, FAQ, MenuItem, PageSection, Project, SectionItem, Sector, SeoMeta,
    Service,
)

log = logging.getLogger("premierpower.seed")

CONTENT = Path(__file__).resolve().parent / "seed_content.json"

# The homepage, block by block. `key` names a component the frontend knows how
# to draw — the CMS reorders, retitles, hides and shows these, but cannot
# invent a new one, because a key nobody wrote renders as nothing and the
# client has no way to tell why.
HOMEPAGE = [
    # The hero's own words, which were hard-coded in Hero.jsx. The slides are
    # separate — they live in the banners table.
    dict(key="hero", eyebrow="Premier Power Limited",
         title="Powering spaces.|Illuminating possibilities.",
         subtitle="Electrical engineering and lighting installation across Kenya — for hotels "
                  "and lodges, commercial interiors, institutions, healthcare, industrial sites "
                  "and residential developments.",
         cta_label="Explore our solutions", cta_href="/services",
         config={"secondary_label": "Talk to an expert"}),
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
    dict(key="lighting", eyebrow="Lighting design",
         title="Illuminate better.|Live brighter.",
         subtitle="Lighting is designed with the interior rather than fitted around it — "
                  "circuits planned to the room's use, sources placed so the fixture "
                  "disappears and only the light remains.",
         cta_label="See lighting projects", cta_href="/portfolio"),
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

# The repeated items inside those blocks, one row each. `icon` names an icon
# the frontend already imports; the CMS chooses from that set rather than
# typing a name nobody drew.
SECTION_ITEMS = {
    "safety": [
        ("shield", "NCA registered",
         "Electrical Engineering Service Contractor, registered with the National "
         "Construction Authority."),
        ("file", "Tested & certified",
         "Full test sequence recorded and certified before handover on every project."),
        ("search", "Private & public sector",
         "Delivered with leading contractors and architects across both."),
        ("zap", "Nationwide",
         "Projects across the country, from Nairobi to Nanyuki, Meru and the Mara."),
    ],
}

LIGHTING_TILES = [
    ("/projects/stairwell.jpg", "Feature stairwell",
     "Vertical run, warm source, no visible fixture line."),
    ("/projects/dining.jpg", "Hospitality dining",
     "Layered ambient and task light across a long room."),
    ("/projects/suite.jpg", "Guest suite",
     "Bedside, wardrobe and reading circuits switched independently."),
]

# The figures beside the home page's four stats. `value` stays blank — it is
# read from the matching company detail, so the number lives in one place.
STAT_ITEMS = [
    ("calendar", "Years trading", "years_trading", ""),
    ("building", "Projects delivered", "projects_completed", ""),
    # A literal, because it is a fact about the NCA registration rather than a
    # figure the client keeps updating.
    ("layers", "Sectors served", "", "7"),
    ("handshake", "Typical response", "response_time", ""),
]


# Every other page, in the same shape: a hero and a few headed blocks. Taken
# from what each page rendered before the CMS owned it, so seeding a fresh
# database reproduces the site exactly.
PAGES = {
    '/about': [
        dict(key='hero', eyebrow='About us', title='A leading electrical engineering company in the corporate market.', subtitle='Premier Power Limited works on electrical installation projects all over the country, and is expanding — diversifying geographical risk, with further offices planned in Kenya and across the border.', image_url='/projects/villa-modern.jpg', image_alt='Completed residential development', config={"crumb": 'About'}),
        dict(key='section1', eyebrow='Mission & vision', title='Our mission and values'),
        dict(key='section2', eyebrow='At a glance', title='The work, the registration and the reach.'),
    ],
    '/safety': [
        dict(key='hero', eyebrow='Compliance', title='Registered, tested, and documented on every project.', subtitle='Premier Power Limited is registered with the National Construction Authority as an Electrical Engineering Service Contractor. Every installation is tested and certified before handover, whatever its size.', image_url='/projects/technical.jpg', image_alt='Terminating conductors during installation', config={"crumb": 'Safety'}),
        dict(key='section1', eyebrow='Before certifying', title='What we test, every time.', subtitle='Every installation gets the full sequence, once before the plaster closes and again at handover. The recorded results go to you with the certificate.'),
    ],
    '/services': [
        dict(key='hero', eyebrow='What we do', title='Eight service lines, one registered contractor.', subtitle='Our NCA registration covers electrical installation and the specialist systems that sit alongside it — security, solar, power continuity, vertical transport, transmission and gas. One contractor, coordinated on one programme.', image_url='/projects/stairwell.jpg', image_alt='Feature lighting installation in a completed stairwell', config={"crumb": 'Services'}),
        dict(key='section1', eyebrow='How it works', title='Four stages, and you sign off before each one closes.', subtitle='Nothing gets covered until you have seen it.'),
    ],
    '/portfolio': [
        dict(key='hero', eyebrow='Our work', title='Installations, photographed at the stage that matters.', subtitle='Finished rooms prove nothing — anyone can plaster over bad work. Every job here is shown open: the board, the chase, the conductors, and only then the finished wall.', image_url='/projects/resort-dusk.jpg', image_alt='Completed resort development at dusk', config={"crumb": 'Installations'}),
    ],
    '/contact': [
        dict(key='hero', eyebrow='Project enquiries', title='Tell us about the project.', subtitle='Send drawings, a tender document or a short description and we will come back with scope and next steps. Site visits and assessments are free, with no obligation.', image_url='/projects/resort-pool.jpg', image_alt='Completed resort development', config={"crumb": 'Contact'}),
    ],
    '/faq': [
        dict(key='hero', eyebrow='Straight answers', title='The questions people actually ask.', subtitle='Mostly about licensing. Almost never about price first — which is the right instinct.', image_url='/projects/lodge-dusk.jpg', image_alt='Completed development at dusk', config={"crumb": 'FAQ'}),
    ],
    '/products': [
        dict(key='hero', eyebrow='Lighting & fittings',
             title='The fittings we supply and install.',
             subtitle='Chandeliers, pendants and linear lighting for hospitality, '
                      'commercial interiors and residential developments \u2014 specified '
                      'with the interior, then wired, hung and commissioned by the same '
                      'contractor.',
             image_url='/projects/stairwell.jpg',
             image_alt='Feature lighting installation in a completed stairwell',
             config={'crumb': 'Lighting & fittings'}),
    ],
    '/testimonials': [
        dict(key='hero', eyebrow='Social proof', title='What customers say.', subtitle='Weighted toward the reviews that mention safety and reliability, because that is what you are actually buying.', image_url='/projects/dining.jpg', image_alt='Completed hospitality interior', config={"crumb": 'Reviews'}),
    ],
}

HEADER_MENU = [
    ("Home", "/"), ("Services", "/services"), ("Lighting & fittings", "/products"),
    ("Installations", "/portfolio"), ("Safety", "/safety"), ("About", "/about"),
    ("Reviews", "/testimonials"), ("FAQ", "/faq"), ("Contact", "/contact"),
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
    ("/products", "Lighting & fittings — Premier Power Limited",
     "Chandeliers, pendants and linear lighting supplied and installed across Kenya for "
     "hospitality, commercial interiors and residential developments."),
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

    # Per page, not per table: a database that already holds the home page's
    # sections would otherwise never receive the other pages'. Each page is
    # still only ever seeded into emptiness, so nothing a client wrote is
    # touched.
    for path, blocks in (("/", HOMEPAGE), *PAGES.items()):
        already = db.scalar(
            select(func.count()).select_from(PageSection).where(PageSection.page == path)
        ) or 0
        if already:
            continue
        db.add_all(
            PageSection(page=path, position=i, enabled=True, **{"config": {}, **row})
            for i, row in enumerate(blocks)
        )
        log.info("seeded %d sections for %s", len(blocks), path)

    # Per link, not per table. A table-level check means a database that
    # already has navigation never receives a link added later — which is
    # exactly what happened when the fittings page was added. Existing links
    # are left alone, including their order and their labels; a new one is
    # appended to the end of its menu for the client to drag into place.
    for menu, items in (("header", HEADER_MENU), ("footer", FOOTER_MENU)):
        present = {
            m.href for m in db.scalars(
                select(MenuItem).where(MenuItem.menu == menu)
            ).all()
        }
        nxt = db.scalar(
            select(func.coalesce(func.max(MenuItem.position), -1) + 1)
            .where(MenuItem.menu == menu)
        ) or 0
        for label, href in items:
            if href in present:
                continue
            db.add(MenuItem(menu=menu, label=label, href=href, position=nxt, published=True))
            log.info("added %s link: %s", menu, label)
            nxt += 1

    if _empty(db, SectionItem):
        rows = []
        for section, items in SECTION_ITEMS.items():
            rows += [SectionItem(section=section, icon=icon, title=title, body=body,
                                 position=i, published=True)
                     for i, (icon, title, body) in enumerate(items)]
        rows += [SectionItem(section="lighting", image_url=src, title=title, body=body,
                             image_alt=title, position=i, published=True)
                 for i, (src, title, body) in enumerate(LIGHTING_TILES)]
        # `href` carries the company-detail key the figure comes from, so the
        # number is edited once under Company details, not twice.
        rows += [SectionItem(section="stats", icon=icon, title=title, href=key,
                             value=literal, position=i, published=True)
                 for i, (icon, title, key, literal) in enumerate(STAT_ITEMS)]
        db.add_all(rows)
        log.info("seeded %d section items", len(rows))

    # Per path, for the same reason: a page added later needs its row, and the
    # client's edits to existing rows must survive.
    present = {r.path for r in db.scalars(select(SeoMeta)).all()}
    for path, title, description in SEO:
        if path in present:
            continue
        db.add(SeoMeta(path=path, title=title, description=description,
                       canonical=f"https://premierpower.co.ke{path}"))
        log.info("added SEO record for %s", path)

    db.commit()
