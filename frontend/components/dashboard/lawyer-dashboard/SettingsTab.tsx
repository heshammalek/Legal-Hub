// frontend/app/components/dashboard/lawyer-dashboard/SettingsTab.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  FaUser, FaShieldAlt, FaCrown, FaCreditCard, FaSave, FaEnvelope, 
  FaLock, FaEye, FaEyeSlash, FaCheck, FaSync, FaDownload,
   FaUserShield, FaGem, FaReceipt, FaExclamationTriangle,
  FaSignOutAlt, FaKey
} from 'react-icons/fa'

interface LawyerData {
  full_name: string
  email: string
  phone: string
  national_id: string
  specialization: string
  bar_association: string
  registration_number: string
  registration_year: number
  office_address: string
  bio: string
  membership_plan: string
  membership_status: string
  membership_end: string
  membership_price: string
}

const menuItems = [
  { 
    id: 'profile', 
    label: 'الملف الشخصي', 
    icon: FaUser,
    gradient: 'from-blue-500 to-cyan-500',
    description: 'إدارة معلوماتك الشخصية'
  },
  { 
    id: 'security', 
    label: 'الأمان', 
    icon: FaShieldAlt,
    gradient: 'from-green-500 to-emerald-500',
    description: 'إعدادات الحماية'
  },
  { 
    id: 'membership', 
    label: 'العضوية', 
    icon: FaGem,
    gradient: 'from-purple-500 to-pink-500',
    description: 'باقتك والفواتير'
  },
]

