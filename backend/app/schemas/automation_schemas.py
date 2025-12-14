"""
Pydantic Schemas for Automation API
Location: backend/app/schemas/automation_schemas.py
"""

from pydantic import BaseModel, Field, validator
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum


# ============================================================================
# ENUMS
# ============================================================================

class WorkflowStatusEnum(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DRAFT = "draft"
    ARCHIVED = "archived"


class ExecutionStatusEnum(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PAUSED = "paused"


class TriggerTypeEnum(str, Enum):
    MANUAL = "manual"
    SCHEDULE = "schedule"
    WEBHOOK = "webhook"
    CASE_EVENT = "case_event"
    DOCUMENT_UPLOAD = "document_upload"
    NOTIFICATION = "notification"


# ============================================================================
# NODE SCHEMAS
# ============================================================================

class NodePosition(BaseModel):
    x: float
    y: float


class NodeDefinition(BaseModel):
    id: str = Field(..., description="معرف فريد للعقدة")
    type: str = Field(..., description="نوع العقدة: trigger, action, logic, etc.")
    subtype: str = Field(..., description="النوع الفرعي: schedule, rag_query, etc.")
    name: Optional[str] = Field(None, description="اسم العقدة")
    position: NodePosition
    config: Dict[str, Any] = Field(default_factory=dict)
    input_mapping: Optional[Dict[str, str]] = Field(default_factory=dict)
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "node_1",
                "type": "trigger",
                "subtype": "schedule",
                "name": "جدولة يومية",
                "position": {"x": 100, "y": 200},
                "config": {"cron_expression": "0 9 * * *"}
            }
        }


class EdgeDefinition(BaseModel):
    id: str = Field(..., description="معرف فريد للحافة")
    source: str = Field(..., description="معرف العقدة المصدر")
    target: str = Field(..., description="معرف العقدة الهدف")
    condition: Optional[Dict[str, Any]] = Field(None, description="شرط التنفيذ")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "edge_1",
                "source": "node_1",
                "target": "node_2",
                "condition": {"field": "status", "operator": "equals", "value": "success"}
            }
        }


class WorkflowDefinition(BaseModel):
    nodes: List[NodeDefinition]
    edges: List[EdgeDefinition]
    variables: Dict[str, Any] = Field(default_factory=dict)
    
    @validator('nodes')
    def validate_nodes(cls, v):
        if not v:
            raise ValueError("Workflow must have at least one node")
        return v


# ============================================================================
# WORKFLOW SCHEMAS
# ============================================================================

class WorkflowBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    trigger_type: TriggerTypeEnum
    trigger_config: Optional[Dict[str, Any]] = Field(default_factory=dict)


class WorkflowCreate(WorkflowBase):
    definition: WorkflowDefinition
    status: WorkflowStatusEnum = WorkflowStatusEnum.DRAFT
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "معالجة مستندات قانونية",
                "description": "تحليل وترجمة المستندات تلقائياً",
                "trigger_type": "schedule",
                "trigger_config": {"cron_expression": "0 9 * * *"},
                "definition": {
                    "nodes": [
                        {
                            "id": "node_1",
                            "type": "trigger",
                            "subtype": "schedule",
                            "name": "جدولة يومية",
                            "position": {"x": 100, "y": 200},
                            "config": {"cron_expression": "0 9 * * *"}
                        }
                    ],
                    "edges": [],
                    "variables": {}
                }
            }
        }


class WorkflowUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    definition: Optional[WorkflowDefinition] = None
    status: Optional[WorkflowStatusEnum] = None
    trigger_config: Optional[Dict[str, Any]] = None


class WorkflowResponse(WorkflowBase):
    id: int
    owner_id: int
    owner_role: str
    definition: WorkflowDefinition
    status: WorkflowStatusEnum
    is_template: bool
    total_executions: int
    successful_executions: int
    failed_executions: int
    last_execution_at: Optional[datetime]
    average_execution_time: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class WorkflowListItem(BaseModel):
    id: int
    name: str
    description: Optional[str]
    status: WorkflowStatusEnum
    trigger_type: TriggerTypeEnum
    total_executions: int
    successful_executions: int
    last_execution_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# EXECUTION SCHEMAS
# ============================================================================

class WorkflowExecute(BaseModel):
    input_data: Dict[str, Any] = Field(default_factory=dict)
    async_execution: bool = Field(True, description="تنفيذ في الخلفية")
    
    class Config:
        json_schema_extra = {
            "example": {
                "input_data": {
                    "case_id": 123,
                    "document_path": "/uploads/doc.pdf"
                },
                "async_execution": True
            }
        }


