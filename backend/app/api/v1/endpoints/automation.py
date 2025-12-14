"""
API Endpoints for Legal Automation System
Location: backend/app/api/v1/endpoints/automation.py
"""

import asyncio
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from backend.app.database.connection import get_db
from backend.app.core.security import get_current_user
from backend.app.models.user_models import User
from backend.app.models.automation.workflow_models import (
    Workflow, WorkflowExecution, WorkflowTemplate, WorkflowSchedule, WorkflowWebhook,
    WorkflowStatus, ExecutionStatus
)
from backend.app.automation.core.workflow_engine import WorkflowEngine, WorkflowValidator
from backend.app.automation.execution.workflow_runner import WorkflowRunner
from backend.app.schemas.automation_schemas import (
    WorkflowCreate, WorkflowUpdate, WorkflowResponse,
    WorkflowExecutionResponse, WorkflowExecute,
    WorkflowTemplateResponse
)

router = APIRouter(prefix="/automation", tags=["automation"])


# ============================================================================
# WORKFLOW CRUD
# ============================================================================

@router.post("/workflows", response_model=WorkflowResponse, status_code=201)
async def create_workflow(
    workflow_data: WorkflowCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    إنشاء Workflow جديد
    
    - **name**: اسم الـ Workflow
    - **description**: وصف اختياري
    - **definition**: تعريف JSON للعقد والحواف
    - **trigger_type**: نوع المشغل (manual, schedule, webhook, etc.)
    """
    # التحقق من صحة التعريف
    is_valid, errors = WorkflowValidator.validate_workflow_definition(workflow_data.definition)
    if not is_valid:
        raise HTTPException(status_code=400, detail={"errors": errors})
    
    # إنشاء Workflow
    workflow = Workflow(
        name=workflow_data.name,
        description=workflow_data.description,
        owner_id=current_user.id,
        owner_role=current_user.role,
        definition=workflow_data.definition,
        trigger_type=workflow_data.trigger_type,
        trigger_config=workflow_data.trigger_config,
        status=WorkflowStatus.DRAFT
    )
    
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    
    return workflow


@router.get("/workflows", response_model=List[WorkflowResponse])
async def list_workflows(
    status: Optional[WorkflowStatus] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """الحصول على قائمة Workflows الخاصة بالمستخدم"""
    query = db.query(Workflow).filter(Workflow.owner_id == current_user.id)
    
    if status:
        query = query.filter(Workflow.status == status)
    
    workflows = query.offset(skip).limit(limit).all()
    return workflows


@router.get("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """الحصول على تفاصيل Workflow محدد"""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.owner_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return workflow


@router.put("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: int,
    workflow_data: WorkflowUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """تحديث Workflow"""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.owner_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # التحقق من التعريف إذا تم تحديثه
    if workflow_data.definition:
        is_valid, errors = WorkflowValidator.validate_workflow_definition(workflow_data.definition)
        if not is_valid:
            raise HTTPException(status_code=400, detail={"errors": errors})
        workflow.definition = workflow_data.definition
    
    # تحديث الحقول الأخرى
    if workflow_data.name:
        workflow.name = workflow_data.name
    if workflow_data.description is not None:
        workflow.description = workflow_data.description
    if workflow_data.status:
        workflow.status = workflow_data.status
    
    workflow.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(workflow)
    
    return workflow


@router.delete("/workflows/{workflow_id}")
async def delete_workflow(
    workflow_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """حذف Workflow"""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.owner_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    db.delete(workflow)
    db.commit()
    
    return {"message": "Workflow deleted successfully"}


@router.post("/workflows/{workflow_id}/duplicate", response_model=WorkflowResponse)
async def duplicate_workflow(
    workflow_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """نسخ Workflow"""
    original = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.owner_id == current_user.id
    ).first()
    
    if not original:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # إنشاء نسخة
    duplicate = Workflow(
        name=f"{original.name} (Copy)",
        description=original.description,
        owner_id=current_user.id,
        owner_role=current_user.role,
        definition=original.definition,
        trigger_type=original.trigger_type,
        trigger_config=original.trigger_config,
        status=WorkflowStatus.DRAFT
    )
    
    db.add(duplicate)
    db.commit()
    db.refresh(duplicate)
    
    return duplicate


# ============================================================================
# WORKFLOW EXECUTION
# ============================================================================

@router.post("/workflows/{workflow_id}/execute", response_model=WorkflowExecutionResponse)
async def execute_workflow(
    workflow_id: int,
    execute_data: WorkflowExecute,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    تنفيذ Workflow يدوياً
    
    - **input_data**: البيانات المُدخلة للـ Workflow
    - **async_execution**: تنفيذ في الخلفية (default: true)
    """
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.owner_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    if workflow.status != WorkflowStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Workflow is not active")
    
    # التنفيذ
    if execute_data.async_execution:
        # تنفيذ في الخلفية
        runner = WorkflowRunner(db)
        background_tasks.add_task(
            runner.run_workflow,
            workflow_id=workflow_id,
            input_data=execute_data.input_data,
            triggered_by="manual"
        )
        
        return {
            "message": "Workflow execution started in background",
            "workflow_id": workflow_id,
            "status": "pending"
        }
    else:
        # تنفيذ متزامن
        engine = WorkflowEngine(db)
        execution = await engine.execute_workflow(
            workflow=workflow,
            input_data=execute_data.input_data,
            triggered_by="manual"
        )
        
        return execution


@router.get("/workflows/{workflow_id}/executions", response_model=List[WorkflowExecutionResponse])
async def list_workflow_executions(
    workflow_id: int,
    status: Optional[ExecutionStatus] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """الحصول على سجل تنفيذات Workflow"""
    # التحقق من ملكية الـ Workflow
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.owner_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    query = db.query(WorkflowExecution).filter(
        WorkflowExecution.workflow_id == workflow_id
    )
    
    if status:
        query = query.filter(WorkflowExecution.status == status)
    
    executions = query.order_by(WorkflowExecution.started_at.desc()).offset(skip).limit(limit).all()
    return executions


@router.get("/executions/{execution_id}", response_model=WorkflowExecutionResponse)
async def get_execution(
    execution_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """الحصول على تفاصيل تنفيذ محدد"""
    execution = db.query(WorkflowExecution).filter(
        WorkflowExecution.execution_id == execution_id
    ).first()
    
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    # التحقق من الصلاحية
    if execution.workflow.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return execution


@router.post("/executions/{execution_id}/cancel")
async def cancel_execution(
    execution_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """إلغاء تنفيذ جاري"""
    execution = db.query(WorkflowExecution).filter(
        WorkflowExecution.execution_id == execution_id
    ).first()
    
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    if execution.workflow.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if execution.status not in [ExecutionStatus.PENDING, ExecutionStatus.RUNNING]:
        raise HTTPException(status_code=400, detail="Cannot cancel completed execution")
    
    execution.status = ExecutionStatus.CANCELLED
    execution.completed_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Execution cancelled successfully"}


@router.post("/executions/{execution_id}/retry", response_model=WorkflowExecutionResponse)
async def retry_execution(
    execution_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """إعادة محاولة تنفيذ فاشل"""
    execution = db.query(WorkflowExecution).filter(
        WorkflowExecution.execution_id == execution_id
    ).first()
    
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    if execution.workflow.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if execution.status != ExecutionStatus.FAILED:
        raise HTTPException(status_code=400, detail="Can only retry failed executions")
    
    # تنفيذ جديد بنفس المدخلات
    runner = WorkflowRunner(db)
    background_tasks.add_task(
        runner.run_workflow,
        workflow_id=execution.workflow_id,
        input_data=execution.input_data,
        triggered_by="retry"
    )
    
    return {
        "message": "Retry started in background",
        "original_execution_id": execution_id
    }


# ============================================================================
# WORKFLOW TEMPLATES
# ============================================================================

@router.get("/templates", response_model=List[WorkflowTemplateResponse])
async def list_templates(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """الحصول على قوالب Workflows الجاهزة"""
    query = db.query(WorkflowTemplate).filter(
        WorkflowTemplate.is_public == True
    )
    
    # فلترة بالدور
    query = query.filter(
        WorkflowTemplate.allowed_roles.contains([current_user.role])
    )
    
    if category:
        query = query.filter(WorkflowTemplate.category == category)
    
    templates = query.all()
    return templates


@router.post("/templates/{template_id}/use", response_model=WorkflowResponse)
async def use_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """إنشاء Workflow من قالب"""
    template = db.query(WorkflowTemplate).filter(
        WorkflowTemplate.id == template_id
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # التحقق من الصلاحية
    if current_user.role not in template.allowed_roles:
        raise HTTPException(status_code=403, detail="Not authorized to use this template")
    
    # إنشاء Workflow من القالب
    workflow = Workflow(
        name=f"{template.name} - {current_user.username}",
        description=template.description,
        owner_id=current_user.id,
        owner_role=current_user.role,
        definition=template.template_definition,
        trigger_type="manual",  # يمكن تغييره لاحقاً
        status=WorkflowStatus.DRAFT
    )
    
    db.add(workflow)
    
    # تحديث إحصائيات القالب
    template.usage_count += 1
    
    db.commit()
    db.refresh(workflow)
    
    return workflow


# ============================================================================
# WEBHOOKS
# ============================================================================

@router.post("/workflows/{workflow_id}/webhooks")
async def create_webhook(
    workflow_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """إنشاء Webhook لتشغيل Workflow"""
    import uuid
    import secrets
    
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.owner_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    webhook_id = str(uuid.uuid4())
    secret_token = secrets.token_urlsafe(32)
    
    webhook = WorkflowWebhook(
        workflow_id=workflow_id,
        webhook_id=webhook_id,
        webhook_url=f"/api/v1/automation/webhooks/{webhook_id}",
        secret_token=secret_token,
        is_active=True
    )
    
    db.add(webhook)
    db.commit()
    db.refresh(webhook)
    
    return {
        "webhook_id": webhook_id,
        "webhook_url": webhook.webhook_url,
        "secret_token": secret_token,
        "message": "Keep the secret token safe - it won't be shown again"
    }


@router.post("/webhooks/{webhook_id}")
async def trigger_webhook(
    webhook_id: str,
    payload: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """استقبال Webhook وتشغيل Workflow"""
    webhook = db.query(WorkflowWebhook).filter(
        WorkflowWebhook.webhook_id == webhook_id,
        WorkflowWebhook.is_active == True
    ).first()
    
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found or inactive")
    
    # TODO: التحقق من secret_token من الهيدر
    
    # تحديث إحصائيات
    webhook.total_calls += 1
    webhook.last_called_at = datetime.utcnow()
    
    # تشغيل الـ Workflow في الخلفية
    runner = WorkflowRunner(db)
    background_tasks.add_task(
        runner.run_workflow,
        workflow_id=webhook.workflow_id,
        input_data=payload,
        triggered_by="webhook",
        trigger_metadata={"webhook_id": webhook_id}
    )
    
    webhook.successful_calls += 1
    db.commit()
    
    return {"message": "Webhook received, workflow execution started"}


# ============================================================================
# SCHEDULES
# ============================================================================

@router.post("/workflows/{workflow_id}/schedules")
async def create_schedule(
    workflow_id: int,
    cron_expression: str,
    timezone: str = "UTC",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """إنشاء جدولة لـ Workflow"""
    from croniter import croniter
    
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.owner_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # التحقق من صحة cron expression
    if not croniter.is_valid(cron_expression):
        raise HTTPException(status_code=400, detail="Invalid cron expression")
    
    # حساب التشغيل القادم
    base_time = datetime.utcnow()
    cron = croniter(cron_expression, base_time)
    next_run = cron.get_next(datetime)
    
    schedule = WorkflowSchedule(
        workflow_id=workflow_id,
        cron_expression=cron_expression,
        timezone=timezone,
        next_run_at=next_run,
        is_active=True
    )
    
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    
    return schedule


@router.get("/workflows/{workflow_id}/schedules")
async def list_schedules(
    workflow_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """الحصول على جدولات Workflow"""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.owner_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    schedules = db.query(WorkflowSchedule).filter(
        WorkflowSchedule.workflow_id == workflow_id
    ).all()
    
    return schedules


# ============================================================================
# MONITORING & ANALYTICS
# ============================================================================

@router.get("/workflows/{workflow_id}/stats")
async def get_workflow_stats(
    workflow_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """إحصائيات Workflow"""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.owner_id == current_user.id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return {
        "workflow_id": workflow_id,
        "total_executions": workflow.total_executions,
        "successful_executions": workflow.successful_executions,
        "failed_executions": workflow.failed_executions,
        "success_rate": (workflow.successful_executions / workflow.total_executions * 100) if workflow.total_executions > 0 else 0,
        "average_execution_time": workflow.average_execution_time,
        "last_execution_at": workflow.last_execution_at
    }


@router.get("/dashboard/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """إحصائيات عامة للمستخدم"""
    workflows = db.query(Workflow).filter(
        Workflow.owner_id == current_user.id
    ).all()
    
    total_workflows = len(workflows)
    active_workflows = len([w for w in workflows if w.status == WorkflowStatus.ACTIVE])
    total_executions = sum(w.total_executions for w in workflows)
    successful_executions = sum(w.successful_executions for w in workflows)
    
    return {
        "total_workflows": total_workflows,
        "active_workflows": active_workflows,
        "total_executions": total_executions,
        "successful_executions": successful_executions,
        "success_rate": (successful_executions / total_executions * 100) if total_executions > 0 else 0
    }


# ============================================================================
# WEBSOCKET FOR LIVE UPDATES
# ============================================================================

@router.websocket("/ws/executions/{execution_id}")
async def execution_websocket(
    websocket: WebSocket,
    execution_id: str,
    db: Session = Depends(get_db)
):
    """WebSocket للحصول على تحديثات مباشرة لتنفيذ Workflow"""
    await websocket.accept()
    
    try:
        while True:
            # جلب حالة التنفيذ
            execution = db.query(WorkflowExecution).filter(
                WorkflowExecution.execution_id == execution_id
            ).first()
            
            if execution:
                await websocket.send_json({
                    "execution_id": execution_id,
                    "status": execution.status,
                    "progress": len(execution.node_executions),
                    "completed_at": execution.completed_at.isoformat() if execution.completed_at else None
                })
                
                # إنهاء الاتصال عند انتهاء التنفيذ
                if execution.status in [ExecutionStatus.SUCCESS, ExecutionStatus.FAILED, ExecutionStatus.CANCELLED]:
                    break
            
            await asyncio.sleep(1)  # تحديث كل ثانية
            
    except WebSocketDisconnect:
        pass