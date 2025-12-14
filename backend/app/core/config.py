import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from cryptography.fernet import Fernet

# تحميل متغيرات البيئة من .env
load_dotenv()

class Settings(BaseSettings):
    # 📦 قاعدة البيانات
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://legal_user:legal_password@localhost:5432/legal_hub")

    # 🔐 الحماية
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

    # 🔑 التشفير
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "")

    # 📧 البريد الإلكتروني
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")

    # ⚙️ إعدادات التطبيق
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Legal Hub")
    VERSION: str = os.getenv("VERSION", "1.0.0")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"

    # 🤖 مفاتيح الذكاء الاصطناعي
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GOOGLE_APPLICATION_CREDENTIALS: str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
    COHERE_API_KEY: str = os.getenv("COHERE_API_KEY", "")
    TOGETHER_API_KEY: str = os.getenv("TOGETHER_API_KEY", "")
    PERPLEXITY_API_KEY: str = os.getenv("PERPLEXITY_API_KEY", "")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# 🔐 دالة لاسترجاع مفتاح التشفير بصيغة bytes
def get_encryption_key() -> bytes:
    key = settings.ENCRYPTION_KEY
    if not key:
        raise ValueError("❌ ENCRYPTION_KEY is missing from environment variables.")
    return key.encode()
