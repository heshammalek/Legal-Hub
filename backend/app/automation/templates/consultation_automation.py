from typing import Dict, Any, List
from . import WorkflowTemplateBase


# CONSULTATION AUTOMATION TEMPLATE
# ============================================================================

class ConsultationAutomationTemplate(WorkflowTemplateBase):
    """قالب أتمتة الاستشارات"""
    
    name = "أتمتة جدولة الاستشارات"
    description = "معالجة طلبات الاستشارات الجديدة وإرسال تأكيدات وتذكيرات"
    category = "consultation"
    icon = "calendar"
    allowed_roles = ["lawyer", "expert"]
    
    @classmethod
    def get_definition(cls) -> Dict[str, Any]:
        return {
            "nodes": [
                {
                    "id": "trigger_1",
                    "type": "trigger",
                    "subtype": "case_event",
                    "name": "طلب استشارة جديد",
                    "position": {"x": 100, "y": 200},
                    "config": {
                        "event_type": "consultation_requested"
                    }
                },
                {
                    "id": "db_query_1",
                    "type": "action",
                    "subtype": "database",
                    "name": "التحقق من التوفر",
                    "position": {"x": 300, "y": 200},
                    "config": {
                        "operation": "read",
                        "table": "lawyer_availability",
                        "filters": {
                            "lawyer_id": "$trigger.lawyer_id",
                            "date": "$trigger.requested_date"
                        }
                    }
                },
                {
                    "id": "condition_1",
                    "type": "logic",
                    "subtype": "condition",
                    "name": "هل متوفر؟",
                    "position": {"x": 500, "y": 200},
                    "config": {
                        "condition": {
                            "field": "is_available",
                            "operator": "equals",
                            "value": True
                        }
                    }
                },
                {
                    "id": "db_update_1",
                    "type": "action",
                    "subtype": "database",
                    "name": "تأكيد الحجز",
                    "position": {"x": 700, "y": 150},
                    "config": {
                        "operation": "update",
                        "table": "consultations",
                        "filters": {"id": "$trigger.consultation_id"},
                        "data": {
                            "status": "confirmed",
                            "confirmed_at": "$now"
                        }
                    }
                },
                {
                    "id": "agenda_1",
                    "type": "action",
                    "subtype": "agenda",
                    "name": "إضافة للأجندة",
                    "position": {"x": 900, "y": 150},
                    "config": {
                        "event_type": "consultation"
                    },
                    "input_mapping": {
                        "user_id": "$trigger.lawyer_id",
                        "event_data": {
                            "title": "استشارة: $trigger.client_name",
                            "start_time": "$trigger.requested_date",
                            "duration": 60,
                            "consultation_id": "$trigger.consultation_id"
                        }
                    }
                },
                {
                    "id": "email_1",
                    "type": "action",
                    "subtype": "email",
                    "name": "بريد تأكيد للعميل",
                    "position": {"x": 1100, "y": 100},
                    "config": {
                        "to": "$trigger.client_email",
                        "subject": "تأكيد موعد الاستشارة",
                        "body_template": "عزيزي {client_name},\n\nتم تأكيد موعد استشارتك:\n\nالمحامي: {lawyer_name}\nالتاريخ: {date}\nالوقت: {time}\n\nرابط الاجتماع: {meeting_link}"
                    }
                },
                {
                    "id": "email_2",
                    "type": "action",
                    "subtype": "email",
                    "name": "بريد تأكيد للمحامي",
                    "position": {"x": 1100, "y": 200},
                    "config": {
                        "to": "$trigger.lawyer_email",
                        "subject": "استشارة جديدة مؤكدة",
                        "body_template": "لديك استشارة جديدة مؤكدة:\n\nالعميل: {client_name}\nالموضوع: {subject}\nالتاريخ: {date}\n\nرابط الاجتماع: {meeting_link}"
                    }
                },
                {
                    "id": "db_update_2",
                    "type": "action",
                    "subtype": "database",
                    "name": "رفض الحجز",
                    "position": {"x": 700, "y": 300},
                    "config": {
                        "operation": "update",
                        "table": "consultations",
                        "filters": {"id": "$trigger.consultation_id"},
                        "data": {
                            "status": "rejected",
                            "rejection_reason": "المحامي غير متوفر في هذا الموعد"
                        }
                    }
                },
                {
                    "id": "notification_1",
                    "type": "action",
                    "subtype": "notification",
                    "name": "إشعار العميل بالرفض",
                    "position": {"x": 900, "y": 300},
                    "config": {
                        "user_id": "$trigger.client_id",
                        "type": "consultation_rejected",
                        "message_template": "عذراً، المحامي غير متوفر في الموعد المطلوب. يرجى اختيار موعد آخر."
                    }
                }
            ],
            "edges": [
                {"id": "e1", "source": "trigger_1", "target": "db_query_1"},
                {"id": "e2", "source": "db_query_1", "target": "condition_1"},
                {"id": "e3", "source": "condition_1", "target": "db_update_1", "condition": {"field": "condition_met", "operator": "equals", "value": True}},
                {"id": "e4", "source": "db_update_1", "target": "agenda_1"},
                {"id": "e5", "source": "agenda_1", "target": "email_1"},
                {"id": "e6", "source": "agenda_1", "target": "email_2"},
                {"id": "e7", "source": "condition_1", "target": "db_update_2", "condition": {"field": "condition_met", "operator": "equals", "value": False}},
                {"id": "e8", "source": "db_update_2", "target": "notification_1"}
            ],
            "variables": {}
        }
