from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

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

class TrainingRequest(BaseModel):
    country_code: str
    training_data: Dict[str, Any]
    model_type: str = "legal_qa"

class AIConversationCreate(BaseModel):
    user_id: UUID
    country_code: str
    ai_model: str
    conversation_history: Dict[str, Any]

class AIConversationResponse(BaseModel):
    id: UUID
    user_id: UUID
    country_code: str
    ai_model: str
    conversation_history: Dict[str, Any]
    created_at: datetime