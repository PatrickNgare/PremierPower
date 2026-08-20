"""Admin CMS.

Mirrors the content types so the client edits services, installations,
testimonials, and site settings without a developer or a redeploy.
"""

from sqladmin import Admin, ModelView
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
from starlette.responses import RedirectResponse

from .models import Lead, Project, Service, SiteSetting, Testimonial
from .settings import settings


class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        if (
            form.get("username") == settings.admin_username
            and form.get("password") == settings.admin_password
        ):
            request.session.update({"authenticated": True})
            return True
        return False

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
    column_labels = {"signs": "Warning signs (one per line)", "lede": "Short summary"}


class ProjectAdmin(ModelView, model=Project):
    name_plural = "Installations"
    icon = "fa-solid fa-camera"
    column_list = [Project.position, Project.title, Project.location, Project.published]
    form_columns = [
        Project.position, Project.title, Project.location, Project.summary,
        Project.image_open_url, Project.image_open_alt,
        Project.image_finished_url, Project.image_finished_alt,
        Project.published,
    ]
    column_labels = {
        "image_open_url": "Photo — chase/board OPEN (CDN URL)",
        "image_open_alt": "Alt text for the open photo",
        "image_finished_url": "Photo — FINISHED, same framing (CDN URL)",
        "image_finished_alt": "Alt text for the finished photo",
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
    column_labels = {"mentions_safety": "Mentions safety/reliability (shown first)"}


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


def mount_admin(app, engine) -> None:
    admin = Admin(
        app,
        engine,
        title="PremierPower",
        authentication_backend=AdminAuth(secret_key=settings.secret_key),
    )
    for view in (ServiceAdmin, ProjectAdmin, TestimonialAdmin, SiteSettingAdmin, LeadAdmin):
        admin.add_view(view)
