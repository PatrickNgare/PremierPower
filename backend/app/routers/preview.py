"""Preview links.

An editor working on a draft needs to see it on the real site, not in a form.
This mints a short-lived token that the public endpoints accept in place of the
published filter — so `/?preview=<token>` renders the site as it would look if
everything currently in draft were live.

The token carries no identity and grants no writes, so a preview link forwarded
to a client shows them unpublished content and nothing else.
"""

from fastapi import APIRouter, Depends

from ..core.security import create_preview_token, get_current_admin
from ..models import Admin

router = APIRouter(tags=["preview"])

PREVIEW_MINUTES = 30


@router.post("/token")
def mint(_: Admin = Depends(get_current_admin)) -> dict[str, str | int]:
    return {"token": create_preview_token(PREVIEW_MINUTES), "expires_in_minutes": PREVIEW_MINUTES}
