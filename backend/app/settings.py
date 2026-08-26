from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://premierpower:premierpower@localhost:5432/premierpower"

    # Seed superuser, created on first startup if no admin exists.
    admin_username: str = "admin"
    admin_email: str = "admin@premierpower.co.ke"
    admin_password: str = "change-me"

    secret_key: str = "change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480  # 8 hours

    cors_origins: str = "http://localhost:5173"
    notify_email: str = ""

    # Media. Cloudinary is used when configured; otherwise files are written to
    # local disk and served from /uploads.
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    upload_dir: str = "uploads"
    max_upload_mb: int = 10

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def cloudinary_configured(self) -> bool:
        return bool(self.cloudinary_cloud_name and self.cloudinary_api_key and self.cloudinary_api_secret)


def _validate(s: "Settings") -> None:
    """Refuse to run with the shipped placeholder secret, and warn on a key too
    short to sign tokens safely. PyJWT reports anything under 32 bytes as below
    the RFC 7518 minimum for HS256; a guessable key means forgeable admin
    sessions."""
    import logging

    log = logging.getLogger("premierpower.settings")

    if s.secret_key in ("", "change-me"):
        raise RuntimeError(
            "SECRET_KEY is unset or still the placeholder. Generate one with: "
            "python -c \"import secrets; print(secrets.token_urlsafe(48))\""
        )
    if len(s.secret_key.encode()) < 32:
        log.warning(
            "SECRET_KEY is %d bytes; 32 or more is recommended for HS256.",
            len(s.secret_key.encode()),
        )
    if s.admin_password in ("", "change-me"):
        log.warning("ADMIN_PASSWORD is unset or the placeholder; no superuser will be seeded.")


settings = Settings()
_validate(settings)
