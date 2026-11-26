from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.security import require_owner
from ..db import get_db
from ..models import Admin, AuditLog
from ..schemas import AuditLogOut

router = APIRouter(tags=["audit"])


@router.get("", response_model=list[AuditLogOut])
def list_audit(
    limit: int = Query(default=100, ge=1, le=500),
    entity: str | None = None,
    db: Session = Depends(get_db),
    _: Admin = Depends(require_owner),
):
    q = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    if entity:
        q = q.where(AuditLog.entity == entity)
    return db.scalars(q).all()
