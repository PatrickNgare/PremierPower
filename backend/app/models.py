from datetime import datetime

from sqlalchemy import (
    JSON, Boolean, DateTime, ForeignKey, Integer, String, Text, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base

# Roles, coarsest first. A role grants everything the roles below it grant.
ROLE_OWNER = "owner"
ROLE_EDITOR = "editor"
ROLE_VIEWER = "viewer"
ROLES = (ROLE_OWNER, ROLE_EDITOR, ROLE_VIEWER)
ROLE_RANK = {ROLE_VIEWER: 0, ROLE_EDITOR: 1, ROLE_OWNER: 2}


class Admin(Base):
    __tablename__ = "admins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120), default="")
    password_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    # owner | editor | viewer. is_superuser stays the hard override so an
    # existing superuser cannot be locked out by a role edit.
    role: Mapped[str] = mapped_column(String(20), default=ROLE_EDITOR, server_default=ROLE_EDITOR)
    # Incrementing this invalidates every token already issued to this admin.
    token_version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __str__(self) -> str:
        return self.email


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    actor: Mapped[str] = mapped_column(String(160))
    action: Mapped[str] = mapped_column(String(40))
    entity: Mapped[str] = mapped_column(String(60))
    entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    detail: Mapped[str] = mapped_column(String(500), default="")
    ip: Mapped[str] = mapped_column(String(60), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __str__(self) -> str:
        return f"{self.actor} {self.action} {self.entity}#{self.entity_id}"


class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(120))
    lede: Mapped[str] = mapped_column(Text)
    body: Mapped[str] = mapped_column(Text, default="")
    signs: Mapped[str] = mapped_column(Text, default="")   # one warning sign per line
    image_url: Mapped[str] = mapped_column(String(500), default="")
    position: Mapped[int] = mapped_column(Integer, default=0)
    published: Mapped[bool] = mapped_column(Boolean, default=True)

    def __str__(self) -> str:
        return self.title


class Project(Base):
    """An installation, framed around what was photographed while open."""

    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(160))
    location: Mapped[str] = mapped_column(String(120), default="")
    # Named "year" but it carries status as often as a date — the company
    # profile lists things like "Ongoing — 85%", which is 13 characters and
    # overflowed the original String(12).
    year: Mapped[str] = mapped_column(String(40), default="")
    summary: Mapped[str] = mapped_column(Text, default="")
    body: Mapped[str] = mapped_column(Text, default="")
    image_open_url: Mapped[str] = mapped_column(String(500), default="")
    image_open_alt: Mapped[str] = mapped_column(String(300), default="")
    image_finished_url: Mapped[str] = mapped_column(String(500), default="")
    image_finished_alt: Mapped[str] = mapped_column(String(300), default="")
    featured: Mapped[bool] = mapped_column(Boolean, default=False)
    position: Mapped[int] = mapped_column(Integer, default=0)
    published: Mapped[bool] = mapped_column(Boolean, default=False)

    def __str__(self) -> str:
        return self.title


class Testimonial(Base):
    __tablename__ = "testimonials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    location: Mapped[str] = mapped_column(String(120), default="")
    job: Mapped[str] = mapped_column(String(160), default="")
    quote: Mapped[str] = mapped_column(Text)
    rating: Mapped[int] = mapped_column(Integer, default=5)
    mentions_safety: Mapped[bool] = mapped_column(Boolean, default=False)
    position: Mapped[int] = mapped_column(Integer, default=0)
    published: Mapped[bool] = mapped_column(Boolean, default=False)

    def __str__(self) -> str:
        return f"{self.name} — {self.quote[:40]}…"


class FAQ(Base):
    __tablename__ = "faqs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    question: Mapped[str] = mapped_column(String(300))
    answer: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(60), default="general")
    position: Mapped[int] = mapped_column(Integer, default=0)
    published: Mapped[bool] = mapped_column(Boolean, default=True)

    def __str__(self) -> str:
        return self.question


