import logging
import asyncio
import os
import sys
from typing import Set, Dict, Any, List, Tuple
from pathlib import Path

# --- إعداد المسارات (مهم للتشغيل كسكريبت) ---
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent.parent.parent 
sys.path.insert(0, str(backend_dir))

from app.ai_advisor.rag.semantic_retriever import SemanticRetriever
from app.ai_advisor.rag.pgvector_manager import PgVectorManager
from app.ai_advisor.rag.advanced_pdf_processor import AdvancedPDFProcessor  # تأكد من استيراد هذا

# --- إعدادات السكريبت ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ⚠️ ضبط متغير البيئة قبل استخدامه
os.environ['AI_DATABASE_URL'] = 'postgresql+asyncpg://postgres:123456@localhost:5432/legal_ai'
AI_DATABASE_URL = os.getenv("AI_DATABASE_URL")

if not AI_DATABASE_URL:
    logger.error("❌ متغير البيئة AI_DATABASE_URL غير مُعد.")
    sys.exit(1)

# المسار إلى مجلد البيانات الرئيسي
DATA_ROOT = backend_dir / "data"

COUNTRIES = [
    "egypt", "saudi_arabia", "uae", "jordan", "lebanon", "syria", "iraq",
    "qatar", "kuwait", "bahrain", "oman", "yemen", "palestine", "libya", 
    "tunisia", "algeria", "morocco", "mauritania", "sudan", "somalia",
    "djibouti", "comoros"
]

DOCUMENT_CATEGORIES = {
    "01_constitutions": "constitution",
    "02_decisions": "decision", 
    "03_reports": "report",
    "04_laws": "law",
    "05_judgments": "judgment",
    "06_international_agreements": "international_agreement",
    "07_legal_templates": "legal_template"
}

# جميع أنواع الملفات المدعومة
SUPPORTED_FILE_TYPES = {
    '.pdf', '.txt', '.md', '.docx', '.doc', 
    '.jpg', '.jpeg', '.png', '.tiff', '.bmp'
}

class LawIngestionPipeline:
    """خط أنابيب ابتلاع المستندات القانونية"""
    
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.retriever = None
        self.pdf_processor = AdvancedPDFProcessor()
        
    async def initialize(self):
        """تهيئة الخدمات"""
        logger.info("🔗 محاولة الاتصال بقاعدة البيانات...")
        self.retriever = SemanticRetriever(database_url=self.database_url)
        await self.retriever.initialize()
        logger.info("✅ تم تهيئة المسترجع الدلالي بنجاح")
    
    async def get_processed_files(self) -> Set[str]:
        """جلب قائمة الملفات المعالجة مسبقاً"""
        logger.info("جاري جلب قائمة الملفات المعالجة مسبقاً...")
        processed_files = set()
        try:
            async with self.retriever.vector_db.pool.acquire() as conn:
                rows = await conn.fetch("SELECT file_path FROM ai_legal_documents WHERE file_path IS NOT NULL")
                for row in rows:
                    processed_files.add(str(Path(row['file_path']).resolve()))
            logger.info(f"تم العثور على {len(processed_files)} ملف تمت معالجته.")
            return processed_files
        except Exception as e:
            logger.error(f"❌ فشل في جلب الملفات المعالجة: {e}")
            return processed_files

    async def find_all_files(self) -> List[Tuple[Path, str, str]]:
        """البحث عن جميع الملفات المدعومة في هيكل المجلدات"""
        files_to_process = []
        
        for country in COUNTRIES:
            country_path = DATA_ROOT / "countries" / country
            
            if not country_path.exists():
                logger.debug(f"مجلد الدولة غير موجود: {country_path}")
                continue
                
            for category_folder, doc_type in DOCUMENT_CATEGORIES.items():
                category_path = country_path / category_folder
                
                if not category_path.exists():
                    logger.debug(f"مجلد التصنيف غير موجود: {category_path}")
                    continue
                    
                # البحث عن جميع أنواع الملفات المدعومة في المجلد
                for file_type in SUPPORTED_FILE_TYPES:
                    for file_path in category_path.rglob(f"*{file_type}"):
                        files_to_process.append((file_path, doc_type, country))
                    
        return files_to_process

    async def process_file(self, file_path: Path, doc_type: str, country: str) -> bool:
        """معالجة ملف فردي"""
        try:
            logger.info(f"--- بدء معالجة: {file_path.name} (البلد: {country}, النوع: {doc_type}) ---")
            
            # البيانات الوصفية الأساسية
            metadata = {
                "title": file_path.stem,
                "file_path": str(file_path.resolve()),
                "file_size": file_path.stat().st_size,
                "document_type": doc_type,
                "country": country,
                "source_folder": file_path.parent.name,
                "file_extension": file_path.suffix.lower()
            }

            # استدعاء الخدمة الرئيسية للابتلاع
            result = await self.retriever.ingest_legal_document(
                pdf_path=str(file_path),
                metadata=metadata
            )
            
            if result.get("success"):
                logger.info(f"✅ تم ابتلاع {file_path.name} بنجاح.")
                logger.info(f"   (ID: {result.get('document_id')}, المواد: {result.get('articles_processed')}, الأجزاء: {result.get('chunks_created')})")
                return True
            else:
                logger.error(f"❌ فشل ابتلاع {file_path.name}: {result.get('error')}")
                return False

        except Exception as e:
            logger.error(f"❌ فشل كارثي أثناء معالجة {file_path.name}: {e}", exc_info=True)
            return False

    async def run_pipeline(self):
        """تشغيل خط الأنابيب الرئيسي"""
        logger.info("🚀 بدء تشغيل خط أنابيب ابتلاع المستندات...")
        
        # 1. تهيئة الخدمات
        await self.initialize()

        # 2. جلب الملفات الموجودة
        processed_files = await self.get_processed_files()

        # 3. البحث عن ملفات جديدة
        logger.info(f"البحث عن ملفات جديدة في: {DATA_ROOT}")
        all_files = await self.find_all_files()
        
        files_to_process = []
        for file_path, doc_type, country in all_files:
            resolved_path_str = str(file_path.resolve())
            if resolved_path_str not in processed_files:
                files_to_process.append((file_path, doc_type, country))
            else:
                logger.debug(f"تخطي ملف موجود: {file_path.name}")

        if not files_to_process:
            logger.info("✅ لا توجد ملفات جديدة للمعالجة. النظام محدث.")
            return

        logger.info(f"تم العثور على {len(files_to_process)} ملف جديد للمعالجة...")

        # 4. معالجة الملفات الجديدة
        successful_ingests = 0
        failed_ingests = 0

        for file_path, doc_type, country in files_to_process:
            success = await self.process_file(file_path, doc_type, country)
            if success:
                successful_ingests += 1
            else:
                failed_ingests += 1
            logger.info("--- انتهاء معالجة الملف ---")

        logger.info("🏁 اكتمل خط الأنابيب.")
        logger.info(f"ملخص: {successful_ingests} نجاح، {failed_ingests} فشل.")

async def main():
    """الوظيفة الرئيسية"""
    pipeline = LawIngestionPipeline(database_url=AI_DATABASE_URL)
    await pipeline.run_pipeline()

if __name__ == "__main__":
    asyncio.run(main())