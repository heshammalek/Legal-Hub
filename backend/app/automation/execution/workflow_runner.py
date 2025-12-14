"""
Workflow Runner and Job Queue Management
Location: backend/app/automation/execution/
"""

import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
from loguru import logger
from celery import Celery, Task
from celery.schedules import crontab

from backend.app.database.connection import get_db
from backend.app.models.automation.workflow_models import (
    Workflow, WorkflowExecution, WorkflowSchedule, ExecutionStatus
)
from backend.app.automation.core.workflow_engine import WorkflowEngine
from backend.app.automation.execution.error_handler import ErrorHandler, RetryHandler


# ============================================================================
# WORKFLOW RUNNER
# Location: backend/app/automation/execution/workflow_runner.py
# ============================================================================

class WorkflowRunner:
    """
    مُنفذ Workflows - يدير التنفيذ المتزامن وغير المتزامن
    
    يستخدم لـ:
    - التنفيذ اليدوي
    - التنفيذ المجدول
    - التنفيذ عبر Webhook
    - التنفيذ عبر أحداث النظام
    """
    
    def __init__(self, db_session=None):
        self.db = db_session or next(get_db())
        self.engine = WorkflowEngine(self.db)
        self.error_handler = ErrorHandler()
        self.retry_handler = RetryHandler(max_retries=3)
    
    async def run_workflow(
        self,
        workflow_id: int,
        input_data: Dict[str, Any] = None,
        triggered_by: str = "manual",
        trigger_metadata: Dict[str, Any] = None
    ) -> WorkflowExecution:
        """
        تشغيل Workflow
        
        Args:
            workflow_id: معرف الـ Workflow
            input_data: البيانات المُدخلة
            triggered_by: مصدر التشغيل
            trigger_metadata: معلومات إضافية
        
        Returns:
            WorkflowExecution: سجل التنفيذ
        """
        logger.info(f"Running workflow {workflow_id} triggered by {triggered_by}")
        
        try:
            # جلب الـ Workflow
            workflow = self.db.query(Workflow).filter(
                Workflow.id == workflow_id
            ).first()
            
            if not workflow:
                raise ValueError(f"Workflow {workflow_id} not found")
            
            # التنفيذ مع إعادة محاولة تلقائية
            execution = await self.retry_handler.execute_with_retry(
                self.engine.execute_workflow,
                workflow=workflow,
                input_data=input_data or {},
                triggered_by=triggered_by,
                trigger_metadata=trigger_metadata or {}
            )
            
            logger.success(
                f"Workflow {workflow_id} completed successfully. "
                f"Execution ID: {execution.execution_id}"
            )
            
            return execution
            
        except Exception as e:
            logger.error(f"Failed to run workflow {workflow_id}: {str(e)}")
            error_info = self.error_handler.handle_error(e)
            
            # إنشاء سجل تنفيذ فاشل إذا لم يكن موجوداً
            # (في حالة فشل قبل إنشاء السجل)
            raise
    
    def run_workflow_sync(
        self,
        workflow_id: int,
        input_data: Dict[str, Any] = None,
        triggered_by: str = "manual"
    ) -> WorkflowExecution:
        """نسخة متزامنة من run_workflow"""
        return asyncio.run(
            self.run_workflow(
                workflow_id=workflow_id,
                input_data=input_data,
                triggered_by=triggered_by
            )
        )
    
    async def run_workflow_by_webhook(
        self,
        webhook_id: str,
        payload: Dict[str, Any]
    ) -> WorkflowExecution:
        """تشغيل Workflow عبر Webhook"""
        from backend.app.models.automation.workflow_models import WorkflowWebhook
        
        webhook = self.db.query(WorkflowWebhook).filter(
            WorkflowWebhook.webhook_id == webhook_id
        ).first()
        
        if not webhook or not webhook.is_active:
            raise ValueError(f"Webhook {webhook_id} not found or inactive")
        
        return await self.run_workflow(
            workflow_id=webhook.workflow_id,
            input_data=payload,
            triggered_by="webhook",
            trigger_metadata={"webhook_id": webhook_id}
        )
    
    async def run_scheduled_workflow(self, schedule_id: int):
        """تشغيل Workflow مجدول"""
        schedule = self.db.query(WorkflowSchedule).filter(
            WorkflowSchedule.id == schedule_id
        ).first()
        
        if not schedule or not schedule.is_active:
            logger.warning(f"Schedule {schedule_id} not found or inactive")
            return
        
        logger.info(f"Running scheduled workflow. Schedule ID: {schedule_id}")
        
        try:
            execution = await self.run_workflow(
                workflow_id=schedule.workflow_id,
                triggered_by="schedule",
                trigger_metadata={
                    "schedule_id": schedule_id,
                    "cron_expression": schedule.cron_expression
                }
            )
            
            # تحديث وقت آخر تشغيل
            schedule.last_run_at = datetime.utcnow()
            
            # حساب التشغيل القادم
            from croniter import croniter
            cron = croniter(schedule.cron_expression, schedule.last_run_at)
            schedule.next_run_at = cron.get_next(datetime)
            
            self.db.commit()
            
            return execution
            
        except Exception as e:
            logger.error(f"Failed to run scheduled workflow: {str(e)}")
            raise
    
    async def cancel_execution(self, execution_id: str) -> bool:
        """
        إلغاء تنفيذ جاري
        
        Args:
            execution_id: معرف التنفيذ
        
        Returns:
            bool: نجح الإلغاء أم لا
        """
        execution = self.db.query(WorkflowExecution).filter(
            WorkflowExecution.execution_id == execution_id
        ).first()
        
        if not execution:
            return False
        
        if execution.status not in [ExecutionStatus.PENDING, ExecutionStatus.RUNNING]:
            logger.warning(f"Cannot cancel execution {execution_id} with status {execution.status}")
            return False
        
        execution.status = ExecutionStatus.CANCELLED
        execution.completed_at = datetime.utcnow()
        self.db.commit()
        
        logger.info(f"Cancelled execution: {execution_id}")
        return True


