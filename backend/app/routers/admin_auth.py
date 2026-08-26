"""Admin accounts: login, identity, user management, password change."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.audit import log_action
from ..core.throttle import too_many
from ..core.security import (
    client_ip, create_access_token, get_current_admin,
    hash_password, require_superuser, verify_password,
)
from ..db import get_db
from ..models import Admin
from ..schemas import AdminCreate, AdminOut, PasswordChange, Token

router = APIRouter(tags=["admin"])


# Ten attempts per address per five minutes. Slow enough to stop credential
# stuffing, loose enough that a person mistyping a password is unaffected.
LOGIN_LIMIT = 10
LOGIN_WINDOW = 300.0


@router.post("/login", response_model=Token)
def login(request: Request, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    ip = client_ip(request)
    if too_many(f"login:{ip}", limit=LOGIN_LIMIT, window=LOGIN_WINDOW):
        log_action(db, actor=form.username or "unknown", action="login-throttled",
                   entity="admin", ip=ip)
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Too many sign-in attempts. Try again shortly.",
        )

    admin = db.scalar(select(Admin).where(Admin.email == form.username))
    if admin is None or not admin.is_active or not verify_password(form.password, admin.password_hash):
        # One message for both cases: never reveal which accounts exist.
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    log_action(db, actor=admin.email, action="login", entity="admin",
               entity_id=admin.id, ip=ip)
    return Token(access_token=create_access_token(admin))


@router.get("/me", response_model=AdminOut)
def me(admin: Admin = Depends(get_current_admin)):
    return admin


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: PasswordChange, request: Request,
    db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin),
):
    if not verify_password(payload.current_password, admin.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect")
    admin.password_hash = hash_password(payload.new_password)
    # Every token issued before this change stops working.
    admin.token_version += 1
    db.commit()
    log_action(db, actor=admin.email, action="change-password", entity="admin",
               entity_id=admin.id, ip=client_ip(request))


@router.post("/logout-everywhere", status_code=status.HTTP_204_NO_CONTENT)
def logout_everywhere(
    request: Request, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin),
):
    admin.token_version += 1
    db.commit()
    log_action(db, actor=admin.email, action="logout-everywhere", entity="admin",
               entity_id=admin.id, ip=client_ip(request))


@router.get("/users", response_model=list[AdminOut])
def list_users(db: Session = Depends(get_db), _: Admin = Depends(require_superuser)):
    return db.scalars(select(Admin).order_by(Admin.id)).all()


@router.post("/users", response_model=AdminOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: AdminCreate, request: Request,
    db: Session = Depends(get_db), actor: Admin = Depends(require_superuser),
):
    if db.scalar(select(Admin).where(Admin.email == payload.email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "That email already has an account")
    admin = Admin(
        email=payload.email, name=payload.name,
        password_hash=hash_password(payload.password),
        is_superuser=payload.is_superuser,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    log_action(db, actor=actor.email, action="create", entity="admin",
               entity_id=admin.id, detail=admin.email, ip=client_ip(request))
    return admin


@router.delete("/users/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    id: int, request: Request,
    db: Session = Depends(get_db), actor: Admin = Depends(require_superuser),
):
    if id == actor.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot delete your own account")
    admin = db.get(Admin, id)
    if admin is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Admin not found")
    email = admin.email
    db.delete(admin)
    db.commit()
    log_action(db, actor=actor.email, action="delete", entity="admin",
               entity_id=id, detail=email, ip=client_ip(request))
