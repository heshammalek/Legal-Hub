from typing import Dict, Any, List
from . import WorkflowTemplateBase


    
# REMINDER SYSTEM TEMPLATE
# ============================================================================

class ReminderSystemTemplate(WorkflowTemplateBase):
    """قالب نظام التذكيرات الذكي"""
    
    name = "نظام التذكيرات الذكي"
    description = "إرسال تذكيرات متعددة المراحل للمواعيد المهمة"
    category = "reminders"
    icon = "bell"
    allowed_roles = ["lawyer", "judge"]
    
    @classmethod
    def get_definition(cls) -> Dict[str, Any]:
        return {
            "nodes": [
                {
                    "id": "trigger_1",
                    "type": "trigger",
                    "subtype": "schedule",
                    "name": "فحص دوري",
                    "position": {"x": 100, "y": 200},
                    "config": {
                        "cron_expression": "0 */6 * * *",  # كل 6 ساعات
                        "description": "فحص المواعيد القادمة"
                    }
                },
                {
                    "id": "db_query_1",
                    "type": "action",
                    "subtype": "database",
                    "name": "جلب المواعيد القادمة",
                    "position": {"x": 300, "y": 200},
                    "config": {
                        "operation": "read",
                        "table": "agenda_items",
                        "filters": {
                            "start_time": "$between_now_and_48h",
                            "reminder_sent": False
                        }
                    }
                },
                {
                    "id": "loop_1",
                    "type": "logic",
                    "subtype": "loop",
                    "name": "لكل موعد",
                    "position": {"x": 500, "y": 200},
                    "config": {
                        "items_field": "agenda_items"
                    }
                },
                {
                    "id": "switch_1",
                    "type": "logic",
                    "subtype": "switch",
                    "name": "حسب نوع الموعد",
                    "position": {"x": 700, "y": 200},
                    "config": {
                        "switch_field": "event_type"
                    }
                },
                {
                    "id": "notification_1",
                    "type": "action",
                    "subtype": "notification",
                    "name": "تذكير جلسة محكمة",
                    "position": {"x": 900, "y": 100},
                    "config": {
                        "user_id": "$item.user_id",
                        "type": "court_hearing_reminder",
                        "message_template": "⚖️ تذكير: لديك جلسة محكمة في {event_title} بعد {time_until}"
                    }
                },
                {
                    "id": "notification_2",
                    "type": "action",
                    "subtype": "notification",
                    "name": "تذكير استشارة",
                    "position": {"x": 900, "y": 200},
                    "config": {
                        "user_id": "$item.user_id",
                        "type": "consultation_reminder",
                        "message_template": "📅 تذكير: لديك استشارة {event_title} بعد {time_until}"
                    }
                },
                {
                    "id": "notification_3",
                    "type": "action",
                    "subtype": "notification",
                    "name": "تذكير عام",
                    "position": {"x": 900, "y": 300},
                    "config": {
                        "user_id": "$item.user_id",
                        "type": "general_reminder",
                        "message_template": "🔔 تذكير: {event_title} بعد {time_until}"
                    }
                },
                {
                    "id": "db_update_1",
                    "type": "action",
                    "subtype": "database",
                    "name": "تحديث حالة التذكير",
                    "position": {"x": 1100, "y": 200},
                    "config": {
                        "operation": "update",
                        "table": "agenda_items",
                        "filters": {"id": "$item.id"},
                        "data": {
                            "reminder_sent": True,
                            "reminder_sent_at": "$now"
                        }
                    }
                }
            ],
            "edges": [
                {"id": "e1", "source": "trigger_1", "target": "db_query_1"},
                {"id": "e2", "source": "db_query_1", "target": "loop_1"},
                {"id": "e3", "source": "loop_1", "target": "switch_1"},
                {"id": "e4", "source": "switch_1", "target": "notification_1", "condition": {"field": "switch_value", "operator": "equals", "value": "court_hearing"}},
                {"id": "e5", "source": "switch_1", "target": "notification_2", "condition": {"field": "switch_value", "operator": "equals", "value": "consultation"}},
                {"id": "e6", "source": "switch_1", "target": "notification_3"},
                {"id": "e7", "source": "notification_1", "target": "db_update_1"},
                {"id": "e8", "source": "notification_2", "target": "db_update_1"},
                {"id": "e9", "source": "notification_3", "target": "db_update_1"}
            ],
            "variables": {}
        }