# ============================================================================
# CELERY CONFIGURATION
# Location: backend/app/automation/execution/job_queue.py
# ============================================================================

# تكوين Celery
celery_app = Celery(
    'legal_automation',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # ساعة واحدة
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)


class WorkflowTask(Task):
    """مهمة Celery مخصصة لـ Workflows"""
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """عند فشل المهمة"""
        logger.error(f"Task {task_id} failed: {exc}")
        
        # تحديث حالة التنفيذ
        workflow_id = kwargs.get('workflow_id')
        if workflow_id:
            db = next(get_db())
            try:
                # البحث عن آخر تنفيذ
                execution = db.query(WorkflowExecution).filter(
                    WorkflowExecution.workflow_id == workflow_id,
                    WorkflowExecution.status == ExecutionStatus.RUNNING
                ).order_by(WorkflowExecution.started_at.desc()).first()
                
                if execution:
                    execution.status = ExecutionStatus.FAILED
                    execution.error_message = str(exc)
                    execution.completed_at = datetime.utcnow()
                    db.commit()
            finally:
                db.close()
    
    def on_success(self, retval, task_id, args, kwargs):
        """عند نجاح المهمة"""
        logger.success(f"Task {task_id} completed successfully")


# ============================================================================
# CELERY TASKS
# ============================================================================

@celery_app.task(base=WorkflowTask, bind=True, max_retries=3)
def execute_workflow_task(self, workflow_id: int, input_data: dict = None, triggered_by: str = "celery"):
    """
    مهمة Celery لتنفيذ Workflow
    
    Args:
        workflow_id: معرف الـ Workflow
        input_data: البيانات المُدخلة
        triggered_by: مصدر التشغيل
    """
    db = next(get_db())
    runner = WorkflowRunner(db)
    
    try:
        execution = runner.run_workflow_sync(
            workflow_id=workflow_id,
            input_data=input_data or {},
            triggered_by=triggered_by
        )
        
        return {
            'execution_id': execution.execution_id,
            'status': execution.status,
            'workflow_id': workflow_id
        }
        
    except Exception as e:
        logger.error(f"Workflow execution failed: {str(e)}")
        
        # إعادة المحاولة مع تأخير
        try:
            raise self.retry(exc=e, countdown=60 * (self.request.retries + 1))
        except self.MaxRetriesExceededError:
            logger.error(f"Max retries exceeded for workflow {workflow_id}")
            raise
    
    finally:
        db.close()


@celery_app.task
def execute_scheduled_workflow_task(schedule_id: int):
    """
    مهمة Celery لتنفيذ Workflow مجدول
    
    Args:
        schedule_id: معرف الجدولة
    """
    db = next(get_db())
    runner = WorkflowRunner(db)
    
    try:
        asyncio.run(runner.run_scheduled_workflow(schedule_id))
    except Exception as e:
        logger.error(f"Scheduled workflow execution failed: {str(e)}")
        raise
    finally:
        db.close()


