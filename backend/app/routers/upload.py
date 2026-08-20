"""Media upload.

Cloudinary is used when configured; otherwise files land on local disk and are
served from /uploads. The local path keeps the client able to add photographs
before anyone has set up a CDN account — which matters here, because the site's
whole argument depends on real installation photography.
"""

import logging
import mimetypes
import secrets
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.audit import log_action
from ..core.security import client_ip, get_current_admin
from ..db import get_db
from ..models import Admin, MediaAsset
from ..schemas import MediaOut
from ..settings import settings

router = APIRouter(tags=["media"])
log = logging.getLogger("premierpower.upload")

ALLOWED = {"image/jpeg", "image/png", "image/webp", "image/avif"}


def _store_local(file: UploadFile, data: bytes) -> dict:
    root = Path(settings.upload_dir)
    root.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "").suffix or mimetypes.guess_extension(file.content_type or "") or ".jpg"
    name = f"{secrets.token_hex(12)}{ext}"
    (root / name).write_bytes(data)
    return {"url": f"/uploads/{name}", "public_id": name, "storage": "local"}


def _store_cloudinary(data: bytes, filename: str) -> dict:
    import cloudinary
    import cloudinary.uploader

    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )
    result = cloudinary.uploader.upload(data, folder="premierpower", resource_type="image")
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
        "width": result.get("width", 0),
        "height": result.get("height", 0),
        "storage": "cloudinary",
    }


@router.post("/image", response_model=MediaOut, status_code=status.HTTP_201_CREATED)
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    if file.content_type not in ALLOWED:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            f"Unsupported type {file.content_type}. Allowed: {', '.join(sorted(ALLOWED))}",
        )

    data = await file.read()
    limit = settings.max_upload_mb * 1024 * 1024
    if len(data) > limit:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"File is larger than the {settings.max_upload_mb}MB limit",
        )

    stored = (
        _store_cloudinary(data, file.filename or "upload")
        if settings.cloudinary_configured
        else _store_local(file, data)
    )

    asset = MediaAsset(
        url=stored["url"], public_id=stored.get("public_id", ""),
        filename=file.filename or "", bytes=len(data),
        width=stored.get("width", 0), height=stored.get("height", 0),
        storage=stored["storage"],
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    log_action(db, actor=admin.email, action="upload", entity="media",
               entity_id=asset.id, detail=asset.filename, ip=client_ip(request))
    return asset


@router.get("/library", response_model=list[MediaOut])
def library(db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    return db.scalars(select(MediaAsset).order_by(MediaAsset.created_at.desc())).all()


@router.delete("/library/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    id: int, request: Request,
    db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin),
):
    asset = db.get(MediaAsset, id)
    if asset is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Asset not found")

    if asset.storage == "local":
        path = Path(settings.upload_dir) / asset.public_id
        path.unlink(missing_ok=True)
    elif asset.storage == "cloudinary":
        try:
            import cloudinary.uploader
            cloudinary.uploader.destroy(asset.public_id)
        except Exception:
            # The database row still goes; a stranded CDN object is preferable
            # to an admin who cannot remove a photograph from the site.
            log.warning("could not remove %s from Cloudinary", asset.public_id)

    filename = asset.filename
    db.delete(asset)
    db.commit()
    log_action(db, actor=admin.email, action="delete", entity="media",
               entity_id=id, detail=filename, ip=client_ip(request))
