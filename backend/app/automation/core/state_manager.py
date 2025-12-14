"""
State Manager and Error Handler for Workflow Engine
Location: backend/app/automation/core/
"""

from typing import Dict, Any, Optional
from datetime import datetime
import traceback
from loguru import logger
import json


# ============================================================================
# STATE MANAGER
# Location: backend/app/automation/core/state_manager.py
# ============================================================================

class StateManager:
    """
    إدارة حالة تنفيذ Workflows
    
    يخزن:
    - البيانات المُدخلة والمُخرجة
    - حالة كل عقدة
    - المتغيرات المشتركة
    """
    
    def __init__(self):
        self._states: Dict[str, Dict[str, Any]] = {}
    
    def initialize_state(
        self,
        execution_id: str,
        workflow_definition: Dict[str, Any],
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        تهيئة حالة جديدة لتنفيذ
        
        Args:
            execution_id: معرف التنفيذ
            workflow_definition: تعريف الـ Workflow
            input_data: البيانات المُدخلة
        
        Returns:
            Dict: الحالة المُهيأة
        """
        state = {
            'execution_id': execution_id,
            'started_at': datetime.utcnow().isoformat(),
            'input': input_data,
            'variables': workflow_definition.get('variables', {}),
            'nodes': {},  # حالة كل عقدة
            'output': {},
            'metadata': {
                'total_nodes': len(workflow_definition.get('nodes', [])),
                'completed_nodes': 0,
                'failed_nodes': 0
            }
        }
        
        self._states[execution_id] = state
        logger.debug(f"Initialized state for execution: {execution_id}")
        
        return state
    
    def get_state(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """الحصول على حالة تنفيذ"""
        return self._states.get(execution_id)
    
    def update_node_state(
        self,
        execution_id: str,
        node_id: str,
        output: Any,
        status: str = "success"
    ):
        """
        تحديث حالة عقدة
        
        Args:
            execution_id: معرف التنفيذ
            node_id: معرف العقدة
            output: مخرجات العقدة
            status: حالة التنفيذ
        """
        if execution_id not in self._states:
            logger.warning(f"State not found for execution: {execution_id}")
            return
        
        state = self._states[execution_id]
        
        # تحديث حالة العقدة
        state['nodes'][node_id] = {
            'output': output,
            'status': status,
            'completed_at': datetime.utcnow().isoformat()
        }
        
        # تحديث الإحصائيات
        state['metadata']['completed_nodes'] += 1
        if status == "failed":
            state['metadata']['failed_nodes'] += 1
        
        logger.debug(f"Updated node state: {node_id} in execution: {execution_id}")
    
    def get_node_output(self, execution_id: str, node_id: str) -> Any:
        """الحصول على مخرجات عقدة محددة"""
        state = self.get_state(execution_id)
        if not state:
            return None
        
        node_state = state['nodes'].get(node_id, {})
        return node_state.get('output')
    
    def set_variable(self, execution_id: str, key: str, value: Any):
        """تعيين متغير في الحالة"""
        if execution_id in self._states:
            self._states[execution_id]['variables'][key] = value
    
    def get_variable(self, execution_id: str, key: str) -> Any:
        """الحصول على متغير من الحالة"""
        state = self.get_state(execution_id)
        if not state:
            return None
        return state['variables'].get(key)
    
    def set_output(self, execution_id: str, output: Dict[str, Any]):
        """تعيين المخرجات النهائية"""
        if execution_id in self._states:
            self._states[execution_id]['output'] = output
    
    def cleanup_state(self, execution_id: str):
        """تنظيف الحالة بعد انتهاء التنفيذ"""
        if execution_id in self._states:
            del self._states[execution_id]
            logger.debug(f"Cleaned up state for execution: {execution_id}")
    
    def get_progress(self, execution_id: str) -> Dict[str, Any]:
        """الحصول على تقدم التنفيذ"""
        state = self.get_state(execution_id)
        if not state:
            return {}
        
        metadata = state['metadata']
        total = metadata['total_nodes']
        completed = metadata['completed_nodes']
        
        return {
            'execution_id': execution_id,
            'total_nodes': total,
            'completed_nodes': completed,
            'failed_nodes': metadata['failed_nodes'],
            'progress_percentage': (completed / total * 100) if total > 0 else 0,
            'status': 'running' if completed < total else 'completed'
        }
    
    def export_state(self, execution_id: str) -> Optional[str]:
        """تصدير الحالة كـ JSON"""
        state = self.get_state(execution_id)
        if not state:
            return None
        
        try:
            return json.dumps(state, indent=2, ensure_ascii=False, default=str)
        except Exception as e:
            logger.error(f"Failed to export state: {e}")
            return None


# ============================================================================
# ERROR HANDLER
# Location: backend/app/automation/execution/error_handler.py
# ============================================================================

class ErrorHandler:
    """
    معالجة أخطاء تنفيذ Workflows
    
    المسؤوليات:
    - تصنيف الأخطاء
    - استخراج معلومات مفيدة
    - تحديد قابلية إعادة المحاولة
    - تسجيل الأخطاء
    """
    
    # أنواع الأخطاء
    ERROR_TYPES = {
        'validation': 'خطأ في التحقق من الصحة',
        'configuration': 'خطأ في الإعدادات',
        'execution': 'خطأ في التنفيذ',
        'network': 'خطأ في الشبكة',
        'timeout': 'انتهاء المهلة',
        'permission': 'خطأ في الصلاحيات',
        'resource': 'خطأ في الموارد',
        'unknown': 'خطأ غير معروف'
    }
    
    # الأخطاء القابلة لإعادة المحاولة
    RETRYABLE_ERRORS = {
        'network',
        'timeout',
        'resource'
    }
    
    def handle_error(self, exception: Exception) -> Dict[str, Any]:
        """
        معالجة خطأ وإرجاع معلومات مفصلة
        
        Args:
            exception: الاستثناء الذي حدث
        
        Returns:
            Dict: معلومات الخطأ
        """
        error_type = self._classify_error(exception)
        error_message = str(exception)
        stack_trace = traceback.format_exc()
        
        error_info = {
            'type': error_type,
            'message': error_message,
            'stack': stack_trace,
            'is_retryable': error_type in self.RETRYABLE_ERRORS,
            'timestamp': datetime.utcnow().isoformat(),
            'exception_class': exception.__class__.__name__
        }
        
        # تسجيل الخطأ
        logger.error(
            f"Error occurred: {error_type} - {error_message}\n"
            f"Exception: {exception.__class__.__name__}"
        )
        
        return error_info
    
    def _classify_error(self, exception: Exception) -> str:
        """تصنيف نوع الخطأ"""
        exception_name = exception.__class__.__name__
        error_message = str(exception).lower()
        
        # أخطاء التحقق
        if 'validation' in exception_name.lower() or 'invalid' in error_message:
            return 'validation'
        
        # أخطاء الإعدادات
        if 'config' in exception_name.lower() or 'missing' in error_message:
            return 'configuration'
        
        # أخطاء الشبكة
        if any(keyword in exception_name.lower() for keyword in ['connection', 'timeout', 'network']):
            return 'network'
        
        # أخطاء المهلة
        if 'timeout' in exception_name.lower():
            return 'timeout'
        
        # أخطاء الصلاحيات
        if any(keyword in exception_name.lower() for keyword in ['permission', 'forbidden', 'unauthorized']):
            return 'permission'
        
        # أخطاء الموارد
        if any(keyword in error_message for keyword in ['memory', 'disk', 'cpu', 'resource']):
            return 'resource'
        
        # أخطاء التنفيذ العامة
        if 'runtime' in exception_name.lower() or 'execution' in exception_name.lower():
            return 'execution'
        
        return 'unknown'
    
    def should_retry(self, error_info: Dict[str, Any], retry_count: int, max_retries: int) -> bool:
        """
        تحديد ما إذا كان يجب إعادة المحاولة
        
        Args:
            error_info: معلومات الخطأ
            retry_count: عدد المحاولات الحالية
            max_retries: الحد الأقصى للمحاولات
        
        Returns:
            bool: True إذا كان يجب إعادة المحاولة
        """
        if retry_count >= max_retries:
            return False
        
        return error_info.get('is_retryable', False)
    
    def get_retry_delay(self, retry_count: int) -> int:
        """
        حساب تأخير إعادة المحاولة (exponential backoff)
        
        Args:
            retry_count: رقم المحاولة
        
        Returns:
            int: التأخير بالثواني
        """
        base_delay = 2  # ثانيتين
        max_delay = 60  # دقيقة واحدة
        
        delay = min(base_delay * (2 ** retry_count), max_delay)
        return delay
    
    def format_error_message(self, error_info: Dict[str, Any]) -> str:
        """تنسيق رسالة خطأ للعرض"""
        error_type = error_info.get('type', 'unknown')
        message = error_info.get('message', 'حدث خطأ غير معروف')
        
        formatted = f"[{self.ERROR_TYPES.get(error_type, 'خطأ')}] {message}"
        
        if error_info.get('is_retryable'):
            formatted += " (سيتم إعادة المحاولة)"
        
        return formatted
    
    def create_error_report(self, execution_id: str, errors: list) -> Dict[str, Any]:
        """إنشاء تقرير شامل للأخطاء"""
        report = {
            'execution_id': execution_id,
            'total_errors': len(errors),
            'error_types': {},
            'retryable_count': 0,
            'critical_errors': [],
            'generated_at': datetime.utcnow().isoformat()
        }
        
        for error in errors:
            error_type = error.get('type', 'unknown')
            
            # تجميع حسب النوع
            if error_type not in report['error_types']:
                report['error_types'][error_type] = 0
            report['error_types'][error_type] += 1
            
            # عد الأخطاء القابلة لإعادة المحاولة
            if error.get('is_retryable'):
                report['retryable_count'] += 1
            
            # الأخطاء الحرجة
            if error_type in ['permission', 'configuration']:
                report['critical_errors'].append({
                    'type': error_type,
                    'message': error.get('message'),
                    'timestamp': error.get('timestamp')
                })
        
        return report


# ============================================================================
# RETRY HANDLER
# Location: backend/app/automation/execution/retry_handler.py
# ============================================================================

class RetryHandler:
    """معالج إعادة المحاولة للعمليات الفاشلة"""
    
    def __init__(self, max_retries: int = 3):
        self.max_retries = max_retries
        self.error_handler = ErrorHandler()
    
    async def execute_with_retry(
        self,
        func,
        *args,
        retry_count: int = 0,
        **kwargs
    ) -> Any:
        """
        تنفيذ دالة مع إعادة محاولة تلقائية
        
        Args:
            func: الدالة المراد تنفيذها
            retry_count: عدد المحاولات الحالية
            *args, **kwargs: معاملات الدالة
        
        Returns:
            Any: نتيجة التنفيذ
        
        Raises:
            Exception: إذا فشلت جميع المحاولات
        """
        import asyncio
        
        try:
            # محاولة التنفيذ
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)
            
            return result
            
        except Exception as e:
            error_info = self.error_handler.handle_error(e)
            
            # التحقق من إمكانية إعادة المحاولة
            if self.error_handler.should_retry(error_info, retry_count, self.max_retries):
                delay = self.error_handler.get_retry_delay(retry_count)
                
                logger.warning(
                    f"Retrying after {delay}s (attempt {retry_count + 1}/{self.max_retries})"
                )
                
                await asyncio.sleep(delay)
                
                # إعادة المحاولة
                return await self.execute_with_retry(
                    func,
                    *args,
                    retry_count=retry_count + 1,
                    **kwargs
                )
            else:
                # فشلت جميع المحاولات
                logger.error(
                    f"All retry attempts failed for {func.__name__}. "
                    f"Total attempts: {retry_count + 1}"
                )
                raise


# ============================================================================
# CIRCUIT BREAKER
# Location: backend/app/automation/execution/circuit_breaker.py
# ============================================================================

class CircuitBreaker:
    """
    Circuit Breaker Pattern لحماية النظام من الأخطاء المتكررة
    
    الحالات:
    - CLOSED: يعمل بشكل طبيعي
    - OPEN: متوقف بسبب أخطاء متكررة
    - HALF_OPEN: اختبار للتعافي
    """
    
    def __init__(
        self,
        failure_threshold: int = 5,
        timeout: int = 60,
        success_threshold: int = 2
    ):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.success_threshold = success_threshold
        
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time = None
        self._state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN
    
    def can_execute(self) -> bool:
        """التحقق من إمكانية التنفيذ"""
        if self._state == 'CLOSED':
            return True
        
        if self._state == 'OPEN':
            # التحقق من انتهاء المهلة
            if self._last_failure_time:
                elapsed = (datetime.utcnow() - self._last_failure_time).total_seconds()
                if elapsed >= self.timeout:
                    self._state = 'HALF_OPEN'
                    self._success_count = 0
                    logger.info("Circuit breaker moved to HALF_OPEN state")
                    return True
            return False
        
        if self._state == 'HALF_OPEN':
            return True
        
        return False
    
    def record_success(self):
        """تسجيل نجاح"""
        if self._state == 'HALF_OPEN':
            self._success_count += 1
            if self._success_count >= self.success_threshold:
                self._state = 'CLOSED'
                self._failure_count = 0
                logger.info("Circuit breaker moved to CLOSED state")
        elif self._state == 'CLOSED':
            self._failure_count = max(0, self._failure_count - 1)
    
    def record_failure(self):
        """تسجيل فشل"""
        self._failure_count += 1
        self._last_failure_time = datetime.utcnow()
        
        if self._state == 'HALF_OPEN':
            self._state = 'OPEN'
            logger.warning("Circuit breaker moved back to OPEN state")
        elif self._state == 'CLOSED':
            if self._failure_count >= self.failure_threshold:
                self._state = 'OPEN'
                logger.error(f"Circuit breaker OPENED after {self._failure_count} failures")
    
    def get_state(self) -> str:
        """الحصول على الحالة الحالية"""
        return self._state
    
    def reset(self):
        """إعادة تعيين Circuit Breaker"""
        self._state = 'CLOSED'
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time = None
        logger.info("Circuit breaker reset to CLOSED state")