"""sitemap.xml and robots.txt, generated from the CMS.

The site shipped a hand-written sitemap.xml. It had drifted: it listed /work,
which has not been a route for some time, and the SPA answers unknown paths
with 200 and a "page not found" screen — so a crawler was being told to index
a not-found page. It also omitted /testimonials.

Generating from seo_meta removes the class of problem: the same rows the CMS
edits are the rows listed here, and unchecking "hide from search engines"
removes a page from the sitemap in the same edit.
"""

from xml.sax.saxutils import escape

from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import BlogPost, Product, SeoMeta, Service, SiteSetting, Testimonial

router = APIRouter(tags=["seo"])

# Where the site actually lives. Overridden by the `site_url` setting so this
# does not have to be redeployed to change domain.
DEFAULT_BASE = "https://premierpower.co.ke"

# Rough weighting. The home page and the two pages that win work rank above
# the supporting ones.
PRIORITY = {"/": "1.0", "/services": "0.9", "/portfolio": "0.9",
            "/products": "0.9", "/contact": "0.8"}

# A service gets its own page in search only once its description is long
# enough to stand alone. Must match SERVICE_PAGE_MIN_CHARS in
# frontend/src/seo/pages.js, which marks thinner ones noindex.
SERVICE_PAGE_MIN_CHARS = 600


def _base(db: Session) -> str:
    row = db.scalar(select(SiteSetting).where(SiteSetting.key == "site_url"))
    return (row.value.strip().rstrip("/") if row and row.value.strip() else DEFAULT_BASE)


@router.get("/sitemap.xml", include_in_schema=False)
def sitemap(db: Session = Depends(get_db)) -> Response:
    base = _base(db)

    rows = db.scalars(
        select(SeoMeta).where(SeoMeta.noindex.is_(False)).order_by(SeoMeta.path)
    ).all()
    listed = {r.path for r in rows}

    # A reviews page with no reviews is marked noindex by the page itself;
    # suggesting it to search engines would contradict that.
    has_reviews = db.scalar(select(Testimonial.id).where(Testimonial.published.is_(True)).limit(1))
    # (path, priority, lastmod or None). lastmod only where a real date is
    # known: a "changed today" stamp on every URL every day teaches search
    # engines to ignore the field.
    paths = [(r.path, PRIORITY.get(r.path, "0.7"), None) for r in rows
             if not (r.path == "/testimonials" and not has_reviews)]

    # Detail pages have no seo_meta row of their own — there is one row for
    # /products, not one per fitting — so they would never be listed. Appended
    # here, and only while their parent page is itself indexable.
    if "/products" in listed:
        paths += [
            (f"/products/{slug}", "0.6", None)
            for slug in db.scalars(
                select(Product.slug).where(Product.published.is_(True))
                .order_by(Product.position, Product.id)
            ).all()
        ]

    if "/services" in listed:
        for svc in db.scalars(
            select(Service).where(Service.published.is_(True)).order_by(Service.position, Service.id)
        ).all():
            if len(f"{svc.lede or ''} {svc.body or ''}".strip()) >= SERVICE_PAGE_MIN_CHARS:
                paths.append((f"/services/{svc.slug}", "0.8", None))

    posts = db.scalars(
        select(BlogPost).where(BlogPost.published.is_(True))
        .order_by(BlogPost.published_at.desc().nullslast(), BlogPost.id.desc())
    ).all()
    if posts:
        newest = next((p.published_at for p in posts if p.published_at), None)
        paths.append(("/insights", "0.7", newest.date().isoformat() if newest else None))
        paths += [
            (f"/insights/{p.slug}", "0.6", p.published_at.date().isoformat() if p.published_at else None)
            for p in posts
        ]

    urls = "\n".join(
        f"  <url>\n"
        f"    <loc>{escape(base + path)}</loc>\n"
        + (f"    <lastmod>{lastmod}</lastmod>\n" if lastmod else "")
        + f"    <priority>{priority}</priority>\n"
        f"  </url>"
        for path, priority, lastmod in paths
    )
    body = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{urls}\n"
        "</urlset>\n"
    )
    return Response(body, media_type="application/xml")


@router.get("/robots.txt", include_in_schema=False)
def robots(db: Session = Depends(get_db)) -> Response:
    base = _base(db)
    hidden = db.scalars(
        select(SeoMeta).where(SeoMeta.noindex.is_(True)).order_by(SeoMeta.path)
    ).all()

    lines = ["User-agent: *"]
    # The CMS is not content and should never be crawled, whatever the
    # seo_meta table says.
    lines += ["Disallow: /admin", "Disallow: /sqladmin"]
    lines += [f"Disallow: {r.path}" for r in hidden]
    lines += ["Allow: /", "", f"Sitemap: {base}/sitemap.xml", ""]
    return Response("\n".join(lines), media_type="text/plain")