class BlogPost(Base):
    """Local-intent SEO content: rewiring costs, signs of outdated wiring."""

    __tablename__ = "blog_posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    excerpt: Mapped[str] = mapped_column(Text, default="")
    body: Mapped[str] = mapped_column(Text, default="")
    cover_url: Mapped[str] = mapped_column(String(500), default="")
    cover_alt: Mapped[str] = mapped_column(String(300), default="")
    author: Mapped[str] = mapped_column(String(120), default="")
    read_minutes: Mapped[int] = mapped_column(Integer, default=4)
    published: Mapped[bool] = mapped_column(Boolean, default=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __str__(self) -> str:
        return self.title


class TeamMember(Base):
    __tablename__ = "team_members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    role: Mapped[str] = mapped_column(String(120), default="")
    bio: Mapped[str] = mapped_column(Text, default="")
    photo_url: Mapped[str] = mapped_column(String(500), default="")
    # An electrician's own licence, shown beside their name.
    licence_number: Mapped[str] = mapped_column(String(80), default="")
    position: Mapped[int] = mapped_column(Integer, default=0)
    published: Mapped[bool] = mapped_column(Boolean, default=False)

    def __str__(self) -> str:
        return self.name


class Banner(Base):
    """Hero slides, editable without a redeploy."""

    __tablename__ = "banners"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    eyebrow: Mapped[str] = mapped_column(String(120), default="")
    headline: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text, default="")
    image_url: Mapped[str] = mapped_column(String(500), default="")
    image_alt: Mapped[str] = mapped_column(String(300), default="")
    cta_label: Mapped[str] = mapped_column(String(80), default="")
    cta_href: Mapped[str] = mapped_column(String(200), default="")
    # The glass card beside the headline. Part of the slide, not a second
    # entity: it changes with the slide and is meaningless without it.
    card_label: Mapped[str] = mapped_column(String(80), default="", server_default="")
    card_title: Mapped[str] = mapped_column(String(120), default="", server_default="")
    card_line: Mapped[str] = mapped_column(Text, default="", server_default="")
    position: Mapped[int] = mapped_column(Integer, default=0)
    published: Mapped[bool] = mapped_column(Boolean, default=True)

    def __str__(self) -> str:
        return self.headline


class SiteSetting(Base):
    """Phone, WhatsApp, licence details, stat figures — editable without a deploy."""

    __tablename__ = "site_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    key: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    value: Mapped[str] = mapped_column(Text, default="")
    note: Mapped[str] = mapped_column(String(300), default="")

    def __str__(self) -> str:
        return self.key


class Lead(Base):
    """A project enquiry. Company and project type matter here because the
    work is mostly won through contractors and architects, not homeowners."""

    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    company: Mapped[str] = mapped_column(String(160), default="")
    email: Mapped[str] = mapped_column(String(200), default="")
    phone: Mapped[str] = mapped_column(String(60))
    area: Mapped[str] = mapped_column(String(120), default="")
    project_type: Mapped[str] = mapped_column(String(80), default="")
    property: Mapped[str] = mapped_column(String(60), default="")
    message: Mapped[str] = mapped_column(Text, default="")
    # enquiry | quote. One inbox, filtered — see QuoteRequest note in the API.
    kind: Mapped[str] = mapped_column(String(20), default="enquiry", server_default="enquiry")
    # new | in_progress | quoted | won | lost
    status: Mapped[str] = mapped_column(String(20), default="new", server_default="new")
    notes: Mapped[str] = mapped_column(Text, default="", server_default="")
    handled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __str__(self) -> str:
        return f"{self.name} ({self.phone})"


class NewsletterSubscriber(Base):
    __tablename__ = "newsletter_subscribers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __str__(self) -> str:
        return self.email


