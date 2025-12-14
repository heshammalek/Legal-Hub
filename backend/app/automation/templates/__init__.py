# backend/app/automation/templates/__init__.py

from typing import Dict, Any, List, Optional
from .case_monitoring import CaseMonitoringTemplate
from .document_pipeline import DocumentProcessingTemplate
from .consultation_automation import ConsultationAutomationTemplate
from .reminder_system import ReminderSystemTemplate
from .case_deadline_tracker import CaseDeadlineTrackerTemplate





class WorkflowTemplateBase:
    """فئة أساسية لقوالب Workflows"""
    
    name: str = ""
    description: str = ""
    category: str = ""
    icon: str = ""
    allowed_roles: List[str] = []
    
    @classmethod
    def get_definition(cls) -> Dict[str, Any]:
        """الحصول على تعريف الـ Workflow"""
        raise NotImplementedError
    




# ============================================================================
# TEMPLATE REGISTRY
# ============================================================================

WORKFLOW_TEMPLATES = {
    "case_monitoring": CaseMonitoringTemplate,
    "document_processing": DocumentProcessingTemplate,
    "consultation_automation": ConsultationAutomationTemplate,
    "reminder_system": ReminderSystemTemplate,
    "case_deadline_tracker": CaseDeadlineTrackerTemplate
}

def get_all_templates() -> List[Dict[str, Any]]:
    """الحصول على جميع القوالب المتاحة"""
    templates = []
    
    for key, template_class in WORKFLOW_TEMPLATES.items():
        templates.append({
            "key": key,
            "name": template_class.name,
            "description": template_class.description,
            "category": template_class.category,
            "icon": template_class.icon,
            "allowed_roles": template_class.allowed_roles,
            "definition": template_class.get_definition()
        })
    
    return templates

def get_template_by_key(key: str) -> Optional[Dict[str, Any]]:
    """الحصول على قالب محدد"""
    if key not in WORKFLOW_TEMPLATES:
        return None
    
    template_class = WORKFLOW_TEMPLATES[key]
    return {
        "key": key,
        "name": template_class.name,
        "description": template_class.description,
        "category": template_class.category,
        "icon": template_class.icon,
        "allowed_roles": template_class.allowed_roles,
        "definition": template_class.get_definition()
    }