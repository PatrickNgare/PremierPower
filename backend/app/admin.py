"""Admin CMS.

Mirrors the content types so the client edits services, installations,
testimonials, and site settings without a developer or a redeploy.
"""

from sqladmin import Admin, ModelView
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
from starlette.responses import RedirectResponse

from sqlalchemy import select

from .core.security import verify_password
from .db import SessionLocal
# Aliased: sqladmin exports its own `Admin` application class.
from .models import Admin as AdminUser
from .models import (
    AuditLog, Banner, BlogPost, FAQ, Lead, MediaAsset,
    NewsletterSubscriber, Project, Service, SiteSetting, TeamMember, Testimonial,
)
from .settings import settings


class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        db = SessionLocal()
        try:
            admin = db.scalar(select(AdminUser).where(AdminUser.email == form.get("username")))
            if admin and admin.is_active and verify_password(str(form.get("password")), admin.password_hash):
                request.session.update({"authenticated": True, "email": admin.email})
                return True
            return False
        finally:
            db.close()

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request):
        if request.session.get("authenticated"):
            return True
        return RedirectResponse(request.url_for("admin:login"), status_code=302)


class ServiceAdmin(ModelView, model=Service):
    name_plural = "Services"
    icon = "fa-solid fa-list"
    column_list = [Service.position, Service.title, Service.slug, Service.published]
    column_default_sort = [(Service.position, False)]
    form_columns = [
        Service.position, Service.title, Service.slug,
        Service.lede, Service.body, Service.signs, Service.published,
    ]
    column_labels = {"signs": "Bullet points (one per line)", "lede": "Short summary"}


class ProjectAdmin(ModelView, model=Project):
    name_plural = "Projects"
    icon = "fa-solid fa-camera"
    column_list = [Project.position, Project.title, Project.location, Project.published]
    form_columns = [
        Project.position, Project.title, Project.location, Project.summary,
        Project.image_open_url, Project.image_open_alt,
        Project.image_finished_url, Project.image_finished_alt,
        Project.published,
    ]
    column_labels = {
        "image_open_url": "Primary photo (URL)",
        "image_open_alt": "Alt text for the primary photo",
        "image_finished_url": "Secondary photo (URL)",
        "image_finished_alt": "Alt text for the secondary photo",
        "location": "Location, e.g. 'Maiyan, Nanyuki, Laikipia'",
        "year": "Year, or status such as 'Ongoing'",
    }


class TestimonialAdmin(ModelView, model=Testimonial):
    name_plural = "Testimonials"
    icon = "fa-solid fa-quote-left"
    column_list = [
        Testimonial.position, Testimonial.name,
        Testimonial.mentions_safety, Testimonial.published,
    ]
    form_columns = [
        Testimonial.position, Testimonial.name, Testimonial.location,
        Testimonial.job, Testimonial.quote, Testimonial.mentions_safety,
        Testimonial.published,
    ]
    column_labels = {"mentions_safety": "Mentions delivery/reliability (shown first)"}


class SiteSettingAdmin(ModelView, model=SiteSetting):
    name_plural = "Site settings"
    icon = "fa-solid fa-sliders"
    column_list = [SiteSetting.key, SiteSetting.value, SiteSetting.note]
    form_columns = [SiteSetting.key, SiteSetting.value, SiteSetting.note]
    can_delete = False


class LeadAdmin(ModelView, model=Lead):
    name_plural = "Assessment requests"
    icon = "fa-solid fa-inbox"
    column_list = [Lead.created_at, Lead.name, Lead.phone, Lead.area, Lead.handled]
    column_default_sort = [(Lead.created_at, True)]
    form_columns = [Lead.handled]
    can_create = False


class FAQAdmin(ModelView, model=FAQ):
    name_plural = "FAQs"
    icon = "fa-solid fa-circle-question"
    column_list = [FAQ.position, FAQ.question, FAQ.category, FAQ.published]
    form_columns = [FAQ.position, FAQ.question, FAQ.answer, FAQ.category, FAQ.published]


class BlogPostAdmin(ModelView, model=BlogPost):
    name_plural = "Blog"
    icon = "fa-solid fa-newspaper"
    column_list = [BlogPost.title, BlogPost.slug, BlogPost.published, BlogPost.created_at]
    form_columns = [
        BlogPost.title, BlogPost.slug, BlogPost.excerpt, BlogPost.body,
        BlogPost.cover_url, BlogPost.cover_alt, BlogPost.author,
        BlogPost.read_minutes, BlogPost.published, BlogPost.published_at,
    ]


class TeamMemberAdmin(ModelView, model=TeamMember):
    name_plural = "Team"
    icon = "fa-solid fa-users"
    column_list = [TeamMember.position, TeamMember.name, TeamMember.role, TeamMember.published]
    form_columns = [
        TeamMember.position, TeamMember.name, TeamMember.role, TeamMember.bio,
        TeamMember.photo_url, TeamMember.licence_number, TeamMember.published,
    ]
    column_labels = {"licence_number": "Their own registration or licence number"}


class BannerAdmin(ModelView, model=Banner):
    name_plural = "Hero slides"
    icon = "fa-solid fa-image"
    column_list = [Banner.position, Banner.headline, Banner.published]
    form_columns = [
        Banner.position, Banner.eyebrow, Banner.headline, Banner.body,
        Banner.image_url, Banner.image_alt, Banner.cta_label, Banner.cta_href, Banner.published,
    ]


class MediaAdmin(ModelView, model=MediaAsset):
    name_plural = "Media library"
    icon = "fa-solid fa-photo-film"
    column_list = [MediaAsset.created_at, MediaAsset.filename, MediaAsset.storage, MediaAsset.url]
    can_create = False
    can_edit = True
    form_columns = [MediaAsset.alt]


class AdminUserAdmin(ModelView, model=AdminUser):
    name_plural = "Admin users"
    icon = "fa-solid fa-user-shield"
    column_list = [AdminUser.email, AdminUser.name, AdminUser.is_superuser, AdminUser.is_active]
    # Passwords are set through the API, never typed into a list view.
    form_columns = [AdminUser.email, AdminUser.name, AdminUser.is_superuser, AdminUser.is_active]
    can_create = False


class SubscriberAdmin(ModelView, model=NewsletterSubscriber):
    name_plural = "Subscribers"
    icon = "fa-solid fa-envelope"
    column_list = [NewsletterSubscriber.created_at, NewsletterSubscriber.email, NewsletterSubscriber.active]
    can_create = False
    form_columns = [NewsletterSubscriber.active]


class AuditAdmin(ModelView, model=AuditLog):
    name_plural = "Audit log"
    icon = "fa-solid fa-clock-rotate-left"
    column_list = [AuditLog.created_at, AuditLog.actor, AuditLog.action, AuditLog.entity, AuditLog.detail]
    column_default_sort = [(AuditLog.created_at, True)]
    can_create = False
    can_edit = False
    can_delete = False


def mount_admin(app, engine) -> None:
    admin = Admin(
        app,
        engine,
        title="PremierPower",
        authentication_backend=AdminAuth(secret_key=settings.secret_key),
    )
    for view in (
        LeadAdmin, ServiceAdmin, ProjectAdmin, TestimonialAdmin, FAQAdmin,
        BlogPostAdmin, TeamMemberAdmin, BannerAdmin, MediaAdmin,
        SiteSettingAdmin, SubscriberAdmin, AdminUserAdmin, AuditAdmin,
    ):
        admin.add_view(view)
