import json
import logging
import asyncio
import os
import sys
import pandas as pd
from pathlib import Path
from typing import List, Dict, Any

from backend.app.ai_advisor.data_pipelines.law_ingestion import DATA_ROOT

# --- إعداد المسارات ---
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent.parent.parent
sys.path.insert(0, str(backend_dir))

from app.ai_advisor.rag.pgvector_manager import PgVectorManager
from app.ai_advisor.core.hybrid_embedder import HybridEmbedder

# --- إعدادات السكريبت ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

AI_DATABASE_URL = os.getenv("AI_DATABASE_URL")
if not AI_DATABASE_URL:
    logger.error("❌ متغير البيئة AI_DATABASE_URL غير مُعد.")
    sys.exit(1)

class ExcelIngestionPipeline:
    """
    خط أنابيب لابتلاع بيانات منظمة (مثل المصطلحات) من ملفات Excel.
    """
    
    def __init__(self, db_url: str):
        self.db_manager = PgVectorManager(database_url=db_url)
        self.embedder = HybridEmbedder() # (سيستخدم النموذج الافتراضي BGE)
    
    async def initialize(self):
        await self.db_manager.initialize()

    async def ingest_glossary(self, 
                              file_path: str, 
                              doc_title: str = "مسرد المصطلحات القانونية",
                              doc_type: str = "template"): # (أو أي نوع مخصص)
        """
        ابتلاع مسرد مصطلحات (عمود 'المصطلح' وعمود 'التعريف').
        """
        logger.info(f"بدء ابتلاع Excel: {file_path}")
        try:
            df = pd.read_excel(file_path)
            # (تأكد من أن أسماء الأعمدة مطابقة للملف)
            if "المصطلح" not in df.columns or "التعريف" not in df.columns:
                logger.error("❌ ملف Excel يجب أن يحتوي على عمودي 'المصطلح' و 'التعريف'")
                return

            # --- 1. إنشاء مستند أب واحد للمسرد ---
            metadata = {
                "title": doc_title,
                "document_type": doc_type,
                "file_path": str(Path(file_path).resolve()),
                "source_url": "local_excel_glossary"
            }
            document_id = await self.db_manager.store_document(metadata)
            logger.info(f"تم إنشاء المستند الأب (ID: {document_id}) للمسرد.")

            # --- 2. تجهيز الأجزاء (Chunks) ---
            chunks_data = []
            for index, row in df.iterrows():
                term = str(row["المصطلح"]).strip()
                definition = str(row["التعريف"]).strip()
                
                if not term or not definition:
                    continue
                    
                chunk_text = f"مصطلح: {term}\nتعريف: {definition}"
                chunk_metadata = {
                    "source_type": "glossary_term",
                    "term": term,
                    "document_title": doc_title,
                    "document_id": document_id
                }
                
                # (نحتاج كائن وهمي يشبه 'TextChunk' لتمريره)
                # هذا ليس نظيفاً جداً، لكنه يتجنب إعادة كتابة 'store_chunks'
                # (للتطوير: يجب تعديل 'store_chunks' ليقبل نصوص خام)
                
                # سنقوم بإنشاء التضمينات هنا مباشرة
                chunks_data.append({
                    "text": chunk_text,
                    "metadata": chunk_metadata
                })

            if not chunks_data:
                logger.warning("لم يتم العثور على مصطلحات صالحة في الملف.")
                return

            # --- 3. إنشاء التضمينات وتخزينها دفعة واحدة ---
            texts = [c["text"] for c in chunks_data]
            embeddings = await self.embedder.get_embeddings(texts)
            
            # (سنقوم باستدعاء الدالة الداخلية لـ pgvector مباشرة)
            async with self.db_manager.pool.acquire() as conn:
                async with conn.transaction():
                    for i, (chunk, embedding) in enumerate(zip(chunks_data, embeddings)):
                        await conn.execute('''
                            INSERT INTO ai_document_chunks 
                            (document_id, chunk_text, chunk_index, embedding, metadata, token_count)
                            VALUES ($1, $2, $3, $4, $5, $6)
                        ''', 
                            document_id,
                            chunk["text"],
                            i,
                            embedding.tolist(),
                            json.dumps(chunk["metadata"]),
                            len(chunk["text"].split()) # (تقدير تقريبي للتوكنز)
                        )
            
            logger.info(f"✅ تم ابتلاع {len(chunks_data)} مصطلح من ملف Excel.")

        except Exception as e:
            logger.error(f"❌ فشل ابتلاع ملف Excel: {e}", exc_info=True)

async def main_excel():
    pipeline = ExcelIngestionPipeline(db_url=AI_DATABASE_URL)
    await pipeline.initialize()
    
    # (افترض وجود ملف مصطلحات في مجلد data)
    glossary_file = DATA_ROOT / "مسرد_مصطلحات.xlsx"
    if glossary_file.exists():
        await pipeline.ingest_glossary(str(glossary_file))
    else:
        logger.warning(f"ملف المسرد {glossary_file} غير موجود، سيتم التخطي.")

# (يمكنك تشغيل هذا السكريبت بشكل منفصل)
# if __name__ == "__main__":
#     asyncio.run(main_excel())