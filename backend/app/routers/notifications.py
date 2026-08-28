"""The admin bell.

Notifications are written by the app when something arrives that a person
should look at — a new enquiry, a new subscriber. They are read, marked read
and cleared here. Nothing outside the app can create one.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..core.security import get_current_admin
from ..db import get_db
from ..models import Admin, Notification
from ..schemas import NotificationOut

router = APIRouter(tags=["notifications"])


def notify(db: Session, *, kind: str, title: str, body: str = "", link: str = "") -> None:
    """Record something worth a person's attention.

    Deliberately does not commit: the caller is mid-transaction writing the
    thing being announced, and a notification for a row that then failed to
    save would be a lie.
    """
    db.add(Notification(kind=kind, title=title, body=body, link=link))


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    unread_only: bool = Query(False),
    limit: int = Query(30, ge=1, le=200),
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    q = select(Notification).order_by(Notification.created_at.desc()).limit(limit)
    if unread_only:
        q = q.where(Notification.read.is_(False))
    return db.scalars(q).all()


@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)) -> dict[str, int]:
    total = db.scalar(
        select(func.count()).select_from(Notification).where(Notification.read.is_(False))
    ) or 0
    return {"count": total}


@router.patch("/{id}/read", response_model=NotificationOut)
def mark_read(id: int, db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    row = db.get(Notification, id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found")
    row.read = True
    db.commit()
    db.refresh(row)
    return row


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read(db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    for row in db.scalars(select(Notification).where(Notification.read.is_(False))).all():
        row.read = True
    db.commit()
