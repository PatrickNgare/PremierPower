"""Every write through the API leaves a trail."""

from sqlalchemy.orm import Session

from ..models import AuditLog


def log_action(
    db: Session, *, actor: str, action: str, entity: str,
    entity_id: int | None = None, detail: str = "", ip: str = "",
) -> None:
    db.add(AuditLog(
        actor=actor, action=action, entity=entity,
        entity_id=entity_id, detail=detail[:500], ip=ip,
    ))
    db.commit()
