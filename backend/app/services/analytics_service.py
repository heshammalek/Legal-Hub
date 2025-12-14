# backend/app/services/analytics_service.py
from datetime import datetime, timedelta
from typing import Dict, List, Any
from collections import defaultdict
from sqlalchemy.orm import Session
import pandas as pd

class CaseAnalyticsService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_case_stats(self, lawyer_id: str, period: str = "monthly") -> Dict[str, Any]:
        """إحصائيات شاملة للقضايا"""
        cases = self.get_lawyer_cases(lawyer_id, period)
        
        return {
            "total_cases": len(cases),
            "active_cases": len([c for c in cases if c.status in ["active", "pending"]]),
            "closed_cases": len([c for c in cases if c.status == "closed"]),
            "upcoming_sessions": self.get_upcoming_sessions_count(cases),
            "success_rate": self.calculate_success_rate(cases),
            "case_distribution": self.get_case_type_distribution(cases),
            "financial_summary": self.get_financial_summary(cases),
            "team_performance": self.get_team_performance(cases),
            "timeline_analytics": self.get_timeline_analytics(cases)
        }
    
    def get_weekly_workload(self, lawyer_id: str) -> Dict[str, Any]:
        """حجم العمل الأسبوعي"""
        start_date = datetime.now() - timedelta(days=30)
        cases = self.get_lawyer_cases_since(lawyer_id, start_date)
        
        weekly_data = defaultdict(lambda: {
            "sessions": 0,
            "documents": 0,
            "tasks": 0,
            "hours": 0
        })
        
        for case in cases:
            for session in case.sessions:
                week_key = session.date.strftime("%Y-%U")
                weekly_data[week_key]["sessions"] += 1
            
            weekly_data[week_key]["documents"] += len(case.documents)
        
        return dict(weekly_data)
    
    def generate_performance_report(self, lawyer_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """تقرير أداء مفصل"""
        return {
            "period": f"{start_date} to {end_date}",
            "case_metrics": self.get_case_metrics(lawyer_id, start_date, end_date),
            "financial_metrics": self.get_financial_metrics(lawyer_id, start_date, end_date),
            "efficiency_metrics": self.get_efficiency_metrics(lawyer_id, start_date, end_date),
            "team_metrics": self.get_team_metrics(lawyer_id, start_date, end_date),
            "recommendations": self.generate_recommendations(lawyer_id)
        }