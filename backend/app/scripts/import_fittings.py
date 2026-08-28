"""Import the lighting fittings showcase.

Uploads the supplier photographs in `frontend/public/Photo` to Cloudinary,
records each in the media library, and creates a published Product for it.

The names and descriptions here were written after looking at each photograph.
They describe what the fitting is and where it suits — nothing is invented.
There are no model numbers and no specifications, because we do not have them:
several of these images carry a supplier's own code burned into the corner, and
transcribing one would be asserting a part number nobody confirmed.

Idempotent: a fitting whose slug already exists is skipped, so a re-run after a
partial failure resumes rather than duplicating.

    # look first
    .venv/bin/python -m app.scripts.import_fittings
    # then commit to it
    .venv/bin/python -m app.scripts.import_fittings --apply

Run from `backend/` on the host: the photographs live in the frontend tree,
which is not inside the API image.
"""

import argparse
import sys
from pathlib import Path

from sqlalchemy import select

from ..db import SessionLocal
from ..models import MediaAsset, Product, ProductCategory
from ..settings import settings

SOURCE_DIR = Path(__file__).resolve().parents[3] / "frontend" / "public" / "Photo"
FOLDER = "fittings"

CATEGORIES = [
    ("chandeliers", "Chandeliers",
     "Statement fittings for stairwells, dining rooms and reception areas."),
    ("pendants", "Pendants",
     "Single-drop fittings for kitchens, islands, bedsides and bars."),
    ("linear", "Linear lighting",
     "Bar and ribbon fittings for dining tables, worktops and corridors."),
]

# filename -> (slug, name, category, summary)
FITTINGS = [
    ("IMG-20260827-WA0006.jpg", "gold-crystal-tiered-pendant",
     "Gold crystal tiered pendant", "chandeliers",
     "A two-tier crystal fitting on a slim drop. Suits a stairwell or a "
     "double-height entrance where the fitting is meant to be seen."),
    ("IMG-20260827-WA0007.jpg", "brass-rippled-glass-globe-pendant",
     "Brass and rippled glass globe pendant", "pendants",
     "Brushed brass stem with a clear rippled glass globe. The texture breaks "
     "the filament into points of light rather than a single glare."),
    ("IMG-20260827-WA0008.jpg", "gold-linear-ribbon-bar",
     "Gold linear ribbon bar", "linear",
     "A straight bar crossed by a ribbon of LED. Made for the length of a "
     "dining table or an island, where a single pendant would light only the middle."),
    ("IMG-20260827-WA0009.jpg", "gold-ring-opal-globe-pendant",
     "Gold ring pendant with opal globe", "pendants",
     "A lit brass ring holding an opal glass globe. Small enough for a bedside "
     "or either end of a bar."),
    ("IMG-20260827-WA0010.jpg", "gold-multi-ring-chandelier",
     "Gold multi-ring chandelier", "chandeliers",
     "Layered rings with a crystal drop at the centre. A reception or dining "
     "room fitting, sized for a room with height to give it."),
    ("IMG-20260827-WA0011.jpg", "brushed-brass-dome-pendant",
     "Brushed brass dome pendant", "pendants",
     "A plain brushed brass dome on a black flex. Directs light down onto a "
     "worktop or a counter rather than across the room."),
    ("IMG-20260827-WA0012.jpg", "crystal-ring-globe-pendant",
     "Crystal ring and globe pendant", "chandeliers",
     "A cut-crystal ring above a faceted globe. Throws refracted light across "
     "the ceiling as well as down."),
    ("IMG-20260828-WA0024.jpg", "black-ring-crystal-chandelier",
     "Black ring chandelier with crystal", "chandeliers",
     "A matt black ring edged in crystal, with a brass and crystal drop inside "
     "it. Reads as a dark object until it is lit."),
    ("IMG-20260828-WA0025.jpg", "three-ring-gold-chandelier",
     "Three-ring gold chandelier", "chandeliers",
     "Three offset lit rings on wires. A common choice over a stairwell or a "
     "long dining table, where the tiers stagger down the drop."),
    ("IMG-20260828-WA0026.jpg", "gold-ring-crystal-drop-pendant",
     "Gold ring pendant with crystal drop", "pendants",
     "A single lit ring with a crystal ball and three angled tubes inside. "
     "A compact fitting for a hallway or a small dining space."),
    ("IMG-20260828-WA0028.jpg", "gold-infinity-crystal-chandelier",
     "Gold infinity chandelier with crystal drops", "chandeliers",
     "Crossed gold bands over four crystal drop balls. Suits a stairwell or a "
     "landing where the fitting is seen from below and from the side."),
    ("IMG-20260828-WA0029.jpg", "gold-black-pendant-cluster",
     "Gold and black pendant cluster", "chandeliers",
     "A crossed-ring cluster with four crystal drops, available in gold and in "
     "black. Shown here in both finishes."),
]

