"""Admin authentication — JWT bearer tokens over bcrypt-hashed passwords."""

from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Admin
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
        # Bumping token_version on the admin logs every existing session out.
        "ver": admin.token_version,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


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


def require_superuser(admin: Admin = Depends(get_current_admin)) -> Admin:
    if not admin.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Superuser only")
    return admin


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
