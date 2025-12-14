import React from 'react';
import { JudicialCase } from '@/types/index';
import { X, Edit, Calendar, User, Scale, FileText, MapPin, Trash2, Clock, DollarSign } from 'lucide-react';

interface CaseDetailsModalProps {
  case: JudicialCase;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (caseId: string) => void;
}

export const CaseDetailsModal: React.FC<CaseDetailsModalProps> = ({ 
  case: caseItem, 
  onClose, 
  onEdit,
  onDelete 
}) => {
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const client = caseItem.parties?.find(party => party.type === 'client');
  const opponent = caseItem.parties?.find(party => party.type === 'opponent');
  const witnesses = caseItem.parties?.filter(party => party.type === 'witness');
  const experts = caseItem.parties?.filter(party => party.type === 'expert');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
        {/* الرأس */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-gray-800">
              القضية #{caseItem.case_number}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
              {caseItem.status === 'active' && 'نشطة'}
              {caseItem.status === 'pending' && 'قيد الانتظار'}
              {caseItem.status === 'in_session' && 'قيد الجلسة'}
              {caseItem.status === 'closed' && 'منتهية'}
              {caseItem.status === 'draft' && 'مسودة'}
            </span>
            <span className={`text-sm font-medium ${getPriorityColor(caseItem.priority)}`}>
              {caseItem.priority === 'urgent' && 'عاجلة'}
              {caseItem.priority === 'high' && 'عالية'}
              {caseItem.priority === 'medium' && 'متوسطة'}
              {caseItem.priority === 'low' && 'منخفضة'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onEdit}
              className="flex items-center px-3 py-2 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
            >
              <Edit className="w-4 h-4 ml-1" />
              تعديل
            </button>
            <button 
              onClick={() => onDelete(caseItem.id)}
              className="flex items-center px-3 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50"
            >
            <Trash2 className="w-4 h-4 ml-1" />
              حذف
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* المحتوى */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          
          {/* المعلومات الأساسية */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            
            {/* العمود الأول */}
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">{caseItem.title}</h4>
                {caseItem.description && (
                  <p className="text-gray-600 leading-relaxed">{caseItem.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center text-sm text-gray-600">
                  <FileText className="w-4 h-4 ml-2 text-blue-500" />
                  <span>النوع: {caseItem.case_type}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 ml-2 text-green-500" />
                  <span>المحكمة: {caseItem.court}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 ml-2 text-purple-500" />
                  <span>التسجيل: {formatDate(caseItem.registration_date)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 ml-2 text-orange-500" />
                  <span>آخر تحديث: {formatDate(caseItem.updated_at)}</span>
                </div>
              </div>

              {/* المعلومات المالية */}
              {(caseItem.fees || caseItem.expenses) && (
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold text-gray-700 mb-3 flex items-center">
                    <DollarSign className="w-4 h-4 ml-2 text-green-500" />
                    المعلومات المالية
                  </h5>
                  <div className="space-y-2 text-sm">
                    {caseItem.fees && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">الرسوم:</span>
                        <span className="font-medium">{formatCurrency(caseItem.fees)}</span>
                      </div>
                    )}
                    {caseItem.expenses && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">المصروفات:</span>
                        <span className="font-medium">{formatCurrency(caseItem.expenses)}</span>
                      </div>
                    )}
                    {caseItem.payment_status && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">حالة الدفع:</span>
                        <span className={`font-medium ${
                          caseItem.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {caseItem.payment_status === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* العمود الثاني - الأطراف */}
            <div className="space-y-4">
              {/* الموكل */}
              {client && (
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold text-gray-700 mb-3 flex items-center">
                    <User className="w-4 h-4 ml-2 text-blue-500" />
                    البيانات الأساسية للموكل
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div><strong>الاسم:</strong> {client.name}</div>
                    {client.identity_number && <div><strong>رقم الهوية:</strong> {client.identity_number}</div>}
                    {client.phone && <div><strong>الهاتف:</strong> {client.phone}</div>}
                    {client.email && <div><strong>البريد الإلكتروني:</strong> {client.email}</div>}
                    {client.address && <div><strong>العنوان:</strong> {client.address}</div>}
                  </div>
                </div>
              )}

              {/* الخصم */}
              {opponent && (
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold text-gray-700 mb-3 flex items-center">
                    <Scale className="w-4 h-4 ml-2 text-red-500" />
                    بيانات الخصم
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div><strong>الاسم:</strong> {opponent.name}</div>
                    {opponent.identity_number && <div><strong>رقم الهوية:</strong> {opponent.identity_number}</div>}
                    {opponent.phone && <div><strong>الهاتف:</strong> {opponent.phone}</div>}
                    {opponent.lawyer && <div><strong>المحامي:</strong> {opponent.lawyer}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* الجلسات */}
          {caseItem.sessions && caseItem.sessions.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">الجلسات</h4>
              <div className="space-y-3">
                {caseItem.sessions.map((session, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-gray-700">الجلسة {index + 1}</h5>
                      <span className="text-sm text-gray-500">{formatDate(session.date)}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div><strong>الموقع:</strong> {session.location}</div>
                        <div><strong>الغرض:</strong> {session.purpose}</div>
                        {session.judge && <div><strong>القاضي:</strong> {session.judge}</div>}
                      </div>
                      <div>
                        {session.clerk && <div><strong>أمين السر:</strong> {session.clerk}</div>}
                        {session.prosecutor && <div><strong>وكيل النيابة:</strong> {session.prosecutor}</div>}
                        {session.court_recorder && <div><strong>سكرتير الجلسة:</strong> {session.court_recorder}</div>}
                      </div>
                    </div>
                    {session.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <strong>ملاحظات:</strong> {session.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* المستندات */}
          {caseItem.documents && caseItem.documents.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">المستندات</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {caseItem.documents.map((doc, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-700">{doc.name}</h5>
                      <span className="text-xs text-gray-500">{formatDate(doc.upload_date)}</span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>النوع:</strong> {doc.type}</div>
                      {doc.description && <div><strong>الوصف:</strong> {doc.description}</div>}
                      <div><strong>رفع بواسطة:</strong> {doc.uploaded_by}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* الوسوم */}
          {caseItem.tags && caseItem.tags.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">الوسوم</h4>
              <div className="flex flex-wrap gap-2">
                {caseItem.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};