from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Project, Service, SiteSetting, Testimonial
from ..schemas import ProjectOut, ServiceOut, TestimonialOut

router = APIRouter(tags=["content"])


@router.get("/services", response_model=list[ServiceOut])
def list_services(db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Service).where(Service.published.is_(True)).order_by(Service.position, Service.id)
    ).all()
    return [
        ServiceOut(
            slug=s.slug,
            title=s.title,
            lede=s.lede,
            body=s.body,
            signs=[line.strip() for line in s.signs.splitlines() if line.strip()],
        )
        for s in rows
    ]


@router.get("/projects", response_model=list[ProjectOut])
def list_projects(db: Session = Depends(get_db)):
    return db.scalars(
        select(Project).where(Project.published.is_(True)).order_by(Project.position, Project.id)
    ).all()


@router.get("/testimonials", response_model=list[TestimonialOut])
def list_testimonials(db: Session = Depends(get_db)):
    # Safety-mentioning reviews lead; they do more work for an anxious reader.
    return db.scalars(
        select(Testimonial)
        .where(Testimonial.published.is_(True))
        .order_by(Testimonial.mentions_safety.desc(), Testimonial.position, Testimonial.id)
    ).all()


@router.get("/settings")
def get_settings(db: Session = Depends(get_db)) -> dict[str, str]:
    """Phone, WhatsApp, licence number, stat figures. Only non-empty values are
    returned, so the frontend keeps rendering an honest gap for anything the
    client has not filled in yet."""
    rows = db.scalars(select(SiteSetting)).all()
    return {r.key: r.value for r in rows if r.value.strip()}
