from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(120))
    lede: Mapped[str] = mapped_column(Text)
    body: Mapped[str] = mapped_column(Text, default="")
    # One warning sign per line.
    signs: Mapped[str] = mapped_column(Text, default="")
    position: Mapped[int] = mapped_column(Integer, default=0)
    published: Mapped[bool] = mapped_column(Boolean, default=True)

    def __str__(self) -> str:
        return self.title


class Project(Base):
    """An installation. Framed around what was photographed while open."""

    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(160))
    location: Mapped[str] = mapped_column(String(120), default="")
    summary: Mapped[str] = mapped_column(Text, default="")
    image_open_url: Mapped[str] = mapped_column(String(500), default="")
    image_open_alt: Mapped[str] = mapped_column(String(300), default="")
    image_finished_url: Mapped[str] = mapped_column(String(500), default="")
    image_finished_alt: Mapped[str] = mapped_column(String(300), default="")
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
    # Surfaces reviews that speak to safety rather than appearance.
    mentions_safety: Mapped[bool] = mapped_column(Boolean, default=False)
    position: Mapped[int] = mapped_column(Integer, default=0)
    published: Mapped[bool] = mapped_column(Boolean, default=False)

    def __str__(self) -> str:
        return f"{self.name} — {self.quote[:40]}…"


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
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(60))
    area: Mapped[str] = mapped_column(String(120), default="")
    property: Mapped[str] = mapped_column(String(60), default="")
    message: Mapped[str] = mapped_column(Text, default="")
    handled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __str__(self) -> str:
        return f"{self.name} ({self.phone})"
