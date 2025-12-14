// src/components/auth/RoleBasedRouter.tsx
'use client'

import { useState, useEffect } from 'react'
import AdminDashboard from '../../components/dashboard/AdminDashboard'
import TeacherDashboard from '../../components/dashboard/TeacherDashboard'
import StudentDashboard from '../../components/dashboard/StudentManagement'

interface RoleBasedRouterProps {
  userType: 'admin' | 'teacher' | 'student'
  userName: string
  institution: string
  onLogout: () => void
}

// إنشاء StudentDashboard مبسط إذا لم يكن موجوداً
function SimpleStudentDashboard({ 
  onBack, 
  studentName, 
  institution 
}: { 
  onBack: () => void
  studentName: string
  institution: string
}) {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-green-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-400">👨‍🎓 لوحة الطالب</h1>
            <p className="text-white/60">الطالب: {studentName} - المؤسسة: {institution}</p>
          </div>
          <button 
            onClick={onBack}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            تسجيل الخروج
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl text-white mb-4">📋 القضايا النشطة</h3>
            <p className="text-white/60">لا توجد قضايا نشطة حالياً</p>
          </div>
          
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl text-white mb-4">📚 مكتبة القضايا</h3>
            <p className="text-white/60">استعرض القضايا للتعلم</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RoleBasedRouter({ 
  userType, 
  userName, 
  institution, 
  onLogout 
}: RoleBasedRouterProps) {
  const [currentView, setCurrentView] = useState<'dashboard' | 'courtroom'>('dashboard')

  const handleEnterCourtroom = () => {
    setCurrentView('courtroom')
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
  }

  if (currentView === 'courtroom') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl text-white mb-4">🏛️ قاعة المحكمة</h1>
          <p className="text-white/60 mb-6">واجهة المحكمة قيد التطوير</p>
          <button 
            onClick={handleBackToDashboard}
            className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600"
          >
            العودة للوحة التحكم
          </button>
        </div>
      </div>
    )
  }

  switch (userType) {
    case 'admin':
      return (
        <AdminDashboard 
          onBack={onLogout}
          adminName={userName}
          institution={institution}
          adminId={1}
        />
      )
    
    case 'teacher':
      return (
        <TeacherDashboard 
          onBack={onLogout}
          teacherName={userName}
          institution={institution}
          onEnterCourtroom={handleEnterCourtroom}
        />
      )
    
    case 'student':
      return (
        <SimpleStudentDashboard 
          onBack={onLogout}
          studentName={userName}
          institution={institution}
        />
      )
    
    default:
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl text-white mb-4">❌ خطأ في نوع المستخدم</h1>
            <button 
              onClick={onLogout}
              className="bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600"
            >
              العودة لتسجيل الدخول
            </button>
          </div>
        </div>
      )
  }
}