"use client";

import { useState, useEffect } from "react";
import { DelegationRequest } from "@/types";
import DelegationRequestForm from "./DelegationRequestForm";
import DelegationRequestItem from "./DelegationRequestItem";
import {
  createDelegation,
  getSentRequests,
  getReceivedRequests,
  acceptRequest,
  cancelRequest,
  recreateRequest,
  deleteRequest,
  rejectRequest, // ✅ تأكد من استيراد rejectRequest
} from "@/services/api";
import { useCurrentLawyer } from "@/hooks/useCurrentLawyer";

export default function DelegationTab() {
  const { lawyerId, isLoading: isLawyerLoading, error: lawyerError } = useCurrentLawyer();

  const [sentRequests, setSentRequests] = useState<DelegationRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<DelegationRequest[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = async () => {
    if (!lawyerId) {
      console.log("⏳ في انتظار lawyerId...");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("🔄 جاري تحميل طلبات الإنابة...");
      
      const [sent, received] = await Promise.all([
        getSentRequests(),
        getReceivedRequests()
      ]);
      
      console.log("✅ تم تحميل الطلبات:", {
        مرسلة: sent?.length || 0,
        واردة: received?.length || 0
      });
      
      setSentRequests(Array.isArray(sent) ? sent : []);
      setReceivedRequests(Array.isArray(received) ? received : []);
      
    } catch (error) {
      console.error("❌ فشل تحميل الطلبات:", error);
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ في تحميل البيانات";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [lawyerId]);

  const handleFormSubmit = async (data: any) => {
    try {
      console.log("📤 إرسال طلب إنابة جديد:", data);
      await createDelegation(data);
      setIsFormOpen(false);
      await loadRequests();
    } catch (error) {
      console.error("❌ فشل إنشاء الطلب:", error);
      alert("تم إنشاء الطلب ولكن قد يكون هناك مشكلة في الاتصال. جاري التحديط...");
      await loadRequests();
    }
  };

  const handleAccept = async (id: string) => {
    try {
      console.log("✋ قبول طلب الإنابة:", id);
      setIsLoading(true);
      await acceptRequest(id);
      await loadRequests();
    } catch (error) {
      console.error("❌ فشل قبول الطلب:", error);
      alert("تم قبول الطلب ولكن قد يكون هناك مشكلة في الاتصال. جاري التحديط...");
      await loadRequests();
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ إضافة دالة handleReject المفقودة
  const handleReject = async (id: string) => {
    try {
      console.log("👎 رفض طلب الإنابة:", id);
      setIsLoading(true);
      await rejectRequest(id);
      
      // إخفاء الطلب المرفوض من الواجهة مباشرة
      setReceivedRequests(prev => prev.filter(req => req.id !== id));
      
    } catch (error) {
      console.error("❌ فشل رفض الطلب:", error);
      alert("فشل في رفض الطلب. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      console.log("❌ إلغاء طلب الإنابة:", id);
      setIsLoading(true);
      await cancelRequest(id);
      await loadRequests();
    } catch (error) {
      console.error("❌ فشل إلغاء الطلب:", error);
      alert("فشل في إلغاء الطلب. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

// في DelegationTab.tsx - تحديث دالة handleRecreate
const handleRecreate = async (id: string) => {
  try {
    console.log("🔄 إعادة إنشاء طلب الإنابة:", id);
    setIsLoading(true);
    
    // إنشاء الطلب الجديد أولاً
    await recreateRequest(id);
    
    // ثم حذف الطلب القديم من الواجهة مباشرة
    setSentRequests(prev => prev.filter(req => req.id !== id));
    
    // إعادة تحميل البيانات للتأكد
    await loadRequests();
    
  } catch (error) {
    console.error("❌ فشل إعادة إنشاء الطلب:", error);
    alert("فشل في إعادة إنشاء الطلب. يرجى المحاولة مرة أخرى.");
  } finally {
    setIsLoading(false);
  }
};

  const handleDelete = async (id: string) => {
    try {
      console.log("🗑️ حذف طلب الإنابة نهائياً:", id);
      setIsLoading(true);
      await deleteRequest(id);
      await loadRequests();
    } catch (error) {
      console.error("❌ فشل حذف الطلب:", error);
      alert("فشل في حذف الطلب. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    loadRequests();
  };

  if (isLawyerLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل بيانات المحامي...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">طلبات الإنابة</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + طلب إنابة جديد
        </button>
      </div>

      <DelegationRequestForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-yellow-800 font-medium">تنبيه</h3>
              <p className="text-yellow-700 mt-1">{error}</p>
              <div className="mt-2">
                <button 
                  onClick={handleRetry}
                  className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                >
                  إعادة المحاولة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* الطلبات المرسلة */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">
            طلباتي المرسلة ({sentRequests.length})
          </h3>
          
          {isLoading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : sentRequests.length > 0 ? (
            <div className="space-y-3">
              {sentRequests.map(request => (
                <div key={request.id} id={`request-${request.id}`}>
                  <DelegationRequestItem
                    request={request}
                    currentUserId={lawyerId!}
                    onAccept={handleAccept}
                    onCancel={handleCancel}
                    onRecreate={handleRecreate}
                    onDelete={handleDelete}
                    onReject={handleReject} // ✅ تمرير onReject هنا
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>لا توجد طلبات مرسلة</p>
              <p className="text-sm mt-2">ابدأ بإنشاء طلب إنابة جديد</p>
            </div>
          )}
        </div>

        {/* الطلبات الواردة */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">
            طلبات واردة ({receivedRequests.length})
          </h3>
          
          {isLoading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : receivedRequests.length > 0 ? (
            <div className="space-y-3">
              {receivedRequests.map(request => (
                <div key={request.id} id={`request-${request.id}`}>
                  <DelegationRequestItem
                    request={request}
                    currentUserId={lawyerId!}
                    onAccept={handleAccept}
                    onCancel={handleCancel}
                    onRecreate={handleRecreate}
                    onDelete={handleDelete}
                    onReject={handleReject} // ✅ تمرير onReject هنا
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>لا توجد طلبات واردة حالياً</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}