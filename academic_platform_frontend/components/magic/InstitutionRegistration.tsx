// src/components/magic/InstitutionRegistration.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface InstitutionRegistrationProps {
  onBack: () => void
  onSuccess: (institutionData: any) => void
}

export default function InstitutionRegistration({ onBack, onSuccess }: InstitutionRegistrationProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'university',
    country: '',
    adminName: '',
    email: '',
    phone: '',
    studentsCount: '',
    teachersCount: ''
  })

  const [currentStep, setCurrentStep] = useState(1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('بيانات المؤسسة:', formData)
    onSuccess(formData)
  }

  const institutionTypes = [
    { value: 'university', label: '🏛️ جامعة', desc: 'كليات الحقوق في الجامعات' },
    { value: 'institute', label: '⚖️ معهد قضائي', desc: 'معاهد التدريب القضائي' },
    { value: 'bar', label: '📜 نقابة محامين', desc: 'نقابات المحامين' },
    { value: 'center', label: '🎓 مركز تدريب', desc: 'مراكز التدريب القانوني' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="relative z-20 flex items-center justify-center min-h-screen p-4"
    >
      <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-8 border-2 border-yellow-400/30 shadow-2xl max-w-2xl w-full mx-4">
        {/* رأس الاستمارة */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-5xl mb-4"
          >
            🏢
          </motion.div>
          <h2 className="text-3xl font-bold text-yellow-400 mb-2">
            تسجيل مؤسسة تعليمية جديدة
          </h2>
          <p className="text-white/80">
            انضم إلى منصة المحاكاة القانونية الرائدة
          </p>
        </div>

        {/* شريط التقدم */}
        <div className="flex justify-between mb-8 relative">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex flex-col items-center z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                step <= currentStep 
                  ? 'bg-yellow-400 border-yellow-400 text-white' 
                  : 'border-white/30 text-white/50'
              }`}>
                {step}
              </div>
              <span className="text-white/70 text-sm mt-2">
                {step === 1 && 'المؤسسة'}
                {step === 2 && 'المسؤول'}
                {step === 3 && 'التأكيد'}
              </span>
            </div>
          ))}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-white/20 -z-10">
            <motion.div 
              className="h-full bg-yellow-400"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep - 1) / 2) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-bold text-white mb-4">معلومات المؤسسة</h3>
                
                <div>
                  <label className="block text-white/80 mb-2">اسم المؤسسة</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-yellow-400 focus:outline-none"
                    placeholder="أدخل اسم المؤسسة الرسمي"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">نوع المؤسسة</label>
                  <div className="grid grid-cols-2 gap-3">
                    {institutionTypes.map((type) => (
                      <motion.button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({...formData, type: type.value})}
                        className={`p-4 rounded-xl text-right transition-all ${
                          formData.type === type.value
                            ? 'bg-yellow-400/30 border-2 border-yellow-400'
                            : 'bg-white/10 border border-white/20 hover:bg-white/15'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="text-white font-semibold">{type.label}</div>
                        <div className="text-white/60 text-sm">{type.desc}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 mb-2">عدد الطلاب المتوقع</label>
                    <input
                      type="number"
                      value={formData.studentsCount}
                      onChange={(e) => setFormData({...formData, studentsCount: e.target.value})}
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-yellow-400 focus:outline-none"
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 mb-2">عدد المدرسين</label>
                    <input
                      type="number"
                      value={formData.teachersCount}
                      onChange={(e) => setFormData({...formData, teachersCount: e.target.value})}
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-yellow-400 focus:outline-none"
                      placeholder="25"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-bold text-white mb-4">معلومات المسؤول</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 mb-2">اسم المسؤول</label>
                    <input
                      type="text"
                      required
                      value={formData.adminName}
                      onChange={(e) => setFormData({...formData, adminName: e.target.value})}
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-yellow-400 focus:outline-none"
                      placeholder="الاسم الكامل"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 mb-2">البلد</label>
                    <input
                      type="text"
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-yellow-400 focus:outline-none"
                      placeholder="مصر"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 mb-2">البريد الإلكتروني</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-yellow-400 focus:outline-none"
                    placeholder="admin@institution.edu"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-yellow-400 focus:outline-none"
                    placeholder="+20..."
                  />
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="text-center space-y-6"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1 }}
                  className="text-6xl"
                >
                  ✅
                </motion.div>
                
                <h3 className="text-2xl font-bold text-yellow-400">جاهز للتسجيل!</h3>
                
                <div className="bg-white/5 rounded-xl p-6 text-right">
                  <div className="text-white font-bold text-lg mb-2">{formData.name}</div>
                  <div className="text-white/70 text-sm">
                    {institutionTypes.find(t => t.value === formData.type)?.label}
                  </div>
                  <div className="text-white/60 text-sm mt-4">
                    المسؤول: {formData.adminName}
                  </div>
                  <div className="text-white/60 text-sm">
                    البريد: {formData.email}
                  </div>
                </div>

                <p className="text-white/80">
                  سيتم مراجعة طلبك خلال 24 ساعة وسنقوم بالتواصل معك على البريد الإلكتروني
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* أزرار التنقل */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-3 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/15 transition-colors"
              >
                السابق
              </button>
            ) : (
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3 rounded-xl bg-slate-800/80 text-white border border-white/20 hover:bg-slate-700/80 transition-colors"
              >
                إلغاء
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-3 rounded-xl bg-yellow-400 text-white font-bold hover:bg-yellow-500 transition-colors"
              >
                التالي
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition-colors"
              >
                ✅ تأكيد التسجيل
              </button>
            )}
          </div>
        </form>
      </div>
    </motion.div>
  )
}