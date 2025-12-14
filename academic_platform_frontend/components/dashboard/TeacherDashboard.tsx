// src/components/dashboard/TeacherDashboard.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { CourtCase, CaseRole } from '@/types/court'
import StudentManagement from './StudentManagement'
import ContentList from '../../components/content/ContentList'
import AssignmentReviewPanel from '../../components/evaluation/AssignmentReviewPanel'
import AIEvaluationPanel from '../../components/evaluation/AIEvaluationPanel'
import ReportsGenerator from '../../components/evaluation/ReportsGenerator'
import RoleAssignment from '../../components/simulation/RoleAssignment'
import SimulationChat from '../../components/simulation/SimulationChat'

interface TeacherDashboardProps {
  onBack: () => void
  teacherName: string
  institution: string
  onEnterCourtroom: () => void
}

export default function TeacherDashboard({ 
  onBack, 
  teacherName, 
  institution,
  onEnterCourtroom 
}: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    'cases' | 'create' | 'students' | 'analytics' | 
    'content' | 'evaluation' | 'ai-evaluation' | 'reports' | 
    'role-assignment' | 'simulation-chat'
  >('cases')
  const [cases, setCases] = useState<CourtCase[]>([])
  const [selectedCase, setSelectedCase] = useState<CourtCase | null>(null)

  // نموذج إنشاء قضية جديد
  const [newCase, setNewCase] = useState<Partial<CourtCase>>({
    title: '',
    description: '',
    type: 'مدنية',
    difficulty: 'مبتدئ',
    duration: 45,
    estimatedParticipants: 4,
    caseFiles: [],
    roles: [
      { id: '1', name: 'القاضي', type: 'قاضي', description: 'إدارة الجلسة واتخاذ القرارات', required: true },
      { id: '2', name: 'محامي الدفاع', type: 'محامي_دفاع', description: 'الدفاع عن المتهم', required: true },
      { id: '3', name: 'النائب العام', type: 'نائب_عام', description: 'إثبات التهمة', required: true },
      { id: '4', name: 'كاتب الجلسة', type: 'كاتب_جلسة', description: 'توثيق وقائع الجلسة', required: false }
    ]
  })

  const createNewCase = () => {
    const caseData: CourtCase = {
      id: Date.now().toString(),
      ...newCase,
      createdBy: teacherName,
      institution: institution,
      createdAt: new Date(),
      status: 'مسودة'
    } as CourtCase
    
    setCases([...cases, caseData])
    setActiveTab('cases')
    setNewCase({
      title: '',
      description: '',
      type: 'مدنية',
      difficulty: 'مبتدئ',
      duration: 45,
      estimatedParticipants: 4,
      caseFiles: [],
      roles: [
        { id: '1', name: 'القاضي', type: 'قاضي', description: 'إدارة الجلسة واتخاذ القرارات', required: true },
        { id: '2', name: 'محامي الدفاع', type: 'محامي_دفاع', description: 'الدفاع عن المتهم', required: true },
        { id: '3', name: 'النائب العام', type: 'نائب_عام', description: 'إثبات التهمة', required: true },
        { id: '4', name: 'كاتب الجلسة', type: 'كاتب_جلسة', description: 'توثيق وقائع الجلسة', required: false }
      ]
    })
  }

  const addRole = () => {
    setNewCase(prev => ({
      ...prev,
      roles: [...(prev.roles || []), {
        id: Date.now().toString(),
        name: 'دور جديد',
        type: 'شاهد',
        description: 'وصف الدور',
        required: false
      }]
    }))
  }

  const handleStartSimulation = (courtCase: CourtCase) => {
    console.log('بدء محاكاة القضية:', courtCase)
    onEnterCourtroom()
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* شريط التحكم */}
      <div className="fixed top-0 left-0 right-0 bg-slate-800/90 backdrop-blur-lg z-50 p-4 border-b border-blue-400/30">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
            >
              ← العودة
            </button>
            <div className="h-6 w-px bg-white/20"></div>
            <div className="text-white">
              <span className="text-blue-400">المدرس:</span> {teacherName}
            </div>
            <div className="text-white">
              <span className="text-blue-400">المؤسسة:</span> {institution}
            </div>
          </div>
          
          <div className="flex gap-2">
            {/* زر دخول المحكمة */}
            <button
              onClick={onEnterCourtroom}
              className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors border border-green-500/30"
            >
              🏛️ دخول المحكمة
            </button>

            {/* التبويبات الأساسية */}
            {(['cases', 'create', 'students', 'analytics'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {tab === 'cases' && '📋 قضاياي'}
                {tab === 'create' && '➕ إنشاء قضية'}
                {tab === 'students' && '👥 الطلاب'}
                {tab === 'analytics' && '📊 إحصائيات'}
              </button>
            ))}

            {/* التبويبات الجديدة */}
            {(['content', 'evaluation', 'ai-evaluation', 'reports', 'role-assignment', 'simulation-chat'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {tab === 'content' && '📚 المحتوى'}
                {tab === 'evaluation' && '📝 التقييم'}
                {tab === 'ai-evaluation' && '🧠 التقييم الذكي'}
                {tab === 'reports' && '📊 التقارير'}
                {tab === 'role-assignment' && '🎭 تعيين الأدوار'}
                {tab === 'simulation-chat' && '💬 المحادثة'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="pt-20 p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'cases' && (
            <motion.div
              key="cases-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-blue-400">📋 قضاياي</h2>
                <button
                  onClick={() => setActiveTab('create')}
                  className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors"
                >
                  ➕ إنشاء قضية جديدة
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cases.map(courtCase => (
                  <motion.div
                    key={courtCase.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-blue-400/30 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-white font-bold text-lg">{courtCase.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        courtCase.status === 'نشط' ? 'bg-green-500/20 text-green-400' :
                        courtCase.status === 'مسودة' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {courtCase.status}
                      </span>
                    </div>
                    
                    <p className="text-white/70 text-sm mb-4">{courtCase.description}</p>
                    
                    <div className="flex justify-between items-center text-white/60 text-sm mb-4">
                      <span>⏱️ {courtCase.duration} دقيقة</span>
                      <span>👥 {courtCase.estimatedParticipants} مشارك</span>
                    </div>

                    <div className="flex gap-2 mb-4">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        {courtCase.type}
                      </span>
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                        {courtCase.difficulty}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 bg-blue-500/20 text-blue-400 py-2 rounded-lg hover:bg-blue-500/30 transition-colors">
                        ✏️ تعديل
                      </button>
                      <button 
                        onClick={() => handleStartSimulation(courtCase)}
                        className="flex-1 bg-green-500/20 text-green-400 py-2 rounded-lg hover:bg-green-500/30 transition-colors"
                      >
                        🚀 بدء المحاكاة
                      </button>
                    </div>
                  </motion.div>
                ))}

                {cases.length === 0 && (
                  <div className="col-span-3 text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-2xl text-white/70 mb-2">لا توجد قضايا بعد</h3>
                    <p className="text-white/50 mb-6">ابدأ بإنشاء قضيتك الأولى</p>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="bg-blue-500 text-white px-8 py-3 rounded-xl hover:bg-blue-600 transition-colors"
                    >
                      ➕ إنشاء أول قضية
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'create' && (
            <motion.div
              key="create-tab"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-3xl font-bold text-blue-400 mb-8">➕ إنشاء قضية جديدة</h2>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-white/80 mb-2">عنوان القضية</label>
                    <input
                      type="text"
                      value={newCase.title}
                      onChange={(e) => setNewCase({...newCase, title: e.target.value})}
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                      placeholder="مثال: قضية تعويض عن ضرر مادي"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 mb-2">نوع القضية</label>
                    <select
                      value={newCase.type}
                      onChange={(e) => setNewCase({...newCase, type: e.target.value as any})}
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white focus:border-blue-400 focus:outline-none"
                    >
                      <option className="bg-slate-800 text-white" value="مدنية">مدنية</option>
                      <option className="bg-slate-800 text-white" value="جنائية">جنائية</option>
                      <option className="bg-slate-800 text-white" value="تجارية">تجارية</option>
                      <option className="bg-slate-800 text-white" value="دستورية">دستورية</option>
                      <option className="bg-slate-800 text-white" value="إدارية">إدارية</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/80 mb-2">مستوى الصعوبة</label>
                    <select
                      value={newCase.difficulty}
                      onChange={(e) => setNewCase({...newCase, difficulty: e.target.value as any})}
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white focus:border-blue-400 focus:outline-none"
                    >
                      <option className="bg-slate-800 text-white" value="مبتدئ">مبتدئ</option>
                      <option className="bg-slate-800 text-white" value="متوسط">متوسط</option>
                      <option className="bg-slate-800 text-white" value="متقدم">متقدم</option>
                      <option className="bg-slate-800 text-white" value="محترف">محترف</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/80 mb-2">المدة (دقائق)</label>
                    <input
                      type="number"
                      value={newCase.duration}
                      onChange={(e) => setNewCase({...newCase, duration: parseInt(e.target.value)})}
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                      placeholder="45"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-white/80 mb-2">وصف القضية</label>
                  <textarea
                    value={newCase.description}
                    onChange={(e) => setNewCase({...newCase, description: e.target.value})}
                    rows={4}
                    className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                    placeholder="وصف مفصل للقضية والخلفية القانونية..."
                  />
                </div>

                {/* إدارة الأدوار */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-blue-400">🎭 أدوار المحاكاة</h3>
                    <button
                      onClick={addRole}
                      className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors"
                    >
                      ➕ إضافة دور
                    </button>
                  </div>

                  <div className="space-y-3">
                    {newCase.roles?.map((role, index) => (
                      <div key={role.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            value={role.name}
                            onChange={(e) => {
                              const updatedRoles = [...(newCase.roles || [])]
                              updatedRoles[index] = {...role, name: e.target.value}
                              setNewCase({...newCase, roles: updatedRoles})
                            }}
                            className="p-2 rounded bg-white/10 border border-white/20 text-white"
                            placeholder="اسم الدور"
                          />
                          <select
                            value={role.type}
                            onChange={(e) => {
                              const updatedRoles = [...(newCase.roles || [])]
                              updatedRoles[index] = {...role, type: e.target.value as any}
                              setNewCase({...newCase, roles: updatedRoles})
                            }}
                            className="p-2 rounded bg-white/10 border border-white/20 text-white"
                          >
                            <option className="bg-slate-800 text-white" value="قاضي">قاضي</option>
                            <option className="bg-slate-800 text-white" value="محامي_دفاع">محامي دفاع</option>
                            <option className="bg-slate-800 text-white" value="نائب_عام">نائب عام</option>
                            <option className="bg-slate-800 text-white" value="كاتب_جلسة">كاتب جلسة</option>
                            <option className="bg-slate-800 text-white" value="شاهد">شاهد</option>
                            <option className="bg-slate-800 text-white" value="خبير">خبير</option>
                          </select>
                        </div>
                        <button
                          onClick={() => {
                            const updatedRoles = newCase.roles?.filter((_, i) => i !== index)
                            setNewCase({...newCase, roles: updatedRoles})
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveTab('cases')}
                    className="flex-1 bg-white/10 text-white py-3 rounded-xl hover:bg-white/15 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={createNewCase}
                    disabled={!newCase.title || !newCase.description}
                    className="flex-1 bg-blue-500 text-white py-3 rounded-xl hover:bg-blue-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    💾 حفظ القضية
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'students' && (
            <motion.div
              key="students-tab"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <StudentManagement onBack={() => setActiveTab('cases')} />
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics-tab"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <h2 className="text-3xl font-bold text-blue-400 mb-8">📊 إحصائيات الأداء</h2>
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <p className="text-white/70 text-center py-8">سيتم دمج هذه الواجهة مع نظام التقارير والتحليلات</p>
              </div>
            </motion.div>
          )}

          {/* التبويبات الجديدة */}
          {activeTab === 'content' && (
            <motion.div
              key="content-tab"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <ContentList />
            </motion.div>
          )}

          {activeTab === 'evaluation' && (
            <motion.div
              key="evaluation-tab"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <AssignmentReviewPanel />
            </motion.div>
          )}

          {activeTab === 'ai-evaluation' && (
            <motion.div
              key="ai-evaluation-tab"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <AIEvaluationPanel />
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div
              key="reports-tab"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <ReportsGenerator />
            </motion.div>
          )}

          {activeTab === 'role-assignment' && (
            <motion.div
              key="role-assignment-tab"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <RoleAssignment />
            </motion.div>
          )}

          {activeTab === 'simulation-chat' && (
            <motion.div
              key="simulation-chat-tab"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <SimulationChat />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}