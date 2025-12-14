# config/settings.py
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME = "Academic Learning Platform"
    VERSION = "1.0.0"
    
    # Database - صحح اسم الداتابيز
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:123456@localhost:5432/academic_platform")
    
    # Security
    SECRET_KEY = os.getenv("SECRET_KEY", "academic-platform-super-secret-2024-change-in-production")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
    
    # AI Integration
    AI_ADVISOR_URL = os.getenv("AI_ADVISOR_URL", "http://localhost:8001")

settings = Settings()