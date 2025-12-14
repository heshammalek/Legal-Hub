// src/components/auth/TeacherAuth.tsx - نسخة مبسطة مؤقتة
'use client'

import { useState } from 'react'

interface TeacherAuthProps {
  onLoginSuccess: (teacherData: any) => void
  onBack: () => void
}

export default function TeacherAuth({ onLoginSuccess, onBack }: TeacherAuthProps) {
  const [form, setForm] = useState({
    email: '',
    institution_code: '',
    password: '123456' // مؤقت
  })

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // مؤقتاً - بيانات تجريبية
    onLoginSuccess({
      name: 'د. أحمد محمد',
      email: form.email,
      institution_code: form.institution_code,
      institution_name: 'كلية الحقوق - جامعة الملك سعود',
      specialization: 'القانون الجنائي'
    })
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-8 border-2 border-blue-400/30 shadow-2xl max-w-md w-full">
        <button
          onClick={onBack}
          className="mb-6 text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
        >
          ← العودة
        </button>

        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👨‍🏫</div>
          <h2 className="text-3xl font-bold text-blue-400 mb-2">دخول المدرس</h2>
          <p className="text-white/80">أدخل بياناتك للوصول إلى لوحة التحكم</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-white/80 mb-2 text-right">البريد الإلكتروني</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
              placeholder="أدخل البريد الإلكتروني"
              required
            />
          </div>

          <div>
            <label className="block text-white/80 mb-2 text-right">كود المؤسسة</label>
            <input
              type="text"
              value={form.institution_code}
              onChange={(e) => setForm({...form, institution_code: e.target.value})}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
              placeholder="أدخل كود المؤسسة"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors"
          >
            دخول المدرس
          </button>
        </form>

        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <h4 className="text-blue-400 font-bold mb-2 text-sm">بيانات تجريبية:</h4>
          <div className="text-white/60 text-xs space-y-1">
            <div>• البريد: ahmed@law001.edu</div>
            <div>• كود المؤسسة: LAW001</div>
          </div>
        </div>
      </div>
    </div>
  )
}