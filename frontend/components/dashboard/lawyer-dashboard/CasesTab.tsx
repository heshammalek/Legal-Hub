import React, { useState, useEffect, useMemo } from 'react';
import { JudicialCase } from '@/types/index';
import { CaseCard } from './CaseCard';
import { CaseStatsDashboard } from './CaseStatsDashboard';
import { CaseCharts } from './CaseCharts';
import { CaseFormModal } from './CaseFormModal';
import { CaseDetailsModal } from './CaseDetailsModal';
import { ViewModeToggle } from './ViewModeToggle';
import { CaseFilters } from './CaseFilters';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Plus } from 'lucide-react';

interface CasesTabProps {
  refreshTrigger?: number;
}

const FileText = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export const CasesTab: React.FC<CasesTabProps> = ({ refreshTrigger = 0 }) => {
  const [cases, setCases] = useState<JudicialCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCase, setSelectedCase] = useState<JudicialCase | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('grid');
  const [filters, setFilters] = useState<Record<string, any>>({});

  // تحميل القضايا - استخدام البيانات التجريبية مباشرة
  useEffect(() => {
    const loadCases = async () => {
      try {
        setLoading(true);
        console.log('🔄 تحميل القضايا...');
        
        // محاكاة تأخير الشبكة
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // استخدام البيانات التجريبية مباشرة
        const mockCases = getMockCases();
        
        // تطبيق الفلاتر
        let filteredCases = mockCases;
        if (filters.status) {
          filteredCases = filteredCases.filter(c => c.status === filters.status);
        }
        if (filters.priority) {
          filteredCases = filteredCases.filter(c => c.priority === filters.priority);
        }
        if (filters.case_type) {
          filteredCases = filteredCases.filter(c => c.case_type === filters.case_type);
        }
        if (filters.court) {
          filteredCases = filteredCases.filter(c => c.court.includes(filters.court));
        }
        
        setCases(filteredCases);
        console.log('✅ تم تحميل القضايا:', filteredCases.length);
      } catch (error) {
        console.error('❌ خطأ في تحميل القضايا:', error);
        setCases(getMockCases());
      } finally {
        setLoading(false);
      }
    };

    loadCases();
  }, [refreshTrigger, filters]);

  const handleDeleteCase = async (caseId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه القضية؟')) {
      try {
        // حذف محلي للتطوير
        setCases(prev => prev.filter(c => c.id !== caseId));
        console.log('✅ تم حذف القضية:', caseId);
      } catch (error) {
        console.error('❌ خطأ في حذف القضية:', error);
        setCases(prev => prev.filter(c => c.id !== caseId));
      }
    }
  };

  const handleSaveCase = async (caseData: JudicialCase) => {
    try {
      if (caseData.id) {
        // تحديث قضية موجودة
        setCases(prev => prev.map(c => c.id === caseData.id ? caseData : c));
        console.log('✅ تم تحديث القضية:', caseData.id);
      } else {
        // إنشاء قضية جديدة
        const newCase: JudicialCase = {
          ...caseData,
          id: Date.now().toString(),
          case_number: `CASE-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        };
        setCases(prev => [...prev, newCase]);
        console.log('✅ تم إنشاء قضية جديدة:', newCase.id);
      }
      setShowForm(false);
      setSelectedCase(null);
    } catch (error) {
      console.error('❌ خطأ في حفظ القضية:', error);
    }
  };

  // بيانات تجريبية للتطوير
  const getMockCases = (): JudicialCase[] => {
    return [
      {
        id: '1',
        case_number: 'CASE-2024-001',
        title: 'قضية تعويض مالي',
        description: 'قضية تعويض عن أضرار مادية ناتجة عن عقد مقاولة',
        case_type: 'مدنية',
        court: 'محكمة الجزئية - التجارية',
        registration_date: '2024-01-15',
        status: 'active',
        priority: 'high',
        parties: [
          {
            type: 'client',
            name: 'أحمد محمد',
            identity_number: '2990101010101',
            phone: '+20123456789',
            email: 'ahmed@example.com',
            address: 'القاهرة، مصر'
          }
        ],
        sessions: [],
        documents: [],
        team: {
          lead_lawyer: 'lawyer-001',
          assistant_lawyers: [],
          legal_researchers: [],
          paralegals: []
        },
        fees: 5000,
        expenses: 1000,
        payment_status: 'paid',
        success_probability: 75,
        created_by: 'lawyer-001',
        tags: ['تعويض', 'مدني'],
        milestones: [],
        reminders: [],
        created_at: '2024-01-15T10:00:00',
        updated_at: '2024-01-15T10:00:00',
        last_updated: '2024-01-15T10:00:00'
      },
      {
        id: '2',
        case_number: 'CASE-2024-002',
        title: 'قضية أحوال شخصية',
        description: 'قضية طلاق ونفقة',
        case_type: 'أحوال شخصية',
        court: 'محكمة الأسرة',
        registration_date: '2024-01-20',
        status: 'pending',
        priority: 'medium',
        parties: [
          {
            type: 'client',
            name: 'فاطمة أحمد',
            identity_number: '2990202020202',
            phone: '+20123456790',
            email: 'fatima@example.com',
            address: 'الإسكندرية، مصر'
          }
        ],
        sessions: [],
        documents: [],
        team: {
          lead_lawyer: 'lawyer-001',
          assistant_lawyers: [],
          legal_researchers: [],
          paralegals: []
        },
        fees: 3000,
        expenses: 500,
        payment_status: 'partial',
        success_probability: 60,
        created_by: 'lawyer-001',
        tags: ['طلاق', 'نفقة'],
        milestones: [],
        reminders: [],
        created_at: '2024-01-20T10:00:00',
        updated_at: '2024-01-20T10:00:00',
        last_updated: '2024-01-20T10:00:00'
      }
    ];
  };

  // ترتيب القضايا حسب الأولوية
  const sortedCases = useMemo(() => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    
    return [...cases].sort((a, b) => {
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
      return bPriority - aPriority;
    });
  }, [cases]);

  if (loading && cases.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
        <span className="mr-2">جاري تحميل القضايا...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* شريط التحكم */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          <CaseFilters filters={filters} onFiltersChange={setFilters} />
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center transition-colors"
        >
          <Plus className="w-5 h-5 ml-2" />
          إضافة قضية جديدة
        </button>
      </div>
      
      {/* عرض المحتوى */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* لوحة الإحصائيات */}
          <CaseStatsDashboard cases={cases} />
          
          {/* الرسوم البيانية */}
          <CaseCharts cases={cases} />
          
          {/* عرض القضايا */}
          {cases.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <FileText className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد قضايا</h3>
              <p className="text-gray-500 mb-4">ابدأ بإضافة قضية جديدة لإدارتها</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                إضافة أول قضية
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
            }>
              {sortedCases.map(caseItem => (
                <CaseCard
                  key={caseItem.id}
                  caseItem={caseItem}
                  viewMode={viewMode}
                  onExpand={setSelectedCase}
                  onEdit={() => {
                    setSelectedCase(caseItem);
                    setShowForm(true);
                  }}
                  onDelete={handleDeleteCase}
                />
              ))}
            </div>
          )}
        </>
      )}
      
      {/* النماذج المنبثقة */}
      {showForm && (
        <CaseFormModal
          case={selectedCase || undefined}
          onSave={handleSaveCase}
          onClose={() => {
            setShowForm(false);
            setSelectedCase(null);
          }}
        />
      )}
      
      {selectedCase && !showForm && (
        <CaseDetailsModal
          case={selectedCase}
          onClose={() => setSelectedCase(null)}
          onEdit={() => {
            setShowForm(true);
          }}
          onDelete={() => handleDeleteCase(selectedCase.id)}
        />
      )}
    </div>
  );
};