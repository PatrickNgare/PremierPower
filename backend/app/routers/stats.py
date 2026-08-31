from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..core.security import get_current_admin
from ..db import get_db
from ..settings import settings as app_settings
from ..models import (
    Admin, Banner, BlogPost, FAQ, Lead, MediaAsset,
    NewsletterSubscriber, Project, Service, SiteSetting, TeamMember, Testimonial,
)

router = APIRouter(tags=["stats"])


@router.get("")
def dashboard_stats(db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    def count(model, *where):
        q = select(func.count()).select_from(model)
        for w in where:
            q = q.where(w)
        return db.scalar(q) or 0

    settings_total = count(SiteSetting)
    settings_filled = count(SiteSetting, SiteSetting.value != "")

    return {
        "leads": {"total": count(Lead), "unhandled": count(Lead, Lead.handled.is_(False))},
        "services": {"total": count(Service), "published": count(Service, Service.published.is_(True))},
        "projects": {"total": count(Project), "published": count(Project, Project.published.is_(True))},
        "testimonials": {"total": count(Testimonial), "published": count(Testimonial, Testimonial.published.is_(True))},
        "faqs": {"total": count(FAQ), "published": count(FAQ, FAQ.published.is_(True))},
        "blog": {"total": count(BlogPost), "published": count(BlogPost, BlogPost.published.is_(True))},
        "team": {"total": count(TeamMember), "published": count(TeamMember, TeamMember.published.is_(True))},
        "banners": {"total": count(Banner)},
        "media": {"total": count(MediaAsset)},
        "subscribers": {"total": count(NewsletterSubscriber, NewsletterSubscriber.active.is_(True))},
        # The launch gate: how much client truth is still missing.
        "settings": {"total": settings_total, "filled": settings_filled,
                     "pending": settings_total - settings_filled},
        # Whether anyone is actually being told about enquiries. An unconfigured
        # mailer is silent by design — the enquiry still saves and the bell
        # still lights — so without surfacing it here a live site can collect
        # leads for weeks with nobody reading them.
        "email": {
            "configured": app_settings.email_configured
            and bool(app_settings.smtp_password),
            "notify": app_settings.notify_email,
            # Everything that arrived while nobody was being emailed.
            "unsent": count(Lead) if not app_settings.smtp_password else 0,
        },
    }
