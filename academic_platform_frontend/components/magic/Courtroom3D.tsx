// src/components/magic/Courtroom3D.tsx - النسخة الكاملة
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

interface Courtroom3DProps {
  onBack: () => void
  selectedInstitution?: string
  userData?: any
}

interface CourtCase {
  id: string
  title: string
  type: 'مدنية' | 'جنائية' | 'تجارية' | 'دستورية'
  difficulty: 'مبتدئ' | 'متوسط' | 'متقدم'
  duration: string
  participants: number
  description: string
  status: 'نشط' | 'مكتمل' | 'متوقف'
  progress?: number
}

interface CaseRole {
  id: string
  name: string
  icon: string
  color: string
  description: string
  available: boolean
}

export default function Courtroom3D({ onBack, selectedInstitution, userData }: Courtroom3DProps) {
  const [activeView, setActiveView] = useState<'dashboard' | 'case-details' | 'simulation'>('dashboard')
  const [selectedCase, setSelectedCase] = useState<CourtCase | null>(null)
  const [selectedRole, setSelectedRole] = useState<CaseRole | null>(null)
  const [simulationStarted, setSimulationStarted] = useState(false)

  // بيانات القضايا الافتراضية
  const courtCases: CourtCase[] = [
    {
      id: '1',
      title: 'قضية تعويض عن ضرر مادي',
      type: 'مدنية',
      difficulty: 'مبتدئ',
      duration: '45 دقيقة',
      participants: 3,
      description: 'قضية تعويض عن أضرار ناتجة عن حادث مروري، تتطلب تحليل الأدلة وتقدير التعويض المناسب.',
      status: 'نشط',
      progress: 0
    },
    {
      id: '2',
      title: 'قضية سرقة مع وجود أدلة',
      type: 'جنائية',
      difficulty: 'متوسط',
      duration: '60 دقيقة',
      participants: 4,
      description: 'قضية جنائية تتضمن تحليل أدلة جنائية والدفاع عن المتهم مع وجود أدلة مادية.',
      status: 'نشط',
      progress: 0
    },
    {
      id: '3',
      title: 'قضية إفلاس شركة تجارية',
      type: 'تجارية',
      difficulty: 'متقدم',
      duration: '90 دقيقة',
      participants: 5,
      description: 'قضية تجارية معقدة تتضمن تحليل البيانات المالية وتوزيع أصول الشركة المفلسة.',
      status: 'نشط',
      progress: 0
    },
    {
      id: '4',
      title: 'قضية دستورية - حرية التعبير',
      type: 'دستورية',
      difficulty: 'متقدم',
      duration: '75 دقيقة',
      participants: 4,
      description: 'قضية دستورية تبحث في حدود حرية التعبير وحقوق المواطنين الدستورية.',
      status: 'نشط',
      progress: 0
    }
  ]

  // أدوار المحاكاة
  const caseRoles: CaseRole[] = [
    {
      id: 'judge',
      name: 'القاضي',
      icon: '⚖️',
      color: 'from-purple-600 to-blue-600',
      description: 'إدارة الجلسة واتخاذ القرارات النهائية',
      available: true
    },
    {
      id: 'defense',
      name: 'محامي الدفاع',
      icon: '🛡️',
      color: 'from-green-600 to-emerald-600',
      description: 'الدفاع عن المتهم وإثبات البراءة',
      available: true
    },
    {
      id: 'prosecution',
      name: 'النائب العام',
      icon: '🎯',
      color: 'from-red-600 to-orange-600',
      description: 'إثبات التهمة وعرض الأدلة',
      available: true
    },
    {
      id: 'clerk',
      name: 'كاتب الجلسة',
      icon: '📝',
      color: 'from-gray-600 to-slate-600',
      description: 'توثيق وقائع الجلسة والمستندات',
      available: true
    },
    {
      id: 'witness',
      name: 'شاهد',
      icon: '👤',
      color: 'from-yellow-600 to-amber-600',
      description: 'تقديم الشهادة والإدلاء بالمعلومات',
      available: false
    },
    {
      id: 'expert',
      name: 'خبير',
      icon: '🔍',
      color: 'from-indigo-600 to-purple-600',
      description: 'تقديم الرأي الفني والخبرة المتخصصة',
      available: false
    }
  ]

  const startSimulation = (courtCase: CourtCase, role: CaseRole) => {
    setSelectedCase(courtCase)
    setSelectedRole(role)
    setSimulationStarted(true)
    setActiveView('simulation')
  }

  const CaseCard = ({ courtCase }: { courtCase: CourtCase }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-yellow-400/30 transition-all cursor-pointer"
      onClick={() => {
        setSelectedCase(courtCase)
        setActiveView('case-details')
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-white font-bold text-lg">{courtCase.title}</h3>
        <span className={`px-2 py-1 rounded text-xs ${
          courtCase.difficulty === 'مبتدئ' ? 'bg-green-500/20 text-green-400' :
          courtCase.difficulty === 'متوسط' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {courtCase.difficulty}
        </span>
      </div>
      
      <p className="text-white/70 text-sm mb-4 line-clamp-2">{courtCase.description}</p>
      
      <div className="flex justify-between items-center text-white/60 text-sm mb-4">
        <span>⏱️ {courtCase.duration}</span>
        <span>👥 {courtCase.participants} مشارك</span>
      </div>

      <div className="flex justify-between items-center">
        <span className={`px-2 py-1 rounded text-xs ${
          courtCase.type === 'مدنية' ? 'bg-blue-500/20 text-blue-400' :
          courtCase.type === 'جنائية' ? 'bg-red-500/20 text-red-400' :
          courtCase.type === 'تجارية' ? 'bg-green-500/20 text-green-400' :
          'bg-purple-500/20 text-purple-400'
        }`}>
          {courtCase.type}
        </span>
        <button className="text-yellow-400 hover:text-yellow-300 text-sm">
          ابدأ المحاكاة →
        </button>
      </div>
    </motion.div>
  )

  const RoleCard = ({ role }: { role: CaseRole }) => (
    <motion.button
      whileHover={{ scale: role.available ? 1.05 : 1 }}
      whileTap={{ scale: role.available ? 0.95 : 1 }}
      onClick={() => role.available && selectedCase && startSimulation(selectedCase, role)}
      disabled={!role.available}
      className={`p-4 rounded-xl text-right transition-all ${
        role.available
          ? `bg-linear-to-r ${role.color} text-white shadow-lg hover:shadow-xl cursor-pointer`
          : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="text-2xl">{role.icon}</div>
        <div className="text-left">
          <div className="font-bold text-lg">{role.name}</div>
          <div className="text-white/80 text-sm">{role.description}</div>
          {!role.available && (
            <div className="text-white/60 text-xs mt-1">⏳ قريباً</div>
          )}
        </div>
      </div>
    </motion.button>
  )

  // واجهة المحاكاة النشطة
  if (simulationStarted && selectedCase && selectedRole) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* شريط التحكم أثناء المحاكاة */}
        <div className="fixed top-0 left-0 right-0 bg-slate-800/90 backdrop-blur-lg z-50 p-4 border-b border-yellow-400/30">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSimulationStarted(false)}
                className="text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-2"
              >
                ← إنهاء المحاكاة
              </button>
              <div className="h-6 w-px bg-white/20"></div>
              <div className="text-white">
                <span className="text-yellow-400">الدور:</span> {selectedRole.name}
              </div>
              <div className="text-white">
                <span className="text-yellow-400">القضية:</span> {selectedCase.title}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm border border-green-500/30">
                ⏱️ {selectedCase.duration}
              </button>
              <button className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm border border-blue-500/30">
                🎯 {selectedCase.difficulty}
              </button>
            </div>
          </div>
        </div>

        {/* محتوى المحاكاة */}
        <div className="pt-20 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* لوحة الأدوات الرئيسية */}
              <div className="lg:col-span-2">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h2 className="text-2xl font-bold text-yellow-400 mb-6">
                    {selectedRole.icon} {selectedRole.name} - {selectedCase.title}
                  </h2>
                  
                  {/* أدوات الدور */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button className="p-4 bg-white/10 rounded-xl text-white hover:bg-white/15 transition-colors border border-white/10">
                      📝 تقديم مرافعة
                    </button>
                    <button className="p-4 bg-white/10 rounded-xl text-white hover:bg-white/15 transition-colors border border-white/10">
                      📄 عرض المستندات
                    </button>
                    <button className="p-4 bg-white/10 rounded-xl text-white hover:bg-white/15 transition-colors border border-white/10">
                      🎤 استجواب الشهود
                    </button>
                    <button className="p-4 bg-white/10 rounded-xl text-white hover:bg-white/15 transition-colors border border-white/10">
                      ⚖️ تقديم طلبات
                    </button>
                  </div>

                  {/* منطقة المحادثة */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h3 className="text-yellow-400 font-bold mb-4">💬 محادثة الجلسة</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      <div className="flex justify-end">
                        <div className="bg-blue-500/20 text-white p-3 rounded-xl max-w-xs">
                          أطلب الإذن للتحدث، سيادة القاضي
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-white/10 text-white p-3 rounded-xl max-w-xs">
                          تفضل، محامي الدفاع
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="اكتب رسالتك..."
                        className="flex-1 p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-yellow-400 focus:outline-none"
                      />
                      <button className="bg-yellow-400 text-white px-4 py-3 rounded-xl hover:bg-yellow-500 transition-colors">
                        إرسال
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* اللوحة الجانبية */}
              <div className="space-y-6">
                {/* معلومات القضية */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-yellow-400 font-bold mb-4">📋 معلومات القضية</h3>
                  <div className="space-y-3 text-white/80 text-sm">
                    <div>النوع: {selectedCase.type}</div>
                    <div>المستوى: {selectedCase.difficulty}</div>
                    <div>المدة: {selectedCase.duration}</div>
                    <div>المشاركون: {selectedCase.participants}</div>
                  </div>
                </div>

                {/* المشاركون */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-yellow-400 font-bold mb-4">👥 المشاركون</h3>
                  <div className="space-y-3">
                    {caseRoles.filter(role => role.available).map(role => (
                      <div key={role.id} className="flex items-center justify-between p-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{role.icon}</span>
                          <span className="text-white text-sm">{role.name}</span>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${
                          role.id === selectedRole.id ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // واجهة تفاصيل القضية
  if (activeView === 'case-details' && selectedCase) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="p-8">
          {/* شريط التحكم */}
          <div className="flex justify-between items-center mb-8">
            <button 
              onClick={() => setActiveView('dashboard')}
              className="text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-2"
            >
              ← العودة للقائمة
            </button>
            <h1 className="text-3xl font-bold text-yellow-400">تفاصيل القضية</h1>
          </div>

          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-2xl p-8 border border-white/10"
            >
              {/* رأس القضية */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-yellow-400 mb-4">{selectedCase.title}</h2>
                <div className="flex justify-center gap-4 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    selectedCase.type === 'مدنية' ? 'bg-blue-500/20 text-blue-400' :
                    selectedCase.type === 'جنائية' ? 'bg-red-500/20 text-red-400' :
                    selectedCase.type === 'تجارية' ? 'bg-green-500/20 text-green-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {selectedCase.type}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    selectedCase.difficulty === 'مبتدئ' ? 'bg-green-500/20 text-green-400' :
                    selectedCase.difficulty === 'متوسط' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedCase.difficulty}
                  </span>
                </div>
              </div>

              {/* معلومات القضية */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <div className="text-2xl">⏱️</div>
                  <div className="text-yellow-400 font-bold">{selectedCase.duration}</div>
                  <div className="text-white/60 text-sm">المدة</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <div className="text-2xl">👥</div>
                  <div className="text-yellow-400 font-bold">{selectedCase.participants}</div>
                  <div className="text-white/60 text-sm">المشاركون</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <div className="text-2xl">⚖️</div>
                  <div className="text-yellow-400 font-bold">{selectedCase.type}</div>
                  <div className="text-white/60 text-sm">النوع</div>
                </div>
              </div>

              {/* وصف القضية */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-yellow-400 mb-4">📖 وصف القضية</h3>
                <p className="text-white/80 leading-relaxed">{selectedCase.description}</p>
              </div>

              {/* اختيار الدور */}
              <div>
                <h3 className="text-xl font-bold text-yellow-400 mb-6">🎭 اختر دورك في المحاكاة</h3>
                <div className="grid grid-cols-2 gap-4">
                  {caseRoles.filter(role => role.available).map(role => (
                    <RoleCard key={role.id} role={role} />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  // الواجهة الرئيسية - Dashboard
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="p-8">
        {/* شريط التحكم */}
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={onBack}
            className="text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-2"
          >
            ← العودة
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-yellow-400">🏛️ المحكمة الافتراضية</h1>
            <p className="text-white/70">مرحباً بك {userData?.name} 👋</p>
          </div>
          <div className="w-20"></div> {/* للمساواة */}
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
            <div className="text-yellow-400 text-2xl font-bold">{courtCases.length}</div>
            <div className="text-white/70">قضية متاحة</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
            <div className="text-green-400 text-2xl font-bold">3</div>
            <div className="text-white/70">قضايا مكتملة</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
            <div className="text-blue-400 text-2xl font-bold">85%</div>
            <div className="text-white/70">معدل الإنجاز</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
            <div className="text-purple-400 text-2xl font-bold">12</div>
            <div className="text-white/70">ساعة تدريب</div>
          </div>
        </div>

        {/* قائمة القضايا */}
        <div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">📋 القضايا المتاحة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courtCases.map((courtCase, index) => (
              <motion.div
                key={courtCase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CaseCard courtCase={courtCase} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}