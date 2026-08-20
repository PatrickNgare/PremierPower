import logging
import time

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.audit import log_action
from ..core.security import client_ip, get_current_admin
from ..db import get_db
from ..models import Admin, Lead
from ..schemas import LeadIn, LeadOut
from ..settings import settings

router = APIRouter(tags=["leads"])
log = logging.getLogger("premierpower.leads")

# Crude per-IP throttle. Enough to stop a bored bot; not a security boundary.
_recent: dict[str, list[float]] = {}
_WINDOW = 3600.0
_LIMIT = 5


def _throttled(ip: str) -> bool:
    now = time.time()
    hits = [t for t in _recent.get(ip, []) if now - t < _WINDOW]
    hits.append(now)
    _recent[ip] = hits
    return len(hits) > _LIMIT


@router.post("", status_code=status.HTTP_201_CREATED)
def create_lead(payload: LeadIn, request: Request, db: Session = Depends(get_db)):
    ip = client_ip(request)
    if _throttled(ip):
        # Still a 201: a throttled bot learns nothing, and a real person who
        # double-submits is not shown a failure for a request we already have.
        log.warning("throttled lead submission from %s", ip)
        return {"ok": True}

    lead = Lead(**payload.model_dump())
    db.add(lead)
    db.commit()
    target = settings.notify_email or "(no NOTIFY_EMAIL configured)"
    log.info("new lead #%s from %s — notify %s", lead.id, lead.phone, target)
    return {"ok": True}


@router.get("", response_model=list[LeadOut])
def list_leads(db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    return db.scalars(select(Lead).order_by(Lead.created_at.desc())).all()


@router.patch("/{id}/handled", response_model=LeadOut)
def mark_handled(
    id: int, request: Request,
    db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin),
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
    db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin),
):
    lead = db.get(Lead, id)
    if lead is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lead not found")
    db.delete(lead)
    db.commit()
    log_action(db, actor=admin.email, action="delete", entity="lead",
               entity_id=id, ip=client_ip(request))