export default function LawyerSettingsTab() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const [passwordChangeStep, setPasswordChangeStep] = useState<'idle' | 'verify_current' | 'enter_otp'>('idle')
  
  const [lawyerData, setLawyerData] = useState<LawyerData>({
    full_name: '',
    email: '',
    phone: '',
    national_id: '',
    specialization: '',
    bar_association: '',
    registration_number: '',
    registration_year: 0,
    office_address: '',
    bio: '',
    membership_plan: '',
    membership_status: '',
    membership_end: '',
    membership_price: ''
  })

  const [resetPassword, setResetPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [otpData, setOtpData] = useState({
    email: '',
    otp: '',
    isSending: false,
    isVerifying: false
  })

  // ==================== دوال المساعدة ====================

  // دالة لتسجيل الخروج الإجباري
  const handleForcedLogout = async (reason: string = 'أسباب أمنية') => {
    try {
      console.log(`🚨 تسجيل الخروج الإجباري: ${reason}`)
      
      // مسح الـ cookies
      document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      document.cookie = "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      
      // مسح localStorage و sessionStorage
      localStorage.clear()
      sessionStorage.clear()
      
      // إظهار رسالة للمستخدم
      setMessage({ 
        type: 'error', 
        text: `تم تسجيل خروجك لأسباب أمنية - ${reason}` 
      })
      
      // توجيه إلى صفحة تسجيل الدخول بعد ثانيتين
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error) {
      console.error('Error during forced logout:', error)
      router.push('/login')
    }
  }

  const togglePasswordVisibility = (field: keyof typeof showPassword) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }))
  }

  // إلغاء عملية تغيير كلمة المرور
  const cancelPasswordChange = () => {
    setPasswordChangeStep('idle')
    setResetPassword({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setOtpData(prev => ({ ...prev, otp: '' }))
    setMessage({ type: '', text: '' })
  }

  // ==================== دوال الـ API ====================

  // جلب بيانات المحامي من API
  const fetchLawyerData = async () => {
    try {
      setIsLoadingData(true)
      
      console.log('🔄 جلب بيانات المحامي...')

      const response = await fetch('http://localhost:8000/api/v1/subscriptions/lawyer/settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      console.log('📡 Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Error response:', errorText)
        
        if (response.status === 401) {
          throw new Error('انتهت جلسة العمل. يرجى تسجيل الدخول مرة أخرى.')
        } else if (response.status === 404) {
          throw new Error('لم يتم العثور على بيانات المحامي')
        } else {
          throw new Error(`فشل في جلب البيانات: ${response.status}`)
        }
      }

      const data = await response.json()
      console.log('✅ Data received:', data)
      
      setLawyerData({
        full_name: data.profile?.full_name || 'غير محدد',
        email: data.profile?.email || 'غير محدد',
        phone: data.profile?.phone || 'غير محدد',
        national_id: '',
        specialization: data.profile?.specialization || 'غير محدد',
        bar_association: data.profile?.bar_association || 'غير محدد',
        registration_number: data.profile?.registration_number || 'غير محدد',
        registration_year: data.profile?.registration_year || 0,
        office_address: data.profile?.office_address || 'غير محدد',
        bio: data.profile?.bio || 'غير محدد',
        membership_plan: data.subscription?.plan_name || data.current_plan || 'لا يوجد اشتراك',
        membership_status: data.subscription?.status || 'غير نشط',
        membership_end: data.subscription?.end_date || '',
        membership_price: data.subscription?.price || '0'
      })

      setOtpData(prev => ({ ...prev, email: data.profile?.email || '' }))

    } catch (error: any) {
      console.error('🚨 Error fetching lawyer data:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'فشل في جلب بيانات المحامي' 
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  // تحديث الملف الشخصي
  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/v1/subscriptions/lawyer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          phone: lawyerData.phone,
          specialization: lawyerData.specialization,
          bar_association: lawyerData.bar_association,
          office_address: lawyerData.office_address,
          bio: lawyerData.bio
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'فشل في تحديث البيانات'
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.detail || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        
        throw new Error(errorMessage)
      }

      setMessage({ type: 'success', text: 'تم تحديث البيانات بنجاح' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'حدث خطأ أثناء حفظ البيانات' })
    } finally {
      setIsLoading(false)
    }
  }

  // دالة شاملة لتغيير كلمة المرور
  const handlePasswordChange = async () => {
    if (resetPassword.newPassword !== resetPassword.confirmPassword) {
      setMessage({ type: 'error', text: 'كلمات المرور الجديدة غير متطابقة' })
      return
    }

    if (resetPassword.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
      return
    }

    setIsLoading(true)
    try {
      console.log('🔐 بدء عملية تغيير كلمة المرور...')

      // الخطوة 1: التحقق من كلمة المرور الحالية
      const verifyResponse = await fetch('http://localhost:8000/api/v1/auth/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          current_password: resetPassword.currentPassword
        })
      })

      if (!verifyResponse.ok) {
        // كلمة المرور الحالية خاطئة - تسجيل خروج إجباري
        setMessage({ 
          type: 'error', 
          text: 'كلمة المرور الحالية غير صحيحة - تم تسجيل خروجك لأسباب أمنية' 
        })
        
        setTimeout(() => {
          handleForcedLogout('كلمة مرور خاطئة')
        }, 3000)
        return
      }

      // الخطوة 2: إرسال OTP بعد التحقق من كلمة المرور
      console.log('📧 إرسال OTP بعد التحقق الناجح...')
      const otpResponse = await fetch('http://localhost:8000/api/v1/auth/request-password-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: lawyerData.email
        })
      })

      if (!otpResponse.ok) {
        const errorText = await otpResponse.text()
        let errorMessage = 'فشل في إرسال رمز التحقق'
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.detail || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        
        throw new Error(errorMessage)
      }

      const otpResult = await otpResponse.json()
      
      // الانتقال لمرحلة إدخال OTP
      setPasswordChangeStep('enter_otp')
      
      // عرض OTP في الكونسول للاختبار
      if (otpResult.otp_debug) {
        console.log('🎯 OTP FOR TESTING:', otpResult.otp_debug)
        setMessage({ 
          type: 'success', 
          text: `تم التحقق من كلمة المرور بنجاح - رمز التحقق: ${otpResult.otp_debug}` 
        })
      } else {
        setMessage({ type: 'success', text: 'تم التحقق من كلمة المرور بنجاح - تم إرسال رمز التحقق' })
      }
      
    } catch (error: any) {
      console.error('🚨 Error in password change process:', error)
      setMessage({ type: 'error', text: error.message || 'فشل في عملية تغيير كلمة المرور' })
    } finally {
      setIsLoading(false)
    }
  }

  // دالة تأكيد تغيير كلمة المرور مع OTP
  const handleConfirmPasswordChangeWithOTP = async () => {
    if (!otpData.otp || otpData.otp.length !== 6) {
      setMessage({ type: 'error', text: 'الرمز يجب أن يكون 6 أرقام' })
      return
    }

    setIsLoading(true)
    try {
      console.log('🔐 تأكيد تغيير كلمة المرور مع OTP...')

      const response = await fetch('http://localhost:8000/api/v1/auth/change-password-with-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: lawyerData.email,
          otp: otpData.otp,
          new_password: resetPassword.newPassword,
          confirm_password: resetPassword.confirmPassword
        })
      })

      console.log('📡 Confirm Password Change Response:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'فشل في تغيير كلمة المرور'
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.detail || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        
        if (response.status === 400) {
          if (errorMessage.includes('غير صحيح') || errorMessage.includes('منتهي')) {
            setMessage({ type: 'error', text: 'رمز التحقق غير صحيح أو منتهي الصلاحية' })
            return
          }
        }
        
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      // إعادة تعيين كل الحالات بعد النجاح
      setPasswordChangeStep('idle')
      setResetPassword({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setOtpData(prev => ({ ...prev, otp: '' }))
      
      setMessage({ type: 'success', text: result.message || 'تم تغيير كلمة المرور بنجاح' })
      
    } catch (error: any) {
      console.error('🚨 Error confirming password change:', error)
      setMessage({ type: 'error', text: error.message || 'فشل في تأكيد تغيير كلمة المرور' })
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== useEffect ====================

  // جلب البيانات عند تحميل المكون
  useEffect(() => {
    fetchLawyerData()
  }, [])

  // تأثيرات عند التبديل بين الأقسام
  useEffect(() => {
    setMessage({ type: '', text: '' })
  }, [activeSection])

  // ==================== دوال التصميم ====================

  // قسم الملف الشخصي
  const renderProfileSection = () => (
    <div className="space-y-6 animate-fadeIn">
      {isLoadingData ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center">
            <FaSync className="animate-spin text-2xl text-blue-500 mr-3" />
            <span className="text-gray-600 dark:text-gray-400">جاري تحميل البيانات...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-blue-100 dark:border-gray-700 shadow-lg shadow-blue-500/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
                <FaUser className="text-2xl text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">المعلومات الأساسية</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">البيانات الشخصية والمهنية</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <FaUser className="text-blue-500" />
              <span>الاسم الكامل</span>
            </div>
            <input
              type="text"
              value={lawyerData.full_name}
              readOnly
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">غير قابل للتعديل</p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <FaEnvelope className="text-blue-500" />
              <span>البريد الإلكتروني</span>
            </div>
            <input
              type="email"
              value={lawyerData.email}
              readOnly
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <FaUser className="text-blue-500" />
              <span>التخصص</span>
            </div>
            <input
              type="text"
              value={lawyerData.specialization}
              onChange={(e) => setLawyerData({...lawyerData, specialization: e.target.value})}
              placeholder="أدخل تخصصك (يمكن إدخال أكثر من تخصص)"
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <p className="text-xs text-gray-500 mt-1">مثال: المحاماة المدنية، الجنائية، التجارية</p>
          </div>
                  <input
                    type="text"
                    value={lawyerData.specialization}
                    onChange={(e) => setLawyerData({...lawyerData, specialization: e.target.value})}
                    placeholder="أدخل تخصصك (يمكن إدخال أكثر من تخصص)"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  <p className="text-xs text-gray-500 mt-1">مثال: المحاماة المدنية، الجنائية، التجارية</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={lawyerData.phone}
                    onChange={(e) => setLawyerData({...lawyerData, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">النقابة</label>
                  <input
                    type="text"
                    value={lawyerData.bar_association}
                    onChange={(e) => setLawyerData({...lawyerData, bar_association: e.target.value})}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">رقم التسجيل</label>
                  <input
                    type="text"
                    value={lawyerData.registration_number}
                    readOnly
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">غير قابل للتعديل</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">العنوان</label>
              <input
                type="text"
                value={lawyerData.office_address}
                onChange={(e) => setLawyerData({...lawyerData, office_address: e.target.value})}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="عنوان المكتب"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">السيرة الذاتية</label>
              <textarea
                value={lawyerData.bio}
                onChange={(e) => setLawyerData({...lawyerData, bio: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="أدخل وصفاً مختصراً عن خبرتك وتخصصك..."
              />
            </div>

            <div className="flex justify-end mt-8">
              <button 
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-3 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
              >
                {isLoading ? (
                  <FaSync className="animate-spin" />
                ) : (
                  <FaSave />
                )}
                {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )

  // قسم الأمان
  const renderSecuritySection = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-green-100 dark:border-gray-700 shadow-lg shadow-green-500/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-100 dark:bg-green-900 rounded-xl">
            <FaLock className="text-2xl text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">تغيير كلمة المرور</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">نظام آمن مزدوج الطبقات</p>
          </div>
        </div>
        
        <div className="space-y-6">
          {passwordChangeStep === 'idle' && (
            <div className="text-center py-8">
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                  <FaShieldAlt />
                  <span className="font-semibold">نظام أمني مزدوج</span>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  التحقق من كلمة المرور الحالية + رمز تحقق عبر البريد الإلكتروني
                </p>
              </div>
              
              <button
                onClick={() => setPasswordChangeStep('verify_current')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center gap-3 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 mx-auto"
              >
                <FaKey />
                بدء عملية تغيير كلمة المرور
              </button>
            </div>
          )}

          {/* المرحلة 1: التحقق من كلمة المرور الحالية */}
          {passwordChangeStep === 'verify_current' && (
            <div className="space-y-4 max-w-md mx-auto">
              <div className="text-center mb-6">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">التحقق من الهوية</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">المرحلة 1: أدخل كلمة المرور الحالية</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  كلمة المرور الحالية
                </label>
                <div className="relative">
                  <input
                    type={showPassword.current ? 'text' : 'password'}
                    value={resetPassword.currentPassword}
                    onChange={(e) => setResetPassword({...resetPassword, currentPassword: e.target.value})}
                    placeholder="أدخل كلمة المرور الحالية"
                    className="w-full px-4 py-3 pr-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword.current ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={cancelPasswordChange}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handlePasswordChange}
                  disabled={isLoading || !resetPassword.currentPassword}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <FaSync className="animate-spin" />
                  ) : (
                    <FaCheck />
                  )}
                  {isLoading ? 'جاري التحقق...' : 'تحقق وإرسال الرمز'}
                </button>
              </div>
            </div>
          )}

          {/* المرحلة 2: إدخال OTP وكلمة المرور الجديدة */}
          {passwordChangeStep === 'enter_otp' && (
            <div className="space-y-4 max-w-md mx-auto">
              <div className="text-center mb-6">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">إكمال العملية</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">المرحلة 2: أدخل رمز التحقق وكلمة المرور الجديدة</p>
                <p className="text-green-600 text-xs mt-2">
                  ✅ تم التحقق من كلمة المرور الحالية بنجاح
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  رمز التحقق (6 أرقام)
                </label>
                <input
                  type="text"
                  value={otpData.otp}
                  onChange={(e) => setOtpData({...otpData, otp: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                  placeholder="123456"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-center text-lg font-mono"
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <input
                    type={showPassword.new ? 'text' : 'password'}
                    value={resetPassword.newPassword}
                    onChange={(e) => setResetPassword({...resetPassword, newPassword: e.target.value})}
                    placeholder="كلمة المرور الجديدة (6 أحرف على الأقل)"
                    className="w-full px-4 py-3 pr-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword.new ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  تأكيد كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? 'text' : 'password'}
                    value={resetPassword.confirmPassword}
                    onChange={(e) => setResetPassword({...resetPassword, confirmPassword: e.target.value})}
                    placeholder="أعد إدخال كلمة المرور الجديدة"
                    className="w-full px-4 py-3 pr-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setPasswordChangeStep('verify_current')}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                >
                  رجوع
                </button>
                <button 
                  onClick={handleConfirmPasswordChangeWithOTP}
                  disabled={isLoading || !otpData.otp || otpData.otp.length !== 6 || !resetPassword.newPassword || !resetPassword.confirmPassword}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <FaSync className="animate-spin" />
                  ) : (
                    <FaCheck />
                  )}
                  {isLoading ? 'جاري التغيير...' : 'تأكيد التغيير'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800 shadow-lg shadow-yellow-500/5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-xl">
            <FaExclamationTriangle className="text-2xl text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">تحذير أمني</h4>
            <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">
              لأسباب أمنية، سيتم تسجيل خروجك تلقائياً في حالة إدخال كلمة مرور خاطئة.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  // قسم العضوية
  const renderMembershipSection = () => (
    <div className="space-y-6 animate-fadeIn">
      {isLoadingData ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center">
            <FaSync className="animate-spin text-2xl text-purple-500 mr-3" />
            <span className="text-gray-600 dark:text-gray-400">جاري تحميل بيانات العضوية...</span>
          </div>
        </div>
      ) : (
        <>
          <div className={`bg-gradient-to-r rounded-2xl p-8 text-white shadow-2xl ${
            lawyerData.membership_status === 'active' 
              ? 'from-purple-600 via-pink-600 to-rose-600 shadow-purple-500/25'
              : 'from-gray-600 via-gray-500 to-gray-400 shadow-gray-500/25'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FaCrown className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">باقة {lawyerData.membership_plan}</h3>
                    <p className="text-white/80 mt-1">
                      الحالة: <span className={`font-semibold ${
                        lawyerData.membership_status === 'active' ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {lawyerData.membership_status === 'active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {lawyerData.membership_end && (
                    <p className="text-white/80">تنتهي في {lawyerData.membership_end}</p>
                  )}
                  {lawyerData.membership_status === 'active' && (
                    <div className="flex items-center gap-2 text-sm">
                      <FaCheck className="text-green-300" />
                      <span>تجديد تلقائي مفعل</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-center lg:text-right">
                <div className="text-3xl font-bold mb-2">{lawyerData.membership_price} ج.م</div>
                <p className="text-white/80 mb-4">شهرياً</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button className="bg-white text-purple-600 px-6 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-all duration-200 shadow-lg hover:shadow-xl">
                    تجديد الاشتراك
                  </button>
                  <button className="bg-transparent border border-white text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-all duration-200">
                    تغيير الخطة
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-orange-100 dark:border-gray-700 shadow-lg shadow-orange-500/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-xl">
                <FaReceipt className="text-2xl text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">فواتير الاشتراك</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">سجل الفواتير والمدفوعات</p>
              </div>
            </div>

            <div className="text-center py-8">
              <FaSync className="animate-spin text-2xl text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">جاري تحميل الفواتير...</p>
            </div>
          </div>
        </>
      )}
    </div>
  )

  // ==================== التصميم الرئيسي ====================

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile': return renderProfileSection()
      case 'security': return renderSecuritySection()
      case 'membership': return renderMembershipSection()
      default: return renderProfileSection()
    }
  }

  return (
    <div className="space-y-6">
      {message.text && (
        <div className={`p-4 rounded-xl border-l-4 ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-300' 
            : 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-300'
        } animate-fadeIn`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? (
              <FaCheck className="text-green-500" />
            ) : (
              <FaExclamationTriangle className="text-red-500" />
            )}
            {message.text}
          </div>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* القائمة الجانبية */}
        <div className="lg:w-80 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <FaUser className="text-white" />
            </div>
            الإعدادات
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">إدارة حسابك وإعدادات الأمان</p>
          
          <nav className="space-y-3">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full text-right p-4 rounded-xl transition-all duration-300 group ${
                  activeSection === item.id
                    ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg transform scale-105`
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md border border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${
                    activeSection === item.id 
                      ? 'bg-white/20' 
                      : `bg-gradient-to-r ${item.gradient}`
                  }`}>
                    <item.icon className={activeSection === item.id ? 'text-white' : 'text-white'} />
                  </div>
                  <div className="flex-1 mr-3">
                    <div className="font-semibold">{item.label}</div>
                    <div className={`text-sm ${
                      activeSection === item.id ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* المحتوى الرئيسي */}
        <div className="flex-1 min-w-0">
          {renderSectionContent()}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}