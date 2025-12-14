# backend/app/api/v1/endpoints/cases.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session
from typing import List, Optional

from app.database.connection import get_session as get_db
from app.database.crud_case import (
    create_judicial_case,
    get_judicial_cases, 
    get_judicial_case,
    update_judicial_case,
    delete_judicial_case,
    get_urgent_cases,
    get_case_stats
)
from app.schemas.judicial_case_schemas import (
    JudicialCaseCreate,
    JudicialCaseUpdate, 
    JudicialCaseResponse
)
from app.core.security import get_current_active_user as get_current_lawyer

router = APIRouter()

@router.get("/", response_model=List[JudicialCaseResponse])
async def read_cases(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None), 
    case_type: Optional[str] = Query(None),
    court: Optional[str] = Query(None),
    current_lawyer: dict = Depends(get_current_lawyer),
    db: Session = Depends(get_db)
):
    """الحصول على قائمة القضايا"""
    try:
        filters = {}
        if status: filters['status'] = status
        if priority: filters['priority'] = priority  
        if case_type: filters['case_type'] = case_type
        if court: filters['court'] = court
            
        cases = get_judicial_cases(
            db, 
            lawyer_id=current_lawyer.id,
            skip=skip,
            limit=limit,
            filters=filters
        )
        return cases
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving cases: {str(e)}"
        )

@router.get("/urgent", response_model=List[JudicialCaseResponse])
async def read_urgent_cases(
    current_lawyer: dict = Depends(get_current_lawyer),
    db: Session = Depends(get_db)
):
    """الحصول على القضايا العاجلة"""
    try:
        cases = get_urgent_cases(db, lawyer_id=current_lawyer.id)
        return cases
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving urgent cases: {str(e)}"
        )

@router.get("/stats")
async def read_case_stats(
    current_lawyer: dict = Depends(get_current_lawyer),
    db: Session = Depends(get_db)
):
    """إحصائيات القضايا"""
    try:
        stats = get_case_stats(db, lawyer_id=current_lawyer.id)
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving case stats: {str(e)}"
        )

@router.get("/{case_id}", response_model=JudicialCaseResponse)
async def read_case(
    case_id: str,
    current_lawyer: dict = Depends(get_current_lawyer),
    db: Session = Depends(get_db)
):
    """الحصول على قضية محددة"""
    try:
        case = get_judicial_case(db, case_id=case_id)
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Case not found"
            )
        
        if case.created_by != current_lawyer.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this case"
            )
            
        return case
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving case: {str(e)}"
        )

@router.post("/", response_model=JudicialCaseResponse)
async def create_new_case(
    case_data: JudicialCaseCreate,
    current_lawyer: dict = Depends(get_current_lawyer),
    db: Session = Depends(get_db)
):
    """إنشاء قضية جديدة"""
    try:
        case_data.created_by = current_lawyer.id
        
        if not case_data.case_number:
            from datetime import datetime
            case_data.case_number = f"CASE-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        case = create_judicial_case(db, case_data)
        return case
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating case: {str(e)}"
        )

@router.put("/{case_id}", response_model=JudicialCaseResponse)
async def update_existing_case(
    case_id: str,
    case_data: JudicialCaseUpdate,
    current_lawyer: dict = Depends(get_current_lawyer),
    db: Session = Depends(get_db)
):
    """تحديث قضية"""
    try:
        existing_case = get_judicial_case(db, case_id=case_id)
        if not existing_case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Case not found"
            )
            
        if existing_case.created_by != current_lawyer.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this case"
            )
        
        updated_case = update_judicial_case(db, case_id, case_data)
        if not updated_case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Case not found during update"
            )
            
        return updated_case
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating case: {str(e)}"
        )

@router.delete("/{case_id}")
async def delete_existing_case(
    case_id: str,
    current_lawyer: dict = Depends(get_current_lawyer),
    db: Session = Depends(get_db)
):
    """حذف قضية"""
    try:
        existing_case = get_judicial_case(db, case_id=case_id)
        if not existing_case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Case not found"
            )
            
        if existing_case.created_by != current_lawyer.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this case"
            )
        
        success = delete_judicial_case(db, case_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Case not found during deletion"
            )
            
        return {"message": "Case deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting case: {str(e)}"
        )