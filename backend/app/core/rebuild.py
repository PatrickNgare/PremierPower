"""Ask Vercel to rebuild the site after content changes that affect its HTML.

Each public page's HTML carries its own title, description and structured
data, written at build time from the API (frontend/scripts/seo-html.mjs). A
service, product or article added in the CMS shows on the site at once, but
only gets its own pre-written HTML at the next build. Set VERCEL_DEPLOY_HOOK
(Vercel → Project → Settings → Git → Deploy Hooks) and this triggers that
build automatically.

Debounced: the build starts REBUILD_DELAY seconds after the last change, so an
editing session of twenty saves costs one build, not twenty. Best-effort and
off the request path: a failed call is logged and never affects the save.
"""

import logging
import threading
import urllib.request

from ..settings import settings

log = logging.getLogger(__name__)

# Entities whose changes alter some page's HTML head or the set of pages.
AFFECTS_HTML = {"service", "product", "post", "seo", "faq", "testimonial", "banner"}
REBUILD_DELAY = 300.0

_timer: threading.Timer | None = None
_lock = threading.Lock()


def _fire() -> None:
    try:
        req = urllib.request.Request(settings.vercel_deploy_hook, method="POST", data=b"")
        with urllib.request.urlopen(req, timeout=20) as res:
            log.info("site rebuild requested (HTTP %s)", res.status)
    except Exception as e:  # noqa: BLE001 — best-effort by design
        log.warning("site rebuild request failed: %s", e)


def schedule_rebuild(entity: str) -> None:
    if not settings.vercel_deploy_hook or entity not in AFFECTS_HTML:
        return
    global _timer
    with _lock:
        if _timer is not None:
            _timer.cancel()
        _timer = threading.Timer(REBUILD_DELAY, _fire)
        _timer.daemon = True
        _timer.start()
