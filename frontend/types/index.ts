// types/index.ts

export interface User {
  id: string;
  name: string;
  nationalId: string;
  country: StandardCountry;
  phone: string;
  email?: string;
  role: 'user' | 'lawyer' | 'admin' | 'judge' | 'expert';
  status: 'pending' | 'active' | 'suspended';
  createdAt: Date;
}

// 🔥 التعديل: تغيير اسم الواجهة لتجنب التعارض
export interface LawyerUser extends User {
  barAssociation: string;
  barNumber: string;
  yearOfAdmission: number;
  degree: string;
  specialization: string;
  officeAddress: string;
  paymentMethods: string[];
  membershipStart: Date;
  membershipEnd: Date;
  availability: boolean;
  lat: number;
  lng: number;
  rating: number;
  totalEarnings: number;
  pendingAmount: number;
}

export interface Judge extends User {
  court: string;
  circuit: string;
  judgeId: string;
}

export interface Expert extends User {
  workplace: string;
  expertise: string;
  paymentMethods: string[];
}

export interface Admin extends User {
  adminLevel: string;
}


// 🔥 التعديل: إعادة تعريف LawyerProfile بشكل منفصل
export interface LawyerProfile {
  id: string;
  profile_id: string;
  bar_association: string;
  registration_number: string;
  specialization: string;
  years_of_experience?: number;
  office_address?: string;
  office_phone?: string;
  
  // معلومات المستخدم
  full_name?: string;
  email?: string;
  phone?: string; // 🔥 إضافة هذا الحقل
  country?: StandardCountry; // 🔥 إضافة هذا الحقل
}


export interface BackendLawyerProfile {
  id: string;
  profile_id: string;
  bar_association: string;
  registration_number: string;
  specialization: string;
  years_of_experience?: number;
  office_address?: string;
  office_phone?: string;
  full_name?: string;
  email?: string;
}



// ==========================================
// 🌍 نظام الدول الموحد
// ==========================================

export const STANDARD_COUNTRIES = [
  'Egypt',
  'Saudi Arabia',
  'UAE',
  'Jordan',
  'Lebanon',
  'Kuwait',
  'Qatar',
  'Oman',
  'Bahrain',
  'Iraq',
  'Algeria',
  'Morocco',
  'Tunisia',
  'Sudan',
  'Yemen'
] as const;

export type StandardCountry = typeof STANDARD_COUNTRIES[number];

export interface CountryTranslation {
  arabic: string;
  english: StandardCountry;
}

export const COUNTRY_TRANSLATIONS: CountryTranslation[] = [
  { arabic: 'مصر', english: 'Egypt' },
  { arabic: 'السعودية', english: 'Saudi Arabia' },
  { arabic: 'الإمارات', english: 'UAE' },
  { arabic: 'الأردن', english: 'Jordan' },
  { arabic: 'لبنان', english: 'Lebanon' },
  { arabic: 'الكويت', english: 'Kuwait' },
  { arabic: 'قطر', english: 'Qatar' },
  { arabic: 'عمان', english: 'Oman' },
  { arabic: 'البحرين', english: 'Bahrain' },
  { arabic: 'العراق', english: 'Iraq' },
  { arabic: 'الجزائر', english: 'Algeria' },
  { arabic: 'المغرب', english: 'Morocco' },
  { arabic: 'تونس', english: 'Tunisia' },
  { arabic: 'السودان', english: 'Sudan' },
  { arabic: 'اليمن', english: 'Yemen' }
];

// ==========================================
// 🔄 دوال التحويل
// ==========================================

export function getEnglishCountry(arabicCountry: string): StandardCountry {
  const country = COUNTRY_TRANSLATIONS.find(c => c.arabic === arabicCountry);
  if (!country) {
    console.warn(`⚠️ الدولة "${arabicCountry}" غير موجودة`);
    return 'Egypt';
  }
  return country.english;
}

export function getArabicCountry(englishCountry: string): string {
  const country = COUNTRY_TRANSLATIONS.find(c => c.english === englishCountry);
  if (!country) {
    console.warn(`⚠️ الدولة "${englishCountry}" غير موجودة`);
    return englishCountry;
  }
  return country.arabic;
}

export function isValidCountry(country: string): country is StandardCountry {
  return STANDARD_COUNTRIES.includes(country as StandardCountry);
}

// ==========================================


// Delegation Types
// ============================================

export type DelegationStatus = "pending" | "accepted" | "cancelled" | "completed";

