# في backend/app/api/v1/endpoints/ai_legal.py
from fastapi import APIRouter
from typing import List
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

router = APIRouter()

# تعريف الـSchemas
class LegalQueryRequest(BaseModel):
    query: str
    country_code: str
    model_name: Optional[str] = "default"

class LegalQueryResponse(BaseModel):
    answer: str
    relevant_laws: Optional[List[Dict]] = []
    citations: Optional[List[str]] = []
    confidence: float

class ModelInfo(BaseModel):
    model_name: str
    country_code: str
    version: str
    accuracy: float
    is_active: bool

@router.get("/available-models", response_model=List[ModelInfo])
async def get_available_models(country_code: str = None):
    """الحصول على النماذج المتاحة"""
    # نماذج ثابتة للبداية
    models = [
        {
            "model_name": "legal_model_sa",
            "country_code": "SA",
            "version": "1.0",
            "accuracy": 0.87,
            "is_active": True
        },
        {
            "model_name": "legal_model_ae",
            "country_code": "AE", 
            "version": "1.0",
            "accuracy": 0.84,
            "is_active": True
        },
        {
            "model_name": "legal_model_eg",
            "country_code": "EG",
            "version": "1.0", 
            "accuracy": 0.82,
            "is_active": True
        }
    ]
    
    if country_code:
        models = [model for model in models if model["country_code"] == country_code]
    
    return models

@router.post("/ask-robot", response_model=LegalQueryResponse)
async def ask_legal_robot(request: LegalQueryRequest):
    """endpoint للاستفسارات القانونية"""
    try:
        from app.ai.inference.legal_predictor import LegalPredictor
        legal_predictor = LegalPredictor()
        
        response = await legal_predictor.process_legal_query(
            query=request.query,
            country_code=request.country_code,
            model_name=request.model_name
        )
        
        return LegalQueryResponse(
            answer=response["answer"],
            relevant_laws=response.get("relevant_laws", []),
            citations=response.get("citations", []),
            confidence=response.get("confidence", 0.5)
        )
        
    except Exception as e:
        return LegalQueryResponse(
            answer=f"عذراً، حدث خطأ: {str(e)}",
            relevant_laws=[],
            citations=[],
            confidence=0.1
        )