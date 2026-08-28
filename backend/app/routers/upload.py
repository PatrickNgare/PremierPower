"""Media upload.

Cloudinary is used when configured; otherwise files land on local disk and are
served from /uploads. The local path keeps the client able to add photographs
before anyone has set up a CDN account — which matters here, because the site's
whole argument depends on real installation photography.
"""

import logging
import re
import secrets
from pathlib import Path

from fastapi import (
    APIRouter, Body, Depends, File, Form, HTTPException, Query, Request, UploadFile, status,
)
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..core.audit import log_action
from ..core.security import client_ip, get_current_admin, require_editor
from ..db import get_db
from ..models import Admin, MediaAsset
from ..schemas import MediaOut
from ..settings import settings

router = APIRouter(tags=["media"])
log = logging.getLogger("premierpower.upload")

# Extension is derived from the validated content type, never from the
# uploaded filename. Trusting the filename let a caller send content-type
# image/png named "x.svg" and have it stored — and served — as SVG, which
# executes script. Same for .html.
ALLOWED = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/avif": ".avif",
}

# First bytes of each permitted format. A declared content type is caller-
# supplied and proves nothing on its own.
MAGIC = (
    (b"\xff\xd8\xff", "image/jpeg"),
    (b"\x89PNG\r\n\x1a\n", "image/png"),
)


def _looks_like_image(data: bytes, declared: str) -> bool:
    """RIFF/WEBP and AVIF carry their marker at offset 4/8, so they are matched
    separately rather than by a simple prefix."""
    for prefix, kind in MAGIC:
        if data.startswith(prefix):
            return kind == declared
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return declared == "image/webp"
    if data[4:8] == b"ftyp" and b"avif" in data[8:24]:
        return declared == "image/avif"
    return False


def _store_local(file: UploadFile, data: bytes) -> dict:
    root = Path(settings.upload_dir)
    root.mkdir(parents=True, exist_ok=True)
    # Name and extension are both generated; nothing from the caller reaches
    # the filesystem path.
    ext = ALLOWED[file.content_type]
    name = f"{secrets.token_hex(12)}{ext}"
    (root / name).write_bytes(data)
    return {"url": f"/uploads/{name}", "public_id": name, "storage": "local"}


def _public_id(filename: str) -> str:
    """A readable, safe public_id derived from the uploaded filename.

    Built here rather than left to Cloudinary's `use_filename`: that reads the
    name off a file object, and uploads arrive as raw bytes, so every asset
    lands as "file_ab12cd" and the Cloudinary console becomes unnavigable.

    Slashes are stripped, not escaped — Cloudinary reads them as folder
    separators, so a crafted filename would otherwise choose its own folder.
    """
    stem = Path(filename or "image").stem
    safe = re.sub(r"[^A-Za-z0-9_-]+", "-", stem).strip("-").lower()[:60]
    return f"{safe or 'image'}-{secrets.token_hex(4)}"


def _configure_cloudinary() -> None:
    import cloudinary

    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )


def _store_cloudinary(data: bytes, filename: str, folder: str = "") -> dict:
    """Upload, then store a *delivery* URL rather than the raw one.

    The URL Cloudinary returns from an upload serves the original bytes at
    their original format. `f_auto,q_auto` is the reason to be on a CDN at all:
    it negotiates AVIF or WebP per browser and picks a quality that holds up
    visually, which on this site's installation photography is most of the
    page weight. Baking it into the stored URL keeps the frontend free of any
    Cloudinary-specific rendering code — it is still just a URL.
    """
    import cloudinary.uploader
    import cloudinary.utils

    _configure_cloudinary()
    result = cloudinary.uploader.upload(
        data,
        folder=f"premierpower/{folder}" if folder else "premierpower",
        resource_type="image",
        public_id=_public_id(filename),
        overwrite=False,
    )
    url, _ = cloudinary.utils.cloudinary_url(
        result["public_id"],
        format=result.get("format"),
        fetch_format="auto",
        quality="auto",
        secure=True,
    )
    return {
        "url": url or result["secure_url"],
        "public_id": result["public_id"],
        "width": result.get("width", 0),
        "height": result.get("height", 0),
        "storage": "cloudinary",
    }


def _store_document_cloudinary(data: bytes, filename: str) -> dict:
    """PDFs go up as `raw`.

    Not `image`: Cloudinary will happily rasterise a PDF as an image resource,
    which quietly turns a document a visitor should download into a picture of
    its first page.
    """
    import cloudinary.uploader

    _configure_cloudinary()
    result = cloudinary.uploader.upload(
        data,
        folder="premierpower/documents",
        # The extension has to stay on a raw resource or the delivered file
        # arrives without one and the browser will not open it as a PDF.
        public_id=f"{_public_id(filename)}.pdf",
        resource_type="raw",
        overwrite=False,
    )
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
        "storage": "cloudinary",
    }


