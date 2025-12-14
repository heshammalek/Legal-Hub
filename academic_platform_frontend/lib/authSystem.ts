// src/lib/authSystem.ts
import { apiService } from './api'

export interface AuthUser {
  type: 'admin' | 'teacher' | 'student'
  name: string
  institution: string
  email?: string
  token: string
}

export interface LoginCredentials {
  email?: string
  student_id?: string
  institution_code: string
  password: string
  user_type?: 'admin' | 'teacher' | 'student'
}

class AuthSystem {
  private currentUser: AuthUser | null = null

  async login(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      let response: any

      // تحديد نوع المستخدم بناءً على البيانات المدخلة
      if (credentials.user_type === 'admin' || !credentials.email) {
        // دخول كمسؤول
        response = await apiService.login({
          country: 'SA', // يمكن جعله ديناميكي
          institution_code: credentials.institution_code,
          password: credentials.password
        })
      } else if (credentials.email?.includes('@')) {
        // دخول كمدرس
        response = await apiService.teacherLogin({
          email: credentials.email,
          institution_code: credentials.institution_code
        })
      } else {
        // دخول كطالب
        response = await apiService.studentLogin({
          student_id: credentials.email || credentials.student_id || '',
          institution_code: credentials.institution_code
        })
      }

      // تحديد نوع المستخدم من الاستجابة
      const userType = this.determineUserType(response)
      
      const user: AuthUser = {
        type: userType,
        name: response.name,
        institution: response.institution_name || credentials.institution_code,
        email: response.email,
        token: response.access_token
      }

      this.currentUser = user
      localStorage.setItem('currentUser', JSON.stringify(user))
      
      return user

    } catch (error: any) {
      throw new Error(error.message || 'فشل في تسجيل الدخول')
    }
  }

  private determineUserType(response: any): 'admin' | 'teacher' | 'student' {
    if (response.access_token && response.role === 'admin') return 'admin'
    if (response.email && response.specialization) return 'teacher'
    if (response.student_id) return 'student'
    return 'student' // افتراضي
  }

  logout(): void {
    this.currentUser = null
    localStorage.removeItem('currentUser')
    localStorage.removeItem('admin_token')
  }

  getCurrentUser(): AuthUser | null {
    if (!this.currentUser) {
      const stored = localStorage.getItem('currentUser')
      if (stored) {
        this.currentUser = JSON.parse(stored)
      }
    }
    return this.currentUser
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }

  hasRole(role: 'admin' | 'teacher' | 'student'): boolean {
    const user = this.getCurrentUser()
    return user?.type === role
  }
}

export const authSystem = new AuthSystem()