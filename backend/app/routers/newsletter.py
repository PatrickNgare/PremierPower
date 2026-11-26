from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.security import get_current_admin, require_editor
from ..db import get_db
from ..models import Admin, NewsletterSubscriber
from ..schemas import SubscriberIn, SubscriberOut

router = APIRouter(tags=["newsletter"])


@router.post("/subscribe", status_code=status.HTTP_201_CREATED)
def subscribe(payload: SubscriberIn, db: Session = Depends(get_db)):
    existing = db.scalar(select(NewsletterSubscriber).where(NewsletterSubscriber.email == payload.email))
    if existing:
        # Resubscribing is idempotent, and the response never reveals whether
        # an address was already on the list.
        existing.active = True
        db.commit()
        return {"ok": True}
    db.add(NewsletterSubscriber(email=payload.email))
    db.commit()
    return {"ok": True}


@router.post("/unsubscribe", status_code=status.HTTP_204_NO_CONTENT)
def unsubscribe(payload: SubscriberIn, db: Session = Depends(get_db)):
    row = db.scalar(select(NewsletterSubscriber).where(NewsletterSubscriber.email == payload.email))
    if row:
        row.active = False
        db.commit()


@router.get("/subscribers", response_model=list[SubscriberOut])
def list_subscribers(db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    return db.scalars(select(NewsletterSubscriber).order_by(NewsletterSubscriber.created_at.desc())).all()


@router.delete("/subscribers/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subscriber(id: int, db: Session = Depends(get_db), _: Admin = Depends(require_editor)):
    row = db.get(NewsletterSubscriber, id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Subscriber not found")
    db.delete(row)
    db.commit()
