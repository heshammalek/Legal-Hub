# backend/app/ai_advisor/rag/pgvector_manager.py
import asyncpg
from asyncpg.pool import Pool
import numpy as np
from typing import List, Dict, Any, Optional
import logging
from dataclasses import dataclass
import json
from datetime import datetime
from ..core.hybrid_embedder import HybridEmbedder


logger = logging.getLogger(__name__)

@dataclass
class DocumentChunk:
    id: int
    text: str
    embedding: np.ndarray
    metadata: Dict[str, Any]
    similarity: float = 0.0

class PgVectorManager:
    """مدير متقدم لقاعدة البيانات المتجهة باستخدام PostgreSQL + pgvector"""
    
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.pool = None
    
    async def initialize(self):
        """تهيئة قاعدة البيانات والجداول"""
        try:
            # تحويل من تنسيق SQLAlchemy إلى تنسيق asyncpg
            if self.database_url.startswith('postgresql+asyncpg://'):
                # تحويل: postgresql+asyncpg://user:pass@host:port/dbname
                # إلى: postgresql://user:pass@host:port/dbname
                asyncpg_url = self.database_url.replace('postgresql+asyncpg://', 'postgresql://')
            else:
                asyncpg_url = self.database_url
            
            logger.info(f"🔗 محاولة الاتصال بقاعدة البيانات: {asyncpg_url}")
            
            self.pool = await asyncpg.create_pool(
                asyncpg_url,
                min_size=5,
                max_size=20
            )
            
            async with self.pool.acquire() as conn:
                # التحقق من وجود pgvector
                await conn.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                await self._create_tables(conn)
                
            logger.info("✅ تم تهيئة قاعدة البيانات المتجهة بنجاح")
            return True
            
        except Exception as e:
            logger.error(f"❌ فشل تهيئة قاعدة البيانات: {e}")
            return False

    async def _create_tables(self, conn):
        """إنشاء الجداول المطلوبة"""
        # جدول المستندات القانونية (محدث)
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS ai_legal_documents (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                content TEXT,
                metadata JSONB,
                document_type VARCHAR(100),
                country VARCHAR(100),
                file_path VARCHAR(1000),
                file_size INTEGER,
                processing_stats JSONB,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        ''')
        
        # جدول أجزاء المستندات مع التضمينات (محدث)
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS ai_document_chunks (
                id SERIAL PRIMARY KEY,
                document_id INTEGER REFERENCES ai_legal_documents(id) ON DELETE CASCADE,
                chunk_text TEXT NOT NULL,
                embedding VECTOR(768),
                metadata JSONB,
                article_number VARCHAR(50),
                created_at TIMESTAMP DEFAULT NOW()
            )
        ''')
        
        # إنشاء الفهارس
        await conn.execute('''
            CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding 
            ON ai_document_chunks USING ivfflat (embedding vector_cosine_ops)
        ''')
        
        await conn.execute('''
            CREATE INDEX IF NOT EXISTS idx_document_type ON ai_legal_documents(document_type)
        ''')
        
        await conn.execute('''
            CREATE INDEX IF NOT EXISTS idx_country ON ai_legal_documents(country)
        ''')
        
        await conn.execute('''
            CREATE INDEX IF NOT EXISTS idx_article_number ON ai_document_chunks(article_number)
        ''')
        
        logger.info("✅ تم إنشاء/التأكد من الجداول والفهارس")

    async def store_document(self, metadata: Dict[str, Any]) -> int:
        """تخزين مستند جديد"""
        async with self.pool.acquire() as conn:
            document_id = await conn.fetchval('''
                INSERT INTO ai_legal_documents 
                (title, document_type, source_url, jurisdiction, language, file_path, file_size, page_count, processing_status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id
            ''', 
                metadata.get('title', 'Unknown'),
                metadata.get('document_type', 'law'),
                metadata.get('source_url'),
                metadata.get('jurisdiction', 'EG'),
                metadata.get('language', 'ar'),
                metadata.get('file_path'),
                metadata.get('file_size'),
                metadata.get('page_count'),
                'processed'
            )
            
            return document_id

    async def store_chunks_with_embeddings_fixed(self, document_id: int, chunks: List[Any], embedder: HybridEmbedder):
        """تخزين الأجزاء مع التضمينات - الإصدار المصحح النهائي"""
        try:
            # استخراج النصوص من الـ chunks
            texts = [chunk.text for chunk in chunks]
            
            # إنشاء التضمينات
            embeddings = await embedder.get_embeddings(texts)
            
            async with self.pool.acquire() as conn:
                async with conn.transaction():
                    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                        # ✅ التحويل الآمن للتضمين
                        if hasattr(embedding, 'tolist'):
                            embedding_list = embedding.tolist()
                        else:
                            embedding_list = list(embedding)
                        
                        # ✅ التأكد من أن جميع العناصر هي floats
                        embedding_list = [float(x) for x in embedding_list]
                        
                        # ✅ التحويل إلى string format الذي يتعرف عليه pgvector
                        # التنسيق الصحيح: '[0.1, 0.2, 0.3]'
                        embedding_str = '[' + ','.join(map(str, embedding_list)) + ']'
                        
                        await conn.execute('''
                            INSERT INTO ai_document_chunks 
                            (document_id, chunk_text, embedding, metadata, article_number, created_at)
                            VALUES ($1, $2, $3::vector, $4, $5, $6)
                        ''', 
                            document_id,
                            chunk.text,
                            embedding_str,  # ✅ إرسال ك string مع تحويل إلى vector
                            json.dumps(chunk.metadata),
                            chunk.metadata.get('article_number'),
                            datetime.now()
                        )
            
            logger.info(f"✅ تم تخزين {len(chunks)} جزء للمستند {document_id}")
            
        except Exception as e:
            logger.error(f"❌ فشل تخزين الأجزاء: {e}")
            raise

    async def semantic_search(self, query_embedding: np.ndarray, limit: int = 10, 
    document_type: str = None, similarity_threshold: float = 0.7) -> List[DocumentChunk]:
        
        """بحث دلالي متقدم"""
        try:
            # تحويل numpy array إلى list بشكل صحيح
            if hasattr(query_embedding, 'tolist'):
                embedding_list = query_embedding.tolist()
            else:
                embedding_list = list(query_embedding)
            
            # تأكد أن التضمين هو list of floats
            if not all(isinstance(x, (int, float)) for x in embedding_list):
                logger.error("❌ تنسيق التضمين غير صحيح")
                return []

            # تم التحقق من التنسيق؛ مكان لإضافة تنفيذ البحث الدلالي لاحقًا
            logger.debug("✅ استلمت تضمين البحث بنجاح")
            return []
        except Exception as e:
            logger.error(f"❌ فشل عملية البحث الدلالي: {e}")
            return []

   
    
    async def get_document_stats(self, document_id: int) -> Dict[str, Any]:
        """الحصول على إحصائيات المستند"""
        async with self.pool.acquire() as conn:
            stats = await conn.fetchrow('''
                SELECT 
                    COUNT(*) as total_chunks,
                    AVG(token_count) as avg_tokens,
                    COUNT(DISTINCT article_number) as unique_articles,
                    MIN(created_at) as first_chunk,
                    MAX(created_at) as last_chunk
                FROM ai_document_chunks 
                WHERE document_id = $1
            ''', document_id)
            
            return dict(stats) if stats else {}
    
    async def get_system_stats(self) -> Dict[str, Any]:
        """الحصول على إحصائيات النظام"""
        async with self.pool.acquire() as conn:
            # إحصائيات المستندات
            doc_stats = await conn.fetchrow('''
                SELECT 
                    COUNT(*) as total_documents,
                    COUNT(DISTINCT jurisdiction) as unique_jurisdictions,
                    SUM(page_count) as total_pages
                FROM ai_legal_documents
                WHERE processing_status = 'processed'
            ''')
            
            # إحصائيات الأجزاء
            chunk_stats = await conn.fetchrow('''
                SELECT 
                    COUNT(*) as total_chunks,
                    SUM(token_count) as total_tokens,
                    AVG(token_count) as avg_tokens_per_chunk
                FROM ai_document_chunks
            ''')
            
            return {
                'documents': dict(doc_stats) if doc_stats else {},
                'chunks': dict(chunk_stats) if chunk_stats else {},
                'database_size': await self._get_database_size(conn)
            }
    
    async def _get_database_size(self, conn) -> str:
        """الحصول على حجم قاعدة البيانات"""
        size = await conn.fetchval("SELECT pg_size_pretty(pg_database_size(current_database()));")
        return size
    
    async def cleanup_old_data(self, days_old: int = 30):
        """تنظيف البيانات القديمة (بناءً على تاريخ الإنشاء)"""
        try:
            async with self.pool.acquire() as conn:
                # الاستعلام المعدل لاستخدام $1 كمعامل صحيح
                # واستخدام RETURNING COUNT(*) للحصول على العدد مباشرة
                deleted_count = await conn.fetchval(
                    '''
                    DELETE FROM ai_legal_documents 
                    WHERE created_at < (NOW() - ($1 * INTERVAL '1 day'))
                    RETURNING COUNT(*)
                    ''', 
                    days_old
                )
                
                count = deleted_count if deleted_count else 0
                logger.info(f"🧹 تم تنظيف {count} مستند قديم (أقدم من {days_old} يوم)")
                return count
        
        except Exception as e:
            logger.error(f"❌ فشل عملية تنظيف البيانات القديمة: {e}")
            return 
        # في دالة cleanup_old_data - إصلاح الاستعلام:
async def cleanup_old_data(self, days_old: int = 30):
    """تنظيف البيانات القديمة"""
    try:
        async with self.pool.acquire() as conn:
            # إصلاح الاستعلام - استخدام معامل صحيح بشكل صحيح
            deleted_count = await conn.fetchval(
                '''
                WITH deleted AS (
                    DELETE FROM ai_legal_documents 
                    WHERE created_at < (NOW() - ($1 * INTERVAL '1 day'))
                    RETURNING id
                )
                SELECT COUNT(*) FROM deleted
                ''', 
                days_old
            )
            
            logger.info(f"🧹 تم تنظيف {deleted_count} مستند قديم (أقدم من {days_old} يوم)")
            return deleted_count
            
    except Exception as e:
        logger.error(f"❌ فشل عملية تنظيف البيانات القديمة: {e}")
        return 0


        