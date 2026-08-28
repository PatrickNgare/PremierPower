"""Move existing photography into the media library and onto Cloudinary.

Two separate jobs, both of which the site needed:

1. The client's project photography shipped inside the frontend build, as
   static files under `frontend/public/projects`. That meant it was invisible
   to the CMS — the client could not pick their own photographs from the media
   picker, reuse one on another page, or fix a description. This uploads each
   to Cloudinary, records it in the media library, and repoints the content
   rows that referenced the static path.

2. Four rows in the media library are leftovers from the stored-XSS audit,
   including two live payloads (`evil.svg`, `evil.html`). Nothing references
   them. `--purge-artifacts` removes them.

The static files are deliberately left in place: they are the offline fallback
the bundled data still points at, and they cost 3.7MB in an image that already
carries them.

Idempotent — a photograph already in the library under folder "projects" is
skipped, so re-running after a partial failure resumes rather than duplicates.

    # look first
    .venv/bin/python -m app.scripts.migrate_media
    # then commit to it
    .venv/bin/python -m app.scripts.migrate_media --apply --purge-artifacts

Run it from `backend/` on the host: it needs the frontend's source photographs,
which are not inside the API image. The one thing it cannot finish from there
is deleting local upload files, which live on the container's volume — it
prints the exact command for those rather than reporting success it did not
achieve.
"""

import argparse
import sys
from pathlib import Path

from sqlalchemy import select

from ..db import SessionLocal
from ..models import Banner, MediaAsset, Project, Sector
from ..settings import settings

# Content columns that can hold one of these paths.
TARGETS = (
    (Banner, "image_url"),
    (Project, "image_open_url"),
    (Project, "image_finished_url"),
    (Sector, "image_url"),
)

SOURCE_DIR = Path(__file__).resolve().parents[3] / "frontend" / "public" / "projects"
MAP_FILE = Path(__file__).resolve().parents[3] / "frontend" / "src" / "data" / "mediaMap.json"
FOLDER = "projects"


def _upload(path: Path) -> dict:
    from ..routers.upload import _store_cloudinary

    return _store_cloudinary(path.read_bytes(), path.name, FOLDER)


def _purge_artifacts(db, apply: bool) -> None:
    """Remove the audit leftovers, database row and file.

    The file only disappears if this runs where the upload directory actually
    is. Run from the host, `upload_dir` resolves beside the source tree while
    the real files sit on the container's volume — so the row goes and the
    file quietly stays. That is exactly what happened the first time, and for
    an XSS payload "quietly stays" is the wrong outcome, so any file that is
    not where it was expected is reported rather than passed over.
    """
    rows = db.scalars(
        select(MediaAsset).where(MediaAsset.storage == "local")
    ).all()
    if not rows:
        print("  nothing to purge")
        return

    stranded = []
    for row in rows:
        print(f"  {'removing' if apply else 'would remove'} #{row.id} {row.filename} ({row.bytes} bytes) {row.url}")
        if not apply:
            continue
        local = Path(settings.upload_dir) / row.public_id
        if local.exists():
            local.unlink()
        else:
            stranded.append(local)
        db.delete(row)

    if apply:
        db.commit()
    if stranded:
        print(
            f"\n  !! {len(stranded)} file(s) were not found at {Path(settings.upload_dir).resolve()} "
            "and are still wherever they really live.\n"
            "     Remove them where the volume is mounted:\n"
            "       docker compose exec api sh -c 'rm -f "
            + " ".join(f"/app/uploads/{p.name}" for p in stranded) + "'"
        )


def _write_map(db) -> None:
    """Emit the local-path -> CDN-URL map the frontend compiles in.

    Some photographs are layout, not content: page hero images, the lighting
    strip, the services feature card. They are chosen by the design and belong
    in the code, but there is no reason to serve them from the container when
    the same file is on the CDN.

    Resolving that at runtime would mean fetching a map before any of those
    images could start loading — a visible delay on exactly the images that
    are above the fold. A file written here and imported at build time costs
    nothing at runtime and cannot get out of step, because the only thing that
    writes it is the thing that does the uploading.
    """
    import json

    rows = db.scalars(select(MediaAsset).where(MediaAsset.folder == FOLDER)).all()
    mapping = {f"/{FOLDER}/{r.filename}": r.url for r in sorted(rows, key=lambda r: r.filename)}
    MAP_FILE.parent.mkdir(parents=True, exist_ok=True)
    MAP_FILE.write_text(json.dumps(mapping, indent=2) + "\n")
    print(f"  wrote {MAP_FILE.relative_to(MAP_FILE.parents[4])} ({len(mapping)} entries)")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--apply", action="store_true", help="write changes; without it nothing is modified")
    ap.add_argument("--purge-artifacts", action="store_true", help="also delete the XSS-audit leftovers")
    args = ap.parse_args()

    if not settings.cloudinary_configured:
        print("Cloudinary is not configured — set CLOUDINARY_* in .env first.")
        return 1
    if not SOURCE_DIR.is_dir():
        print(f"No source directory at {SOURCE_DIR}")
        return 1

    files = sorted(p for p in SOURCE_DIR.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"})
    print(f"{'APPLYING' if args.apply else 'DRY RUN'} — {len(files)} photographs in {SOURCE_DIR}\n")

    db = SessionLocal()
    try:
        if args.purge_artifacts:
            print("Audit artifacts:")
            _purge_artifacts(db, args.apply)
            print()

        existing = {
            a.filename: a for a in db.scalars(
                select(MediaAsset).where(MediaAsset.folder == FOLDER)
            ).all()
        }

        # Local path -> Cloudinary URL, built as we go and applied at the end.
        moved: dict[str, str] = {}
        for path in files:
            site_path = f"/{FOLDER}/{path.name}"
            if path.name in existing:
                moved[site_path] = existing[path.name].url
                print(f"  skip   {path.name} — already in the library")
                continue
            if not args.apply:
                # Record the planned result so the reference pass can report
                # what *would* be repointed. Without this a dry run lists every
                # reference as unmatched and reads like a failure.
                moved[site_path] = "(pending upload)"
                print(f"  upload {path.name} ({path.stat().st_size:,} bytes)")
                continue
            stored = _upload(path)
            asset = MediaAsset(
                url=stored["url"], public_id=stored["public_id"], filename=path.name,
                bytes=path.stat().st_size, width=stored.get("width", 0),
                height=stored.get("height", 0), storage="cloudinary",
                folder=FOLDER, tags="migrated",
            )
            db.add(asset)
            db.flush()
            moved[site_path] = stored["url"]
            print(f"  upload {path.name} -> {stored['public_id']}")

        print("\nContent references:")
        rewritten = 0
        for model, column in TARGETS:
            for row in db.scalars(select(model)).all():
                current = getattr(row, column) or ""
                if not current.startswith(f"/{FOLDER}/"):
                    continue
                target = moved.get(current)
                if not target:
                    print(f"  !! {model.__tablename__}.{column} #{row.id} -> {current} has no uploaded match")
                    continue
                print(f"  {model.__tablename__}.{column} #{row.id}: {current}")
                if args.apply:
                    setattr(row, column, target)
                rewritten += 1

        if args.apply:
            db.commit()
            _write_map(db)
            print(f"\nDone — {len(moved)} photographs in the library, {rewritten} references repointed.")
        else:
            print(f"\n{rewritten} references would be repointed. Re-run with --apply.")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
