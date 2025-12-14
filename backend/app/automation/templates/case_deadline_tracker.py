from typing import Dict, Any, List

from . import WorkflowTemplateBase



# CASE DEADLINE TRACKER TEMPLATE
# ============================================================================

class CaseDeadlineTrackerTemplate(WorkflowTemplateBase):
    """قالب تتبع مواعيد نهائية للقضايا"""
    
    name = "تتبع المواعيد النهائية للقضايا"
    description = "مراقبة المواعيد النهائية للقضايا وإرسال تنبيهات متدرجة"
    category = "case_management"
    icon = "alert-triangle"
    allowed_roles = ["lawyer"]
    
    @classmethod
    def get_definition(cls) -> Dict[str, Any]:
        return {
            "nodes": [
                {
                    "id": "trigger_1",
                    "type": "trigger",
                    "subtype": "schedule",
                    "name": "فحص يومي",
                    "position": {"x": 100, "y": 200},
                    "config": {
                        "cron_expression": "0 8 * * *"
                    }
                },
                {
                    "id": "db_query_1",
                    "type": "action",
                    "subtype": "database",
                    "name": "القضايا بمواعيد قريبة",
                    "position": {"x": 300, "y": 200},
                    "config": {
                        "operation": "read",
                        "table": "judicial_cases",
                        "filters": {
                            "deadline": "$within_7_days",
                            "status": "active"
                        }
                    }
                },
                {
                    "id": "loop_1",
                    "type": "logic",
                    "subtype": "loop",
                    "name": "لكل قضية",
                    "position": {"x": 500, "y": 200},
                    "config": {}
                },
                {
                    "id": "condition_1",
                    "type": "logic",
                    "subtype": "condition",
                    "name": "أقل من 24 ساعة؟",
                    "position": {"x": 700, "y": 150},
                    "config": {
                        "condition": {
                            "field": "hours_remaining",
                            "operator": "less_than",
                            "value": 24
                        }
                    }
                },
                {
                    "id": "notification_urgent",
                    "type": "action",
                    "subtype": "notification",
                    "name": "تنبيه عاجل",
                    "position": {"x": 900, "y": 100},
                    "config": {
                        "user_id": "$item.lawyer_id",
                        "type": "urgent_deadline",
                        "priority": "high",
                        "message_template": "🚨 عاجل: الموعد النهائي للقضية {case_number} خلال {hours_remaining} ساعة!"
                    }
                },
                {
                    "id": "notification_normal",
                    "type": "action",
                    "subtype": "notification",
                    "name": "تنبيه عادي",
                    "position": {"x": 900, "y": 200},
                    "config": {
                        "user_id": "$item.lawyer_id",
                        "type": "deadline_reminder",
                        "priority": "normal",
                        "message_template": "⏰ تذكير: الموعد النهائي للقضية {case_number} خلال {days_remaining} أيام"
                    }
                },
                {
                    "id": "email_urgent",
                    "type": "action",
                    "subtype": "email",
                    "name": "بريد عاجل",
                    "position": {"x": 1100, "y": 100},
                    "config": {
                        "to": "$item.lawyer_email",
                        "subject": "⚠️ موعد نهائي عاجل",
                        "body_template": "عزيزي المحامي،\n\nهذا تنبيه عاجل بخصوص القضية رقم {case_number}.\n\nالموعد النهائي: {deadline}\nالوقت المتبقي: {hours_remaining} ساعة\n\nيرجى اتخاذ الإجراء المناسب فوراً."
                    }
                }
            ],
            "edges": [
                {"id": "e1", "source": "trigger_1", "target": "db_query_1"},
                {"id": "e2", "source": "db_query_1", "target": "loop_1"},
                {"id": "e3", "source": "loop_1", "target": "condition_1"},
                {"id": "e4", "source": "condition_1", "target": "notification_urgent", "condition": {"field": "condition_met", "operator": "equals", "value": True}},
                {"id": "e5", "source": "condition_1", "target": "notification_normal", "condition": {"field": "condition_met", "operator": "equals", "value": False}},
                {"id": "e6", "source": "notification_urgent", "target": "email_urgent"}
            ],
            "variables": {}
        }