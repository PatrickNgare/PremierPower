import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

ORM = ConfigDict(from_attributes=True)


# ── auth ────────────────────────────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminOut(BaseModel):
    model_config = ORM
    id: int
    email: str
    name: str
    is_active: bool
    is_superuser: bool
    role: str = "editor"


class AdminUpdate(BaseModel):
    name: str = Field(default="", max_length=120)
    role: str = "editor"
    is_active: bool = True

    @field_validator("role")
    @classmethod
    def known_role(cls, v: str) -> str:
        if v not in ("owner", "editor", "viewer"):
            raise ValueError("role must be owner, editor or viewer")
        return v


class AdminCreate(BaseModel):
    email: EmailStr
    name: str = ""
    password: str = Field(min_length=10)
    is_superuser: bool = False
    role: str = "editor"


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=10)


# ── content ─────────────────────────────────────────────────────────────
class ServiceIn(BaseModel):
    slug: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=120)
    lede: str = ""
    body: str = ""
    signs: str = ""
    image_url: str = ""
    position: int = 0
    published: bool = True


class ServiceOut(BaseModel):
    model_config = ORM
    id: int
    slug: str
    title: str
    lede: str
    body: str
    signs: list[str]
    image_url: str
    position: int
    published: bool

    @field_validator("signs", mode="before")
    @classmethod
    def split_signs(cls, v):
        if isinstance(v, str):
            return [line.strip() for line in v.splitlines() if line.strip()]
        return v


class GalleryImage(BaseModel):
    url: str = Field(min_length=1, max_length=500)
    alt: str = Field(default="", max_length=300)


class ProjectIn(BaseModel):
    slug: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=160)
    location: str = ""
    year: str = ""
    summary: str = ""
    body: str = ""
    image_open_url: str = ""
    image_open_alt: str = ""
    image_finished_url: str = ""
    image_finished_alt: str = ""
    featured: bool = False
    gallery: list[GalleryImage] = Field(default_factory=list, max_length=30)
    position: int = 0
    published: bool = False


class ProjectOut(ProjectIn):
    model_config = ORM
    id: int


class TestimonialIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    location: str = ""
    job: str = ""
    quote: str = Field(min_length=1)
    rating: int = Field(default=5, ge=1, le=5)
    mentions_safety: bool = False
    position: int = 0
    published: bool = False


class TestimonialOut(TestimonialIn):
    model_config = ORM
    id: int


class FAQIn(BaseModel):
    question: str = Field(min_length=1, max_length=300)
    answer: str = Field(min_length=1)
    category: str = "general"
    position: int = 0
    published: bool = True


class FAQOut(FAQIn):
    model_config = ORM
    id: int


class BlogPostIn(BaseModel):
    slug: str = Field(min_length=1, max_length=160)
    title: str = Field(min_length=1, max_length=200)
    excerpt: str = ""
    body: str = ""
    cover_url: str = ""
    cover_alt: str = ""
    author: str = ""
    read_minutes: int = 4
    published: bool = False


class BlogPostOut(BlogPostIn):
    model_config = ORM
    id: int
    published_at: datetime | None = None
    created_at: datetime | None = None


class TeamMemberIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    role: str = ""
    bio: str = ""
    photo_url: str = ""
    licence_number: str = ""
    position: int = 0
    published: bool = False


class TeamMemberOut(TeamMemberIn):
    model_config = ORM
    id: int


class BannerIn(BaseModel):
    eyebrow: str = ""
    headline: str = Field(min_length=1, max_length=200)
    body: str = ""
    image_url: str = ""
    image_alt: str = ""
    cta_label: str = ""
    cta_href: str = ""
    card_label: str = ""
    card_title: str = ""
    card_line: str = ""
    position: int = 0
    published: bool = True


class BannerOut(BannerIn):
    model_config = ORM
    id: int


class SettingIn(BaseModel):
    key: str = Field(min_length=1, max_length=80)
    value: str = ""
    note: str = ""


class SettingOut(SettingIn):
    model_config = ORM
    id: int


# ── leads & newsletter ──────────────────────────────────────────────────
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class LeadIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    company: str = Field(default="", max_length=160)
    email: str = Field(default="", max_length=200)
    phone: str = Field(min_length=6, max_length=60)
    area: str = Field(default="", max_length=120)
    project_type: str = Field(default="", max_length=80)
    property: str = Field(default="", max_length=60)
    message: str = Field(default="", max_length=4000)
    kind: Literal["enquiry", "quote", "callback"] = "enquiry"
    # Honeypot: a field hidden from people, so only a bot fills it in. The
    # router drops such a submission while still answering 201.
    website: str = Field(default="", max_length=200, exclude=True)

    # Before the length checks, not after: stripping afterwards let a name of
    # three spaces pass min_length and then be saved as "".
    @field_validator("name", "company", "email", "phone", "area", "project_type", "property", "message", mode="before")
    @classmethod
    def strip(cls, v):
        return v.strip() if isinstance(v, str) else v

    @field_validator("email")
    @classmethod
    def email_shape(cls, v: str) -> str:
        if v and not EMAIL_RE.match(v):
            raise ValueError("Enter a full email address, like name@company.co.ke")
        return v

    @field_validator("phone")
    @classmethod
    def phone_digits(cls, v: str) -> str:
        if sum(c.isdigit() for c in v) < 7:
            raise ValueError("Enter a phone number we can call, with at least 7 digits")
        return v


class LeadAttachmentOut(BaseModel):
    """What the CMS sees of an attachment: never where it is stored."""
    name: str
    bytes: int = 0
    type: str = ""


