// src/components/auth/AuthSystem.tsx - النسخة الجديدة
'use client'

import { useState } from 'react'
import { apiService } from '../../lib/api'

interface AuthSystemProps {
  onLoginSuccess: (adminData: any) => void
  onBack: () => void
}

export default function AuthSystem({ onLoginSuccess, onBack }: AuthSystemProps) {
  const [form, setForm] = useState({
    country: '',
    institution_code: '', 
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await apiService.login(form)
      onLoginSuccess(result.admin_data)
    } catch (err: any) {
      setError(err.message || 'بيانات الدخول غير صحيحة')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-8 border-2 border-yellow-400/30 shadow-2xl max-w-md w-full">
          
          {/* زر العودة */}
          <button
            onClick={onBack}
            className="mb-6 text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-2"
          >
            ← العودة
          </button>

          {/* العنوان */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🏢</div>
            <h2 className="text-3xl font-bold text-yellow-400 mb-2">
              دخول أدمن المؤسسة
            </h2>
            <p className="text-white/80">
              أدخل بيانات مؤسستك للوصول إلى لوحة التحكم
            </p>
          </div>

          {/* نموذج الدخول */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-white/80 mb-2 text-right">البلد</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => setForm({...form, country: e.target.value})}
                className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-yellow-400 focus:outline-none"
                placeholder="مثال: SA, EG"
                required
              />
            </div>

            <div>
              <label className="block text-white/80 mb-2 text-right">كود المؤسسة</label>
              <input
                type="text"
                value={form.institution_code}
                onChange={(e) => setForm({...form, institution_code: e.target.value})}
                className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-yellow-400 focus:outline-none"
                placeholder="أدخل كود المؤسسة"
                required
              />
            </div>

            <div>
              <label className="block text-white/80 mb-2 text-right">كلمة المرور</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
                className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-yellow-400 focus:outline-none"
                placeholder="أدخل كلمة المرور"
                required
              />
            </div>

            {/* رسالة الخطأ */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            {/* زر الدخول */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-lg font-bold rounded-xl transition-all bg-linear-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-green-500/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري التحقق...
                </div>
              ) : (
                '🚀 دخول أدمن المؤسسة'
              )}
            </button>
          </form>

          {/* معلومات مساعدة */}
          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <h4 className="text-yellow-400 font-bold mb-2 text-sm">معلومات الدخول:</h4>
            <div className="text-white/60 text-xs space-y-1">
              <div>• البلد: كود الدولة (مثال: SA للمملكة العربية السعودية)</div>
              <div>• كود المؤسسة: الرمز الخاص بمؤسستك</div>
              <div>• كلمة المرور: المسجلة في النظام</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}