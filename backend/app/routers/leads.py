import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.audit import log_action
from ..core.mailer import lead_notification, send as send_mail
from ..core.security import client_ip, get_current_admin, require_editor
from ..core.throttle import too_many
from ..db import get_db
from ..models import Admin, Lead
from ..schemas import LeadIn, LeadOut, LeadUpdate
from ..settings import settings
from .notifications import notify

router = APIRouter(tags=["leads"])
log = logging.getLogger("premierpower.leads")

LEAD_LIMIT = 5
LEAD_WINDOW = 3600.0


@router.post("", status_code=status.HTTP_201_CREATED)
def create_lead(
    payload: LeadIn, request: Request, background: BackgroundTasks,
    db: Session = Depends(get_db),
):
    ip = client_ip(request)
    if too_many(f"lead:{ip}", limit=LEAD_LIMIT, window=LEAD_WINDOW):
        # Still a 201: a throttled bot learns nothing, and a real person who
        # double-submits is not shown a failure for a request we already have.
        log.warning("throttled lead submission from %s", ip)
        return {"ok": True}

    if payload.website:
        # The hidden honeypot was filled in: a bot. Same answer as a real
        # submission, so it has no signal to adapt to; nothing is saved.
        log.warning("dropped honeypot lead submission from %s", ip)
        return {"ok": True}

    lead = Lead(**payload.model_dump())
    db.add(lead)
    db.flush()   # assigns the id the notification links to
    notify(
        db,
        kind="lead",
        title=f"New {lead.kind} from {lead.name}",
        body=(lead.message or lead.project_type or "")[:200],
        link=f"/admin/inbox/{lead.id}",
    )
    db.commit()

    # Sent after the response, and best-effort: the enquiry is already saved,
    # so a mail server that is slow or down must not make the person filling
    # in the form wait, and must not make it look like their message failed.
    subject, body = lead_notification(lead)
    background.add_task(send_mail, subject, body, reply_to=lead.email or "")

    log.info("new lead #%s from %s — notifying %s",
             lead.id, lead.phone, settings.notify_email or "(NOTIFY_EMAIL unset)")
    return {"ok": True}


@router.get("", response_model=list[LeadOut])
def list_leads(
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
    q: str = "",
    kind: str = "",
    status_filter: str = "",
):
    stmt = select(Lead).order_by(Lead.created_at.desc())
    if q.strip():
        like = f"%{q.strip()}%"
        stmt = stmt.where(
            Lead.name.ilike(like) | Lead.company.ilike(like)
            | Lead.phone.ilike(like) | Lead.email.ilike(like) | Lead.message.ilike(like)
        )
    if kind:
        stmt = stmt.where(Lead.kind == kind)
    if status_filter:
        stmt = stmt.where(Lead.status == status_filter)
    return db.scalars(stmt).all()


@router.get("/{id}", response_model=LeadOut)
def get_lead(id: int, db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    lead = db.get(Lead, id)
    if lead is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lead not found")
    return lead


@router.patch("/{id}", response_model=LeadOut)
def update_lead(
    id: int, payload: LeadUpdate, request: Request,
    db: Session = Depends(get_db), admin: Admin = Depends(require_editor),
):
    """Move a request through the pipeline and keep a note against it.

    Only the fields staff own are writable — never the enquirer's own words,
    which stay exactly as they were submitted.
    """
    lead = db.get(Lead, id)
    if lead is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lead not found")
    lead.status = payload.status
    lead.notes = payload.notes
    lead.handled = payload.status in ("won", "lost")
    db.commit()
    db.refresh(lead)
    log_action(db, actor=admin.email, action="update", entity="lead",
               entity_id=id, detail=f"status={lead.status}", ip=client_ip(request))
    return lead


@router.patch("/{id}/handled", response_model=LeadOut)
def mark_handled(
    id: int, request: Request,
    db: Session = Depends(get_db), admin: Admin = Depends(require_editor),
):
    lead = db.get(Lead, id)
    if lead is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lead not found")
    lead.handled = True
    db.commit()
    db.refresh(lead)
    log_action(db, actor=admin.email, action="handled", entity="lead",
               entity_id=id, ip=client_ip(request))
    return lead


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(
    id: int, request: Request,
    db: Session = Depends(get_db), admin: Admin = Depends(require_editor),
):
    lead = db.get(Lead, id)
    if lead is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lead not found")
    db.delete(lead)
    db.commit()
    log_action(db, actor=admin.email, action="delete", entity="lead",
               entity_id=id, ip=client_ip(request))
