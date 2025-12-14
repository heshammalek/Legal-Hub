# backend/load_law_file.py
import asyncio
import os
from dotenv import load_dotenv
from app.ai_advisor.services.expert_legal_advisor import ExpertLegalAdvisor

async def main():
    load_dotenv()
    
    # خد database_url من environment variables
    database_url = os.getenv("AI_DATABASE_URL")
    
    if not database_url:
        print("❌ AI_DATABASE_URL مش موجود في ملف .env")
        return
    
    advisor = ExpertLegalAdvisor(database_url)  # ✅ الآن كامل
    
    result = await advisor.ingest_law_document(
        "backend/data/laws/labor_law.pdf",
        {
            "title": "قانون العمل المصري", 
            "type": "law",
            "jurisdiction": "EG"
        }
    )
    print("نتيجة التحميل:", result)

asyncio.run(main())