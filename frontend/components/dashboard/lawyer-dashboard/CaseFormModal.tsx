import React, { useState, useEffect } from 'react';
import { JudicialCase, Party, Session, Document, CaseTeam } from '@/types/index';
import { X, Save, Plus, Trash2, Calendar, User, FileText } from 'lucide-react';

interface CaseFormModalProps {
  case?: JudicialCase;
  onSave: (caseData: JudicialCase) => void;
  onClose: () => void;
}

interface FormData {
  case_number: string;
  title: string;
  description: string;
  case_type: string;
  court: string;
  registration_date: string;
  status: string;
  priority: string;
  parties: Party[];
  sessions: Session[];
  documents: Document[];
  team: CaseTeam;
  fees?: number;
  expenses?: number;
  payment_status: string;
  tags: string[];
}

const CASE_TYPES = [
  'مدنية', 'تجارية', 'جنائية', 'أحوال شخصية', 'عمل', 'إدارية', 'دستورية'
];

const COURTS = [
  'المحكمة الدستورية',
  'محكمة النقض',
  'المحكمة الإدارية العليا',
  'محاكم الاستئناف',
  'المحاكم الابتدائية',
  'محاكم الدرجة الأولى',
  'محاكم الأمور المستعجلة'
];

const PARTY_TYPES = [
  'client', 'opponent', 'witness', 'expert', 'third_party'
];

const getPartyTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    client: 'موكل',
    opponent: 'خصم',
    witness: 'شاهد',
    expert: 'خبير',
    third_party: 'طرف ثالث'
  };
  return labels[type] || type;
};

export const CaseFormModal: React.FC<CaseFormModalProps> = ({ 
  case: existingCase, 
  onSave, 
  onClose 
}) => {
  const [formData, setFormData] = useState<FormData>({
    case_number: '',
    title: '',
    description: '',
    case_type: '',
    court: '',
    registration_date: new Date().toISOString().split('T')[0],
    status: 'draft',
    priority: 'medium',
    parties: [],
    sessions: [],
    documents: [],
    team: {
      lead_lawyer: '',
      assistant_lawyers: [],
      legal_researchers: [],
      paralegals: []
    },
    fees: 0,
    expenses: 0,
    payment_status: 'unpaid',
    tags: []
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'parties' | 'sessions' | 'documents' | 'team'>('basic');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (existingCase) {
      setFormData({
        case_number: existingCase.case_number,
        title: existingCase.title,
        description: existingCase.description || '',
        case_type: existingCase.case_type,
        court: existingCase.court,
        registration_date: existingCase.registration_date,
        status: existingCase.status,
        priority: existingCase.priority,
        parties: existingCase.parties || [],
        sessions: existingCase.sessions || [],
        documents: existingCase.documents || [],
        team: existingCase.team,
        fees: existingCase.fees,
        expenses: existingCase.expenses,
        payment_status: existingCase.payment_status || 'unpaid',
        tags: existingCase.tags || []
      });
    }
  }, [existingCase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: existingCase?.id || '',
      created_by: existingCase?.created_by || '',
      created_at: existingCase?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    } as JudicialCase);
  };

  const addParty = () => {
    setFormData(prev => ({
      ...prev,
      parties: [...prev.parties, {
        type: 'client',
        name: '',
        identity_number: '',
        phone: '',
        email: '',
        address: ''
      }]
    }));
  };

  const updateParty = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      parties: prev.parties.map((party, i) => 
        i === index ? { ...party, [field]: value } : party
      )
    }));
  };

  const removeParty = (index: number) => {
    setFormData(prev => ({
      ...prev,
      parties: prev.parties.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const tabs = [
    { id: 'basic', label: 'البيانات الأساسية', icon: <FileText className="w-4 h-4" /> },
    { id: 'parties', label: 'أطراف القضية', icon: <User className="w-4 h-4" /> },
    { id: 'sessions', label: 'الجلسات', icon: <Calendar className="w-4 h-4" /> },
    { id: 'documents', label: 'المستندات', icon: <FileText className="w-4 h-4" /> },
    { id: 'team', label: 'فريق العمل', icon: <User className="w-4 h-4" /> }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
        {/* الرأس */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">
            {existingCase ? 'تعديل القضية' : 'إضافة قضية جديدة'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* التبويبات */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                <span className="mr-2">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* المحتوى */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            
            {/* البيانات الأساسية */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      رقم القضية *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.case_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, case_number: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      عنوان القضية *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الوصف
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      نوع القضية *
                    </label>
                    <select
                      required
                      value={formData.case_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, case_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">اختر نوع القضية</option>
                      {CASE_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      المحكمة *
                    </label>
                    <select
                      required
                      value={formData.court}
                      onChange={(e) => setFormData(prev => ({ ...prev, court: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">اختر المحكمة</option>
                      {COURTS.map(court => (
                        <option key={court} value={court}>{court}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      تاريخ التسجيل *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.registration_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, registration_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الحالة
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">مسودة</option>
                      <option value="active">نشطة</option>
                      <option value="pending">قيد الانتظار</option>
                      <option value="in_session">قيد الجلسة</option>
                      <option value="closed">منتهية</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الأولوية
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">منخفضة</option>
                      <option value="medium">متوسطة</option>
                      <option value="high">عالية</option>
                      <option value="urgent">عاجلة</option>
                    </select>
                  </div>
                </div>

                {/* الوسوم */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الوسوم
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="mr-1 hover:text-blue-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="أضف وسم جديد"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      إضافة
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* أطراف القضية */}
            {activeTab === 'parties' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-800">أطراف القضية</h4>
                  <button
                    type="button"
                    onClick={addParty}
                    className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    إضافة طرف
                  </button>
                </div>

                {formData.parties.map((party, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h5 className="font-medium text-gray-700">طرف #{index + 1}</h5>
                      <button
                        type="button"
                        onClick={() => removeParty(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          نوع الطرف
                        </label>
                        <select
                          value={party.type}
                          onChange={(e) => updateParty(index, 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          {PARTY_TYPES.map(type => (
                            <option key={type} value={type}>
                              {getPartyTypeLabel(type)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          الاسم *
                        </label>
                        <input
                          type="text"
                          required
                          value={party.name}
                          onChange={(e) => updateParty(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          رقم الهوية
                        </label>
                        <input
                          type="text"
                          value={party.identity_number || ''}
                          onChange={(e) => updateParty(index, 'identity_number', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          الهاتف
                        </label>
                        <input
                          type="tel"
                          value={party.phone || ''}
                          onChange={(e) => updateParty(index, 'phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          البريد الإلكتروني
                        </label>
                        <input
                          type="email"
                          value={party.email || ''}
                          onChange={(e) => updateParty(index, 'email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          العنوان
                        </label>
                        <input
                          type="text"
                          value={party.address || ''}
                          onChange={(e) => updateParty(index, 'address', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {formData.parties.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>لا توجد أطراف مضافة</p>
                  </div>
                )}
              </div>
            )}

            {/* باقي التبويبات يمكن إضافتها لاحقاً */}
            {activeTab !== 'basic' && activeTab !== 'parties' && (
              <div className="text-center py-8 text-gray-500">
                <p>سيتم إضافة هذه الميزة قريباً</p>
              </div>
            )}
          </div>

          {/* أزرار التنفيذ */}
          <div className="flex justify-between p-6 border-t bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              إلغاء
            </button>
            <div className="space-x-3">
              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Save className="w-4 h-4 ml-1" />
                {existingCase ? 'تحديث' : 'إضافة'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};