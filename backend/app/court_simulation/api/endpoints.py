# backend/app/court_simulation/api/endpoints.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ...court_simulation.simulation_manager import CourtSimulationManager

router = APIRouter(prefix="/court-simulation", tags=["court-simulation"])
simulation_manager = CourtSimulationManager()

class SimulationRequest(BaseModel):
    case_type: str
    difficulty: str

class LawyerResponse(BaseModel):
    session_id: str
    response: str

@router.post("/start")
async def start_simulation(request: SimulationRequest):
    """بدء جلسة محاكاة جديدة"""
    try:
        session_data = await simulation_manager.start_simulation(
            request.case_type, request.difficulty
        )
        return session_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في بدء المحاكاة: {e}")

@router.post("/respond")
async def submit_lawyer_response(response: LawyerResponse):
    """إرسال رد المحامي"""
    try:
        feedback = await simulation_manager.process_lawyer_response(
            response.session_id, response.response
        )
        return feedback
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في معالجة الرد: {e}")

@router.post("/evaluate/{session_id}")
async def evaluate_performance(session_id: str):
    """تقييم الأداء النهائي"""
    try:
        evaluation = await simulation_manager.final_evaluation(session_id)
        return evaluation
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في التقييم: {e}")