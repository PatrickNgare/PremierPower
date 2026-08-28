"""Admin authentication — JWT bearer tokens over bcrypt-hashed passwords."""

from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import ROLE_EDITOR, ROLE_OWNER, ROLE_RANK, ROLE_VIEWER, Admin
from ..settings import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/admin/login", auto_error=False)

CREDENTIALS_ERROR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


# bcrypt hashes at most 72 bytes and raises rather than truncating, so the
# limit is applied here explicitly. passlib is deliberately not used: it is
# unmaintained and its backend detection crashes against bcrypt 5.x.
_BCRYPT_MAX = 72


def _prepared(password: str) -> bytes:
    return password.encode("utf-8")[:_BCRYPT_MAX]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_prepared(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_prepared(plain), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(admin: Admin) -> str:
    payload = {
        "sub": str(admin.id),
        "email": admin.email,
        "superuser": admin.is_superuser,
        "role": effective_role(admin),
        # Bumping token_version on the admin logs every existing session out.
        "ver": admin.token_version,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_preview_token(minutes: int = 30) -> str:
    """Short-lived token that lets the public site render drafts.

    Scoped to previewing and nothing else: it carries no admin identity, so a
    leaked preview link exposes unpublished content for half an hour and grants
    no write access at all.
    """
    return jwt.encode(
        {"scope": "preview", "exp": datetime.now(timezone.utc) + timedelta(minutes=minutes)},
        settings.secret_key,
        algorithm=settings.algorithm,
    )


def preview_ok(token: str | None) -> bool:
    if not token:
        return False
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except jwt.PyJWTError:
        return False
    return payload.get("scope") == "preview"


def get_current_admin(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Admin:
    if not token:
        raise CREDENTIALS_ERROR
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except jwt.PyJWTError:
        raise CREDENTIALS_ERROR from None

    admin = db.get(Admin, int(payload.get("sub", 0)))
    if admin is None or not admin.is_active:
        raise CREDENTIALS_ERROR
    # A password reset or a forced logout invalidates tokens issued earlier.
    if payload.get("ver") != admin.token_version:
        raise CREDENTIALS_ERROR
    return admin


def effective_role(admin: Admin) -> str:
    """A superuser is an owner whatever the role column says.

    is_superuser predates roles and is what seeds the first account. Deriving
    rather than trusting the column means an owner cannot be demoted into
    locking everyone out of the settings that only an owner can reach.
    """
    if admin.is_superuser:
        return ROLE_OWNER
    return admin.role if admin.role in ROLE_RANK else ROLE_VIEWER


def require_role(minimum: str):
    """Dependency factory: refuse anyone ranked below `minimum`.

    viewer  — reads everything, writes nothing.
    editor  — writes content: pages, products, projects, media, the inbox.
    owner   — the above, plus admin users, roles and destructive deletes.
    """
    floor = ROLE_RANK[minimum]

    def guard(admin: Admin = Depends(get_current_admin)) -> Admin:
        if ROLE_RANK[effective_role(admin)] < floor:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action needs the {minimum} role",
            )
        return admin

    return guard


require_editor = require_role(ROLE_EDITOR)
require_owner = require_role(ROLE_OWNER)


def require_superuser(admin: Admin = Depends(get_current_admin)) -> Admin:
    if not admin.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Superuser only")
    return admin


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
