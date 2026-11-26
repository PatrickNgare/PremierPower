from math import ceil

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..core.audit import RETENTION_DAYS
from ..core.security import require_owner
from ..db import get_db
from ..models import Admin, AuditLog
from ..schemas import AuditPage

router = APIRouter(tags=["audit"])


@router.get("", response_model=AuditPage)
def list_audit(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    entity: str | None = None,
    action: str | None = None,
    db: Session = Depends(get_db),
    _: Admin = Depends(require_owner),
):
    """One page of the activity log, most recent first."""
    where = []
    if entity:
        where.append(AuditLog.entity == entity)
    if action:
        where.append(AuditLog.action == action)
    total = db.scalar(select(func.count()).select_from(AuditLog).where(*where)) or 0
    items = db.scalars(
        select(AuditLog).where(*where)
        .order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
        .offset((page - 1) * page_size).limit(page_size)
    ).all()
    return {
        "items": items, "total": total, "page": page, "page_size": page_size,
        "pages": max(1, ceil(total / page_size)), "retention_days": RETENTION_DAYS,
    }
