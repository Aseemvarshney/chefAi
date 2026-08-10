import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./chefai.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "chefai-super-secret-jwt-key-2024-please-change-me")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    APP_NAME: str = os.getenv("APP_NAME", "ChefAI")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"

settings = Settings()
