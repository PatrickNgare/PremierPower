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


settings = Settings()