@router.post("/image", response_model=MediaOut, status_code=status.HTTP_201_CREATED)
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    folder: str = Form(""),
    alt: str = Form(""),
    tags: str = Form(""),
    db: Session = Depends(get_db),
    admin: Admin = Depends(require_editor),
):
    if file.content_type not in ALLOWED:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            f"Unsupported type {file.content_type}. Allowed: {', '.join(sorted(ALLOWED))}",
        )

    data = await file.read()

    if not _looks_like_image(data, file.content_type):
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            "File contents do not match the declared image type.",
        )
    limit = settings.max_upload_mb * 1024 * 1024
    if len(data) > limit:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"File is larger than the {settings.max_upload_mb}MB limit",
        )

    stored = (
        _store_cloudinary(data, file.filename or "upload", folder.strip())
        if settings.cloudinary_configured
        else _store_local(file, data)
    )

    asset = MediaAsset(
        url=stored["url"], public_id=stored.get("public_id", ""),
        filename=file.filename or "", bytes=len(data),
        width=stored.get("width", 0), height=stored.get("height", 0),
        storage=stored["storage"],
        folder=folder.strip()[:120], alt=alt.strip()[:300], tags=tags.strip()[:300],
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    log_action(db, actor=admin.email, action="upload", entity="media",
               entity_id=asset.id, detail=asset.filename, ip=client_ip(request))
    return asset


# Documents are a separate door from images on purpose. The image endpoint
# validates magic bytes against an image allowlist; widening it to accept PDFs
# would mean one endpoint whose "is this really an image" check has to be told
# when not to apply — exactly the shape of the bug that let SVG through before.
DOC_ALLOWED = {"application/pdf": ".pdf"}
DOC_MAGIC = b"%PDF-"


@router.post("/document", status_code=status.HTTP_201_CREATED)
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: Admin = Depends(require_editor),
):
    """Store a PDF and hand back what the document form needs.

    Returns metadata rather than creating the row: the client still has to give
    the file a title a person would recognise, and "PremierPower_Profile_v3
    (2).pdf" is not it.
    """
    if file.content_type not in DOC_ALLOWED:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            "Only PDF documents can be uploaded.",
        )
    data = await file.read()
    if not data.startswith(DOC_MAGIC):
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            "That file is not a PDF, whatever it is named.",
        )
    limit = settings.max_upload_mb * 1024 * 1024
    if len(data) > limit:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"File is larger than the {settings.max_upload_mb}MB limit",
        )

    if settings.cloudinary_documents_enabled:
        stored = _store_document_cloudinary(data, file.filename or "document.pdf")
        file_url = stored["url"]
    else:
        root = Path(settings.upload_dir) / "docs"
        root.mkdir(parents=True, exist_ok=True)
        name = f"{secrets.token_hex(12)}.pdf"
        (root / name).write_bytes(data)
        file_url = f"/uploads/docs/{name}"

    log_action(db, actor=admin.email, action="upload", entity="document",
               entity_id=None, detail=file.filename or file_url, ip=client_ip(request))
    return {
        "file_url": file_url,
        "filename": file.filename or "document.pdf",
        "bytes": len(data),
    }


@router.get("/library", response_model=list[MediaOut])
def library(
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
    q: str = Query("", description="Search filename, alt text and tags"),
    folder: str = Query(""),
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    stmt = select(MediaAsset).order_by(MediaAsset.created_at.desc())
    if q.strip():
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(
            MediaAsset.filename.ilike(like),
            MediaAsset.alt.ilike(like),
            MediaAsset.tags.ilike(like),
        ))
    if folder:
        stmt = stmt.where(MediaAsset.folder == folder)
    return db.scalars(stmt.limit(limit).offset(offset)).all()


@router.get("/storage")
def storage(_: Admin = Depends(get_current_admin)) -> dict[str, object]:
    """Which backend uploads land in, so the CMS can say so plainly.

    Never reports the API secret or key — only whether the three values needed
    are all present.
    """
    return {
        "backend": "cloudinary" if settings.cloudinary_configured else "local",
        "documents_backend": "cloudinary" if settings.cloudinary_documents_enabled else "local",
        "cloud_name": settings.cloudinary_cloud_name or "",
        "max_upload_mb": settings.max_upload_mb,
        "missing": [
            name for name, value in (
                ("CLOUDINARY_CLOUD_NAME", settings.cloudinary_cloud_name),
                ("CLOUDINARY_API_KEY", settings.cloudinary_api_key),
                ("CLOUDINARY_API_SECRET", settings.cloudinary_api_secret),
            ) if not value
        ],
    }


@router.get("/folders", response_model=list[str])
def folders(db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    """Folders are a column, not a table — a name only exists while something
    is filed under it, so the list can never drift from what is really there."""
    rows = db.scalars(
        select(MediaAsset.folder).where(MediaAsset.folder != "").group_by(MediaAsset.folder)
        .order_by(func.lower(MediaAsset.folder))
    ).all()
    return list(rows)


@router.put("/library/{id}", response_model=MediaOut)
def update_asset(
    id: int,
    alt: str = Body("", embed=True),
    folder: str = Body("", embed=True),
    tags: str = Body("", embed=True),
    db: Session = Depends(get_db),
    _: Admin = Depends(require_editor),
):
    """Alt text is editable after the fact because it is usually written badly
    in the rush of uploading, and a wrong alt is worse than a late one."""
    asset = db.get(MediaAsset, id)
    if asset is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Asset not found")
    asset.alt = alt.strip()[:300]
    asset.folder = folder.strip()[:120]
    asset.tags = tags.strip()[:300]
    db.commit()
    db.refresh(asset)
    return asset


@router.delete("/library/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    id: int, request: Request,
    db: Session = Depends(get_db), admin: Admin = Depends(require_editor),
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
            _configure_cloudinary()
            cloudinary.uploader.destroy(asset.public_id, resource_type="image")
        except Exception:
            # The database row still goes; a stranded CDN object is preferable
            # to an admin who cannot remove a photograph from the site.
            log.warning("could not remove %s from Cloudinary", asset.public_id)

    filename = asset.filename
    db.delete(asset)
    db.commit()
    log_action(db, actor=admin.email, action="delete", entity="media",
               entity_id=id, detail=filename, ip=client_ip(request))
