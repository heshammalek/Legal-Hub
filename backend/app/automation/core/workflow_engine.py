"""
Advanced Workflow Engine for Legal Automation System
Location: backend/app/automation/core/workflow_engine.py
"""

import asyncio
import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime
from loguru import logger

from backend.app.models.automation.workflow_models import (
    Workflow, WorkflowExecution, NodeExecution, ExecutionStatus
)
from backend.app.automation.nodes.base_node import BaseNode
from backend.app.automation.core.state_manager import StateManager
from backend.app.automation.execution.error_handler import ErrorHandler


class WorkflowEngine:
    """
    محرك تنفيذ Workflows المتقدم
    
    المسؤوليات:
    - تنفيذ Workflows بشكل متزامن أو غير متزامن
    - إدارة تدفق التنفيذ بين العقد
    - معالجة الأخطاء وإعادة المحاولة
    - تتبع الحالة والتقدم
    """
    
    def __init__(self, db_session):
        self.db = db_session
        self.state_manager = StateManager()
        self.error_handler = ErrorHandler()
        self.node_registry: Dict[str, type] = {}
        self._register_nodes()
    
    def _register_nodes(self):
        """تسجيل جميع أنواع العقد المتاحة"""
        # سيتم التسجيل الديناميكي للعقد
        # TODO: استيراد وتسجيل جميع العقد من مجلدات nodes/
        pass
    
    def register_node(self, node_type: str, node_class: type):
        """تسجيل نوع عقدة جديد"""
        if not issubclass(node_class, BaseNode):
            raise ValueError(f"{node_class} must inherit from BaseNode")
        self.node_registry[node_type] = node_class
        logger.info(f"Registered node type: {node_type}")
    
    async def execute_workflow(
        self,
        workflow: Workflow,
        input_data: Dict[str, Any] = None,
        triggered_by: str = "manual",
        trigger_metadata: Dict[str, Any] = None
    ) -> WorkflowExecution:
        """
        تنفيذ Workflow كامل
        
        Args:
            workflow: الـ Workflow المطلوب تنفيذه
            input_data: البيانات المُدخلة
            triggered_by: مصدر التشغيل
            trigger_metadata: معلومات إضافية عن المشغل
        
        Returns:
            WorkflowExecution: سجل التنفيذ
        """
        execution_id = str(uuid.uuid4())
        started_at = datetime.utcnow()
        
        # إنشاء سجل تنفيذ
        execution = WorkflowExecution(
            workflow_id=workflow.id,
            execution_id=execution_id,
            status=ExecutionStatus.RUNNING,
            input_data=input_data or {},
            triggered_by=triggered_by,
            trigger_metadata=trigger_metadata or {},
            started_at=started_at
        )
        self.db.add(execution)
        self.db.commit()
        
        logger.info(f"Starting workflow execution: {execution_id} for workflow: {workflow.name}")
        
        try:
            # تهيئة حالة التنفيذ
            execution_state = self.state_manager.initialize_state(
                execution_id=execution_id,
                workflow_definition=workflow.definition,
                input_data=input_data or {}
            )
            
            # الحصول على العقد الجذرية (Trigger nodes)
            root_nodes = self._get_root_nodes(workflow.definition)
            
            # تنفيذ كل عقدة جذرية
            for root_node in root_nodes:
                await self._execute_node(
                    node_definition=root_node,
                    workflow=workflow,
                    execution=execution,
                    execution_state=execution_state
                )
            
            # تحديث حالة التنفيذ إلى نجاح
            execution.status = ExecutionStatus.SUCCESS
            execution.completed_at = datetime.utcnow()
            execution.duration = (execution.completed_at - started_at).total_seconds()
            execution.output_data = execution_state.get('output', {})
            
            # تحديث إحصائيات الـ Workflow
            workflow.total_executions += 1
            workflow.successful_executions += 1
            workflow.last_execution_at = execution.completed_at
            
            logger.success(f"Workflow execution completed successfully: {execution_id}")
            
        except Exception as e:
            # معالجة الأخطاء
            error_info = self.error_handler.handle_error(e)
            
            execution.status = ExecutionStatus.FAILED
            execution.completed_at = datetime.utcnow()
            execution.duration = (execution.completed_at - started_at).total_seconds()
            execution.error_message = error_info['message']
            execution.error_stack = error_info['stack']
            
            workflow.total_executions += 1
            workflow.failed_executions += 1
            workflow.last_execution_at = execution.completed_at
            
            logger.error(f"Workflow execution failed: {execution_id} - {error_info['message']}")
        
        finally:
            self.db.commit()
            # تنظيف الحالة
            self.state_manager.cleanup_state(execution_id)
        
        return execution
    
    async def _execute_node(
        self,
        node_definition: Dict[str, Any],
        workflow: Workflow,
        execution: WorkflowExecution,
        execution_state: Dict[str, Any],
        parent_output: Any = None
    ) -> Any:
        """
        تنفيذ عقدة واحدة
        
        Args:
            node_definition: تعريف العقدة من workflow.definition
            workflow: الـ Workflow الأب
            execution: سجل التنفيذ
            execution_state: حالة التنفيذ الحالية
            parent_output: مخرجات العقدة السابقة
        
        Returns:
            Any: مخرجات العقدة
        """
        node_id = node_definition['id']
        node_type = node_definition['type']
        node_subtype = node_definition['subtype']
        node_name = node_definition.get('name', f"{node_type}_{node_subtype}")
        node_config = node_definition.get('config', {})
        
        started_at = datetime.utcnow()
        
        # إنشاء سجل تنفيذ العقدة
        node_execution = NodeExecution(
            workflow_execution_id=execution.id,
            node_id=node_id,
            node_type=node_type,
            node_subtype=node_subtype,
            node_name=node_name,
            status=ExecutionStatus.RUNNING,
            started_at=started_at
        )
        self.db.add(node_execution)
        self.db.commit()
        
        logger.debug(f"Executing node: {node_id} ({node_type}/{node_subtype})")
        
        try:
            # الحصول على فئة العقدة من السجل
            node_key = f"{node_type}.{node_subtype}"
            if node_key not in self.node_registry:
                raise ValueError(f"Unknown node type: {node_key}")
            
            NodeClass = self.node_registry[node_key]
            node_instance = NodeClass(config=node_config, db=self.db)
            
            # تحضير المدخلات
            node_input = self._prepare_node_input(
                node_definition=node_definition,
                execution_state=execution_state,
                parent_output=parent_output
            )
            
            node_execution.input_data = node_input
            
            # تنفيذ العقدة
            node_output = await node_instance.execute(node_input)
            
            # تحديث الحالة
            self.state_manager.update_node_state(
                execution_id=execution.execution_id,
                node_id=node_id,
                output=node_output
            )
            
            # تحديث سجل التنفيذ
            node_execution.status = ExecutionStatus.SUCCESS
            node_execution.output_data = node_output
            node_execution.completed_at = datetime.utcnow()
            node_execution.duration = int((node_execution.completed_at - started_at).total_seconds() * 1000)
            
            logger.debug(f"Node executed successfully: {node_id}")
            
            # تنفيذ العقد التالية
            next_nodes = self._get_next_nodes(
                workflow_definition=workflow.definition,
                current_node_id=node_id,
                node_output=node_output
            )
            
            for next_node in next_nodes:
                await self._execute_node(
                    node_definition=next_node,
                    workflow=workflow,
                    execution=execution,
                    execution_state=execution_state,
                    parent_output=node_output
                )
            
            return node_output
            
        except Exception as e:
            # معالجة أخطاء العقدة
            error_info = self.error_handler.handle_error(e)
            
            node_execution.status = ExecutionStatus.FAILED
            node_execution.error_message = error_info['message']
            node_execution.completed_at = datetime.utcnow()
            node_execution.duration = int((node_execution.completed_at - started_at).total_seconds() * 1000)
            
            logger.error(f"Node execution failed: {node_id} - {error_info['message']}")
            
            # إعادة رفع الخطأ لإيقاف التنفيذ
            raise
        
        finally:
            self.db.commit()
    
    def _prepare_node_input(
        self,
        node_definition: Dict[str, Any],
        execution_state: Dict[str, Any],
        parent_output: Any = None
    ) -> Dict[str, Any]:
        """تحضير مدخلات العقدة من الحالة والعقد السابقة"""
        input_mapping = node_definition.get('input_mapping', {})
        node_input = {}
        
        # دمج مخرجات العقدة السابقة
        if parent_output is not None:
            node_input['parent_output'] = parent_output
        
        # تطبيق تعيين المدخلات
        for key, source in input_mapping.items():
            if source.startswith('$state.'):
                # قراءة من الحالة
                state_key = source.replace('$state.', '')
                node_input[key] = execution_state.get(state_key)
            elif source.startswith('$node.'):
                # قراءة من مخرجات عقدة أخرى
                node_ref = source.replace('$node.', '')
                node_input[key] = self.state_manager.get_node_output(
                    execution_state['execution_id'],
                    node_ref
                )
            else:
                # قيمة ثابتة
                node_input[key] = source
        
        return node_input
    
    def _get_root_nodes(self, workflow_definition: Dict[str, Any]) -> List[Dict[str, Any]]:
        """الحصول على العقد الجذرية (Trigger nodes)"""
        nodes = workflow_definition.get('nodes', [])
        edges = workflow_definition.get('edges', [])
        
        # العقد التي ليس لها حواف داخلة
        target_nodes = {edge['target'] for edge in edges}
        root_nodes = [node for node in nodes if node['id'] not in target_nodes]
        
        return root_nodes
    
    def _get_next_nodes(
        self,
        workflow_definition: Dict[str, Any],
        current_node_id: str,
        node_output: Any = None
    ) -> List[Dict[str, Any]]:
        """
        الحصول على العقد التالية بناءً على الحواف والشروط
        
        Args:
            workflow_definition: تعريف الـ Workflow
            current_node_id: معرف العقدة الحالية
            node_output: مخرجات العقدة الحالية (للشروط)
        
        Returns:
            List[Dict]: قائمة العقد التالية
        """
        nodes = workflow_definition.get('nodes', [])
        edges = workflow_definition.get('edges', [])
        
        # البحث عن الحواف الخارجة من العقدة الحالية
        outgoing_edges = [edge for edge in edges if edge['source'] == current_node_id]
        
        next_nodes = []
        for edge in outgoing_edges:
            # التحقق من الشرط إذا وجد
            condition = edge.get('condition')
            if condition and not self._evaluate_condition(condition, node_output):
                continue
            
            # إيجاد تعريف العقدة المستهدفة
            target_node = next(
                (node for node in nodes if node['id'] == edge['target']),
                None
            )
            
            if target_node:
                next_nodes.append(target_node)
        
        return next_nodes
    
    def _evaluate_condition(self, condition: Dict[str, Any], node_output: Any) -> bool:
        """
        تقييم شرط الحافة
        
        Args:
            condition: تعريف الشرط
            node_output: مخرجات العقدة للتقييم
        
        Returns:
            bool: نتيجة التقييم
        """
        # TODO: تطبيق محرك تقييم شروط متقدم
        # مثال: {"field": "status", "operator": "equals", "value": "success"}
        
        if not condition:
            return True
        
        field = condition.get('field')
        operator = condition.get('operator')
        value = condition.get('value')
        
        # استخراج القيمة من المخرجات
        if isinstance(node_output, dict):
            actual_value = node_output.get(field)
        else:
            actual_value = node_output
        
        # تقييم العملية
        if operator == 'equals':
            return actual_value == value
        elif operator == 'not_equals':
            return actual_value != value
        elif operator == 'greater_than':
            return actual_value > value
        elif operator == 'less_than':
            return actual_value < value
        elif operator == 'contains':
            return value in str(actual_value)
        elif operator == 'exists':
            return actual_value is not None
        else:
            return True


