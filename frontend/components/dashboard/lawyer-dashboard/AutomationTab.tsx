import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Play, Save, Calendar, Webhook, Zap, Database, Mail, Bell, FileText, 
  RotateCcw, GitBranch, BarChart3, X, Download, Upload, Video, 
  ChevronDown, Layout, Menu, Maximize2, Minimize2, 
  Workflow, Sparkles, Settings, ChevronLeft, ChevronRight,
  ChevronUp, ChevronDown as ChevronDownIcon,
  FolderOpen, FolderClosed, Cpu, Cloud, Shield, Users,
  MessageCircle, Filter, Clock, AlertCircle, Search,
  UserCheck, BookOpen, ShieldAlert, Globe, Smartphone,
  Printer, Archive, TrendingUp, Eye, Edit3, Trash2,
  Link, Server, Wifi, HardDrive, MousePointer, Code,
  GripVertical
} from 'lucide-react';

// تعريف الـ Types
interface NodePosition {
  x: number;
  y: number;
}

interface NodeConfig {
  [key: string]: any;
}

interface WorkflowNode {
  id: string;
  type: string;
  subtype: string;
  name: string;
  position: NodePosition;
  config: NodeConfig;
  icon: string;
  color: string;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: any;
}

interface WorkflowTemplate {
  key: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  allowed_roles: string[];
  definition: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
}

// تعريف iconComponents خارج الكومبوننت مباشرة
const iconComponents: { [key: string]: React.ComponentType<any> } = {
  Calendar, Webhook, FileText, Zap, Mail, Bell, Database, GitBranch, 
  RotateCcw, BarChart3, Upload, Video, Layout, Sparkles, Workflow,
  FolderOpen, FolderClosed, Cpu, Cloud, Shield, Users, MessageCircle,
  Filter, Clock, AlertCircle, Play, Save, Settings, Download,
  Maximize2, Minimize2, Search, UserCheck, BookOpen, ShieldAlert,
  Globe, Smartphone, Printer, Archive, TrendingUp, Eye, Edit3,
  Trash2, Link, Server, Wifi, HardDrive, MousePointer, Code,
  GripVertical
};

