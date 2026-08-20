from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.audit import log_action
from ..core.security import client_ip, get_current_admin
from ..db import get_db
from ..models import Admin, SiteSetting
from ..schemas import SettingIn, SettingOut

router = APIRouter(tags=["settings"])


@router.get("")
def public_settings(db: Session = Depends(get_db)) -> dict[str, str]:
    """Only non-empty values are returned, so the frontend keeps rendering an
    honest gap for anything the client has not filled in yet."""
    rows = db.scalars(select(SiteSetting)).all()
    return {r.key: r.value for r in rows if r.value.strip()}


@router.get("/all", response_model=list[SettingOut])
def all_settings(db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    return db.scalars(select(SiteSetting).order_by(SiteSetting.key)).all()


@router.put("/{key}", response_model=SettingOut)
def upsert(
    key: str, payload: SettingIn, request: Request,
    db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin),
):
    row = db.scalar(select(SiteSetting).where(SiteSetting.key == key))
    if row is None:
        row = SiteSetting(key=key)
        db.add(row)
    row.value = payload.value
    if payload.note:
        row.note = payload.note
    db.commit()
    db.refresh(row)
    log_action(db, actor=admin.email, action="update", entity="setting",
               entity_id=row.id, detail=f"{key}={payload.value[:80]}", ip=client_ip(request))
    return row
