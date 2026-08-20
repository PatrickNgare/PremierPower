from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://premierpower:premierpower@localhost:5432/premierpower"
    admin_username: str = "admin"
    admin_password: str = "change-me"
    secret_key: str = "change-me"
    cors_origins: str = "http://localhost:5173"
    notify_email: str = ""

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
