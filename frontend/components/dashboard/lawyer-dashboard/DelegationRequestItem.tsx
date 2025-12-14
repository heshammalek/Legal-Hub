"use client";

import { useState } from "react";
import { DelegationRequest } from "@/types";
import { MessageSquare, CheckCircle, XCircle, Eye, RefreshCw, Ban, Trash2, DollarSign, FileText } from "lucide-react";

interface DelegationRequestItemProps {
  request: DelegationRequest;
  currentUserId: string;
  onAccept: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onRecreate: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800", 
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  accepted: "مقبول - جاري التواصل",
  cancelled: "ملغي", 
  completed: "مكتمل",
};

export default function DelegationRequestItem({
  request,
  currentUserId,
  onAccept,
  onCancel,
  onRecreate,
  onDelete,
  onReject,
}: DelegationRequestItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isMyRequest = request.requester_lawyer_id === currentUserId;
  const hasWhatsApp = request.whatsapp_number && request.whatsapp_number.trim() !== '';
  const isAccepted = request.status === "accepted";
  const isPending = request.status === "pending";
  const hasFinancialOffer = request.financial_offer && request.financial_offer > 0;

  const handleAction = async (action: () => Promise<void>) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await action();
    } catch (error) {
      console.error("خطأ في الإجراء:", error);
      alert("حدث خطأ أثناء تنفيذ الإجراء. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!hasWhatsApp) {
      alert("لا يوجد رقم واتساب متاح للتواصل");
      return;
    }

    const message = `مرحباً، أريد التواصل بخصوص قضية رقم ${request.case_number}`;
    const url = `https://wa.me/${request.whatsapp_number}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleAcceptWithWhatsApp = () => {
    // فتح واتساب أولاً
    handleOpenWhatsApp();
    // ثم قبول الطلب
    handleAction(() => onAccept(request.id));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">
            قضية رقم: {request.case_number}
          </h4>
          <p className="text-sm text-gray-600">{request.court_name} - {request.circuit}</p>
          {request.requester_lawyer_name && (
            <p className="text-sm text-blue-600 mt-1">
              المحامي الطالب: {request.requester_lawyer_name}
            </p>
          )}
          {isAccepted && request.accepter_lawyer_id && (
            <p className="text-sm text-green-600 mt-1">
              ✅ تم القبول - جاري التواصل عبر واتساب
            </p>
          )}
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            statusColors[request.status]
          }`}
        >
          {statusLabels[request.status]}
        </span>
      </div>

      {/* المعلومات الأساسية - تظهر دائماً */}
      <div className="space-y-2 text-sm mb-3">
        <div className="flex justify-between">
          <span className="text-gray-600">تاريخ الجلسة:</span>
          <span className="font-medium">
            {new Date(request.case_date).toLocaleDateString("ar-EG")}
          </span>
        </div>

        {/* عرض القيمة المالية إذا كانت موجودة */}
        {hasFinancialOffer && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600 flex items-center gap-1">
              <DollarSign size={14} />
              القيمة المالية:
            </span>
            <span className="font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
              {request.financial_offer} جنيه
            </span>
          </div>
        )}

        {/* عرض ملخص الإجراء المطلوب */}
        <div className="bg-blue-50 p-2 rounded">
          <div className="flex items-start gap-1">
            <FileText size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-800 font-medium text-xs">الإجراء المطلوب:</p>
              <p className="text-blue-700 text-sm mt-1">
                {request.required_action.length > 100 
                  ? `${request.required_action.substring(0, 100)}...` 
                  : request.required_action
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* التفاصيل الإضافية - تظهر عند التوسيع */}
      {isExpanded && (
        <div className="pt-3 border-t border-gray-200 space-y-2 text-sm">
          {request.roll && (
            <div className="flex justify-between">
              <span className="text-gray-600">الرول:</span>
              <span className="font-medium">{request.roll}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-600">رقم القيد:</span>
            <span className="font-medium">{request.registration_number}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">رقم التوكيل:</span>
            <span className="font-medium">{request.power_of_attorney_number}</span>
          </div>

          {hasWhatsApp && (
            <div className="flex justify-between">
              <span className="text-gray-600">رقم الواتساب:</span>
              <span className="font-medium">{request.whatsapp_number}</span>
            </div>
          )}

          {/* عرض الإجراء المطلوب كاملاً */}
          <div>
            <p className="text-gray-600 mb-1">تفاصيل الإجراء المطلوب:</p>
            <p className="text-gray-800 bg-gray-50 p-3 rounded text-sm leading-relaxed">
              {request.required_action}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2 flex-wrap">
        {/* زر عرض التفاصيل */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition"
        >
          <Eye size={16} />
          {isExpanded ? "إخفاء التفاصيل" : "عرض التفاصيل"}
        </button>

        {/* أزرار المحامي الطالب (المنشئ) */}
        {isMyRequest && (
          <>
            {/* إلغاء الطلب - يظهر فقط إذا كان pending - يمحو من الجميع */}
            {isPending && (
              <button
                onClick={() => handleAction(() => onCancel(request.id))}
                disabled={isProcessing}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 rounded transition"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Ban size={16} />
                    إلغاء الطلب
                  </>
                )}
              </button>
            )}

            {/* بعد القبول: تم الاتفاق أو إعادة النشر */}
            {isAccepted && (
              <div className="flex gap-2">
                {/* تم الاتفاق - يحذف الطلب من الجميع */}
                <button
                  onClick={() => handleAction(() => onDelete(request.id))}
                  disabled={isProcessing}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 rounded transition"
                  title="تم الاتفاق مع المحامي الآخر"
                >
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      تم الاتفاق
                    </>
                  )}
                </button>

                {/* إعادة النشر - يعيد الطلب كطلب جديد للجميع */}
                <button
                  onClick={() => handleAction(() => onRecreate(request.id))}
                  disabled={isProcessing}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 rounded transition"
                  title="إعادة النشر إذا لم يتم الاتفاق"
                >
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      إعادة النشر
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* أزرار المحامي المستقبل (القابل) */}
        {!isMyRequest && (
          <>
            {/* قبول وفتح واتساب - يظهر فقط إذا كان pending */}
            {isPending && (
              <button
                onClick={handleAcceptWithWhatsApp}
                disabled={isProcessing}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 rounded transition"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    قبول وفتح واتساب
                  </>
                )}
              </button>
            )}

            {/* رفض الطلب - يخفي الطلب من داشبورد المحامي فقط */}
            {isPending && (
              <button
                onClick={() => handleAction(() => onReject(request.id))}
                disabled={isProcessing}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-400 rounded transition"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <XCircle size={16} />
                    رفض
                  </>
                )}
              </button>
            )}

            {/* فتح واتساب مرة أخرى - إذا كان قد قبل الطلب مسبقاً */}
            {isAccepted && hasWhatsApp && (
              <button
                onClick={handleOpenWhatsApp}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded transition"
              >
                <MessageSquare size={16} />
                فتح واتساب
              </button>
            )}
          </>
        )}
      </div>

      {/* معلومات إضافية */}
      {request.accepter_lawyer_id && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            {isMyRequest ? "تم القبول من قبل محامي آخر" : "قبلت هذا الطلب"}
            {request.accepted_at && (
              <span className="mr-2">
                في {new Date(request.accepted_at).toLocaleDateString("ar-EG")}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}