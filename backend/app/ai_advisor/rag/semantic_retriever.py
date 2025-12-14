# backend/app/ai_advisor/rag/semantic_retriever.py
from datetime import datetime
import json
from typing import List, Dict, Any, Optional
import logging
from .advanced_pdf_processor import ProcessingResult, AdvancedPDFProcessor
from .smart_chunker import SmartChunker
from .pgvector_manager import PgVectorManager
from ..core.hybrid_embedder import HybridEmbedder

logger = logging.getLogger(__name__)

class SemanticRetriever:
    """مسترجع دلالي متقدم للمعلومات القانونية - يدعم AWS Textract والمعالجة المحلية"""
    
    def __init__(self, database_url: str):
        self.vector_db = PgVectorManager(database_url)
        self.embedder = HybridEmbedder()
        self.chunker = SmartChunker()
        self.is_initialized = False
    
    async def initialize(self):
        """تهيئة المسترجع"""
        if not self.is_initialized:
            success = await self.vector_db.initialize()
            if success:
                self.is_initialized = True
                logger.info("✅ تم تهيئة المسترجع الدلالي بنجاح")
            else:
                raise Exception("فشل تهيئة قاعدة البيانات")
    
    async def ingest_legal_document(self, pdf_path: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        استيعاب وثيقة قانونية باستخدام AWS Textract كخيار أساسي
        مع fallback للمعالجة المحلية إذا فشل الاتصال بـ AWS
        """
        try:
            # المحاولة الأولى: استخدام AWS Textract للاستخراج المتقدم
            aws_result = await self._ingest_with_aws(pdf_path, metadata)
            if aws_result["success"]:
                logger.info("✅ تم معالجة المستند باستخدام AWS Textract")
                return aws_result
            
            # Fallback: المعالجة المحلية إذا فشل AWS
            logger.info("🔄 الانتقال للمعالجة المحلية (فشل AWS)")
            return await self._ingest_locally(pdf_path, metadata)
            
        except Exception as e:
            logger.error(f"❌ فشل استيعاب المستند: {e}")
            return {"success": False, "error": str(e)}
    
    async def _ingest_with_aws(self, pdf_path: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """استيعاب المستند باستخدام AWS Textract (الخيار الأساسي)"""
        try:
            from ..aws_services.textract_processor import AWSTextractProcessor
            
            processor = AWSTextractProcessor()
            result = await processor.process_pdf(pdf_path)
            
            return {
                "success": True,
                "processing_engine": "aws_textract",
                "document_id": f"aws_{hash(pdf_path)}",
                "text_extracted": len(result.text),
                "pages_processed": result.metadata.get('total_pages', 0),
                "tables_found": len(result.tables),
                "forms_found": len(result.forms),
                "confidence_score": result.metadata.get('confidence', 0),
                "metadata": {**result.metadata, **metadata},
                "text_preview": result.text[:500] + "..." if len(result.text) > 500 else result.text,
                "features": {
                    "ocr_used": True,
                    "tables_extracted": True,
                    "forms_extracted": True,
                    "cloud_processing": True
                }
            }
            
        except Exception as e:
            logger.warning(f"⚠️ فشل المعالجة باستخدام AWS: {e}")
            return {"success": False, "error": f"AWS Textract failed: {str(e)}"}
    
    async def _ingest_locally(self, pdf_path: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """استيعاب المستند باستخدام المعالجة المحلية (fallback)"""
        try:
            processor = AdvancedPDFProcessor()
            # ✅ التصحيح: استخدام process_legal_document بدلاً من process_law_pdf
            result = processor.process_legal_document(pdf_path)
            
            # حفظ المستند في قاعدة البيانات
            document_id = await self._save_document_to_db(result, metadata)
            
            # تقسيم النص إلى أجزاء
            chunks_created = await self._chunk_and_save_document_fixed(result, document_id, metadata)
            
            return {
                "success": True,
                "processing_engine": "local_advanced",
                "document_id": document_id,
                "articles_processed": len(result.articles),
                "pages_processed": result.total_pages,
                "chunks_created": chunks_created,
                "stats": result.stats,
                "metadata": {**result.metadata, **metadata},
                "sample_articles": [
                    {
                        "number": article.number,
                        "content_preview": article.content[:200] + "...",
                        "page": article.page,
                        "section": article.section
                    }
                    for article in result.articles[:5]  # أول 5 مواد فقط
                ],
                "features": {
                    "ocr_used": result.metadata.get('ocr_used', False),
                    "tables_extracted": result.stats.get('tables_extracted', 0) > 0,
                    "forms_extracted": False,
                    "cloud_processing": False
                }
            }
            
        except Exception as e:
            logger.error(f"❌ فشل المعالجة المحلية: {e}")
            return {"success": False, "error": f"Local processing failed: {str(e)}"}
    
    async def _save_document_to_db(self, result: ProcessingResult, metadata: Dict[str, Any]) -> int:
        """حفظ المستند في قاعدة البيانات"""
        try:
            async with self.vector_db.pool.acquire() as conn:
                document_id = await conn.fetchval('''
                    INSERT INTO ai_legal_documents (
                        title, content, metadata, document_type, 
                        country, file_path, file_size, processing_stats,
                        created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING id
                ''', 
                    metadata.get('title', 'Untitled'),
                    result.full_text,
                    json.dumps({**result.metadata, **metadata}),
                    metadata.get('document_type', 'law'),
                    metadata.get('country', 'unknown'),
                    metadata.get('file_path'),
                    metadata.get('file_size', 0),
                    json.dumps(result.stats),
                    datetime.now(),
                    datetime.now()
                )
                
                logger.info(f"💾 تم حفظ المستند في قاعدة البيانات (ID: {document_id})")
                return document_id
                
        except Exception as e:
            logger.error(f"❌ فشل حفظ المستند في قاعدة البيانات: {e}")
            raise Exception(f"فشل حفظ المستند: {e}")
    
    async def _chunk_and_save_document_fixed(self, result: ProcessingResult, document_id: int, metadata: Dict[str, Any]) -> int:
        """تقسيم المستند إلى أجزاء وحفظها - الإصدار المصحح النهائي"""
        try:
            chunks_created = 0
            
            # 1. تقسيم النص الكامل إلى أجزاء
            full_text_chunks = self.chunker.chunk_text(result.full_text)
            
            for i, chunk_text in enumerate(full_text_chunks):
                if not chunk_text.strip():
                    continue
                    
                # إنشاء تضمين للجزء
                chunk_embedding = await self.embedder.get_embedding(chunk_text)
                
                # ✅ التحويل الآمن للتضمين
                if hasattr(chunk_embedding, 'tolist'):
                    embedding_list = chunk_embedding.tolist()
                else:
                    embedding_list = list(chunk_embedding)
                
                # ✅ التأكد من أن جميع العناصر هي floats
                embedding_list = [float(x) for x in embedding_list]
                
                # ✅ التحويل إلى string format
                embedding_str = '[' + ','.join(map(str, embedding_list)) + ']'
                
                # حفظ الجزء في قاعدة البيانات
                async with self.vector_db.pool.acquire() as conn:
                    await conn.execute('''
                        INSERT INTO ai_document_chunks 
                        (document_id, chunk_text, embedding, metadata, created_at)
                        VALUES ($1, $2, $3::vector, $4, $5)
                    ''', 
                        document_id,
                        chunk_text,
                        embedding_str,  # ✅ إرسال ك string مع تحويل إلى vector
                        json.dumps({
                            **metadata,
                            "chunk_index": i,
                            "total_chunks": len(full_text_chunks),
                            "chunk_type": "full_text",
                            "processing_engine": result.stats.get('processing_engine', 'unknown')
                        }),
                        datetime.now()
                    )
                chunks_created += 1
            
            # 2. حفظ المواد كأجزاء منفصلة
            if result.articles:
                for article in result.articles:
                    if article.content and len(article.content.strip()) > 10:
                        article_embedding = await self.embedder.get_embedding(article.content)
                        
                        # ✅ التحويل الآمن للتضمين
                        if hasattr(article_embedding, 'tolist'):
                            article_embedding_list = article_embedding.tolist()
                        else:
                            article_embedding_list = list(article_embedding)
                        
                        # ✅ التأكد من أن جميع العناصر هي floats
                        article_embedding_list = [float(x) for x in article_embedding_list]
                        
                        # ✅ التحويل إلى string format
                        article_embedding_str = '[' + ','.join(map(str, article_embedding_list)) + ']'
                        
                        async with self.vector_db.pool.acquire() as conn:
                            await conn.execute('''
                                INSERT INTO ai_document_chunks 
                                (document_id, chunk_text, embedding, metadata, article_number, created_at)
                                VALUES ($1, $2, $3::vector, $4, $5, $6)
                            ''', 
                                document_id,
                                article.content,
                                article_embedding_str,  # ✅ إرسال ك string مع تحويل إلى vector
                                json.dumps({
                                    **metadata,
                                    "article_number": article.number,
                                    "article_page": article.page,
                                    "article_section": article.section,
                                    "chunk_type": "article",
                                    "processing_engine": result.stats.get('processing_engine', 'unknown')
                                }),
                                article.number,
                                datetime.now()
                            )
                        chunks_created += 1
            
            logger.info(f"✂️ تم إنشاء {chunks_created} جزء من المستند")
            return chunks_created
            
        except Exception as e:
            logger.error(f"❌ فشل تقسيم المستند: {e}")
            return 0
    
    async def retrieve_relevant_content(self, query: str, max_results: int = 8, 
                                      filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """استرجاع المحتوى ذي الصلة"""
        try:
            if not self.is_initialized:
                await self.initialize()
            
            # إنشاء تضمين الاستعلام
            query_embedding = await self.embedder.get_embedding(query)
            
            # تطبيق الفلاتر
            document_type = filters.get('document_type') if filters else None
            country = filters.get('country') if filters else None
            
            # البحث الدلالي
            relevant_chunks = await self.vector_db.semantic_search(
                query_embedding=query_embedding,
                limit=max_results,
                document_type=document_type,
                country=country,
                similarity_threshold=0.6
            )
            
            # تنسيق النتائج
            formatted_results = []
            for chunk in relevant_chunks:
                formatted_results.append({
                    'content': chunk.text,
                    'similarity': chunk.similarity,
                    'metadata': chunk.metadata,
                    'article_number': chunk.metadata.get('article_number'),
                    'document_title': chunk.metadata.get('document_title'),
                    'confidence': self._calculate_confidence(chunk)
                })
            
            logger.info(f"🔍 تم استرجاع {len(formatted_results)} نتيجة للاستعلام: {query[:50]}...")
            return formatted_results
            
        except Exception as e:
            logger.error(f"❌ فشل استرجاع المحتوى: {e}")
            return []
    
    async def hybrid_search(self, query: str, keyword_fallback: bool = True) -> List[Dict[str, Any]]:
        """بحث هجين يجمع بين الدلالي والكلمات المفتاحية"""
        try:
            # البحث الدلالي الأساسي
            semantic_results = await self.retrieve_relevant_content(query)
            
            # إذا كانت النتائج ضعيفة، استخدم البحث بالكلمات المفتاحية
            if keyword_fallback and (not semantic_results or all(r['similarity'] < 0.7 for r in semantic_results)):
                keyword_results = await self._keyword_search(query)
                return keyword_results
            
            return semantic_results
            
        except Exception as e:
            logger.error(f"❌ فشل البحث الهجين: {e}")
            return []
    
    async def _keyword_search(self, query: str) -> List[Dict[str, Any]]:
        """بحث بالكلمات المفتاحية (احتياطي)"""
        try:
            async with self.vector_db.pool.acquire() as conn:
                # استخراج الكلمات المفتاحية من الاستعلام
                keywords = self._extract_keywords(query)
                
                if not keywords:
                    return []
                
                # بناء استعلام البحث
                search_conditions = " OR ".join([f"chunk_text ILIKE '%{kw}%'" for kw in keywords])
                
                rows = await conn.fetch(f'''
                    SELECT 
                        dc.id,
                        dc.chunk_text,
                        dc.metadata,
                        dc.article_number,
                        ld.title as document_title,
                        0.5 as similarity  -- ثقة متوسطة للبحث بالكلمات المفتاحية
                    FROM ai_document_chunks dc
                    JOIN ai_legal_documents ld ON dc.document_id = ld.id
                    WHERE {search_conditions}
                    LIMIT 10
                ''')
                
                results = []
                for row in rows:
                    results.append({
                        'content': row['chunk_text'],
                        'similarity': row['similarity'],
                        'metadata': json.loads(row['metadata']) if row['metadata'] else {},
                        'article_number': row['article_number'],
                        'document_title': row['document_title'],
                        'confidence': 0.5,
                        'search_type': 'keyword'
                    })
                
                logger.info(f"🔤 تم العثور على {len(results)} نتيجة بالكلمات المفتاحية")
                return results
                
        except Exception as e:
            logger.error(f"❌ فشل البحث بالكلمات المفتاحية: {e}")
            return []
    
    def _extract_keywords(self, query: str) -> List[str]:
        """استخراج الكلمات المفتاحية من الاستعلام"""
        # قائمة بالكلمات الشائعة التي يمكن تجاهلها
        stop_words = {'ما', 'هي', 'كيف', 'لماذا', 'متى', 'أين', 'من', 'هل', 'على', 'في', 'من'}
        
        # تقسيم الاستعلام إلى كلمات
        words = query.split()
        
        # تصفية الكلمات المهمة
        keywords = [
            word for word in words 
            if len(word) > 2 and word not in stop_words
        ]
        
        return keywords[:5]  # الحد الأقصى 5 كلمات مفتاحية
    
    def _calculate_confidence(self, chunk: Any) -> float:
        """حساب درجة الثقة للنتيجة"""
        base_confidence = chunk.similarity
        
        # زيادة الثقة إذا كانت المادة محددة
        if chunk.metadata.get('article_number'):
            base_confidence += 0.1
        
        # زيادة الثقة إذا كان النص من قانون معترف به
        if chunk.metadata.get('document_type') == 'law':
            base_confidence += 0.1
        
        return min(1.0, base_confidence)
    
    async def get_retrieval_stats(self) -> Dict[str, Any]:
        """الحصول على إحصائيات الاسترجاع"""
        if not self.is_initialized:
            await self.initialize()
        
        db_stats = await self.vector_db.get_system_stats()
        embedder_info = self.embedder.get_model_info()
        
        return {
            'database': db_stats,
            'embedding_model': embedder_info,
            'chunker_config': {
                'max_chunk_size': self.chunker.max_chunk_size,
                'overlap': self.chunker.overlap
            },
            'retrieval_ready': self.is_initialized
        }