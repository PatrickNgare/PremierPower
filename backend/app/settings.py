from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://premierpower:premierpower@localhost:5432/premierpower"

    @field_validator("database_url")
    @classmethod
    def _psycopg_driver(cls, v: str) -> str:
        """Hosts such as Render hand out `postgres://` or `postgresql://` URLs.
        SQLAlchemy reads either as "use psycopg2", which is not installed, and
        fails at the first connection. Name the installed psycopg 3 driver."""
        for prefix in ("postgres://", "postgresql://"):
            if v.startswith(prefix):
                return "postgresql+psycopg://" + v[len(prefix):]
        return v

    # Seed superuser, created on first startup if no admin exists.
    admin_username: str = "admin"
    admin_email: str = "admin@premierpower.co.ke"
    admin_password: str = "change-me"

    secret_key: str = "change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480  # 8 hours

    cors_origins: str = "http://localhost:5173"

    # Where new enquiries are emailed. Blank disables the email entirely —
    # the enquiry is still saved and still appears in the admin.
    notify_email: str = ""
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    # STARTTLS on 587, implicit TLS on 465. Only turn this off for a local
    # relay you control.
    smtp_tls: bool = True

    # Media. Cloudinary is used when configured; otherwise files are written to
    # local disk and served from /uploads.
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    # PDFs stay on local disk even when Cloudinary is configured. Cloudinary
    # blocks delivery of PDF and ZIP files by default at the account level: the
    # upload succeeds, the resource is public, and the CDN still answers 401.
    # Turn this on only after enabling "Allow delivery of PDF and ZIP files"
    # under Settings -> Security in the Cloudinary console.
    cloudinary_documents: bool = False
    upload_dir: str = "uploads"
    max_upload_mb: int = 10

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def email_configured(self) -> bool:
        return bool(self.smtp_host and self.notify_email)

    @property
    def mail_from(self) -> str:
        # Falls back to the authenticating user, which is what most providers
        # require the From header to match anyway.
        return self.smtp_from or self.smtp_user or self.notify_email

    @property
    def cloudinary_configured(self) -> bool:
        return bool(self.cloudinary_cloud_name and self.cloudinary_api_key and self.cloudinary_api_secret)

    @property
    def cloudinary_documents_enabled(self) -> bool:
        return self.cloudinary_configured and self.cloudinary_documents


def _validate(s: "Settings") -> None:
    """Refuse to run with the shipped placeholder secret, and warn on a key too
    short to sign tokens safely. PyJWT reports anything under 32 bytes as below
    the RFC 7518 minimum for HS256; a guessable key means forgeable admin
    sessions."""
    import logging

    log = logging.getLogger("premierpower.settings")

    # Postgres is the only supported database, in development, in tests and in
    # production. Failing here is better than failing later: the schema uses
    # Postgres types and the migrations emit Postgres DDL, so another engine
    # gets some distance in and then breaks somewhere far less obvious.
    if not s.database_url.startswith("postgresql"):
        raise RuntimeError(
            f"DATABASE_URL must be a PostgreSQL URL, got {s.database_url.split(':', 1)[0]!r}. "
            "This application supports PostgreSQL only."
        )

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
