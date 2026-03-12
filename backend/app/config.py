from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://gantchart:gantchart_dev@localhost:5432/gantchart"
    cors_origins: str = "http://localhost:3000"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    api_key: str = ""
    rate_limit: str = "60/minute"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
