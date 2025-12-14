// src/types/court.ts
export interface CourtCase {
  id: string
  title: string
  description: string
  type: 'مدنية' | 'جنائية' | 'تجارية' | 'دستورية' | 'إدارية'
  difficulty: 'مبتدئ' | 'متوسط' | 'متقدم' | 'محترف'
  duration: number // بالدقائق
  estimatedParticipants: number
  createdBy: string // ID المدرس
  institution: string // ID المؤسسة
  createdAt: Date
  caseFiles: CaseFile[]
  roles: CaseRole[]
  status: 'مسودة' | 'نشط' | 'مكتمل' | 'ملغي'
}

export interface CaseFile {
  id: string
  name: string
  type: 'وثيقة' | 'صورة' | 'فيديو' | 'تسجيل'
  url: string
  description: string
}

export interface CaseRole {
  id: string
  name: string
  type: 'قاضي' | 'محامي_دفاع' | 'نائب_عام' | 'كاتب_جلسة' | 'شاهد' | 'خبير'
  description: string
  assignedTo?: string // ID الطالب
  required: boolean
}

export interface SimulationSession {
  id: string
  caseId: string
  institution: string
  participants: SessionParticipant[]
  startTime: Date
  endTime?: Date
  status: 'جارية' | 'منتهية' | 'ملغاة'
  recordings: string[]
  chatLogs: ChatMessage[]
}

export interface SessionParticipant {
  studentId: string
  role: string
  joinedAt: Date
  leftAt?: Date
  performance: PerformanceMetrics
}

export interface PerformanceMetrics {
  preparation: number
  argumentation: number
  professionalism: number
  timeManagement: number
  totalScore: number
}

export interface ChatMessage {
  id: string
  sender: string
  role: string
  message: string
  timestamp: Date
  type: 'نص' | 'وثيقة' | 'تعليق'
}