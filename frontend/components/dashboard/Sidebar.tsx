'use client'

import {
  User,
  MapPin,
  FileText,
  MessageSquare,
  Briefcase,
  Calendar,
  Gavel,
  FileSearch,
  Users,
  Settings,
  Moon, // 🗑️ لحذفها - متعلقة بـ dark mode
  Sun, // 🗑️ لحذفها - متعلقة بـ dark mode
} from 'lucide-react'
import {
  FaBell,
  FaCalendarAlt,
  FaCog,
  FaComments,
  FaExchangeAlt,
  FaExclamationTriangle,
  FaFileAlt,
  FaFolderOpen,
  FaGavel,
  FaRobot,
  FaTasks,
  FaUsers,
  FaVideo,
} from 'react-icons/fa'
import { useState, useEffect } from 'react'

interface TabItem {
  label: string
  tab: string
  icon: React.FC<React.SVGProps<SVGSVGElement>>
}

/** خريطة التابات لكل دور */
const tabsConfig: Record<string, TabItem[]> = {
  user: [
    { label: 'الملف الشخصي', tab: 'profile', icon: User },
    { label: 'محام طواريء', tab: 'map', icon: MapPin },
    { label: 'طلب استشارة', tab: 'consultation', icon: FileText },
    { label: 'اسال الروبوت', tab: 'ask_robot', icon: FaRobot }, // نفس تاب المحامي
  { label: 'الإعدادات', tab: 'settings', icon: FaCog }, // نفس تاب المحامي
    { label: 'اطلب خدمة ', tab: 'posts', icon: Briefcase },
  ],
  lawyer: [
    { label: 'القضايا الخاصة بي', tab: 'cases', icon: FaFolderOpen },
    { label: 'الترجمة القانونية ', tab: 'translation', icon: FaCalendarAlt },
    { label: 'الطلبات الطارئة', tab: 'emergencyRequests', icon: FaExchangeAlt },
    { label: 'طلبات الاستشارات', tab: 'consultationRequests', icon: FaComments },
    { label: 'الاستشارات النشطة', tab: 'activeConsultations', icon: FaVideo },
    { label: 'طلبات الإنابة', tab: 'delegation', icon: FaExchangeAlt },
    { label: ' المكتبة ومحرر النصوص', tab: 'documents', icon: FaFileAlt },
    { label: 'الأجندة', tab: 'calendar', icon: FaCalendarAlt },
    { label: 'المحكمة التفاعلية', tab: 'AllCourtsSimulation', icon: FaCalendarAlt },
    { label: 'إقامة دعوى', tab: 'lawsuit', icon: FaGavel },
    { label: 'أتمتة المهام', tab: 'automation', icon: FaTasks },
    { label: 'اسأل الروبوت', tab: 'ask_robot', icon: FaRobot },
    { label: 'المناقشات القانونية', tab: 'ask_peers', icon: FaUsers },
    { label: 'التنبيهات', tab: 'notifications', icon: FaBell },
    { label: 'الإعدادات', tab: 'settings', icon: FaCog },
  ],
  judge: [
    { label: 'القضايا المعلقة', tab: 'pending', icon: Gavel },
    { label: 'الجلسات', tab: 'hearings', icon: Calendar },
    { label: 'القرارات', tab: 'decisions', icon: FileSearch },
    { label: 'الإعدادات', tab: 'settings', icon: Settings },
  ],
  expert: [
    { label: 'بياناتي', tab: 'profile', icon: User },
    { label: 'التقارير', tab: 'reports', icon: FileSearch },
    { label: 'المهام', tab: 'assignments', icon: FileText },
    { label: 'الإعدادات', tab: 'settings', icon: Settings },
  ],
  admin: [
    { label: 'إدارة المستخدمين', tab: 'users', icon: Users },
    { label: 'إدارة الأدوار', tab: 'roles', icon: Settings },
    { label: 'تحميل مصادر ', tab: 'fileDownloaderTab', icon: Settings },
    { label: 'الإعدادات', tab: 'settings', icon: Settings },
  ],
}

interface LawyerAvailability {
  emergency_available: boolean
  consultations_available: boolean
  lat?: number
  lng?: number
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Sidebar({
  role,
  activeTab,
  onTabChange,
}: {
  role: string
  activeTab: string
  onTabChange: (tab: string) => void
}) {
  const items = tabsConfig[role] ?? []
  const [availability, setAvailability] = useState<LawyerAvailability>({
    emergency_available: false,
    consultations_available: false,
    lat: undefined,
    lng: undefined
  })
  const [loading, setLoading] = useState<string | null>(null)
  const [initialLoad, setInitialLoad] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false) // 🗑️ لحذفها - متعلقة بـ dark mode

  // جلب حالة الاتاحة الحالية من API عند التحميل الأول
  useEffect(() => {
    if (role === 'lawyer') {
      fetchLawyerAvailability()
    }

   
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialDarkMode = savedTheme === 'dark' || (!savedTheme && systemPrefersDark)
    
    setIsDarkMode(initialDarkMode)
    applyDarkMode(initialDarkMode)
  }, [role])