class LeadOut(BaseModel):
    model_config = ORM
    id: int
    name: str
    company: str
    email: str
    phone: str
    area: str
    project_type: str
    property: str
    message: str
    kind: str = "enquiry"
    status: str = "new"
    notes: str = ""
    attachments: list[LeadAttachmentOut] = []
    handled: bool
    created_at: datetime | None = None


class SubscriberIn(BaseModel):
    email: EmailStr


class SubscriberOut(BaseModel):
    model_config = ORM
    id: int
    email: str
    active: bool
    created_at: datetime | None = None


# ── media & audit ───────────────────────────────────────────────────────
class MediaOut(BaseModel):
    model_config = ORM
    id: int
    url: str
    public_id: str
    filename: str
    alt: str
    width: int
    height: int
    bytes: int
    storage: str
    folder: str = ""
    tags: str = ""
    created_at: datetime | None = None


class AuditLogOut(BaseModel):
    model_config = ORM
    id: int
    actor: str
    action: str
    entity: str
    entity_id: int | None
    detail: str
    ip: str
    created_at: datetime | None = None


# ── catalogue ───────────────────────────────────────────────────────────
class ProductCategoryIn(BaseModel):
    slug: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=120)
    description: str = ""
    image_url: str = ""
    position: int = 0
    published: bool = True


class ProductCategoryOut(ProductCategoryIn):
    model_config = ORM
    id: int


class ProductIn(BaseModel):
    slug: str = Field(min_length=1, max_length=120)
    name: str = Field(min_length=1, max_length=160)
    category_id: int | None = None
    summary: str = ""
    body: str = ""
    specs: str = ""
    brand: str = Field(default="", max_length=120)
    price_note: str = Field(default="", max_length=120)
    image_url: str = ""
    image_alt: str = ""
    featured: bool = False
    position: int = 0
    published: bool = False


class ProductOut(BaseModel):
    model_config = ORM
    id: int
    slug: str
    name: str
    category_id: int | None
    summary: str
    body: str
    specs: list[str]
    brand: str
    price_note: str
    image_url: str
    image_alt: str
    featured: bool
    position: int
    published: bool

    @field_validator("specs", mode="before")
    @classmethod
    def split_lines(cls, v):
        # Stored as text so the CMS field is a plain textarea, not a repeater
        # widget the client has to learn. One spec per line.
        if isinstance(v, str):
            return [line.strip() for line in v.splitlines() if line.strip()]
        return v


# ── site structure ──────────────────────────────────────────────────────
class PageSectionIn(BaseModel):
    page: str = "/"
    key: str = Field(min_length=1, max_length=60)
    eyebrow: str = ""
    title: str = ""
    subtitle: str = ""
    cta_label: str = ""
    cta_href: str = ""
    image_url: str = ""
    image_alt: str = ""
    position: int = 0
    enabled: bool = True
    config: dict = Field(default_factory=dict)


class PageSectionOut(PageSectionIn):
    model_config = ORM
    id: int


class MenuItemIn(BaseModel):
    menu: str = "header"
    label: str = Field(min_length=1, max_length=80)
    href: str = Field(default="/", max_length=300)
    parent_id: int | None = None
    new_tab: bool = False
    position: int = 0
    published: bool = True


class MenuItemOut(MenuItemIn):
    model_config = ORM
    id: int


class SocialLinkIn(BaseModel):
    platform: str = Field(min_length=1, max_length=40)
    url: str = Field(min_length=1, max_length=400)
    position: int = 0
    published: bool = True


class SocialLinkOut(SocialLinkIn):
    model_config = ORM
    id: int


class SeoMetaIn(BaseModel):
    path: str = Field(min_length=1, max_length=200)
    title: str = Field(default="", max_length=200)
    description: str = ""
    og_image_url: str = ""
    canonical: str = ""
    noindex: bool = False

    @field_validator("path")
    @classmethod
    def leading_slash(cls, v: str) -> str:
        v = v.strip()
        return v if v.startswith("/") else f"/{v}"


class SeoMetaOut(SeoMetaIn):
    model_config = ORM
    id: int


class DocumentIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    file_url: str = ""
    filename: str = ""
    category: str = Field(default="general", max_length=60)
    bytes: int = 0
    position: int = 0
    published: bool = False


class DocumentOut(DocumentIn):
    model_config = ORM
    id: int
    created_at: datetime | None = None


class NotificationOut(BaseModel):
    model_config = ORM
    id: int
    kind: str
    title: str
    body: str
    link: str
    read: bool
    created_at: datetime | None = None


class LeadUpdate(BaseModel):
    """The staff-owned half of a request. The enquirer's own fields are not
    editable — a record of what someone actually asked for is worth more than
    a tidy one."""

    status: str = "new"
    notes: str = Field(default="", max_length=4000)

    @field_validator("status")
    @classmethod
    def known_status(cls, v: str) -> str:
        allowed = ("new", "in_progress", "quoted", "won", "lost")
        if v not in allowed:
            raise ValueError(f"status must be one of {', '.join(allowed)}")
        return v


class SectorIn(BaseModel):
    slug: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=160)
    line: str = ""
    body: str = ""
    image_url: str = ""
    image_alt: str = ""
    position: int = 0
    published: bool = True


class SectorOut(SectorIn):
    model_config = ORM
    id: int


class SectionItemIn(BaseModel):
    section: str = Field(min_length=1, max_length=60)
    title: str = ""
    body: str = ""
    icon: str = ""
    image_url: str = ""
    image_alt: str = ""
    video_url: str = ""
    href: str = ""
    value: str = ""
    position: int = 0
    published: bool = True


class SectionItemOut(SectionItemIn):
    model_config = ORM
    id: int
