"""Generic CRUD router factory.

SpaceInfra repeats a near-identical router per resource. The endpoint shape is
the same here, built once: public list and detail over published rows, plus
authenticated list-all, create, update and delete — every write audited.
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.audit import log_action
from ..core.security import client_ip, get_current_admin
from ..db import get_db
from ..models import Admin


def crud_router(
    *,
    model: Any,
    schema_in: Any,
    schema_out: Any,
    entity: str,
    lookup: str = "slug",
    order_by: tuple = (),
    tags: list[str] | None = None,
) -> APIRouter:
    router = APIRouter(tags=tags or [entity])
    ordering = order_by or (model.position, model.id)

    def _published(q):
        return q.where(model.published.is_(True)) if hasattr(model, "published") else q

    @router.get("", response_model=list[schema_out])
    def list_public(db: Session = Depends(get_db)):
        return db.scalars(_published(select(model)).order_by(*ordering)).all()

    @router.get("/all", response_model=list[schema_out])
    def list_all(db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
        return db.scalars(select(model).order_by(*ordering)).all()

    if lookup:
        @router.get("/{key}", response_model=schema_out)
        def get_one(key: str, db: Session = Depends(get_db)):
            column = getattr(model, lookup)
            row = db.scalar(_published(select(model)).where(column == key))
            if row is None:
                raise HTTPException(status.HTTP_404_NOT_FOUND, f"{entity} not found")
            return row

    @router.post("", response_model=schema_out, status_code=status.HTTP_201_CREATED)
    def create(
        payload: schema_in, request: Request,
        db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin),
    ):
        row = model(**payload.model_dump())
        db.add(row)
        try:
            db.commit()
        except Exception:
            db.rollback()
            raise HTTPException(status.HTTP_409_CONFLICT, f"{entity} already exists") from None
        db.refresh(row)
        log_action(db, actor=admin.email, action="create", entity=entity,
                   entity_id=row.id, detail=str(row), ip=client_ip(request))
        return row

    @router.put("/{id}", response_model=schema_out)
    def update(
        id: int, payload: schema_in, request: Request,
        db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin),
    ):
        row = db.get(model, id)
        if row is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"{entity} not found")
        for k, v in payload.model_dump().items():
            setattr(row, k, v)
        db.commit()
        db.refresh(row)
        log_action(db, actor=admin.email, action="update", entity=entity,
                   entity_id=row.id, detail=str(row), ip=client_ip(request))
        return row

    @router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete(
        id: int, request: Request,
        db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin),
    ):
        row = db.get(model, id)
        if row is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"{entity} not found")
        detail = str(row)
        db.delete(row)
        db.commit()
        log_action(db, actor=admin.email, action="delete", entity=entity,
                   entity_id=id, detail=detail, ip=client_ip(request))

    return router
