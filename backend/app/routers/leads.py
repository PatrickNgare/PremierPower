import logging

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Lead
from ..schemas import LeadIn
from ..settings import settings

router = APIRouter(tags=["leads"])
log = logging.getLogger("premierpower.leads")

# Crude per-IP throttle. Enough to stop a bored bot; not a security boundary.
_recent: dict[str, list[float]] = {}
_WINDOW = 3600.0
_LIMIT = 5


def _throttled(ip: str) -> bool:
    import time

    now = time.time()
    hits = [t for t in _recent.get(ip, []) if now - t < _WINDOW]
    hits.append(now)
    _recent[ip] = hits
    return len(hits) > _LIMIT


@router.post("/leads", status_code=201)
def create_lead(payload: LeadIn, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else "unknown"
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
