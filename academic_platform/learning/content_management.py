# learning/content_management.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import httpx
import asyncio

from database.connection import get_db
from database.models import InstitutionAdmin, StudyGroup
from auth.admin_permissions import get_current_admin
from config.settings import settings

router = APIRouter()

class AIContentRequest(BaseModel):
    topic: str
    content_type: str  # lesson, exercise, case_study, simulation
    difficulty: str  # beginner, intermediate, advanced
    legal_domain: Optional[str] = None
    target_groups: List[int]

class AIContentResponse(BaseModel):
    generated_content: Dict[str, Any]
    source_references: List[str]
    legal_citations: List[str]
    suggested_exercises: List[Dict[str, Any]]
    ai_service_status: str  # online, offline, fallback

def create_fallback_content(topic: str, content_type: str, difficulty: str, legal_domain: str) -> Dict[str, Any]:
    """إنشاء محتوى بديل عندما الـ AI مش شغال"""
    
    content_templates = {
        "lesson": {
            "title": f"درس: {topic}",
            "sections": [
                {
                    "title": "المقدمة",
                    "content": f"هذا درس في {topic} للمستوى {difficulty}.",
                    "key_points": ["النقطة الأساسية 1", "النقطة الأساسية 2"]
                },
                {
                    "title": "الشرح التفصيلي", 
                    "content": f"شرح مفصل لـ {topic} في مجال {legal_domain}.",
                    "examples": ["مثال تطبيقي 1", "مثال تطبيقي 2"]
                }
            ]
        },
        "case_study": {
            "title": f"دراسة حالة: {topic}",
            "case_facts": f"وقائع قضية متعلقة بـ {topic}",
            "legal_issues": ["الإشكال القانوني 1", "الإشكال القانوني 2"],
            "analysis": "تحليل قانوني للقضية",
            "conclusion": "الخلاصة والتوصيات"
        },
        "exercise": {
            "title": f"تمرين: {topic}",
            "instructions": f"قم بحل هذا التمرين في {topic}",
            "questions": [
                {
                    "question": f"سؤال عن {topic}",
                    "options": ["الإجابة أ", "الإجابة ب", "الإجابة ج"],
                    "correct_answer": 0,
                    "explanation": "شرح الإجابة الصحيحة"
                }
            ]
        }
    }
    
    return content_templates.get(content_type, content_templates["lesson"])

async def call_ai_advisor(prompt: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """الاتصال بـ AI Advisor مع fallback"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.AI_ADVISOR_URL}/api/ai/generate-educational-content",
                json={
                    "prompt": prompt,
                    "context": context,
                    "content_type": "legal_education"
                }
            )
            
            if response.status_code == 200:
                return {
                    **response.json(),
                    "ai_service_status": "online"
                }
            else:
                raise Exception(f"AI service returned {response.status_code}")
                
    except Exception as e:
        print(f"⚠️  AI Advisor غير متاح: {e}")
        # استخدام المحتوى البديل
        fallback_content = create_fallback_content(
            context.get("topic", ""),
            context.get("content_type", "lesson"),
            context.get("difficulty_level", "beginner"),
            context.get("legal_domain", "عام")
        )
        
        return {
            "content": fallback_content,
            "references": ["مراجع قانونية أساسية"],
            "citations": ["تشريعات ذات صلة"],
            "exercises": [
                {
                    "type": "multiple_choice",
                    "question": "سؤال تفاعلي عن الموضوع",
                    "options": ["خيار 1", "خيار 2", "خيار 3"],
                    "correct_index": 0
                }
            ],
            "ai_service_status": "fallback"
        }

@router.post("/content/generate-with-ai", response_model=AIContentResponse)
async def generate_content_with_ai(
    request: AIContentRequest,
    admin: InstitutionAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """توليد محتوى تعليمي باستخدام RAG system"""
    
    # التحقق من المجموعات المستهدفة
    valid_groups = []
    for group_id in request.target_groups:
        group_result = await db.execute(
            select(StudyGroup).where(
                StudyGroup.id == group_id,
                StudyGroup.admin_id == admin.id
            )
        )
        group = group_result.scalar_one_or_none()
        if group:
            valid_groups.append(group.name)
    
    if not valid_groups:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="يجب تحديد مجموعات مستهدفة صحيحة"
        )
    
    # بناء prompt تعليمي
    prompt = f"""
    أنشئ {request.content_type} عن: {request.topic}
    للمستوى: {request.difficulty}
    المجال: {request.legal_domain or 'قانوني عام'}
    """
    
    context = {
        "topic": request.topic,
        "content_type": request.content_type,
        "difficulty_level": request.difficulty,
        "legal_domain": request.legal_domain,
        "target_groups": valid_groups,
        "institution_country": admin.country
    }
    
    # الاتصال بـ AI Advisor
    ai_response = await call_ai_advisor(prompt, context)
    
    return AIContentResponse(
        generated_content=ai_response.get("content", {}),
        source_references=ai_response.get("references", []),
        legal_citations=ai_response.get("citations", []),
        suggested_exercises=ai_response.get("exercises", []),
        ai_service_status=ai_response.get("ai_service_status", "unknown")
    )

@router.get("/content/legal-domains")
async def get_legal_domains():
    """المجالات القانونية المتاحة"""
    return {
        "legal_domains": [
            {"id": "criminal", "name": "🔫 القانون الجنائي", "description": "الجنايات والجنح والمخالفات"},
            {"id": "commercial", "name": "💼 القانون التجاري", "description": "العقود والشركات والأعمال التجارية"},
            {"id": "constitutional", "name": "⚖️ القانون الدستوري", "description": "الدستور والحقوق والحريات"},
            {"id": "administrative", "name": "🏛️ القانون الإداري", "description": "الإدارة العامة والوظيفة العامة"},
            {"id": "civil", "name": "📝 القانون المدني", "description": "الأحوال الشخصية والالتزامات"},
            {"id": "international", "name": "🌍 القانون الدولي", "description": "العلاقات الدولية والمنظمات"}
        ],
        "ai_service_status": "fallback"  # مؤقتاً
    }

@router.get("/content/search-legal-resources")
async def search_legal_resources(
    query: str,
    legal_domain: Optional[str] = None,
    admin: InstitutionAdmin = Depends(get_current_admin)
):
    """بحث في الموارد القانونية"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{settings.AI_ADVISOR_URL}/api/ai/search-legal-knowledge",
                params={"query": query, "legal_domain": legal_domain, "country": admin.country}
            )
            
            if response.status_code == 200:
                return {
                    **response.json(),
                    "ai_service_status": "online"
                }
            else:
                raise Exception("Service unavailable")
                
    except Exception as e:
        # نتائج بديلة للبحث
        return {
            "results": [
                {
                    "title": f"مورد عن {query}",
                    "summary": f"معلومات أساسية عن {query} في القانون",
                    "source": "المكتبة القانونية الأساسية",
                    "relevance": 0.8
                }
            ],
            "suggestions": [f"{query} في التشريعات", f"تطبيقات {query}"],
            "ai_service_status": "fallback",
            "message": "جاري استخدام موارد بديلة"
        }

@router.get("/content/health")
async def check_ai_health():
    """فحص حالة الـ AI Advisor"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.AI_ADVISOR_URL}/health")
            return {
                "ai_advisor_status": "online" if response.status_code == 200 else "offline",
                "response_time": "unknown"
            }
    except:
        return {"ai_advisor_status": "offline", "response_time": "timeout"}