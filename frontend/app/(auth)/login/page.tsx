'use client'

import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, Scale, Crown } from 'lucide-react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { useRouter, useSearchParams } from 'next/navigation'

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون على الأقل 6 أحرف'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect')
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'

      console.log('🔐 Attempting login with:', { email: data.email })

      const response = await fetch(`${backendUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      const result = await response.json()
      console.log('📥 Login response:', { status: response.status, result })

      if (response.ok) {
        toast.success('تم تسجيل الدخول بنجاح')

        if (result.user_type) {
          localStorage.setItem('user_type', result.user_type)
        }

        const destination = 
          result.redirect_url || 
          redirectPath || 
          (result.user_type ? `/dashboards/${result.user_type}` : '/dashboards/user')

        console.log(`🎯 Redirecting to: ${destination}`)
        window.location.href = destination
      } else {
        console.error('❌ Login failed:', result)
        toast.error(result.detail || 'فشل تسجيل الدخول')
      }
    } catch (err) {
      console.error('💥 Login error:', err)
      toast.error('حدث خطأ أثناء الاتصال بالخادم')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center relative overflow-hidden">
      {/* تأثيرات الخلفية */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 backdrop-blur-sm">
          
          {/* الهيدر */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="relative">
                <div className="animate-float">
                  <Scale className="h-10 w-10 text-blue-400" />
                </div>
                <div className="absolute -inset-2 bg-blue-500 rounded-full opacity-30 blur-sm"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Legal Hub
              </span>
            </div>
            
            <div className="inline-flex items-center space-x-2 bg-gray-700/50 rounded-full px-4 py-2 border border-gray-600 mb-3">
              <Crown className="h-4 w-4 text-gold-400" />
              <span className="text-gold-200 text-xs font-semibold">مرحباً بعودتك</span>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
              تسجيل الدخول
            </h1>
            <p className="text-gray-400">استمر في رحلتك القانونية</p>
          </div>

          {/* رسالة إعادة التوجيه */}
          {redirectPath && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <p className="text-sm text-yellow-200 text-center">
                يرجى تسجيل الدخول للوصول إلى الصفحة المطلوبة
              </p>
            </div>
          )}

          {/* النموذج */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* البريد الإلكتروني */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="example@email.com"
                  className="w-full pr-10 pl-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-all duration-300"
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-2 flex items-center space-x-1">
                  <span>•</span>
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            {/* كلمة المرور */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full pr-10 pl-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-all duration-300"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors duration-300"
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-2 flex items-center space-x-1">
                  <span>•</span>
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>

            {/* زر التسجيل */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg border border-blue-500/30"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>جاري تسجيل الدخول...</span>
                </span>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>

          {/* رابط إنشاء حساب */}
          <p className="text-center text-gray-400 mt-6 pt-6 border-t border-gray-700">
            ليس لديك حساب؟{' '}
            <Link
              href="/signup"
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-300"
            >
              إنشاء حساب جديد
            </Link>
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}