@celery_app.task
def cleanup_old_executions_task(days: int = 30):
    """
    تنظيف سجلات التنفيذ القديمة
    
    Args:
        days: حذف السجلات الأقدم من هذا العدد من الأيام
    """
    from datetime import timedelta
    
    db = next(get_db())
    
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        deleted = db.query(WorkflowExecution).filter(
            WorkflowExecution.started_at < cutoff_date,
            WorkflowExecution.status.in_([ExecutionStatus.SUCCESS, ExecutionStatus.FAILED])
        ).delete(synchronize_session=False)
        
        db.commit()
        
        logger.info(f"Cleaned up {deleted} old workflow executions")
        
        return {'deleted_count': deleted}
        
    except Exception as e:
        logger.error(f"Cleanup failed: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


# ============================================================================
# CELERY BEAT SCHEDULE (للمهام الدورية)
# ============================================================================

celery_app.conf.beat_schedule = {
    # تنظيف السجلات القديمة كل يوم
    'cleanup-old-executions': {
        'task': 'backend.app.automation.execution.job_queue.cleanup_old_executions_task',
        'schedule': crontab(hour=2, minute=0),  # 2 صباحاً كل يوم
        'args': (30,)  # حذف أقدم من 30 يوم
    },
    
    # فحص الجدولات كل دقيقة
    'check-schedules': {
        'task': 'backend.app.automation.execution.job_queue.check_and_run_schedules',
        'schedule': 60.0,  # كل دقيقة
    }
}


@celery_app.task
def check_and_run_schedules():
    """فحص وتشغيل الجدولات المستحقة"""
    db = next(get_db())
    
    try:
        now = datetime.utcnow()
        
        # البحث عن الجدولات المستحقة
        schedules = db.query(WorkflowSchedule).filter(
            WorkflowSchedule.is_active == True,
            WorkflowSchedule.next_run_at <= now
        ).all()
        
        logger.info(f"Found {len(schedules)} schedules to run")
        
        for schedule in schedules:
            # تشغيل في مهمة منفصلة
            execute_scheduled_workflow_task.delay(schedule.id)
        
    except Exception as e:
        logger.error(f"Failed to check schedules: {str(e)}")
    finally:
        db.close()


# ============================================================================
# WORKFLOW SCHEDULER
# Location: backend/app/automation/execution/scheduler.py
# ============================================================================

class WorkflowScheduler:
    """إدارة جدولة Workflows"""
    
    def __init__(self, db_session):
        self.db = db_session
    
    def create_schedule(
        self,
        workflow_id: int,
        cron_expression: str,
        timezone: str = "UTC",
        max_retries: int = 3,
        timeout_seconds: int = 3600
    ) -> WorkflowSchedule:
        """
        إنشاء جدولة جديدة
        
        Args:
            workflow_id: معرف الـ Workflow
            cron_expression: تعبير Cron
            timezone: المنطقة الزمنية
            max_retries: الحد الأقصى لإعادة المحاولة
            timeout_seconds: المهلة القصوى
        
        Returns:
            WorkflowSchedule: الجدولة المُنشأة
        """
        from croniter import croniter
        
        # التحقق من صحة cron expression
        if not croniter.is_valid(cron_expression):
            raise ValueError(f"Invalid cron expression: {cron_expression}")
        
        # حساب التشغيل القادم
        base_time = datetime.utcnow()
        cron = croniter(cron_expression, base_time)
        next_run = cron.get_next(datetime)
        
        schedule = WorkflowSchedule(
            workflow_id=workflow_id,
            cron_expression=cron_expression,
            timezone=timezone,
            next_run_at=next_run,
            is_active=True,
            max_retries=max_retries,
            timeout_seconds=timeout_seconds
        )
        
        self.db.add(schedule)
        self.db.commit()
        self.db.refresh(schedule)
        
        logger.info(
            f"Created schedule for workflow {workflow_id}. "
            f"Next run: {next_run}"
        )
        
        return schedule
    
    def update_schedule(
        self,
        schedule_id: int,
        cron_expression: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> WorkflowSchedule:
        """تحديث جدولة"""
        schedule = self.db.query(WorkflowSchedule).filter(
            WorkflowSchedule.id == schedule_id
        ).first()
        
        if not schedule:
            raise ValueError(f"Schedule {schedule_id} not found")
        
        if cron_expression:
            from croniter import croniter
            
            if not croniter.is_valid(cron_expression):
                raise ValueError(f"Invalid cron expression: {cron_expression}")
            
            schedule.cron_expression = cron_expression
            
            # إعادة حساب التشغيل القادم
            base_time = schedule.last_run_at or datetime.utcnow()
            cron = croniter(cron_expression, base_time)
            schedule.next_run_at = cron.get_next(datetime)
        
        if is_active is not None:
            schedule.is_active = is_active
        
        self.db.commit()
        self.db.refresh(schedule)
        
        return schedule
    
    def delete_schedule(self, schedule_id: int):
        """حذف جدولة"""
        schedule = self.db.query(WorkflowSchedule).filter(
            WorkflowSchedule.id == schedule_id
        ).first()
        
        if schedule:
            self.db.delete(schedule)
            self.db.commit()
            logger.info(f"Deleted schedule {schedule_id}")
    
    def get_upcoming_schedules(self, hours: int = 24) -> list:
        """الحصول على الجدولات القادمة"""
        from datetime import timedelta
        
        cutoff = datetime.utcnow() + timedelta(hours=hours)
        
        schedules = self.db.query(WorkflowSchedule).filter(
            WorkflowSchedule.is_active == True,
            WorkflowSchedule.next_run_at <= cutoff
        ).order_by(WorkflowSchedule.next_run_at).all()
        
        return schedules