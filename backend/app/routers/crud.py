"""Generic CRUD router factory.

SpaceInfra repeats a near-identical router per resource. The endpoint shape is
the same here, built once: a public list over published rows, an authenticated
list over everything with search, filters and paging, plus create, update,
delete, publish toggling and drag-and-drop reordering — every write audited.

Adding a content type to the CMS is a model, a schema pair and one line in
main.py. That is the whole point of this file.
"""

from typing import Any, Generic, TypeVar

from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..core.audit import log_action
from ..core.security import client_ip, get_current_admin, preview_ok, require_editor
from ..db import get_db
from ..models import Admin

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    """A slice of a list view, with enough to draw a pager."""

    items: list[T]
    total: int
    limit: int
    offset: int


class Reorder(BaseModel):
    """Ids in their new order. Position becomes the index in this list."""

    ids: list[int]


def crud_router(
    *,
    model: Any,
    schema_in: Any,
    schema_out: Any,
    entity: str,
    lookup: str = "slug",
    order_by: tuple = (),
    search: tuple = (),
    filters: dict[str, Any] | None = None,
    tags: list[str] | None = None,
) -> APIRouter:
    router = APIRouter(tags=tags or [entity])
    # Not every content type is ordered by hand — SEO rows are keyed by path
    # and have no position at all, so fall back to id rather than assuming one.
    ordering = order_by or ((model.position, model.id) if hasattr(model, "position") else (model.id,))
    filter_map = filters or {}
    # `published` is the draft flag everywhere; a few models gate on `enabled`.
    gate = "published" if hasattr(model, "published") else ("enabled" if hasattr(model, "enabled") else "")

    def _live(q):
        return q.where(getattr(model, gate).is_(True)) if gate else q

    def _search(q, term: str):
        if not term or not search:
            return q
        like = f"%{term.strip()}%"
        return q.where(or_(*[getattr(model, c).ilike(like) for c in search]))

    def _filtered(q, values: dict):
        for name, raw in values.items():
            if raw in (None, ""):
                continue
            column = filter_map[name]
            q = q.where(column == raw)
        return q

    # ── public ──────────────────────────────────────────────────────────
    @router.get("", response_model=list[schema_out])
    def list_public(
        db: Session = Depends(get_db),
        q: str = Query("", description="Free-text search"),
        preview: str = Query("", description="Preview token — includes drafts"),
    ):
        stmt = select(model)
        # A valid preview token is the only way an unpublished row reaches the
        # public site, and it expires. Drafts are not otherwise addressable.
        if not preview_ok(preview):
            stmt = _live(stmt)
        return db.scalars(_search(stmt, q).order_by(*ordering)).all()

    # ── admin ───────────────────────────────────────────────────────────
    @router.get("/all", response_model=Page[schema_out])
    def list_all(
        db: Session = Depends(get_db),
        _: Admin = Depends(get_current_admin),
        q: str = Query(""),
        published: bool | None = Query(None, description="Filter by draft/published"),
        limit: int = Query(100, ge=1, le=500),
        offset: int = Query(0, ge=0),
    ):
        stmt = _search(select(model), q)
        if published is not None and gate:
            stmt = stmt.where(getattr(model, gate).is_(published))
        total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        rows = db.scalars(stmt.order_by(*ordering).limit(limit).offset(offset)).all()
        return Page(items=rows, total=total, limit=limit, offset=offset)

    if filter_map:
        # Declared filters get their own endpoint rather than being folded into
        # the list signature: FastAPI reads the signature to build the query
        # schema, and a dynamic **kwargs there documents as nothing at all.
        @router.get("/filter", response_model=list[schema_out])
        def list_filtered(
            request: Request,
            db: Session = Depends(get_db),
            preview: str = Query(""),
        ):
            values = {k: request.query_params.get(k) for k in filter_map}
            stmt = select(model)
            if not preview_ok(preview):
                stmt = _live(stmt)
            return db.scalars(_filtered(stmt, values).order_by(*ordering)).all()

    if lookup:
        @router.get("/{key}", response_model=schema_out)
        def get_one(key: str, db: Session = Depends(get_db), preview: str = Query("")):
            column = getattr(model, lookup)
            stmt = select(model).where(column == key)
            if not preview_ok(preview):
                stmt = _live(stmt)
            row = db.scalar(stmt)
            if row is None:
                raise HTTPException(status.HTTP_404_NOT_FOUND, f"{entity} not found")
            return row

    @router.post("", response_model=schema_out, status_code=status.HTTP_201_CREATED)
    def create(
        payload: schema_in, request: Request,
        db: Session = Depends(get_db), admin: Admin = Depends(require_editor),
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
        db: Session = Depends(get_db), admin: Admin = Depends(require_editor),
    ):
        row = db.get(model, id)
        if row is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"{entity} not found")
        for k, v in payload.model_dump().items():
            setattr(row, k, v)
        try:
            db.commit()
        except Exception:
            db.rollback()
            raise HTTPException(status.HTTP_409_CONFLICT, f"{entity} conflicts with another") from None
        db.refresh(row)
        log_action(db, actor=admin.email, action="update", entity=entity,
                   entity_id=row.id, detail=str(row), ip=client_ip(request))
        return row

    if gate:
        @router.patch("/{id}/publish", response_model=schema_out)
        def set_published(
            id: int, request: Request, value: bool = Body(embed=True),
            db: Session = Depends(get_db), admin: Admin = Depends(require_editor),
        ):
            row = db.get(model, id)
            if row is None:
                raise HTTPException(status.HTTP_404_NOT_FOUND, f"{entity} not found")
            setattr(row, gate, value)
            # Stamp the first publish where the model records one, so "published
            # on" is not the row's creation date forever.
            if value and hasattr(row, "published_at") and row.published_at is None:
                row.published_at = func.now()
            db.commit()
            db.refresh(row)
            log_action(db, actor=admin.email, action="publish" if value else "unpublish",
                       entity=entity, entity_id=row.id, detail=str(row), ip=client_ip(request))
            return row

    if hasattr(model, "position"):
        @router.post("/reorder", status_code=status.HTTP_204_NO_CONTENT)
        def reorder(
            payload: Reorder, request: Request,
            db: Session = Depends(get_db), admin: Admin = Depends(require_editor),
        ):
            rows = {r.id: r for r in db.scalars(select(model).where(model.id.in_(payload.ids))).all()}
            missing = [i for i in payload.ids if i not in rows]
            if missing:
                raise HTTPException(status.HTTP_404_NOT_FOUND, f"unknown {entity} ids: {missing}")
            for index, row_id in enumerate(payload.ids):
                rows[row_id].position = index
            db.commit()
            log_action(db, actor=admin.email, action="reorder", entity=entity, entity_id=None,
                       detail=f"{len(payload.ids)} rows", ip=client_ip(request))

    @router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete(
        id: int, request: Request,
        db: Session = Depends(get_db), admin: Admin = Depends(require_editor),
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
