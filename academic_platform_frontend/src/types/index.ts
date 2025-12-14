export interface User {
  id: number
  name: string
  email: string
  role: 'teacher' | 'student' | 'admin'
}

export interface Content {
  id: number
  title: string
  description: string
  contentType: 'case' | 'task' | 'assignment' | 'research'
  legalDomain: string
  difficulty: 'مبتدئ' | 'متوسط' | 'متقدم'
  duration: number
  learningObjectives: string[]
  status: 'نشط' | 'مسودة' | 'مغلق'
  created_at: string
  createdBy: number
}

export interface Assignment {
  id: number
  student_id: number
  student_name: string
  content_id: number
  content_title: string
  submission_text: string
  submitted_at: string
  status: 'submitted' | 'graded' | 'returned'
}

export interface AIEvaluation {
  score: number
  feedback: string
  legal_accuracy: number
  completeness: number
  clarity: number
  suggestions: string[]
  analyzed_sections: string[]
}

export interface SimulationCase {
  id: number
  title: string
  description: string
  roles: SimulationRole[]
  case_facts: string
  legal_issues: string[]
}

export interface SimulationRole {
  id: number
  name: string
  type: 'قاضي' | 'محامي_دفاع' | 'نائب_عام' | 'كاتب_جلسة' | 'شاهد' | 'خبير'
  description: string
  required: boolean
  case_id: number
}
