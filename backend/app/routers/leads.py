import logging

from fastapi import (
    APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Request, Response, UploadFile, status,
)
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from starlette.concurrency import run_in_threadpool
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core import attachments as files_store
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


def _gate(request: Request, payload: LeadIn) -> bool:
    """True when the submission should be answered but not saved: over the
    rate limit, or the honeypot was filled. Either way the caller gets a 201,
    so a bot learns nothing and a person who double-submits sees no failure."""
    ip = client_ip(request)
    if too_many(f"lead:{ip}", limit=LEAD_LIMIT, window=LEAD_WINDOW):
        log.warning("throttled lead submission from %s", ip)
        return True
    if payload.website:
        log.warning("dropped honeypot lead submission from %s", ip)
        return True
    return False


def _save(db: Session, background: BackgroundTasks, payload: LeadIn, stored: list[dict]) -> dict:
    lead = Lead(**payload.model_dump(), attachments=stored)
    db.add(lead)
    db.flush()   # assigns the id the notification links to
    extra = f" · {len(stored)} file{'s' if len(stored) != 1 else ''} attached" if stored else ""
    notify(
        db,
        kind="lead",
        title=f"New {lead.kind} from {lead.name}{extra}",
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


@router.post("", status_code=status.HTTP_201_CREATED)
def create_lead(
    payload: LeadIn, request: Request, background: BackgroundTasks,
    db: Session = Depends(get_db),
):
    if _gate(request, payload):
        return {"ok": True}
    return _save(db, background, payload, [])


@router.post("/with-files", status_code=status.HTTP_201_CREATED)
async def create_lead_with_files(
    request: Request, background: BackgroundTasks,
    name: str = Form(""), company: str = Form(""), email: str = Form(""), phone: str = Form(""),
    area: str = Form(""), project_type: str = Form(""), message: str = Form(""),
    website: str = Form(""),
    files: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
):
    """The same enquiry, plus up to three drawings or documents.

    Validated exactly as the JSON endpoint (same LeadIn, same 422 shape, same
    honeypot and rate limit), and every file is checked before any is stored,
    so a bad third file never leaves the first two orphaned in storage.
    """
    try:
        payload = LeadIn(name=name, company=company, email=email, phone=phone, area=area,
                         project_type=project_type, message=message, website=website)
    except ValidationError as e:
        raise RequestValidationError(
            [{**err, "loc": ("body", *err["loc"])} for err in e.errors(include_url=False)]
        ) from None
    if _gate(request, payload):
        return {"ok": True}
    checked = await files_store.read_files(files)
    stored = [await run_in_threadpool(files_store.store, *f) for f in checked]
    return _save(db, background, payload, stored)


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


@router.get("/{id}/attachments/{n}")
async def download_attachment(
    id: int, n: int, db: Session = Depends(get_db), _: Admin = Depends(get_current_admin),
):
    """Stream one attachment to a signed-in admin. The storage location never
    leaves the server."""
    lead = db.get(Lead, id)
    items = (lead.attachments or []) if lead else []
    if not 0 <= n < len(items):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Attachment not found")
    item = items[n]
    data = await run_in_threadpool(files_store.fetch, item)
    safe = item.get("name", "file").replace('"', "")
    return Response(data, media_type=item.get("type") or "application/octet-stream", headers={
        "Content-Disposition": f'inline; filename="{safe}"',
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
    })


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(
    id: int, request: Request,
    db: Session = Depends(get_db), admin: Admin = Depends(require_editor),
):
    lead = db.get(Lead, id)
    if lead is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lead not found")
    for item in lead.attachments or []:
        files_store.remove(item)
    db.delete(lead)
    db.commit()
    log_action(db, actor=admin.email, action="delete", entity="lead",
               entity_id=id, ip=client_ip(request))
