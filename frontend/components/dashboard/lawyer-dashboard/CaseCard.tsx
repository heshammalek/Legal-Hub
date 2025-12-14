import React from 'react';
import { JudicialCase } from '@/types/index';
import { User, Scale, Calendar, Edit, Expand, Trash2, Clock, AlertTriangle } from 'lucide-react';

// 🔥 التعديل: تغيير case إلى caseItem
interface CaseCardProps {
  caseItem: JudicialCase; // كان case فأصبح caseItem
  viewMode: 'grid' | 'list' | 'timeline';
  onExpand: (caseItem: JudicialCase) => void;
  onEdit: (caseItem: JudicialCase) => void;
  onDelete: (caseId: string) => void;
}

export const CaseCard: React.FC<CaseCardProps> = ({ 
  caseItem, // 🔥 التعديل هنا
  viewMode, 
  onExpand, 
  onEdit,
  onDelete 
}) => {
  
  const getPriorityColor = () => {
    switch (caseItem.priority) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-green-500 bg-green-50';
    }
  };

  const getPriorityIcon = () => {
    switch (caseItem.priority) {
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high': return <Clock className="w-4 h-4 text-orange-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_session': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

  const client = caseItem.parties?.find(party => party.type === 'client');
  const opponent = caseItem.parties?.find(party => party.type === 'opponent');
  const nextSession = caseItem.sessions?.[0];

  return (
    <div className={`rounded-lg border-l-4 p-4 shadow-sm transition-all hover:shadow-md ${getPriorityColor()}`}>
      
      {/* الهيدر */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-gray-900">القضية #{caseItem.case_number}</h4>
          {getPriorityIcon()}
        </div>
        <div className="flex items-center gap-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
            {caseItem.status === 'active' && 'نشطة'}
            {caseItem.status === 'pending' && 'قيد الانتظار'}
            {caseItem.status === 'in_session' && 'قيد الجلسة'}
            {caseItem.status === 'closed' && 'منتهية'}
            {caseItem.status === 'draft' && 'مسودة'}
          </span>
        </div>
      </div>
      
      {/* العنوان */}
      <h3 className="text-lg font-semibold text-gray-800 mb-3">{caseItem.title}</h3>
      
      {/* المعلومات الأساسية */}
      <div className="space-y-2 text-sm text-gray-600 mb-4">
        {client && (
          <div className="flex items-center">
            <User className="w-4 h-4 ml-2 text-blue-500" />
            <span>الموكل: {client.name}</span>
          </div>
        )}
        
        {opponent && (
          <div className="flex items-center">
            <Scale className="w-4 h-4 ml-2 text-red-500" />
            <span>الخصم: {opponent.name}</span>
          </div>
        )}
        
        <div className="flex items-center">
          <Calendar className="w-4 h-4 ml-2 text-green-500" />
          <span>التسجيل: {formatDate(caseItem.registration_date)}</span>
        </div>
        
        {nextSession && (
          <div className="flex items-center text-orange-600 font-medium">
            <Clock className="w-4 h-4 ml-2" />
            <span>الجلسة القادمة: {formatDate(nextSession.date)}</span>
          </div>
        )}
      </div>
      
      {/* الإجراءات */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
        <button 
          onClick={() => onExpand(caseItem)}
          className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
        >
          <Expand className="w-4 h-4 ml-1" />
          التفاصيل
        </button>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onEdit(caseItem)}
            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            title="تعديل"
          >
            <Edit className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => onDelete(caseItem.id)}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
            title="حذف"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};