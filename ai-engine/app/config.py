import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    env: str = os.getenv("ENV", "development")
    port: int = int(os.getenv("PORT", "8000"))
    log_level: str = os.getenv("LOG_LEVEL", "info")
    enable_training_endpoint: bool = os.getenv("ENABLE_TRAINING_ENDPOINT", "false") == "true"


settings = Settings()
