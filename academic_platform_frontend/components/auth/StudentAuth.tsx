// src/components/auth/StudentAuth.tsx - نسخة مبسطة مؤقتة
'use client'

import { useState } from 'react'

interface StudentAuthProps {
  onLoginSuccess: (studentData: any) => void
  onBack: () => void
}

export default function StudentAuth({ onLoginSuccess, onBack }: StudentAuthProps) {
  const [form, setForm] = useState({
    student_id: '',
    institution_code: '',
    password: '123456' // مؤقت
  })

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // مؤقتاً - بيانات تجريبية
    onLoginSuccess({
      name: 'محمد أحمد',
      student_id: form.student_id,
      institution_code: form.institution_code,
      institution_name: 'كلية الحقوق - جامعة الملك سعود'
    })
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-8 border-2 border-green-400/30 shadow-2xl max-w-md w-full">
        <button
          onClick={onBack}
          className="mb-6 text-green-400 hover:text-green-300 transition-colors flex items-center gap-2"
        >
          ← العودة
        </button>

        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎓</div>
          <h2 className="text-3xl font-bold text-green-400 mb-2">دخول الطالب</h2>
          <p className="text-white/80">أدخل بياناتك للوصول إلى المحكمة الافتراضية</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-white/80 mb-2 text-right">الرقم الجامعي</label>
            <input
              type="text"
              value={form.student_id}
              onChange={(e) => setForm({...form, student_id: e.target.value})}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-green-400 focus:outline-none"
              placeholder="أدخل الرقم الجامعي"
              required
            />
          </div>

          <div>
            <label className="block text-white/80 mb-2 text-right">كود المؤسسة</label>
            <input
              type="text"
              value={form.institution_code}
              onChange={(e) => setForm({...form, institution_code: e.target.value})}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-green-400 focus:outline-none"
              placeholder="أدخل كود المؤسسة"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors"
          >
            دخول الطالب
          </button>
        </form>

        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <h4 className="text-green-400 font-bold mb-2 text-sm">بيانات تجريبية:</h4>
          <div className="text-white/60 text-xs space-y-1">
            <div>• الرقم الجامعي: 2023001</div>
            <div>• كود المؤسسة: LAW001</div>
          </div>
        </div>
      </div>
    </div>
  )
}