# The same three-ring chandelier as IMG-20260828-WA0025, photographed slightly
# tighter. Uploaded to the library so it is available as an alternate shot, but
# not given a second product — two identical items on a showcase page reads as
# a mistake rather than a range.
ALTERNATE_SHOTS = ["IMG-20260828-WA0027.jpg"]


def _upload(path: Path) -> dict:
    from ..routers.upload import _store_cloudinary

    return _store_cloudinary(path.read_bytes(), path.name, FOLDER)


def _record(db, path: Path, stored: dict, alt: str) -> MediaAsset:
    asset = MediaAsset(
        url=stored["url"], public_id=stored["public_id"], filename=path.name,
        bytes=path.stat().st_size, width=stored.get("width", 0),
        height=stored.get("height", 0), storage="cloudinary",
        folder=FOLDER, alt=alt, tags="fittings",
    )
    db.add(asset)
    return asset


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--apply", action="store_true",
                    help="write changes; without it nothing is modified")
    args = ap.parse_args()

    if not settings.cloudinary_configured:
        print("Cloudinary is not configured — set CLOUDINARY_* in .env first.")
        return 1
    if not SOURCE_DIR.is_dir():
        print(f"No source directory at {SOURCE_DIR}")
        return 1

    print(f"{'APPLYING' if args.apply else 'DRY RUN'} — {SOURCE_DIR}\n")
    db = SessionLocal()
    try:
        # ── categories ──────────────────────────────────────────────────
        existing_cats = {c.slug: c for c in db.scalars(select(ProductCategory)).all()}
        for i, (slug, name, description) in enumerate(CATEGORIES):
            if slug in existing_cats:
                print(f"  skip   category {name}")
                continue
            print(f"  create category {name}")
            if args.apply:
                cat = ProductCategory(slug=slug, name=name, description=description,
                                      position=i, published=True)
                db.add(cat)
                db.flush()
                existing_cats[slug] = cat
        if args.apply:
            db.commit()

        # ── fittings ────────────────────────────────────────────────────
        have = {p.slug for p in db.scalars(select(Product)).all()}
        made = 0
        for i, (filename, slug, name, cat_slug, summary) in enumerate(FITTINGS):
            path = SOURCE_DIR / filename
            if not path.exists():
                print(f"  !! {filename} is missing")
                continue
            if slug in have:
                print(f"  skip   {name}")
                continue
            if not args.apply:
                print(f"  create {name}  ({cat_slug})")
                made += 1
                continue

            stored = _upload(path)
            asset = _record(db, path, stored, name)
            db.add(Product(
                slug=slug, name=name, summary=summary,
                category_id=existing_cats[cat_slug].id,
                image_url=stored["url"], image_alt=name,
                position=i, published=True,
            ))
            db.flush()
            print(f"  create {name}  -> {asset.public_id}")
            made += 1

        # ── alternate shots, library only ───────────────────────────────
        for filename in ALTERNATE_SHOTS:
            path = SOURCE_DIR / filename
            if not path.exists():
                continue
            already = db.scalar(
                select(MediaAsset).where(MediaAsset.filename == filename)
            )
            if already:
                print(f"  skip   alternate shot {filename}")
                continue
            print(f"  upload alternate shot {filename} (library only)")
            if args.apply:
                _record(db, path, _upload(path), "Three-ring gold chandelier, alternate view")

        if args.apply:
            db.commit()
            print(f"\nDone — {made} fitting(s) created.")
        else:
            print(f"\n{made} fitting(s) would be created. Re-run with --apply.")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
