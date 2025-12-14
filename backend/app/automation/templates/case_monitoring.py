from typing import Dict, Any, List

from . import WorkflowTemplateBase


# CASE MONITORING TEMPLATE
# ============================================================================

class CaseMonitoringTemplate(WorkflowTemplateBase):
    """قالب مراقبة القضايا وإرسال تنبيهات"""
    
    name = "مراقبة القضايا التلقائية"
    description = "مراقبة تحديثات القضايا وإرسال إشعارات للمحامين عند حدوث تغييرات مهمة"
    category = "case_management"
    icon = "gavel"
    allowed_roles = ["lawyer", "judge"]
    
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
                        "cron_expression": "0 9 * * *",  # كل يوم 9 صباحاً
                        "description": "فحص القضايا يومياً"
                    }
                },
                {
                    "id": "db_query_1",
                    "type": "action",
                    "subtype": "database",
                    "name": "جلب القضايا النشطة",
                    "position": {"x": 300, "y": 200},
                    "config": {
                        "operation": "read",
                        "table": "judicial_cases",
                        "filters": {
                            "status": "active",
                            "next_hearing_date": "$today"
                        }
                    }
                },
                {
                    "id": "condition_1",
                    "type": "logic",
                    "subtype": "condition",
                    "name": "هل يوجد قضايا؟",
                    "position": {"x": 500, "y": 200},
                    "config": {
                        "condition": {
                            "field": "count",
                            "operator": "greater_than",
                            "value": 0
                        }
                    }
                },
                {
                    "id": "loop_1",
                    "type": "logic",
                    "subtype": "loop",
                    "name": "لكل قضية",
                    "position": {"x": 700, "y": 200},
                    "config": {
                        "items_field": "cases"
                    }
                },
                {
                    "id": "notification_1",
                    "type": "action",
                    "subtype": "notification",
                    "name": "إشعار المحامي",
                    "position": {"x": 900, "y": 200},
                    "config": {
                        "user_id": "$case.lawyer_id",
                        "type": "case_reminder",
                        "message_template": "تذكير: لديك جلسة في القضية {case_number} اليوم الساعة {hearing_time}"
                    },
                    "input_mapping": {
                        "user_id": "$node.loop_1.current.lawyer_id",
                        "case_number": "$node.loop_1.current.case_number",
                        "hearing_time": "$node.loop_1.current.hearing_time"
                    }
                },
                {
                    "id": "email_1",
                    "type": "action",
                    "subtype": "email",
                    "name": "إرسال بريد",
                    "position": {"x": 900, "y": 350},
                    "config": {
                        "to": "$case.lawyer_email",
                        "subject": "تذكير بجلسة قضائية",
                        "body_template": "عزيزي المحامي،\n\nهذا تذكير بأن لديك جلسة في القضية رقم {case_number} اليوم.\n\nالتفاصيل:\n- رقم القضية: {case_number}\n- الوقت: {hearing_time}\n- المكان: {court_location}"
                    }
                }
            ],
            "edges": [
                {"id": "e1", "source": "trigger_1", "target": "db_query_1"},
                {"id": "e2", "source": "db_query_1", "target": "condition_1"},
                {"id": "e3", "source": "condition_1", "target": "loop_1", "condition": {"field": "condition_met", "operator": "equals", "value": True}},
                {"id": "e4", "source": "loop_1", "target": "notification_1"},
                {"id": "e5", "source": "notification_1", "target": "email_1"}
            ],
            "variables": {}
        }