class WorkflowValidator:
    """التحقق من صحة تعريفات Workflow"""
    
    @staticmethod
    def validate_workflow_definition(definition: Dict[str, Any]) -> tuple[bool, List[str]]:
        """
        التحقق من صحة تعريف Workflow
        
        Returns:
            tuple: (is_valid, list of errors)
        """
        errors = []
        
        # التحقق من الهيكل الأساسي
        if 'nodes' not in definition:
            errors.append("Missing 'nodes' in workflow definition")
        
        if 'edges' not in definition:
            errors.append("Missing 'edges' in workflow definition")
        
        if errors:
            return False, errors
        
        nodes = definition['nodes']
        edges = definition['edges']
        
        # التحقق من العقد
        node_ids = {node['id'] for node in nodes}
        
        for node in nodes:
            if 'id' not in node:
                errors.append(f"Node missing 'id'")
            if 'type' not in node:
                errors.append(f"Node {node.get('id', 'unknown')} missing 'type'")
            if 'subtype' not in node:
                errors.append(f"Node {node.get('id', 'unknown')} missing 'subtype'")
        
        # التحقق من الحواف
        for edge in edges:
            if 'source' not in edge or 'target' not in edge:
                errors.append(f"Edge missing 'source' or 'target'")
                continue
            
            if edge['source'] not in node_ids:
                errors.append(f"Edge references non-existent source node: {edge['source']}")
            
            if edge['target'] not in node_ids:
                errors.append(f"Edge references non-existent target node: {edge['target']}")
        
        # التحقق من وجود عقدة جذرية واحدة على الأقل
        target_nodes = {edge['target'] for edge in edges}
        root_nodes = [node for node in nodes if node['id'] not in target_nodes]
        
        if not root_nodes:
            errors.append("Workflow must have at least one root (trigger) node")
        
        # التحقق من عدم وجود دورات (cycles)
        if WorkflowValidator._has_cycle(nodes, edges):
            errors.append("Workflow contains cycles (circular dependencies)")
        
        return len(errors) == 0, errors
    
    @staticmethod
    def _has_cycle(nodes: List[Dict], edges: List[Dict]) -> bool:
        """التحقق من وجود دورات في الرسم البياني"""
        # استخدام DFS للكشف عن الدورات
        adjacency = {node['id']: [] for node in nodes}
        for edge in edges:
            adjacency[edge['source']].append(edge['target'])
        
        visited = set()
        rec_stack = set()
        
        def dfs(node_id: str) -> bool:
            visited.add(node_id)
            rec_stack.add(node_id)
            
            for neighbor in adjacency.get(node_id, []):
                if neighbor not in visited:
                    if dfs(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True
            
            rec_stack.remove(node_id)
            return False
        
        for node in nodes:
            if node['id'] not in visited:
                if dfs(node['id']):
                    return True
        
        return False