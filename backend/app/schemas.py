from datetime import datetime

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


class AdminCreate(BaseModel):
    email: EmailStr
    name: str = ""
    password: str = Field(min_length=10)
    is_superuser: bool = False


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
class LeadIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    company: str = Field(default="", max_length=160)
    email: str = Field(default="", max_length=200)
    phone: str = Field(min_length=6, max_length=60)
    area: str = Field(default="", max_length=120)
    project_type: str = Field(default="", max_length=80)
    property: str = Field(default="", max_length=60)
    message: str = Field(default="", max_length=4000)

    @field_validator("name", "company", "email", "phone", "area", "project_type", "property", "message")
    @classmethod
    def strip(cls, v: str) -> str:
        return v.strip()


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
