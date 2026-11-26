"""Every write through the API leaves a trail, kept for six months.

Older entries are deleted: at startup, and at most once a day as new entries
are written, so a server that runs for weeks without restarting still clears
them. Six months covers any question about a recent change without keeping
staff names and IP addresses for longer than they are useful.
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy import delete
from sqlalchemy.orm import Session

from ..models import AuditLog

RETENTION_DAYS = 183   # six months
_PRUNE_EVERY = timedelta(days=1)
_last_prune: datetime | None = None


def prune_audit(db: Session) -> int:
    """Delete entries older than RETENTION_DAYS. Returns how many went."""
    global _last_prune
    cutoff = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)
    gone = db.execute(delete(AuditLog).where(AuditLog.created_at < cutoff)).rowcount or 0
    db.commit()
    _last_prune = datetime.now(timezone.utc)
    return gone


def log_action(
    db: Session, *, actor: str, action: str, entity: str,
    entity_id: int | None = None, detail: str = "", ip: str = "",
) -> None:
    db.add(AuditLog(
        actor=actor, action=action, entity=entity,
        entity_id=entity_id, detail=detail[:500], ip=ip,
    ))
    db.commit()
    if _last_prune is None or datetime.now(timezone.utc) - _last_prune > _PRUNE_EVERY:
        prune_audit(db)