  // 🗑️ كامل هذه الدالة - متعلقة بـ dark mode
  const applyDarkMode = (dark: boolean) => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      document.body.style.backgroundColor = '#111827'
      document.body.style.color = '#f9fafb'
    } else {
      root.classList.remove('dark')
      document.body.style.backgroundColor = '#ffffff'
      document.body.style.color = '#111827'
    }
  }

  const fetchLawyerAvailability = async () => {
    try {
      setInitialLoad(true)
      const response = await fetch(`${API_BASE_URL}/api/lawyer/availability`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setAvailability(data)
      } else {
        console.error('Failed to fetch availability:', response.status)
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
    } finally {
      setInitialLoad(false)
    }
  }



  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    })
  }

  const handleEmergencyToggle = async () => {
    if (loading) return
    
    setLoading('emergency')
    
    try {
      const newEmergencyState = !availability.emergency_available
      
      if (newEmergencyState) {
        // تشغيل الطواريء - يحتاج تحديد الموقع
        const location = await getCurrentLocation()
        
        const response = await fetch(`${API_BASE_URL}/api/lawyer/availability`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            emergency_available: true,
            consultations_available: availability.consultations_available,
            lat: location.lat,
            lng: location.lng
          }),
        })

        if (response.ok) {
          const result = await response.json()
          console.log('✅ Emergency update successful:', result)
          
          // تحديث الحالة المحلية فوراً
          setAvailability(prev => ({
            ...prev,
            emergency_available: true,
            lat: location.lat,
            lng: location.lng
          }))
        } else {
          const errorData = await response.json()
          console.error('❌ Server error:', errorData)
          throw new Error(errorData.detail || 'Failed to update emergency availability')
        }
      } else {
        // إيقاف الطواريء - إزالة الموقع
        const response = await fetch(`${API_BASE_URL}/api/lawyer/availability`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            emergency_available: false,
            consultations_available: availability.consultations_available,
            lat: null,
            lng: null
          }),
        })

        if (response.ok) {
          const result = await response.json()
          console.log('✅ Emergency stop successful:', result)
          
          // تحديث الحالة المحلية فوراً
          setAvailability(prev => ({
            ...prev,
            emergency_available: false,
            lat: undefined,
            lng: undefined
          }))
        } else {
          const errorData = await response.json()
          console.error('❌ Server error:', errorData)
          throw new Error(errorData.detail || 'Failed to update emergency availability')
        }
      }
    } catch (error: any) {
      console.error('Error updating emergency availability:', error)
      alert(`حدث خطأ في تحديث حالة الطواريء: ${error.message}`)
      // نعيد جلب البيانات الحقيقية في حالة الخطأ
      await fetchLawyerAvailability()
    } finally {
      setLoading(null)
    }
  }

  const handleConsultationsToggle = async () => {
    if (loading) return
    
    setLoading('consultations')
    
    try {
      const newConsultationsState = !availability.consultations_available
      
      const response = await fetch(`${API_BASE_URL}/api/lawyer/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          emergency_available: availability.emergency_available,
          consultations_available: newConsultationsState,
          lat: availability.lat,
          lng: availability.lng
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Consultations update successful:', result)
        
        // تحديث الحالة المحلية فوراً
        setAvailability(prev => ({
          ...prev,
          consultations_available: newConsultationsState
        }))
      } else {
        const errorData = await response.json()
        console.error('❌ Server error:', errorData)
        throw new Error(errorData.detail || 'Failed to update consultations availability')
      }
    } catch (error: any) {
      console.error('Error updating consultations availability:', error)
      alert(`حدث خطأ في تحديث حالة الاستشارات: ${error.message}`)
      // نعيد جلب البيانات الحقيقية في حالة الخطأ
      await fetchLawyerAvailability()
    } finally {
      setLoading(null)
    }
  }

  // عرض مؤشر تحميل أثناء الجلب الأولي للبيانات
  if (initialLoad && role === 'lawyer') {
    return (
      <nav className="space-y-4">
        <div className="bg-gradient-to-l from-gray-50 to-white p-4 rounded-lg mb-4 border border-gray-200 shadow-sm">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="sticky top-20 space-y-4 bg-gradient-to-b from-slate-800 to-slate-900 p-4 rounded-lg border border-slate-700 shadow-xl">
    

      {/* أزرار التبديل للمحامي */}
      {role === 'lawyer' && (
        // 🎨 يحتاج إزالة classes الـ dark: منها
        <div className="bg-gradient-to-l from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 p-4 rounded-lg mb-4 border border-gray-200 dark:border-gray-600 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 text-right border-b dark:border-gray-600 pb-2">
            جاهز لتلقي الطلبات 
          </h3>
          <div className="space-y-4">

            {/* زر تبديل الطواريء */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  availability.emergency_available 
                    ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400' 
                    : 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500'
                }`}>
                  <FaExclamationTriangle className="h-4 w-4" />
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 block">طواريء</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
                    {availability.emergency_available ? 'نشط - موقعك مفعل' : 'غير نشط'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleEmergencyToggle}
                disabled={loading === 'emergency'}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  availability.emergency_available 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                } ${loading === 'emergency' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {loading === 'emergency' ? (
                  <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  availability.emergency_available ? 'نشط' : 'غير نشط'
                )}
              </button>
            </div>

            {/* زر تبديل الاستشارات */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  availability.consultations_available 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                    : 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500'
                }`}>
                  <FaComments className="h-4 w-4" />
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 block">استشارات</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
                    {availability.consultations_available ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleConsultationsToggle}
                disabled={loading === 'consultations'}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  availability.consultations_available 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                } ${loading === 'consultations' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {loading === 'consultations' ? (
                  <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  availability.consultations_available ? 'نشط' : 'غير نشط'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* التابات العادية */}
      {items.map(({ label, tab, icon: Icon }) => {
        const isActive = activeTab === tab
        return (
         <button
  key={tab}
  onClick={() => onTabChange(tab)}
  className={`flex items-center gap-3 px-4 py-3 w-full text-right rounded-lg transition-all duration-200 ${
    isActive 
      ? 'bg-amber-500/20 text-amber-300 border-r-4 border-amber-400 shadow-lg' 
      : 'text-slate-300 hover:bg-slate-700 hover:text-white border-r-4 border-transparent'
  }`}
>
  <Icon className={`h-5 w-5 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
  <span className="font-medium">{label}</span>
</button>
        )
      })}
    </nav>
  )
}