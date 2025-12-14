from typing import Dict, Any, List
from . import WorkflowTemplateBase


# DOCUMENT PROCESSING PIPELINE
# ============================================================================

class DocumentProcessingTemplate(WorkflowTemplateBase):
    """قالب معالجة المستندات القانونية"""
    
    name = "معالجة المستندات التلقائية"
    description = "تحليل وترجمة وتصنيف المستندات القانونية تلقائياً عند رفعها"
    category = "document_processing"
    icon = "file-text"
    allowed_roles = ["lawyer", "expert"]
    
    @classmethod
    def get_definition(cls) -> Dict[str, Any]:
        return {
            "nodes": [
                {
                    "id": "trigger_1",
                    "type": "trigger",
                    "subtype": "document_upload",
                    "name": "عند رفع مستند",
                    "position": {"x": 100, "y": 200},
                    "config": {
                        "watch_folder": "/uploads/documents",
                        "file_types": ["pdf", "docx"]
                    }
                },
                {
                    "id": "analysis_1",
                    "type": "action",
                    "subtype": "document_analysis",
                    "name": "تحليل المستند",
                    "position": {"x": 300, "y": 200},
                    "config": {
                        "analysis_type": "comprehensive",
                        "extract_entities": True,
                        "identify_clauses": True
                    },
                    "input_mapping": {
                        "document_path": "$trigger.file_path"
                    }
                },
                {
                    "id": "rag_query_1",
                    "type": "action",
                    "subtype": "rag_query",
                    "name": "استعلام قانوني",
                    "position": {"x": 500, "y": 200},
                    "config": {
                        "query_template": "ما هي المواد القانونية ذات الصلة بـ: {summary}"
                    },
                    "input_mapping": {
                        "summary": "$node.analysis_1.summary"
                    }
                },
                {
                    "id": "condition_1",
                    "type": "logic",
                    "subtype": "condition",
                    "name": "هل يحتاج ترجمة؟",
                    "position": {"x": 500, "y": 350},
                    "config": {
                        "condition": {
                            "field": "language",
                            "operator": "not_equals",
                            "value": "ar"
                        }
                    }
                },
                {
                    "id": "translation_1",
                    "type": "action",
                    "subtype": "translation",
                    "name": "ترجمة للعربية",
                    "position": {"x": 700, "y": 350},
                    "config": {
                        "source_lang": "auto",
                        "target_lang": "ar",
                        "preserve_legal_terms": True
                    },
                    "input_mapping": {
                        "text": "$node.analysis_1.full_text"
                    }
                },
                {
                    "id": "db_save_1",
                    "type": "action",
                    "subtype": "database",
                    "name": "حفظ النتائج",
                    "position": {"x": 900, "y": 200},
                    "config": {
                        "operation": "create",
                        "table": "document_analysis",
                        "data": {
                            "document_id": "$trigger.document_id",
                            "summary": "$node.analysis_1.summary",
                            "legal_references": "$node.rag_query_1.sources",
                            "analysis_date": "$now"
                        }
                    }
                },
                {
                    "id": "notification_1",
                    "type": "action",
                    "subtype": "notification",
                    "name": "إشعار المستخدم",
                    "position": {"x": 1100, "y": 200},
                    "config": {
                        "user_id": "$trigger.uploaded_by",
                        "type": "document_processed",
                        "message_template": "تم معالجة المستند {filename} بنجاح"
                    }
                }
            ],
            "edges": [
                {"id": "e1", "source": "trigger_1", "target": "analysis_1"},
                {"id": "e2", "source": "analysis_1", "target": "rag_query_1"},
                {"id": "e3", "source": "analysis_1", "target": "condition_1"},
                {"id": "e4", "source": "condition_1", "target": "translation_1", "condition": {"field": "condition_met", "operator": "equals", "value": True}},
                {"id": "e5", "source": "rag_query_1", "target": "db_save_1"},
                {"id": "e6", "source": "translation_1", "target": "db_save_1"},
                {"id": "e7", "source": "db_save_1", "target": "notification_1"}
            ],
            "variables": {}
        }