export interface DelegationRequest {
  id: string;
  court_name: string;
  circuit: string;
  case_number: string;
  case_date: string;
  roll?: string;
  required_action: string;
  financial_offer?: number;
  contact_phone?: string;        // ✅ إضافة كحقل اختياري
  whatsapp_number: string;
  whatsapp_url?: string;         // ✅ إضافة كحقل اختياري
  requester_signature?: string;
  registration_number: string;
  power_of_attorney_number: string;
  actor_role?: string;           // ✅ إضافة كحقل اختياري
  delegation_identity?: string;  // ✅ إضافة كحقل اختياري
  status: DelegationStatus;
  requester_lawyer_id: string;
  accepter_lawyer_id?: string;
  created_at: string;
  updated_at: string;
  accepted_at?: string;
  confirmed_at?: string;
  cancelled_at?: string;
  completed_at?: string;
  
  // بيانات إضافية من العلاقات
  requester_lawyer_name?: string;
  requester_bar_association?: string;
  requester_office_address?: string;
}

// الحفاظ على النموذج الحالي مع إضافة الحقول الجديدة كاختيارية
export interface DelegationRequestCreate {
  court_name: string;
  circuit: string;
  case_number: string;
  case_date: string;
  roll?: string;
  required_action: string;
  financial_offer?: number;
  contact_phone?: string;        // ✅ إضافة كحقل اختياري
  whatsapp_number: string;
  whatsapp_url?: string;         // ✅ إضافة كحقل اختياري
  requester_signature?: string;
  registration_number: string;
  power_of_attorney_number: string;
  actor_role?: string;           // ✅ إضافة كحقل اختياري
  delegation_identity?: string;  // ✅ إضافة كحقل اختياري
}



// ============================================
// Notification Types
// ============================================

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "delegation" | "chat" | "system" | "consultation";
  is_read: boolean;
  created_at: string;
  metadata?: {
    delegation_id?: string;
    chat_room_id?: string;
    sender_name?: string;
  };
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface ApiError {
  detail: string;
  status_code: number;
}

// ============================================
// Form Types
// ============================================

export interface DelegationFormData {
  court_name: string;
  circuit: string;
  case_number: string;
  case_date: string;
  roll?: string;
  required_action: string;
  requester_signature?: string;
  registration_number: string;
  power_of_attorney_number: string;
}

// ============================================
// Filter Types
// ============================================

export interface DelegationFilters {
  status?: DelegationStatus;
  court_name?: string;
  circuit?: string;
  date_from?: string;
  date_to?: string;
}

export interface ChatFilters {
  is_active?: boolean;
  has_unread?: boolean;
}

// ============================================
// Stats Types
// ============================================

export interface DelegationStats {
  total_sent: number;
  total_received: number;
  pending: number;
  under_review: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

export interface ChatStats {
  total_rooms: number;
  active_rooms: number;
  total_unread: number;
}


// ==========================================
// 📋 أنواع الاستشارات
// ==========================================

export interface ConsultationRequest {
  id: string;
  lawyer_id: string;
  subject: string;
  message: string;
  country: StandardCountry;
  category: string;
  urgency_level: 'low' | 'normal' | 'high';
  consultation_fee: number;
  duration_minutes: number;
}

export interface ConsultationLawyer {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  consultation_fee: number;
  experience_years: number;
  consultations_count: number;
  response_time: string;
  description: string;
  country: StandardCountry;
  phone: string;
}



// ==========================================
// ⚖️ أنواع القضايا القضائية
// ==========================================

export interface JudicialCase {
  id: string;
  case_number: string;
  title: string;
  description?: string;
  case_type: string;
  court: string;
  registration_date: string;
  status: CaseStatus;
  priority: CasePriority;
  parties: Party[];
  sessions: Session[];
  documents: Document[];
  team: CaseTeam;
  fees?: number;
  expenses?: number;
  payment_status?: string;
  success_probability?: number;
  created_by: string;
  tags: string[];
  milestones: Milestone[];
  reminders: Reminder[];
  created_at: string;
  updated_at: string;
  last_updated: string;
}

export type CaseStatus = 'draft' | 'active' | 'pending' | 'in_session' | 'appeal' | 'closed' | 'archived';
export type CasePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Party {
  id?: string;
  type: string;
  name: string;
  identity_number?: string;
  phone?: string;
  email?: string;
  address?: string;
  lawyer?: string;
}

export interface Session {
  id?: string;
  date: string;
  location: string;
  purpose: string;
  judge?: string;
  clerk?: string;
  prosecutor?: string;
  court_recorder?: string;
  notes?: string;
  documents: string[];
  outcome?: string;
  next_session_date?: string;
}

export interface Document {
  id?: string;
  name: string;
  type: string;
  upload_date: string;
  file_url: string;
  uploaded_by: string;
  related_session?: string;
  description?: string;
}

export interface CaseTeam {
  lead_lawyer: string;
  assistant_lawyers: string[];
  legal_researchers: string[];
  paralegals: string[];
}

export interface Milestone {
  id?: string;
  title: string;
  date: string;
  description: string;
  completed: boolean;
}

export interface Reminder {
  id?: string;
  title: string;
  due_date: string;
  priority: CasePriority;
  completed: boolean;
}