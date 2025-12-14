// src/components/magic/PortalEntrance.tsx
'use client'

import { motion } from 'framer-motion'

interface PortalEntranceProps {
  onAdminLogin: () => void
  onTeacherLogin: () => void
  onStudentLogin: () => void
  onRegisterInstitution: () => void
}

export default function PortalEntrance({ 
  onAdminLogin, 
  onTeacherLogin, 
  onStudentLogin,
  onRegisterInstitution 
}: PortalEntranceProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 backdrop-blur-2xl rounded-3xl p-8 border-2 border-yellow-400/30 shadow-2xl max-w-md w-full"
        >
          {/* العنوان الرئيسي */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              ⚖️
            </motion.div>
            <h1 className="text-4xl font-bold text-yellow-400 mb-2">
              منصة التعلم القانوني
            </h1>
            <p className="text-white/80 text-lg">بوابة الدخول إلى عالم المحاكاة القانونية</p>
          </motion.div>

          {/* أزرار الدخول */}
          <div className="space-y-4 mb-6">
            {/* دخول أدمن المؤسسة */}
            <motion.button
              onClick={onAdminLogin}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full p-4 bg-linear-to-r from-yellow-500 to-orange-500 text-white rounded-xl shadow-lg hover:shadow-yellow-500/50 transition-all text-right"
            >
              <div className="flex items-center justify-between">
                <div className="text-2xl">🚀</div>
                <div>
                  <div className="font-bold text-lg">دخول أدمن المؤسسة</div>
                  <div className="text-white/80 text-sm">إدارة المدرسين والطلاب والمجموعات</div>
                </div>
              </div>
            </motion.button>

            {/* دخول المدرس */}
            <motion.button
              onClick={onTeacherLogin}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full p-4 bg-linear-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-blue-500/50 transition-all text-right"
            >
              <div className="flex items-center justify-between">
                <div className="text-2xl">👨‍🏫</div>
                <div>
                  <div className="font-bold text-lg">تسجيل دخول المدرس</div>
                  <div className="text-white/80 text-sm">الوصول إلى لوحة التحكم</div>
                </div>
              </div>
            </motion.button>

            {/* دخول الطالب */}
            <motion.button
              onClick={onStudentLogin}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full p-4 bg-linear-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-lg hover:shadow-green-500/50 transition-all text-right"
            >
              <div className="flex items-center justify-between">
                <div className="text-2xl">🎓</div>
                <div>
                  <div className="font-bold text-lg">تسجيل دخول الطالب</div>
                  <div className="text-white/80 text-sm">الوصول إلى المحكمة الافتراضية</div>
                </div>
              </div>
            </motion.button>
          </div>

          {/* زر تسجيل المؤسسة */}
          <motion.button
            onClick={onRegisterInstitution}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full p-4 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/15 transition-all text-right"
          >
            <div className="flex items-center justify-between">
              <div className="text-2xl">🏢</div>
              <div>
                <div className="font-bold text-lg">تسجيل مؤسسة تعليمية</div>
                <div className="text-white/80 text-sm">انضم كشريك تعليمي</div>
              </div>
            </div>
          </motion.button>

          {/* معلومات إضافية */}
          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <h4 className="text-yellow-400 font-bold mb-2 text-sm">عن المنصة:</h4>
            <ul className="text-white/60 text-xs text-right space-y-1">
              <li>• محاكاة قانونية واقعية</li>
              <li>• إدارة كاملة للقضايا والطلاب</li>
              <li>• تقارير أداء مفصلة</li>
              <li>• بيئة تعلم تفاعلية</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  )
}