const WorkflowBuilder = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    {
      id: 'trigger-1',
      type: 'trigger',
      subtype: 'schedule',
      name: 'جدولة يومية',
      position: { x: 100, y: 200 },
      config: { cron_expression: '0 9 * * *' },
      icon: 'Calendar',
      color: 'bg-blue-500'
    }
  ]);
  
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [workflowName, setWorkflowName] = useState('Workflow جديد');
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<NodePosition>({ x: 0, y: 0 });
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isDraggingTools, setIsDraggingTools] = useState(false);
  const [toolsDragOffset, setToolsDragOffset] = useState({ x: 0, y: 0 });
  const [toolsPosition, setToolsPosition] = useState({ x: 50, y: 50 });
  const [showTemplates, setShowTemplates] = useState(false);

  const toolsRef = useRef<HTMLDivElement>(null);

  // تعريف الدوال أولاً
  const addNode = (type: string, subtype: string, name: string, iconName: string, color: string) => {
    const newNode: WorkflowNode = {
      id: `${type}-${Date.now()}`,
      type,
      subtype,
      name,
      icon: iconName,
      color,
      position: { x: 300, y: 150 + nodes.length * 100 },
      config: getDefaultConfig(subtype)
    };
    setNodes([...nodes, newNode]);
  };

  const getDefaultConfig = (subtype: string): NodeConfig => {
    const configs: { [key: string]: NodeConfig } = {
      schedule: { cron_expression: '0 9 * * *' },
      webhook: { url: '', method: 'POST' },
      case_event: { event_type: 'case_updated' },
      document_upload: { allowed_types: ['pdf', 'docx'] },
      email: { to: '', subject: '', body: '' },
      notification: { message: '', type: 'info' },
      database: { query: '', operation: 'select' },
      rag_query: { collection: '', query: '' },
      document_analysis: { analysis_type: 'summary' },
      condition: { condition: '', operator: 'equals' },
      loop: { items: '', max_iterations: 10 },
      api_call: { endpoint: '', method: 'GET' },
      sms: { to: '', message: '' }
    };
    return configs[subtype] || {};
  };

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setEdges(edges.filter(e => e.source !== nodeId && e.target !== nodeId));
    if (selectedNode?.id === nodeId) setSelectedNode(null);
  };

  const useTemplate = (template: WorkflowTemplate) => {
    setNodes(template.definition.nodes);
    setEdges(template.definition.edges);
    setWorkflowName(template.name);
    setShowTemplates(false);
  };

  const handleMouseDown = (e: React.MouseEvent, node: WorkflowNode) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDraggingNode(node.id);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNode) {
      const canvas = document.getElementById('workflow-canvas');
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;
      
      setNodes(nodes.map(node => 
        node.id === draggingNode ? { ...node, position: { x, y } } : node
      ));
    }

    if (isDraggingTools) {
      setToolsPosition({
        x: e.clientX - toolsDragOffset.x,
        y: e.clientY - toolsDragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
    setIsDraggingTools(false);
  };

  const handleToolsMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!toolsRef.current) return;
    
    const rect = toolsRef.current.getBoundingClientRect();
    setIsDraggingTools(true);
    setToolsDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const updateNodeConfig = (key: string, value: any) => {
    if (!selectedNode) return;
    
    setNodes(nodes.map(n => 
      n.id === selectedNode.id ? { 
        ...n, 
        config: { ...n.config, [key]: value } 
      } : n
    ));
    setSelectedNode({ 
      ...selectedNode, 
      config: { ...selectedNode.config, [key]: value } 
    });
  };

  const saveWorkflow = async () => {
    const workflowDefinition = { 
      name: workflowName,
      nodes, 
      edges, 
      variables: {},
      created_at: new Date().toISOString()
    };
    
    try {
      console.log('Saving workflow:', workflowDefinition);
      alert('تم حفظ Workflow بنجاح!');
    } catch (error) {
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const executeWorkflow = async () => {
    setIsExecuting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('تم تنفيذ Workflow بنجاح!');
    } catch (error) {
      alert('حدث خطأ أثناء التنفيذ');
    } finally {
      setIsExecuting(false);
    }
  };

  const exportWorkflow = () => {
    const workflowData = {
      name: workflowName,
      nodes,
      edges,
      exported_at: new Date().toISOString()
    };
    const dataStr = JSON.stringify(workflowData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${workflowName}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const toggleTools = () => {
    setIsToolsOpen(!isToolsOpen);
    setShowTemplates(false);
  };

  // تعريف جميع المهام في مصفوفة واحدة
  const allTasks = [
    // المشغلات
    { type: 'trigger', subtype: 'schedule', name: 'جدولة زمنية', icon: 'Calendar', color: 'bg-blue-500' },
    { type: 'trigger', subtype: 'webhook', name: 'Webhook', icon: 'Webhook', color: 'bg-green-500' },
    { type: 'trigger', subtype: 'case_event', name: 'حدث قضية', icon: 'FileText', color: 'bg-purple-500' },
    { type: 'trigger', subtype: 'document_upload', name: 'رفع مستند', icon: 'Upload', color: 'bg-indigo-500' },
    { type: 'trigger', subtype: 'api_trigger', name: 'استدعاء API', icon: 'Cloud', color: 'bg-teal-500' },
    { type: 'trigger', subtype: 'time_trigger', name: 'مؤقت زمني', icon: 'Clock', color: 'bg-amber-500' },
    
    // الإجراءات
    { type: 'action', subtype: 'rag_query', name: 'استعلام RAG', icon: 'Zap', color: 'bg-amber-500' },
    { type: 'action', subtype: 'document_analysis', name: 'تحليل مستند', icon: 'FileText', color: 'bg-indigo-500' },
    { type: 'action', subtype: 'email', name: 'إرسال بريد', icon: 'Mail', color: 'bg-red-500' },
    { type: 'action', subtype: 'notification', name: 'إشعار', icon: 'Bell', color: 'bg-orange-500' },
    { type: 'action', subtype: 'database', name: 'قاعدة بيانات', icon: 'Database', color: 'bg-cyan-500' },
    { type: 'action', subtype: 'api_call', name: 'استدعاء API', icon: 'Cloud', color: 'bg-teal-500' },
    { type: 'action', subtype: 'sms', name: 'رسالة SMS', icon: 'MessageCircle', color: 'bg-emerald-500' },
    { type: 'action', subtype: 'data_filter', name: 'تصفية بيانات', icon: 'Filter', color: 'bg-violet-500' },
    
    // المنطق
    { type: 'logic', subtype: 'condition', name: 'شرط', icon: 'GitBranch', color: 'bg-gray-500' },
    { type: 'logic', subtype: 'loop', name: 'حلقة تكرار', icon: 'RotateCcw', color: 'bg-slate-500' },
    { type: 'logic', subtype: 'switch', name: 'تبديل', icon: 'Cpu', color: 'bg-rose-500' },
    { type: 'logic', subtype: 'delay', name: 'تأخير', icon: 'Clock', color: 'bg-amber-500' },
    
    // التكاملات
    { type: 'integration', subtype: 'zoom', name: 'Zoom', icon: 'Video', color: 'bg-blue-400' },
    { type: 'integration', subtype: 'calendar', name: 'تقويم', icon: 'Calendar', color: 'bg-green-400' },
    { type: 'integration', subtype: 'slack', name: 'Slack', icon: 'MessageCircle', color: 'bg-purple-400' },
    { type: 'integration', subtype: 'whatsapp', name: 'WhatsApp', icon: 'MessageCircle', color: 'bg-green-400' },
    { type: 'integration', subtype: 'teams', name: 'Microsoft Teams', icon: 'Users', color: 'bg-blue-400' },
    { type: 'integration', subtype: 'drive', name: 'Google Drive', icon: 'FolderOpen', color: 'bg-yellow-400' }
  ];

  // الكشف عن حجم الشاشة
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Mock data للقوالب
  useEffect(() => {
    const mockTemplates: WorkflowTemplate[] = [
      {
        key: 'case_monitoring',
        name: 'مراقبة القضايا',
        description: 'مراقبة تحديثات القضايا وإرسال إشعارات',
        category: 'case_management',
        icon: '⚖️',
        allowed_roles: ['lawyer', 'judge'],
        definition: {
          nodes: [
            {
              id: 'trigger_1',
              type: 'trigger',
              subtype: 'schedule',
              name: 'فحص يومي',
              position: { x: 100, y: 200 },
              config: { cron_expression: '0 9 * * *' },
              icon: 'Calendar',
              color: 'bg-blue-500'
            }
          ],
          edges: []
        }
      },
      {
        key: 'document_processing',
        name: 'معالجة المستندات',
        description: 'تحليل وترجمة المستندات القانونية',
        category: 'document_processing',
        icon: '📄',
        allowed_roles: ['lawyer', 'expert'],
        definition: {
          nodes: [
            {
              id: 'trigger_1',
              type: 'trigger',
              subtype: 'document_upload',
              name: 'رفع مستند',
              position: { x: 100, y: 200 },
              config: { file_types: ['pdf', 'docx'] },
              icon: 'Upload',
              color: 'bg-indigo-500'
            }
          ],
          edges: []
        }
      },
      {
        key: 'client_communication',
        name: 'تواصل العملاء',
        description: 'إرسال تحديثات تلقائية للعملاء',
        category: 'communication',
        icon: '📞',
        allowed_roles: ['lawyer', 'assistant'],
        definition: {
          nodes: [
            {
              id: 'trigger_1',
              type: 'trigger',
              subtype: 'case_event',
              name: 'تحديث قضية',
              position: { x: 100, y: 200 },
              config: { event_type: 'case_updated' },
              icon: 'FileText',
              color: 'bg-purple-500'
            }
          ],
          edges: []
        }
      }
    ];
    setTemplates(mockTemplates);
  }, []);

  const renderNodeConfig = (node: WorkflowNode) => {
    switch (node.subtype) {
      case 'schedule':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                جدولة Cron
              </label>
              <input
                type="text"
                value={node.config.cron_expression || ''}
                onChange={(e) => updateNodeConfig('cron_expression', e.target.value)}
                placeholder="0 9 * * *"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">مثال: 0 9 * * * (كل يوم 9 صباحاً)</p>
            </div>
          </div>
        );
      
      case 'email':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                إلى
              </label>
              <input
                type="text"
                value={node.config.to || ''}
                onChange={(e) => updateNodeConfig('to', e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الموضوع
              </label>
              <input
                type="text"
                value={node.config.subject || ''}
                onChange={(e) => updateNodeConfig('subject', e.target.value)}
                placeholder="موضوع البريد الإلكتروني"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        );
      
      default:
        return (
          <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded border border-blue-200">
            <p>يمكن إضافة إعدادات مخصصة لكل نوع عقدة</p>
          </div>
        );
    }
  };

  interface NodeComponentProps {
    node: WorkflowNode;
  }

  const NodeComponent: React.FC<NodeComponentProps> = ({ node }) => {
    const IconComponent = iconComponents[node.icon] || Zap;
    
    return (
      <div
        onMouseDown={(e) => handleMouseDown(e, node)}
        onClick={() => setSelectedNode(node)}
        style={{
          position: 'absolute',
          left: node.position.x,
          top: node.position.y,
          cursor: draggingNode === node.id ? 'grabbing' : 'grab'
        }}
        className={`bg-white rounded-xl shadow-lg border-2 ${
          selectedNode?.id === node.id ? 'border-blue-500' : 'border-gray-200'
        } w-52 transition-all hover:shadow-xl`}
      >
        <div className={`${node.color} p-4 rounded-t-xl flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <IconComponent className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-sm">{node.name}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteNode(node.id);
            }}
            className="text-white hover:bg-white/20 rounded p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-3">
          <div className="text-xs text-gray-500 mb-2">{node.type} / {node.subtype}</div>
          {Object.keys(node.config).length > 0 && (
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
              {Object.entries(node.config).slice(0, 2).map(([key, value]) => (
                <div key={key} className="truncate">
                  <strong>{key}:</strong> {String(value).substring(0, 20)}
                  {String(value).length > 20 ? '...' : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50" 
         onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      
      {/* زر الأدوات الثابت في المنتصف أسفل الشاشة */}
      {!isToolsOpen && (
       <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
  <button
    onClick={toggleTools}
    className="flex items-center gap-4 px-8 py-5 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 text-white rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-500 border-2 border-white/20 backdrop-blur-sm relative overflow-hidden group"
  >
    {/* تأثير الخلفية المتحرك */}
    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 transform group-hover:scale-110 transition-transform duration-700" />
    
    {/* تأثير الوميض */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
    
    <div className="relative z-10 flex items-center gap-4">
      {/* الأيقونة مع تأثير الدوران */}
      <div className="relative">
        <div className="absolute inset-0 bg-white/20 rounded-full blur-sm group-hover:blur-md transition-all duration-500" />
        <Settings className="w-7 h-7 transform group-hover:rotate-180 transition-transform duration-700" />
      </div>
      
      {/* النص مع تأثير التدرج */}
      <div className="text-right">
        <div className="font-bold text-xl bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
          أدوات الأتمتة
        </div>
        <div className="text-sm bg-gradient-to-r from-white/80 to-white/60 bg-clip-text text-transparent font-medium">
          كفاءة أعلى · دقة متناهية
        </div>
      </div>
      
      {/* السهم مع تأثير الطفو */}
      <div className="relative">
        <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse" />
        <ChevronUp className="w-6 h-6 transform group-hover:-translate-y-1 transition-transform duration-300" />
      </div>
    </div>
    
    {/* نقاط مضيئة */}
    <div className="absolute top-2 right-4 w-2 h-2 bg-green-400 rounded-full animate-ping" />
    <div className="absolute bottom-2 left-4 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
  </button>
</div>
      )}

      {/* لوحة الأدوات العائمة */}
      {isToolsOpen && (
        <div
          ref={toolsRef}
          style={{
            position: 'absolute',
            left: toolsPosition.x,
            top: toolsPosition.y,
            zIndex: 100,
            cursor: isDraggingTools ? 'grabbing' : 'grab'
          }}
          className="bg-white rounded-xl shadow-2xl border border-gray-300 transition-all w-80"
        >
          {/* Header مع إمكانية السحب */}
          <div 
            onMouseDown={handleToolsMouseDown}
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-xl cursor-move"
          >
            <GripVertical className="w-5 h-5 text-white/80" />
            <div className="flex-1">
              <h3 className="font-bold text-lg">أدوات الأتمتة</h3>
              <div className="text-sm text-white/90">90% أخطاء أقل</div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="القوالب الجاهزة"
              >
                <Layout className="w-5 h-5" />
              </button>
              <button
                onClick={toggleTools}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="إغلاق الأدوات"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* محتوى الأدوات */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {/* القوالب الجاهزة */}
            {showTemplates && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800 text-sm">القوالب الجاهزة</h3>
                  <button
                    onClick={() => setShowTemplates(false)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    إغلاق
                  </button>
                </div>
                <div className="space-y-2">
                  {templates.map(template => (
                    <button
                      key={template.key}
                      onClick={() => useTemplate(template)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-right transition-all group text-xs"
                    >
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-purple-200">
                        <span className="text-purple-600 text-sm">{template.icon}</span>
                      </div>
                      <div className="flex-1 text-right">
                        <div className="font-medium text-purple-800">{template.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* جميع المهام */}
            {!showTemplates && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800 text-sm">جميع المهام</h3>
                  <button
                    onClick={() => setShowTemplates(true)}
                    className="text-s text-red-600 hover:text-blue-800"
                  >
                    القوالب
                  </button>
                </div>
                <div className="space-y-1">
                  {allTasks.map((task, index) => {
                    const IconComp = iconComponents[task.icon];
                    return (
                      <button
                        key={`${task.type}-${task.subtype}-${index}`}
                        onClick={() => addNode(task.type, task.subtype, task.name, task.icon, task.color)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-right transition-all group text-xs"
                      >
                        <div className={`${task.color} p-2 rounded-lg group-hover:scale-110 transition-transform`}>
                          <IconComp className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium text-gray-700 flex-1 text-right">
                          {task.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* أزرار التحكم */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={executeWorkflow}
                  disabled={isExecuting}
                  className="flex flex-col items-center gap-1 p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors text-xs"
                  title="تشغيل Workflow"
                >
                  <Play className="w-4 h-4" />
                  <span>تشغيل</span>
                </button>

                <button
                  onClick={saveWorkflow}
                  className="flex flex-col items-center gap-1 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs"
                  title="حفظ Workflow"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ</span>
                </button>

                <button
                  onClick={exportWorkflow}
                  className="flex flex-col items-center gap-1 p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-xs"
                  title="تصدير Workflow"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير</span>
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="flex flex-col items-center gap-1 p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-xs"
                  title={isFullscreen ? "الخروج من ملء الشاشة" : "ملء الشاشة"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                  <span>{isFullscreen ? 'خروج' : 'ملء'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* المساحة الرئيسية */}
      <div className="flex-1 relative overflow-hidden">
        {/* معلومات Workflow */}
        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-lg font-bold border-none outline-none bg-transparent w-48"
            placeholder="اسم Workflow"
          />
          <div className="text-sm text-gray-600 mt-1">
            {nodes.length} عقدة · {edges.length} اتصال
          </div>
        </div>

        <div
          id="workflow-canvas"
          className="w-full h-full relative bg-gray-50"
          style={{
            backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        >
          {nodes.map(node => (
            <NodeComponent key={node.id} node={node} />
          ))}
        </div>
      </div>

      {/* Sidebar - إعدادات العقدة */}
      {selectedNode && (
        <div className={`
          ${isMobile ? 'fixed inset-x-0 bottom-0 h-1/2' : 'w-80 h-full'} 
          bg-white border-l border-gray-200 z-40 shadow-xl
        `}>
          <div className="p-4 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">إعدادات العقدة</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم العقدة
                </label>
                <input
                  type="text"
                  value={selectedNode.name}
                  onChange={(e) => {
                    setNodes(nodes.map(n => 
                      n.id === selectedNode.id ? { ...n, name: e.target.value } : n
                    ));
                    setSelectedNode({ ...selectedNode, name: e.target.value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  النوع
                </label>
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                  {selectedNode.type} / {selectedNode.subtype}
                </div>
              </div>

              {renderNodeConfig(selectedNode)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowBuilder;