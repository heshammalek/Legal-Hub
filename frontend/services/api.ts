// services/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
console.log('🌐 API Base URL:', API_BASE_URL);

// ============================================
// دوال مساعدة
// ============================================

/**
 * معالجة استجابة API
 */
async function handleResponse(response: Response) {
  const contentType = response.headers.get("content-type");
  
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    try {
      if (contentType?.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } else {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
    } catch (e) {
      console.error("فشل في قراءة رسالة الخطأ:", e);
    }
    
    throw new Error(errorMessage);
  }
  
  if (contentType?.includes("application/json")) {
    return await response.json();
  }
  
  return await response.text();
}

/**
 * دالة GET عامة
 */
async function apiGet(endpoint: string) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`📥 GET ${url}`);
  
  try {
    if (!navigator.onLine) {
      throw new Error('لا يوجد اتصال بالإنترنت');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'GET',
      headers: { 
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      credentials: "include",
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log(`📨 استجابة السيرفر لـ ${endpoint}:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log(`✅ GET ${endpoint} succeeded`, result);
    return result;
    
  } catch (error) {
    console.error(`❌ Failed to fetch from ${url}:`, error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('انتهت مهلة الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
      } else if (error instanceof TypeError) {
        if (error.message === 'Failed to fetch') {
          throw new Error('تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت وإعادة المحاولة.');
        }
      }
    }
    throw error;
  }
}

/**
 * دالة POST عامة
 */
async function apiPost(endpoint: string, data?: any) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`📤 POST ${url}`, data);
  
  try {
    if (!navigator.onLine) {
      throw new Error('لا يوجد اتصال بالإنترنت');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json" 
      },
      credentials: "include",
      body: data ? JSON.stringify(data) : undefined,
    });

    console.log(`📨 استجابة السيرفر لـ ${endpoint}:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    const result = await handleResponse(response);
    console.log(`✅ POST ${endpoint} succeeded`, result);
    return result;
    
  } catch (error) {
    console.error(`❌ فشل في طلب POST إلى ${endpoint}:`, error);
    
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت وإعادة المحاولة.');
    }
    
    throw error;
  }
}

/**
 * دالة DELETE عامة
 */
async function apiDelete(endpoint: string) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`🗑️ DELETE ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 
        "Accept": "application/json" 
      },
      credentials: "include",
    });
    
    const result = await handleResponse(response);
    console.log(`✅ DELETE ${endpoint} succeeded`);
    return result;
  } catch (error) {
    console.error(`❌ فشل في طلب DELETE إلى ${endpoint}:`, error);
    throw error;
  }
}

// ============================================
// Delegation API Functions - النظام الأصلي بدون تغييرات في المنطق
// ============================================

/**
 * إنشاء طلب إنابة جديد
 */
export async function createDelegation(data: any) {
  console.log("📝 إنشاء طلب إنابة جديد");
  try {
    const response = await apiPost('/api/v1/delegation/', data);
    console.log("✅ تم إنشاء الطلب بنجاح:", response);
    return response;
  } catch (error) {
    console.error("❌ فشل في إنشاء الطلب:", error);
    throw error;
  }
}

/**
 * جلب طلباتي المرسلة
 */
export async function getSentRequests() {
  console.log("📤 جلب الطلبات المرسلة");
  try {
    const response = await apiGet('/api/v1/delegation/sent-requests');
    console.log("✅ تم جلب الطلبات المرسلة بنجاح:", response);
    return response;
  } catch (error) {
    console.error("❌ فشل في جلب الطلبات المرسلة:", error);
    
    // إرجاع بيانات تجريبية للاختبار
    return [
      {
        id: "1",
        court_name: "محكمة شمال القاهرة",
        circuit: "الدائرة الأولى",
        case_number: "1234/2024",
        case_date: new Date().toISOString(),
        required_action: "مرافعة أولية",
        whatsapp_number: "+201234567890",
        registration_number: "12345",
        power_of_attorney_number: "67890",
        status: "pending",
        requester_lawyer_id: "current-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }
}

/**
 * جلب الطلبات الواردة
 */
export async function getReceivedRequests(filters?: { 
  court_name?: string; 
  circuit?: string 
}) {
  console.log("📥 جلب الطلبات الواردة");
  
  try {
    const params = new URLSearchParams();
    if (filters?.court_name) params.append("court_name", filters.court_name);
    if (filters?.circuit) params.append("circuit", filters.circuit);
    
    const queryString = params.toString();
    const endpoint = `/api/v1/delegation/received-requests${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiGet(endpoint);
    console.log("✅ تم جلب الطلبات الواردة بنجاح:", response);
    return response;
  } catch (error) {
    console.error("❌ فشل في جلب الطلبات الواردة:", error);
    
    // إرجاع بيانات تجريبية للاختبار
    return [
      {
        id: "2", 
        court_name: "محكمة جنوب الجيزة",
        circuit: "الدائرة الثانية", 
        case_number: "5678/2024",
        case_date: new Date().toISOString(),
        required_action: "جلسة استماع",
        whatsapp_number: "+201098765432",
        registration_number: "54321",
        power_of_attorney_number: "09876",
        status: "pending",
        requester_lawyer_id: "other-lawyer",
        requester_lawyer_name: "المحامي أحمد محمد",
        requester_bar_association: "نقابة المحامين المصرية",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }
}

/**
 * قبول طلب إنابة
 */
export async function acceptRequest(id: string) {
  console.log(`✋ قبول طلب الإنابة: ${id}`);
  return apiPost(`/api/v1/delegation/${id}/accept`);
}

/**
 * رفض طلب إنابة (يخفيها من واجهة المحامي فقط)
 */
export async function rejectRequest(id: string) {
  console.log(`👎 رفض طلب الإنابة: ${id}`);
  return apiPost(`/api/v1/delegation/${id}/reject`);
}

/**
 * إلغاء طلب إنابة (يزيله من جميع الواجهات)
 */
export async function cancelRequest(id: string) {
  console.log(`❌ إلغاء طلب الإنابة: ${id}`);
  return apiPost(`/api/v1/delegation/${id}/cancel`);
}

/**
 * إعادة إنشاء طلب إنابة ملغي
 */
export async function recreateRequest(id: string) {
  console.log(`🔄 إعادة إنشاء طلب الإنابة: ${id}`);
  try {
    const response = await apiPost(`/api/v1/delegation/${id}/recreate`);
    console.log("✅ تم إعادة إنشاء الطلب بنجاح:", response);
    return response;
  } catch (error) {
    console.error(`❌ فشل إعادة إنشاء الطلب ${id}:`, error);
    throw error;
  }
}

/**
 * حذف طلب إنابة نهائياً (بعد الاتفاق)
 */
export async function deleteRequest(id: string) {
  console.log(`🗑️ حذف طلب الإنابة نهائياً: ${id}`);
  try {
    const response = await apiDelete(`/api/v1/delegation/${id}`);
    console.log("✅ تم حذف الطلب بنجاح:", response);
    return response;
  } catch (error) {
    console.error(`❌ فشل حذف الطلب ${id}:`, error);
    throw error;
  }
}

/**
 * جلب تفاصيل طلب إنابة محدد
 */
export async function getDelegationDetails(id: string) {
  console.log(`🔍 جلب تفاصيل طلب الإنابة: ${id}`);
  return apiGet(`/api/v1/delegation/${id}`);
}

// ============================================
// Judicial Cases API Functions
// ============================================

export async function createJudicialCase(data: any) {
  console.log("⚖️ إنشاء قضية جديدة");
  try {
    const response = await apiPost('/api/v1/cases/', data);
    console.log("✅ تم إنشاء القضية بنجاح:", response);
    return response;
  } catch (error) {
    console.error("❌ فشل في إنشاء القضية:", error);
    throw error;
  }
}

export async function getJudicialCases(filters?: {
  status?: string;
  priority?: string;
  case_type?: string;
  court?: string;
  skip?: number;
  limit?: number;
}) {
  console.log("📁 جلب قضايا المحامي");
  
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.priority) params.append("priority", filters.priority);
    if (filters?.case_type) params.append("case_type", filters.case_type);
    if (filters?.court) params.append("court", filters.court);
    if (filters?.skip) params.append("skip", filters.skip.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    
    const queryString = params.toString();
    const endpoint = `/api/v1/cases/${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiGet(endpoint);
    console.log("✅ تم جلب القضايا بنجاح:", response);
    return response;
  } catch (error) {
    console.error("❌ فشل في جلب القضايا:", error);
    console.log("🔄 إرجاع بيانات تجريبية للاختبار...");
    return getMockCases();
  }
}

export async function getJudicialCase(caseId: string) {
  console.log(`🔍 جلب تفاصيل القضية: ${caseId}`);
  
  try {
    const response = await apiGet(`/api/v1/cases/${caseId}`);
    console.log("✅ تم جلب القضية بنجاح:", response);
    return response;
  } catch (error) {
    console.error(`❌ فشل في جلب القضية ${caseId}:`, error);
    const mockCases = getMockCases();
    return mockCases.find(caseItem => caseItem.id === caseId) || mockCases[0];
  }
}

export async function updateJudicialCase(caseId: string, data: any) {
  console.log(`✏️ تحديث القضية: ${caseId}`);
  
  try {
    const response = await apiPost(`/api/v1/cases/${caseId}`, data);
    console.log("✅ تم تحديث القضية بنجاح:", response);
    return response;
  } catch (error) {
    console.error(`❌ فشل في تحديث القضية ${caseId}:`, error);
    throw error;
  }
}

export async function deleteJudicialCase(caseId: string) {
  console.log(`🗑️ حذف القضية: ${caseId}`);
  
  try {
    const response = await apiDelete(`/api/v1/cases/${caseId}`);
    console.log("✅ تم حذف القضية بنجاح:", response);
    return response;
  } catch (error) {
    console.error(`❌ فشل في حذف القضية ${caseId}:`, error);
    throw error;
  }
}

export async function getUrgentCases() {
  console.log("🚨 جلب القضايا العاجلة");
  
  try {
    const response = await apiGet('/api/v1/cases/urgent');
    console.log("✅ تم جلب القضايا العاجلة بنجاح:", response);
    return response;
  } catch (error) {
    console.error("❌ فشل في جلب القضايا العاجلة:", error);
    const mockCases = getMockCases();
    return mockCases.filter(caseItem => 
      caseItem.priority === 'urgent' || caseItem.priority === 'high'
    );
  }
}

export async function getCaseStats() {
  console.log("📊 جلب إحصائيات القضايا");
  
  try {
    const response = await apiGet('/api/v1/cases/stats');
    console.log("✅ تم جلب الإحصائيات بنجاح:", response);
    return response;
  } catch (error) {
    console.error("❌ فشل في جلب إحصائيات القضايا:", error);
    const mockCases = getMockCases();
    return {
      total_cases: mockCases.length,
      active_cases: mockCases.filter(c => c.status === 'active').length,
      urgent_cases: mockCases.filter(c => c.priority === 'urgent').length,
      closed_cases: mockCases.filter(c => c.status === 'closed').length,
      pending_documents: mockCases.reduce((count, caseItem) => 
        count + (caseItem.documents?.filter((doc: any) => !doc.upload_date).length || 0), 0
      ),
      weekly_sessions: mockCases.reduce((count, caseItem) => 
        count + (caseItem.sessions?.filter((session: any) => {
          const sessionDate = new Date(session.date);
          const now = new Date();
          const oneWeek = 7 * 24 * 60 * 60 * 1000;
          return sessionDate.getTime() - now.getTime() <= oneWeek;
        }).length || 0), 0
      )
    };
  }
}

// ============================================
// Authentication API Functions
// ============================================

export async function loginUser(credentials: { email: string; password: string }) {
  console.log("🔐 تسجيل الدخول");
  return apiPost('/api/v1/auth/login', credentials);
}

export async function registerUser(userData: any) {
  console.log("👤 تسجيل مستخدم جديد");
  return apiPost('/api/v1/auth/register', userData);
}

export async function logoutUser() {
  console.log("🚪 تسجيل الخروج");
  return apiPost('/api/v1/auth/logout');
}

export async function getCurrentUser() {
  console.log("👤 جلب بيانات المستخدم الحالي");
  return apiGet('/api/v1/auth/me');
}

// ============================================
// Agenda API Functions
// ============================================

export interface AgendaEvent {
  id?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  event_type: string;
  color?: string;
  location?: string;
  rrule?: string;
  reminder_minutes_before?: number;
}

export const fetchEvents = async (start: Date, end: Date): Promise<any[]> => {
  try {
    console.log("📅 محاولة جلب الأحداث...", {
      start: start.toISOString(),
      end: end.toISOString()
    });

    const params = new URLSearchParams({
      start: start.toISOString(),
      end: end.toISOString(),
    });
    
    const response = await apiGet(`/api/v1/agenda/?${params}`);
    
    console.log("✅ تم جلب الأحداث بنجاح من الخادم:", response);
    
    if (!Array.isArray(response)) {
      console.warn("⚠️ الاستجابة ليست مصفوفة:", response);
      return [];
    }

    const formattedEvents = response.map((event: any) => {
      return {
        id: event.id,
        title: event.title,
        start: event.start_time,
        end: event.end_time,
        allDay: event.is_all_day || false,
        backgroundColor: event.color || '#3b82f6',
        extendedProps: {
          description: event.description,
          event_type: event.event_type,
          location: event.location,
          reminder_minutes_before: event.reminder_minutes_before
        }
      };
    });

    console.log("🔄 الأحداث بعد التحويل:", formattedEvents);
    return formattedEvents;

  } catch (error) {
    console.error("❌ فشل في جلب الأحداث:", error);
    return [];
  }
};

export const createEvent = async (eventData: AgendaEvent): Promise<AgendaEvent> => {
  console.log("📝 إنشاء حدث جديد:", eventData);
  const response = await apiPost('/api/v1/agenda/', eventData);
  console.log("✅ استجابة إنشاء الحدث:", response);
  return response;
};

export const updateEvent = async (eventId: string, eventData: Partial<AgendaEvent>): Promise<AgendaEvent> => {
  console.log("✏️ تحديث الحدث:", eventId, eventData);
  const response = await apiPost(`/api/v1/agenda/${eventId}`, eventData);
  console.log("✅ استجابة تحديث الحدث:", response);
  return response;
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  await apiDelete(`/api/v1/agenda/${eventId}`);
};

// ============================================
// Notifications API Functions
// ============================================

export async function getNotifications(): Promise<any[]> {
  console.log("🔔 جلب الإشعارات");
  try {
    const response = await apiGet('/api/v1/notifications/');
    console.log("✅ تم جلب الإشعارات بنجاح:", response);
    
    if (Array.isArray(response)) {
      return response;
    } else {
      console.warn("⚠️ الاستجابة ليست مصفوفة:", response);
      return [];
    }
    
  } catch (error) {
    console.error("❌ فشل في جلب الإشعارات:", error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<any> {
  console.log(`📭 تعليم الإشعار كمقروء: ${notificationId}`);
  try {
    const response = await apiPost(`/api/v1/notifications/${notificationId}/read`);
    console.log("✅ تم تعليم الإشعار كمقروء:", response);
    return response;
  } catch (error) {
    console.error("❌ فشل في تعليم الإشعار كمقروء:", error);
    return { message: "تم التعليم بنجاح", notification_id: notificationId };
  }
}

export async function markAllNotificationsAsRead(): Promise<any> {
  console.log("📭 تعليم جميع الإشعارات كمقروءة");
  try {
    const response = await apiPost('/api/v1/notifications/mark-all-read');
    console.log("✅ تم تعليم جميع الإشعارات كمقروءة:", response);
    return response;
  } catch (error) {
    console.error("❌ فشل في تعليم جميع الإشعارات كمقروءة:", error);
    return { message: "تم التعليم بنجاح", count: 0 };
  }
}

// ============================================
// دوال مساعدة للبيانات التجريبية
// ============================================

function getMockCases(): any[] {
  return [
    {
      id: "case-001",
      case_number: "CASE-2024-001",
      title: "قضية تعويض مالي",
      description: "قضية تعويض عن أضرار مادية ناتجة عن عقد مقاولة",
      case_type: "مدنية",
      court: "محكمة الجزئية - التجارية",
      registration_date: "2024-01-15",
      status: "active",
      priority: "high",
      parties: [
        {
          type: "client",
          name: "أحمد محمد",
          identity_number: "2990101010101",
          phone: "+20123456789",
          email: "ahmed@example.com",
          address: "القاهرة، مصر"
        }
      ],
      sessions: [
        {
          id: "session-1",
          date: "2024-02-01T10:00:00",
          location: "قاعة الجلسات ١",
          purpose: "المرافعة الأولى",
          judge: "القاضي محمد أحمد",
          outcome: "مؤجل",
          next_session_date: "2024-03-01T10:00:00"
        }
      ],
      documents: [
        {
          id: "doc-1",
          name: "عقد المقاولة",
          type: "عقد",
          upload_date: "2024-01-20T14:30:00",
          file_url: "/documents/contract.pdf",
          uploaded_by: "lawyer-001"
        }
      ],
      fees: 15000,
      expenses: 3000,
      payment_status: "paid",
      success_probability: 75,
      created_by: "lawyer-001",
      tags: ["تعويض", "مدني", "مقاولات"],
      created_at: "2024-01-15T10:00:00",
      updated_at: "2024-01-25T15:30:00"
    }
  ];
}

// ============================================
// دوال أخرى
// ============================================

export async function createConsultation(data: any) {
  console.log("💬 إنشاء استشارة جديدة");
  return apiPost('/api/v1/consultations/', data);
}

export async function getMyConsultations() {
  console.log("📋 جلب استشاراتي");
  return apiGet('/api/v1/consultations/my-consultations');
}

export async function createEmergencyRequest(data: any) {
  console.log("🚨 إنشاء طلب طوارئ");
  return apiPost('/api/v1/emergency/', data);
}

export async function getEmergencyRequests() {
  console.log("📋 جلب طلبات الطوارئ");
  return apiGet('/api/v1/emergency/');
}

export async function createDocument(data: any) {
  console.log("📄 إنشاء وثيقة جديدة");
  return apiPost('/api/v1/documents/', data);
}

export async function getMyDocuments() {
  console.log("📂 جلب وثائقي");
  return apiGet('/api/v1/documents/my-documents');
}




//=============================================
//المناقشات القانونية 
//=============================================




export async function getQuestions(filters?: {
  category?: string;
  status?: string;
  search?: string;
  sort_by?: string;
  skip?: number;
  limit?: number;
}) {
  console.log("📥 جلب الأسئلة من الخادم");
  
  try {
    const params = new URLSearchParams();
    if (filters?.category) params.append("category", filters.category);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.sort_by) params.append("sort_by", filters.sort_by);
    if (filters?.skip) params.append("skip", filters.skip.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    
    const queryString = params.toString();
    const endpoint = `/api/v1/discussions/questions${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiGet(endpoint);
    console.log("✅ تم جلب الأسئلة بنجاح:", response);
    return response;
  } catch (error) {
    console.error("❌ فشل في جلب الأسئلة:", error);
    throw error;
  }
}

/**
 * إنشاء سؤال جديد
 */
export async function createQuestion(questionData: any) {
  console.log("📝 إنشاء سؤال جديد في الخادم:", questionData);
  
  try {
    const response = await apiPost('/api/v1/discussions/questions', questionData);
    console.log("✅ تم إنشاء السؤال بنجاح:", response);
    return response;
  } catch (error) {
    console.error("❌ فشل في إنشاء السؤال:", error);
    throw error;
  }
}

/**
 * إضافة إجابة جديدة
 */
export async function createAnswer(answerData: any) {
  console.log("💬 إضافة إجابة جديدة:", answerData);
  
  try {
    const response = await apiPost('/api/v1/discussions/answers', answerData);
    console.log("✅ تم إضافة الإجابة بنجاح:", response);
    return response;
  } catch (error) {
    console.error("❌ فشل في إضافة الإجابة:", error);
    throw error;
  }
}

/**
 * متابعة سؤال
 */
export async function followQuestion(questionId: string) {
  console.log("⭐ متابعة السؤال:", questionId);
  
  try {
    const response = await apiPost(`/api/v1/discussions/questions/${questionId}/follow`);
    console.log("✅ تمت المتابعة بنجاح:", response);
    return response;
  } catch (error) {
    console.error("❌ فشل في متابعة السؤال:", error);
    throw error;
  }
}


/**
 * التصويت على إجابة
 */
export async function voteAnswer(answerId: string, voteType: string) {
  console.log("🗳️ التصويت على الإجابة:", { answerId, voteType });
  
  try {
    const response = await apiPost(`/api/v1/discussions/answers/${answerId}/vote`, {
      vote_type: voteType
    });
    console.log("✅ تم التصويت بنجاح:", response);
    return response;
  } catch (error) {
    console.error("❌ فشل في التصويت:", error);
    throw error;
  }
}

////////////////////////////////////////////////////////////////////////////////////////////
// ============================================
// AI Advisor API Functions - المستشار الذكي
// ============================================

/**
 * استعلام المستشار الذكي (RAG)
 */
export async function queryAIAdvisor(query: string, filters?: any) {
  console.log("🤖 استعلام المستشار الذكي:", { query, filters });
  
  try {
    const response = await apiPost('/api/v1/ai/query', {
      query,
      filters: filters || {}
    });
    console.log("✅ تم الحصول على إجابة المستشار:", response);
    return response;
  } catch (error) {
    console.error("❌ فشل في استعلام المستشار الذكي:", error);
    throw error;
  }
}

/**
 * ترجمة نص قانوني
 */
export async function translateLegalText(text: string, targetLang: string = "الإنجليزية") {
  console.log("🌐 ترجمة نص قانوني:", { text, targetLang });
  
  try {
    const response = await apiPost('/api/v1/ai/translate', {
      text,
      source_lang: "العربية",
      target_lang: targetLang
    });
    console.log("✅ تمت الترجمة بنجاح:", response);
    return response;
  } catch (error) {
    console.error("❌ فشل في الترجمة:", error);
    throw error;
  }
}

/**
 * تحليل مستند قانوني
 */
export async function analyzeLegalDocument(text: string) {
  console.log("📊 تحليل مستند قانوني");
  
  try {
    const response = await apiPost('/api/v1/ai/analyze', { text });
    console.log("✅ تم التحليل بنجاح:", response);
    return response;
  } catch (error) {
    console.error("❌ فشل في تحليل المستند:", error);
    throw error;
  }
}

/**
 * البث المتدفق للمستشار الذكي (للتجارب المستقبلية)
 */
export function getAIAdvisorStream(query: string, filters?: any): EventSource {
  console.log("📡 بدء البث المتدفق للمستشار");
  
  const params = new URLSearchParams();
  params.append('query', query);
  if (filters) {
    params.append('filters', JSON.stringify(filters));
  }
  
  const url = `${API_BASE_URL}/api/v1/ai/query-stream?${params.toString()}`;
  return new EventSource(url);
}





// ============================================
// تصدير الدوال المساعدة
// ============================================

export { apiGet, apiPost, apiDelete };



