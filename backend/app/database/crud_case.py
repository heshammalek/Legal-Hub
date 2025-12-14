# backend/app/database/crud_case.py
# backend/app/database/crud_case.py
from sqlmodel import Session, select, and_
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

from app.models.judicialCase import JudicialCase
from ..schemas.judicial_case_schemas import JudicialCaseCreate, JudicialCaseUpdate

def create_judicial_case(db: Session, case_data: JudicialCaseCreate) -> JudicialCase:
    """إنشاء قضية جديدة"""
    try:
        # تحويل Pydantic model إلى SQLModel dict
        case_dict = case_data.dict()
        case_dict["id"] = str(uuid.uuid4())
        
        db_case = JudicialCase(**case_dict)
        db.add(db_case)
        db.commit()
        db.refresh(db_case)
        return db_case
        
    except Exception as e:
        db.rollback()
        raise e

def get_judicial_cases(
    db: Session, 
    lawyer_id: str, 
    skip: int = 0, 
    limit: int = 100,
    filters: Optional[Dict[str, Any]] = None
) -> List[JudicialCase]:
    """الحصول على قضايا المحامي"""
    try:
        statement = select(JudicialCase).where(
            JudicialCase.created_by == lawyer_id
        )
        
        # تطبيق الفلاتر
        if filters:
            if filters.get('status'):
                statement = statement.where(JudicialCase.status == filters['status'])
            if filters.get('priority'):
                statement = statement.where(JudicialCase.priority == filters['priority'])
            if filters.get('case_type'):
                statement = statement.where(JudicialCase.case_type == filters['case_type'])
            if filters.get('court'):
                statement = statement.where(JudicialCase.court.contains(filters['court']))
        
        # الترتيب حسب الأولوية وتاريخ التحديث
        statement = statement.order_by(
            JudicialCase.priority.desc(),
            JudicialCase.updated_at.desc()
        ).offset(skip).limit(limit)
        
        results = db.exec(statement)
        return results.all()
        
    except Exception as e:
        raise e



def get_judicial_case(db: Session, case_id: str) -> Optional[JudicialCase]:
    """الحصول على قضية محددة"""
    try:
        statement = select(JudicialCase).where(JudicialCase.id == case_id)
        result = db.exec(statement)
        return result.first()
    except Exception as e:
        raise e

def update_judicial_case(
    db: Session, 
    case_id: str, 
    case_data: JudicialCaseUpdate
) -> Optional[JudicialCase]:
    """تحديث قضية"""
    try:
        # الحصول على القضية الحالية
        statement = select(JudicialCase).where(JudicialCase.id == case_id)
        result = db.exec(statement)
        db_case = result.first()
        
        if not db_case:
            return None
        
        # تحديث الحقول
        update_data = case_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_case, field, value)
        
        db_case.updated_at = datetime.now()
        db_case.last_updated = datetime.now()
        
        db.add(db_case)
        db.commit()
        db.refresh(db_case)
        return db_case
        
    except Exception as e:
        db.rollback()
        raise e

def delete_judicial_case(db: Session, case_id: str) -> bool:
    """حذف قضية"""
    try:
        statement = select(JudicialCase).where(JudicialCase.id == case_id)
        result = db.exec(statement)
        db_case = result.first()
        
        if db_case:
            db.delete(db_case)
            db.commit()
            return True
        return False
        
    except Exception as e:
        db.rollback()
        raise e

def get_urgent_cases(db: Session, lawyer_id: str) -> List[JudicialCase]:
    """الحصول على القضايا العاجلة"""
    try:
        statement = select(JudicialCase).where(
            and_(
                JudicialCase.created_by == lawyer_id,
                JudicialCase.priority.in_(["high", "urgent"])
            )
        ).order_by(
            JudicialCase.priority.desc(),
            JudicialCase.updated_at.desc()
        )
        
        results = db.exec(statement)
        return results.all()
    except Exception as e:
        raise e

def get_case_stats(db: Session, lawyer_id: str) -> Dict[str, Any]:
    """إحصائيات القضايا"""
    try:
        # إجمالي القضايا
        total_stmt = select(JudicialCase).where(JudicialCase.created_by == lawyer_id)
        total_cases = len(db.exec(total_stmt).all())
        
        # القضايا النشطة
        active_stmt = select(JudicialCase).where(
            and_(
                JudicialCase.created_by == lawyer_id,
                JudicialCase.status.in_(["active", "pending", "in_session"])
            )
        )
        active_cases = len(db.exec(active_stmt).all())
        
        # القضايا العاجلة
        urgent_stmt = select(JudicialCase).where(
            and_(
                JudicialCase.created_by == lawyer_id,
                JudicialCase.priority.in_(["high", "urgent"])
            )
        )
        urgent_cases = len(db.exec(urgent_stmt).all())
        
        return {
            "total_cases": total_cases,
            "active_cases": active_cases,
            "urgent_cases": urgent_cases,
            "closed_cases": total_cases - active_cases
        }
        
    except Exception as e:
        raise e