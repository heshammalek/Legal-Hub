// src/app/page.tsx
'use client'

import { useState } from 'react'
import PortalEntrance from '../../components/magic/PortalEntrance'
import AuthSystem from '../../components/auth/AuthSystem'
import InstitutionRegistration from '../../components/magic/InstitutionRegistration'
import Courtroom3D from '../../components/magic/Courtroom3D'
import TeacherDashboard from '../../components/dashboard/TeacherDashboard'
import StudentAuth from '../../components/auth/StudentAuth'
import TeacherAuth from '../../components/auth/TeacherAuth'
import AdminDashboard from '../../components/dashboard/AdminDashboard'

type ViewType = 'portal' | 'admin-auth' | 'teacher-auth' | 'student-auth' | 'registration' | 'courtroom' | 'teacher-dashboard' | 'admin-dashboard'

export default function HomePage() {
  const [currentView, setCurrentView] = useState<ViewType>('portal')
  const [userData, setUserData] = useState<any>(null)

  // معالجة دخول الأدمن
  const handleAdminLogin = () => {
    setCurrentView('admin-auth')
  }

  const handleAdminAuthSuccess = (adminData: any) => {
    console.log('تم تسجيل دخول الأدمن:', adminData)
    setUserData(adminData)
    setCurrentView('admin-dashboard')
  }

  // معالجة دخول المدرس
  const handleTeacherLogin = () => {
    setCurrentView('teacher-auth')
  }

  const handleTeacherAuthSuccess = (teacherData: any) => {
    console.log('تم تسجيل دخول المدرس:', teacherData)
    setUserData(teacherData)
    setCurrentView('teacher-dashboard')
  }

  // معالجة دخول الطالب
  const handleStudentLogin = () => {
    setCurrentView('student-auth')
  }

  const handleStudentAuthSuccess = (studentData: any) => {
    console.log('تم تسجيل دخول الطالب:', studentData)
    setUserData(studentData)
    setCurrentView('courtroom')
  }

  // معالجة تسجيل المؤسسة
  const handleShowRegistration = () => {
    setCurrentView('registration')
  }

  const handleRegistrationSuccess = (institutionData: any) => {
    console.log('تم تسجيل المؤسسة:', institutionData)
    setCurrentView('portal')
    alert('تم تقديم طلب تسجيل مؤسستك بنجاح! سيتم المراجعة والاتصال بك.')
  }

  // العودة للبوابة الرئيسية
  const handleBackToPortal = () => {
    setCurrentView('portal')
    setUserData(null)
  }

  // Render بناءً على الحالة الحالية
  switch (currentView) {
    case 'admin-auth':
      return (
        <AuthSystem 
          onLoginSuccess={handleAdminAuthSuccess}
          onBack={handleBackToPortal}
        />
      )

    case 'teacher-auth':
      return (
        <TeacherAuth 
          onLoginSuccess={handleTeacherAuthSuccess}
          onBack={handleBackToPortal}
        />
      )

    case 'student-auth':
      return (
        <StudentAuth 
          onLoginSuccess={handleStudentAuthSuccess}
          onBack={handleBackToPortal}
        />
      )

    case 'admin-dashboard':
      return (
        <AdminDashboard 
          onBack={handleBackToPortal}
          adminData={userData}
        />
      )

    case 'teacher-dashboard':
      return (
        <TeacherDashboard 
          onBack={handleBackToPortal}
          teacherName={userData?.name || "المدرس"}
          institution={userData?.institution_code || "المؤسسة"}
          onEnterCourtroom={() => setCurrentView('courtroom')}
        />
      )

    case 'courtroom':
      return (
        <Courtroom3D 
          onBack={handleBackToPortal}
          selectedInstitution={userData?.institution_code}
          userData={userData}
        />
      )

    case 'registration':
      return (
        <InstitutionRegistration 
          onBack={handleBackToPortal}
          onSuccess={handleRegistrationSuccess}
        />
      )

    default: // 'portal'
      return (
        <PortalEntrance
          onAdminLogin={handleAdminLogin}
          onTeacherLogin={handleTeacherLogin}
          onStudentLogin={handleStudentLogin}
          onRegisterInstitution={handleShowRegistration}
        />
      )
  }
}