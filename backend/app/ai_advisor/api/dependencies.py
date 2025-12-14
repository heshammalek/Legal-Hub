import logging
from functools import lru_cache
from typing import Dict, Any, Optional
import os

from fastapi import Depends

# --- استيراد كل المكونات الأساسية والخدمات ---

# Core
from ..core.cache_manager import CacheManager
from ..core.hybrid_embedder import HybridEmbedder
from ..core.multi_llm_orchestrator import MultiLLMOrchestrator

# RAG
from ..rag.pgvector_manager import PgVectorManager
from ..rag.cross_encoder_ranker import CrossEncoderRanker
from ..rag.semantic_retriever import SemanticRetriever

# Services
from ..services.legal_translator import LegalTranslator
from ..services.document_analyzer import DocumentAnalyzer
from ..services.expert_legal_advisor import ExpertLegalAdvisor
from ..services.citation_validator import CitationValidator

logger = logging.getLogger(__name__)

# --- قراءة الإعدادات الرئيسية ---
AI_DATABASE_URL = os.getenv("AI_DATABASE_URL", "postgresql+asyncpg://user:pass@host:port/legal_ai")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/1")

# إعدادات نماذج LLM (سيتم تحميل المفاتيح من متغيرات البيئة)
LLM_CONFIG = {
    "models": {
        "fast": {"provider": "google", "model_name": "gemini-1.5-flash-latest"},
        "smart": {"provider": "google", "model_name": "gemini-1.5-pro-latest"},
        # (يمكن إضافة OpenAI أو Claude هنا إذا كانت المفاتيح متوفرة)
        # "smart_openai": {"provider": "openai", "model_name": "gpt-4o"},
    }
}

# --- تهيئة الكائنات المفردة (Singletons) باستخدام lru_cache ---
# (lru_cache(None) يحول الدالة إلى Singleton، تُستدعى مرة واحدة فقط)

@lru_cache(None)
def get_cache_manager() -> CacheManager:
    logger.info("Initializing CacheManager Singleton...")
    manager = CacheManager(redis_url=REDIS_URL)
    # (ملاحظة: نحتاج لتهيئة الاتصال عند بدء تشغيل FastAPI)
    return manager

@lru_cache(None)
def get_hybrid_embedder() -> HybridEmbedder:
    logger.info("Initializing HybridEmbedder Singleton...")
    return HybridEmbedder() # (سيستخدم النموذج الافتراضي BGE)

@lru_cache(None)
def get_pgvector_manager() -> PgVectorManager:
    logger.info("Initializing PgVectorManager Singleton...")
    return PgVectorManager(database_url=AI_DATABASE_URL)

@lru_cache(None)
def get_cross_encoder_ranker(
    cache: CacheManager = Depends(get_cache_manager)
) -> CrossEncoderRanker:
    logger.info("Initializing CrossEncoderRanker Singleton...")
    return CrossEncoderRanker(cache_manager=cache)

@lru_cache(None)
def get_llm_orchestrator(
    cache: CacheManager = Depends(get_cache_manager)
) -> MultiLLMOrchestrator:
    logger.info("Initializing MultiLLMOrchestrator Singleton...")
    return MultiLLMOrchestrator(config=LLM_CONFIG, cache_manager=cache)

@lru_cache(None)
def get_semantic_retriever(
    db_manager: PgVectorManager = Depends(get_pgvector_manager),
    embedder: HybridEmbedder = Depends(get_hybrid_embedder)
) -> SemanticRetriever:
    logger.info("Initializing SemanticRetriever Singleton...")
    # (يجب تعديل SemanticRetriever __init__ ليقبل db_manager و embedder)
    # هذا تعديل مقترح على الكود السابق لـ SemanticRetriever:
    
    # --- تعديل مقترح لـ SemanticRetriever.__init__ ---
    # def __init__(self, db_manager: PgVectorManager, embedder: HybridEmbedder):
    #     self.vector_db = db_manager
    #     self.embedder = embedder
    #     self.chunker = SmartChunker()
    #     self.is_initialized = False # (التهيئة ستتم عند بدء التشغيل)
    
    # (بناءً على الكود *الحالي*، هو ينشئها بنفسه، لذا سنلتزم به)
    retriever = SemanticRetriever(database_url=AI_DATABASE_URL)
    return retriever


# --- تهيئة الخدمات (Services) ---

@lru_cache(None)
def get_legal_translator(
    orchestrator: MultiLLMOrchestrator = Depends(get_llm_orchestrator),
    cache: CacheManager = Depends(get_cache_manager)
) -> LegalTranslator:
    logger.info("Initializing LegalTranslator Service...")
    return LegalTranslator(orchestrator=orchestrator, cache_manager=cache)

@lru_cache(None)
def get_document_analyzer(
    orchestrator: MultiLLMOrchestrator = Depends(get_llm_orchestrator),
    cache: CacheManager = Depends(get_cache_manager)
) -> DocumentAnalyzer:
    logger.info("Initializing DocumentAnalyzer Service...")
    return DocumentAnalyzer(orchestrator=orchestrator, cache_manager=cache)

@lru_cache(None)
def get_expert_legal_advisor(
    orchestrator: MultiLLMOrchestrator = Depends(get_llm_orchestrator),
    retriever: SemanticRetriever = Depends(get_semantic_retriever),
    reranker: CrossEncoderRanker = Depends(get_cross_encoder_ranker),
    cache: CacheManager = Depends(get_cache_manager)
) -> ExpertLegalAdvisor:
    logger.info("Initializing ExpertLegalAdvisor Service...")
    return ExpertLegalAdvisor(
        orchestrator=orchestrator,
        retriever=retriever,
        reranker=reranker,
        cache_manager=cache
    )

@lru_cache(None)
def get_citation_validator(
    orchestrator: MultiLLMOrchestrator = Depends(get_llm_orchestrator),
    retriever: SemanticRetriever = Depends(get_semantic_retriever)
) -> CitationValidator:
    logger.info("Initializing CitationValidator Service...")
    return CitationValidator(orchestrator=orchestrator, retriever=retriever)


# --- دالة لتهيئة كل شيء عند بدء تشغيل FastAPI ---
async def initialize_ai_services():
    """
    يجب استدعاء هذه الدالة عند بدء تشغيل FastAPI (startup event)
    لتهيئة اتصالات DB و Cache.
    """
    logger.info("... بدء تهيئة اتصالات خدمات الذكاء الاصطناعي ...")
    
    # 1. تهيئة الكاش
    cache = get_cache_manager()
    await cache.initialize()
    
    # 2. تهيئة مدير الداتابيز (PgVectorManager)
    # (يجب تعديل SemanticRetriever ليتم تهيئته هنا)
    retriever = get_semantic_retriever(None, None) # (استدعاء غريب بسبب التصميم الحالي)
    await retriever.initialize() # هذا سيهيئ (DB + Embedder)
    
    # 3. تهيئة باقي الخدمات (لا تحتاج تهيئة async)
    get_llm_orchestrator(cache)
    get_cross_encoder_ranker(cache)
    get_legal_translator(None, None)
    get_document_analyzer(None, None)
    get_expert_legal_advisor(None, None, None, None)
    get_citation_validator(None, None)
    
    logger.info("✅ ... اكتملت تهيئة خدمات الذكاء الاصطناعي ...")