class MediaAsset(Base):
    """Uploaded photographs. The client's own work, never stock."""

    __tablename__ = "media_assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    url: Mapped[str] = mapped_column(String(500))
    public_id: Mapped[str] = mapped_column(String(300), default="")
    filename: Mapped[str] = mapped_column(String(255), default="")
    alt: Mapped[str] = mapped_column(String(300), default="")
    width: Mapped[int] = mapped_column(Integer, default=0)
    height: Mapped[int] = mapped_column(Integer, default=0)
    bytes: Mapped[int] = mapped_column(Integer, default=0)
    storage: Mapped[str] = mapped_column(String(20), default="local")
    folder: Mapped[str] = mapped_column(String(120), default="", server_default="")
    tags: Mapped[str] = mapped_column(String(300), default="", server_default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __str__(self) -> str:
        return self.filename or self.url


# ── Catalogue ───────────────────────────────────────────────────────────

class ProductCategory(Base):
    """A grouping for the catalogue — 'Lighting', 'Switchgear', 'Solar'."""

    __tablename__ = "product_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text, default="")
    image_url: Mapped[str] = mapped_column(String(500), default="")
    position: Mapped[int] = mapped_column(Integer, default=0)
    published: Mapped[bool] = mapped_column(Boolean, default=True)

    products: Mapped[list["Product"]] = relationship(back_populates="category")

    def __str__(self) -> str:
        return self.name


class Product(Base):
    """Something the client supplies or installs. Prices are deliberately a
    free-text note, not a number: this trade quotes per project, and a figure
    on a page invites an argument about a figure nobody agreed to."""

    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("product_categories.id", ondelete="SET NULL"), nullable=True, index=True,
    )
    summary: Mapped[str] = mapped_column(Text, default="")
    body: Mapped[str] = mapped_column(Text, default="")
    specs: Mapped[str] = mapped_column(Text, default="")       # one "Label: value" per line
    brand: Mapped[str] = mapped_column(String(120), default="")
    price_note: Mapped[str] = mapped_column(String(120), default="")
    image_url: Mapped[str] = mapped_column(String(500), default="")
    image_alt: Mapped[str] = mapped_column(String(300), default="")
    featured: Mapped[bool] = mapped_column(Boolean, default=False)
    position: Mapped[int] = mapped_column(Integer, default=0)
    published: Mapped[bool] = mapped_column(Boolean, default=False)

    category: Mapped["ProductCategory | None"] = relationship(back_populates="products")

    def __str__(self) -> str:
        return self.name


# ── Site structure ──────────────────────────────────────────────────────

class HomepageSection(Base):
    """Which blocks the homepage renders, in what order.

    `key` names a component the frontend knows how to draw; the CMS cannot
    invent a new one, only reorder, retitle, hide or show what exists. That
    boundary is deliberate — a section list that can name a component nobody
    wrote renders a blank page and the client cannot tell why.
    """

    __tablename__ = "homepage_sections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    key: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    # The three lines every section header on the site is made of. Columns
    # rather than keys inside `config`, because these are the fields the client
    # actually edits and nobody should have to type JSON to reword a heading.
    eyebrow: Mapped[str] = mapped_column(String(120), default="", server_default="")
    title: Mapped[str] = mapped_column(String(200), default="")
    subtitle: Mapped[str] = mapped_column(Text, default="")
    cta_label: Mapped[str] = mapped_column(String(80), default="", server_default="")
    cta_href: Mapped[str] = mapped_column(String(300), default="", server_default="")
    position: Mapped[int] = mapped_column(Integer, default=0)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    # Anything genuinely section-specific — a tile limit, an alignment. Rare
    # by design; a section needing much here wants its own columns.
    config: Mapped[dict] = mapped_column(JSON, default=dict)

    def __str__(self) -> str:
        return self.title or self.key


class MenuItem(Base):
    """Navigation, per menu. Two levels: a top-level item, or a child of one."""

    __tablename__ = "menu_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    menu: Mapped[str] = mapped_column(String(30), default="header", index=True)
    label: Mapped[str] = mapped_column(String(80))
    href: Mapped[str] = mapped_column(String(300), default="/")
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=True, index=True,
    )
    new_tab: Mapped[bool] = mapped_column(Boolean, default=False)
    position: Mapped[int] = mapped_column(Integer, default=0)
    published: Mapped[bool] = mapped_column(Boolean, default=True)

    def __str__(self) -> str:
        return f"{self.menu}: {self.label}"


