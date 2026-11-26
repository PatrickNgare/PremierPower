"""Files sent with an enquiry: drawings, tender documents, site photos.

They are often confidential, so they are never stored at a public address.
With Cloudinary configured they go up as "authenticated" assets, which
Cloudinary will only serve against a signed, expiring link; locally they go to
a directory the web server does not expose. Either way the CMS reaches them
only through GET /api/leads/{id}/attachments/{n}, which needs a signed-in
admin and streams the file back.
"""

import logging
import re
import secrets
import time
import urllib.request
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from ..settings import settings

log = logging.getLogger("premierpower.attachments")

MAX_FILES = 3
MAX_BYTES = 10 * 1024 * 1024
# Identified by content, not by the name or the declared type.
KINDS = (
    (b"%PDF-", "application/pdf", "pdf"),
    (b"\xff\xd8\xff", "image/jpeg", "jpg"),
    (b"\x89PNG\r\n\x1a\n", "image/png", "png"),
)


def _private_dir() -> Path:
    d = Path(settings.private_dir)
    d.mkdir(parents=True, exist_ok=True)
    return d


def _kind(data: bytes) -> tuple[str, str] | None:
    for magic, mime, ext in KINDS:
        if data.startswith(magic):
            return mime, ext
    return None


def _clean_name(name: str, ext: str) -> str:
    stem = Path(name or "file").stem
    stem = re.sub(r"[^A-Za-z0-9 ._()-]+", "-", stem).strip(" .-")[:80] or "file"
    return f"{stem}.{ext}"


async def read_files(files: list[UploadFile]) -> list[tuple[bytes, str, str, str]]:
    """Validate everything before anything is stored. Returns
    (data, clean_name, mime, ext) per file; raises 4xx with a plain reason."""
    files = [f for f in files if f and f.filename]
    if len(files) > MAX_FILES:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT,
                            f"Attach up to {MAX_FILES} files.")
    out = []
    for f in files:
        data = await f.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES:
            raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE,
                                f"{f.filename} is over 10 MB. Send larger drawings by email instead.")
        kind = _kind(data)
        if kind is None:
            raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                                f"{f.filename} is not a PDF, JPG or PNG.")
        mime, ext = kind
        out.append((data, _clean_name(f.filename, ext), mime, ext))
    return out


def store(data: bytes, name: str, mime: str, ext: str) -> dict:
    """Blocking (Cloudinary client); call from a worker thread."""
    key = f"{secrets.token_hex(12)}"
    if settings.cloudinary_configured:
        import cloudinary.uploader
        from ..routers.upload import _configure_cloudinary
        _configure_cloudinary()
        resource = "raw" if ext == "pdf" else "image"
        result = cloudinary.uploader.upload(
            data, folder="premierpower/enquiries", type="authenticated",
            resource_type=resource,
            public_id=f"{key}.{ext}" if resource == "raw" else key,
            overwrite=False,
        )
        return {"name": name, "bytes": len(data), "type": mime, "storage": "cloudinary",
                "public_id": result["public_id"], "resource": resource,
                "format": result.get("format") or ext}
    (_private_dir() / f"{key}.{ext}").write_bytes(data)
    return {"name": name, "bytes": len(data), "type": mime, "storage": "local", "key": f"{key}.{ext}"}


def fetch(item: dict) -> bytes:
    """The file's bytes, for streaming to a signed-in admin. Blocking."""
    if item.get("storage") == "cloudinary":
        import cloudinary.utils
        from ..routers.upload import _configure_cloudinary
        _configure_cloudinary()
        url = cloudinary.utils.private_download_url(
            item["public_id"], item.get("format", ""), resource_type=item.get("resource", "raw"),
            type="authenticated", expires_at=int(time.time()) + 120,
        )
        with urllib.request.urlopen(url, timeout=30) as res:
            return res.read()
    path = _private_dir() / Path(item.get("key", "")).name
    if not path.is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "That file is no longer stored.")
    return path.read_bytes()


def remove(item: dict) -> None:
    """Best-effort delete when the enquiry is deleted."""
    try:
        if item.get("storage") == "cloudinary":
            import cloudinary.uploader
            from ..routers.upload import _configure_cloudinary
            _configure_cloudinary()
            cloudinary.uploader.destroy(item["public_id"], resource_type=item.get("resource", "raw"),
                                        type="authenticated")
        else:
            (_private_dir() / Path(item.get("key", "")).name).unlink(missing_ok=True)
    except Exception:  # noqa: BLE001
        log.warning("could not remove attachment %s", item.get("name"))