class NodeExecutionInfo(BaseModel):
    node_id: str
    node_type: str
    node_subtype: str
    node_name: Optional[str]
    status: ExecutionStatusEnum
    started_at: datetime
    completed_at: Optional[datetime]
    duration: Optional[int]
    error_message: Optional[str]
    
    class Config:
        from_attributes = True


class WorkflowExecutionResponse(BaseModel):
    id: int
    execution_id: str
    workflow_id: int
    status: ExecutionStatusEnum
    input_data: Dict[str, Any]
    output_data: Optional[Dict[str, Any]]
    error_message: Optional[str]
    triggered_by: str
    started_at: datetime
    completed_at: Optional[datetime]
    duration: Optional[int]
    node_executions: Optional[List[NodeExecutionInfo]] = []
    
    class Config:
        from_attributes = True


class ExecutionStats(BaseModel):
    total_executions: int
    successful: int
    failed: int
    pending: int
    running: int
    success_rate: float
    average_duration: float


# ============================================================================
# TEMPLATE SCHEMAS
# ============================================================================

class WorkflowTemplateResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: Optional[str]
    icon: Optional[str]
    template_definition: WorkflowDefinition
    allowed_roles: List[str]
    is_public: bool
    usage_count: int
    rating: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class TemplateCategory(BaseModel):
    category: str
    count: int
    templates: List[WorkflowTemplateResponse]


# ============================================================================
# SCHEDULE SCHEMAS
# ============================================================================

class ScheduleCreate(BaseModel):
    cron_expression: str = Field(..., description="Cron expression (e.g., '0 9 * * *')")
    timezone: str = Field("UTC", description="Timezone (e.g., 'Africa/Cairo')")
    max_retries: int = Field(3, ge=0, le=10)
    timeout_seconds: int = Field(3600, ge=60, le=86400)
    
    class Config:
        json_schema_extra = {
            "example": {
                "cron_expression": "0 9 * * MON-FRI",
                "timezone": "Africa/Cairo",
                "max_retries": 3,
                "timeout_seconds": 3600
            }
        }


class ScheduleResponse(BaseModel):
    id: int
    workflow_id: int
    cron_expression: str
    timezone: str
    is_active: bool
    next_run_at: Optional[datetime]
    last_run_at: Optional[datetime]
    max_retries: int
    timeout_seconds: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# WEBHOOK SCHEMAS
# ============================================================================

class WebhookCreate(BaseModel):
    allowed_ips: Optional[List[str]] = Field(default_factory=list)
    expires_at: Optional[datetime] = None


class WebhookResponse(BaseModel):
    id: int
    workflow_id: int
    webhook_id: str
    webhook_url: str
    secret_token: Optional[str]  # فقط عند الإنشاء
    is_active: bool
    total_calls: int
    successful_calls: int
    failed_calls: int
    last_called_at: Optional[datetime]
    created_at: datetime
    expires_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# ============================================================================
# ANALYTICS SCHEMAS
# ============================================================================

class WorkflowStats(BaseModel):
    workflow_id: int
    workflow_name: str
    total_executions: int
    successful_executions: int
    failed_executions: int
    success_rate: float
    average_execution_time: float
    last_execution_at: Optional[datetime]


class DashboardStats(BaseModel):
    total_workflows: int
    active_workflows: int
    total_executions: int
    successful_executions: int
    failed_executions: int
    success_rate: float
    executions_today: int
    executions_this_week: int
    top_workflows: List[WorkflowStats]


class ExecutionTrend(BaseModel):
    date: str
    total: int
    successful: int
    failed: int


class NodePerformance(BaseModel):
    node_type: str
    node_subtype: str
    total_executions: int
    average_duration: float
    success_rate: float


class AnalyticsResponse(BaseModel):
    dashboard: DashboardStats
    trends: List[ExecutionTrend]
    node_performance: List[NodePerformance]


# ============================================================================
# ERROR SCHEMAS
# ============================================================================

class ErrorDetail(BaseModel):
    node_id: str
    node_name: str
    error_type: str
    error_message: str
    timestamp: datetime
    stack_trace: Optional[str]


class ValidationError(BaseModel):
    field: str
    message: str
    value: Any


class WorkflowValidationResult(BaseModel):
    is_valid: bool
    errors: List[str]
    warnings: Optional[List[str]] = []


# ============================================================================
# UTILITY SCHEMAS
# ============================================================================

class MessageResponse(BaseModel):
    message: str
    details: Optional[Dict[str, Any]] = None


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int


class BulkOperationResult(BaseModel):
    success_count: int
    failure_count: int
    errors: List[ErrorDetail] = []