class SocialLink(Base):
    __tablename__ = "social_links"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    platform: Mapped[str] = mapped_column(String(40))   # facebook, instagram, linkedin, x, youtube, tiktok
    url: Mapped[str] = mapped_column(String(400))
    position: Mapped[int] = mapped_column(Integer, default=0)
    published: Mapped[bool] = mapped_column(Boolean, default=True)

    def __str__(self) -> str:
        return self.platform


class SeoMeta(Base):
    """Per-route title, description and share image."""

    __tablename__ = "seo_meta"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    path: Mapped[str] = mapped_column(String(200), unique=True, index=True)   # "/", "/services"
    title: Mapped[str] = mapped_column(String(200), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    og_image_url: Mapped[str] = mapped_column(String(500), default="")
    canonical: Mapped[str] = mapped_column(String(400), default="")
    noindex: Mapped[bool] = mapped_column(Boolean, default=False)

    def __str__(self) -> str:
        return self.path


class Document(Base):
    """Downloadables — the company profile, certificates, spec sheets."""

    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    file_url: Mapped[str] = mapped_column(String(500), default="")
    filename: Mapped[str] = mapped_column(String(255), default="")
    category: Mapped[str] = mapped_column(String(60), default="general")
    bytes: Mapped[int] = mapped_column(Integer, default=0)
    position: Mapped[int] = mapped_column(Integer, default=0)
    published: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __str__(self) -> str:
        return self.title


class Notification(Base):
    """What the admin bell shows. Written by the app, read by a person."""

    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    kind: Mapped[str] = mapped_column(String(40), default="info")   # lead, subscriber, system
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text, default="")
    link: Mapped[str] = mapped_column(String(300), default="")
    read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __str__(self) -> str:
        return self.title


class Sector(Base):
    """A market the client works in.

    The site renders these twice — as the "solutions" strip and as the sectors
    grid — from one row each. They were two hard-coded lists saying the same
    thing in different words, which is how the two drifted apart.
    """

    __tablename__ = "sectors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(160))
    line: Mapped[str] = mapped_column(Text, default="")      # the solutions strip
    body: Mapped[str] = mapped_column(Text, default="")      # the sectors grid
    image_url: Mapped[str] = mapped_column(String(500), default="")
    image_alt: Mapped[str] = mapped_column(String(300), default="")
    position: Mapped[int] = mapped_column(Integer, default=0)
    published: Mapped[bool] = mapped_column(Boolean, default=True)

    def __str__(self) -> str:
        return self.title


class SectionItem(Base):
    """A repeated item inside a homepage block.

    The safety marks, the lighting tiles, the stat figures: three sections that
    are each a heading plus a short list. One table serves all of them, keyed
    by the section it belongs to, rather than three near-identical tables and
    three near-identical admin screens.

    `icon` names an icon the frontend already imports. Like a section `key`, it
    is a choice from a fixed set rather than free text — a name nobody drew
    renders as a hole.
    """

    __tablename__ = "section_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # Matches HomepageSection.key. A plain column rather than a foreign key:
    # items belong to the block the code draws, and must survive a section row
    # being deleted and reseeded.
    section: Mapped[str] = mapped_column(String(60), index=True)
    title: Mapped[str] = mapped_column(String(160), default="")
    body: Mapped[str] = mapped_column(Text, default="")
    icon: Mapped[str] = mapped_column(String(40), default="")
    image_url: Mapped[str] = mapped_column(String(500), default="")
    image_alt: Mapped[str] = mapped_column(String(300), default="")
    href: Mapped[str] = mapped_column(String(300), default="")
    # Free text, so "same day" and "12" are equally valid for a stat.
    value: Mapped[str] = mapped_column(String(120), default="")
    position: Mapped[int] = mapped_column(Integer, default=0)
    published: Mapped[bool] = mapped_column(Boolean, default=True)

    def __str__(self) -> str:
        return f"{self.section}: {self.title or self.value}"
