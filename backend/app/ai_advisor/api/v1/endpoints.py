import logging
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.params import Form
from pydantic import BaseModel
from typing import Optional, Dict, Any

# استيراد الاعتماديات (Services)
from ..dependencies import (
    get_legal_translator,
    get_document_analyzer,
    get_expert_legal_advisor,
    get_citation_validator,
    get_semantic_retriever
)
from ...rag.semantic_retriever import SemanticRetriever
from ...services.legal_translator import LegalTranslator
from ...services.document_analyzer import DocumentAnalyzer
from ...services.expert_legal_advisor import ExpertLegalAdvisor
from ...services.citation_validator import CitationValidator

logger = logging.getLogger(__name__)
router = APIRouter()

# --- نماذج Pydantic للطلبات (Request Bodies) ---

class TranslateRequest(BaseModel):
    text: str
    source_lang: str = "العربية"
    target_lang: str = "الإنجليزية"

class AnalyzeRequest(BaseModel):
    text: str

class QueryRequest(BaseModel):
    query: str
    filters: Optional[Dict[str, Any]] = None

class ValidateRequest(BaseModel):
    claim: str # الادعاء


class IngestRequest(BaseModel):
    metadata: Dict[str, Any]

    

@router.post("/ingest", summary="تحميل مستند قانوني للنظام")
async def ingest_document(
    file: UploadFile = File(...),
    metadata: str = Form(...),
    retriever: SemanticRetriever = Depends(get_semantic_retriever)
):
    """
    تحميل مستند PDF قانوني وإضافته لنظام RAG
    """
    try:
        # حفظ الملف مؤقتاً
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        # تحويل metadata من string إلى dict
        import json
        metadata_dict = json.loads(metadata)
        
        # معالجة المستند
        result = await retriever.ingest_legal_document(temp_path, metadata_dict)
        
        # تنظيف الملف المؤقت
        os.unlink(temp_path)
        
        return result
        
    except Exception as e:
        logger.error(f"Ingest API Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"فشل في معالجة المستند: {str(e)}")

@router.post("/translate", summary="ترجمة نص قانوني")
async def translate_text(
    request: TranslateRequest,
    translator: LegalTranslator = Depends(get_legal_translator)
):
    """
    ترجمة نص قانوني مع الحفاظ على دقة المصطلحات.
    """
    try:
        translated_text = await translator.translate_text(
            text=request.text,
            source_lang=request.source_lang,
            target_lang=request.target_lang
        )
        return {"translated_text": translated_text}
    except Exception as e:
        logger.error(f"Translate API Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="فشل في الترجمة")

@router.post("/analyze", summary="تحليل مستند قانوني")
async def analyze_document(
    request: AnalyzeRequest,
    analyzer: DocumentAnalyzer = Depends(get_document_analyzer)
):
    """
    تحليل مستند واستخراج (ملخص، كيانات، كلمات مفتاحية) بصيغة JSON.
    """
    try:
        analysis = await analyzer.analyze_document(request.text)
        return analysis
    except Exception as e:
        logger.error(f"Analyze API Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="فشل في التحليل")

@router.post("/query", summary="سؤال المستشار الخبير (RAG)")
async def query_expert(
    request: QueryRequest,
    advisor: ExpertLegalAdvisor = Depends(get_expert_legal_advisor)
):
    """
    إرسال سؤال إلى نظام RAG والحصول على إجابة كاملة مدعومة بالمصادر.
    (لا يدعم البث المتدفق - استخدم /query-stream للبث).
    """
    try:
        response = await advisor.answer_question(
            query=request.query,
            filters=request.filters
        )
        return response
    except Exception as e:
        logger.error(f"Query API Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="فشل في معالجة الاستعلام")

@router.post("/validate-claim", summary="التحقق من صحة ادعاء قانوني")
async def validate_legal_claim(
    request: ValidateRequest,
    validator: CitationValidator = Depends(get_citation_validator)
):
    """
    التحقق مما إذا كان الادعاء (نص مادة) مدعومًا بالمستندات في قاعدة المعرفة.
    """
    try:
        validation_result = await validator.validate_claim(request.claim)
        return validation_result
    except Exception as e:
        logger.error(f"Validate API Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="فشل في التحقق من الادعاء")