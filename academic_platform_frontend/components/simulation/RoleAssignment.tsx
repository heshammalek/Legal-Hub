// src/components/simulation/RoleAssignment.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Student {
  id: string
  name: string
  email: string
  group: string
  performance: number
  preferred_roles: string[]
}

interface CaseRole {
  id: string
  name: string
  type: string
  description: string
  required: boolean
  difficulty: 'منخفض' | 'متوسط' | 'مرتفع'
  assigned_student?: string
}

interface SimulationCase {
  id: string
  title: string
  description: string
  type: string
  difficulty: string
  roles: CaseRole[]
  estimated_duration: number
}

export default function RoleAssignment() {
  const [cases, setCases] = useState<SimulationCase[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedCase, setSelectedCase] = useState<SimulationCase | null>(null)
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const [autoAssignLoading, setAutoAssignLoading] = useState(false)

  // بيانات تجريبية
  useEffect(() => {
    const mockCases: SimulationCase[] = [
      {
        id: '1',
        title: 'قضية سرقة مسلحة',
        description: 'محاكاة قضية سرقة مع أدلة متناقضة وشهود متعددين',
        type: 'جنائية',
        difficulty: 'متوسط',
        estimated_duration: 60,
        roles: [
          {
            id: 'role-1',
            name: 'القاضي',
            type: 'قاضي',
            description: 'إدارة الجلسة واتخاذ القرارات النهائية',
            required: true,
            difficulty: 'مرتفع'
          },
          {
            id: 'role-2',
            name: 'محامي الدفاع',
            type: 'محامي_دفاع',
            description: 'الدفاع عن المتهم وتقديم الأدلة',
            required: true,
            difficulty: 'مرتفع'
          },
          {
            id: 'role-3',
            name: 'النائب العام',
            type: 'نائب_عام',
            description: 'إثبات التهمة وتقديم الأدلة',
            required: true,
            difficulty: 'مرتفع'
          },
          {
            id: 'role-4',
            name: 'كاتب الجلسة',
            type: 'كاتب_جلسة',
            description: 'توثيق وقائع الجلسة والمحاضر',
            required: true,
            difficulty: 'منخفض'
          },
          {
            id: 'role-5',
            name: 'شاهد العيان',
            type: 'شاهد',
            description: 'تقديم الشهادة حول وقائع الحادث',
            required: false,
            difficulty: 'متوسط'
          },
          {
            id: 'role-6',
            name: 'خبير الطب الشرعي',
            type: 'خبير',
            description: 'تقديم التقرير الفني',
            required: false,
            difficulty: 'متوسط'
          }
        ]
      }
    ]

    const mockStudents: Student[] = [
      {
        id: 'student-1',
        name: 'محمد أحمد',
        email: 'mohamed@law.edu',
        group: 'المجموعة أ',
        performance: 85,
        preferred_roles: ['قاضي', 'نائب_عام']
      },
      {
        id: 'student-2',
        name: 'فاطمة علي',
        email: 'fatima@law.edu',
        group: 'المجموعة أ',
        performance: 92,
        preferred_roles: ['محامي_دفاع', 'قاضي']
      },
      {
        id: 'student-3',
        name: 'خالد إبراهيم',
        email: 'khaled@law.edu',
        group: 'المجموعة أ',
        performance: 78,
        preferred_roles: ['نائب_عام', 'خبير']
      },
      {
        id: 'student-4',
        name: 'سارة محمد',
        email: 'sara@law.edu',
        group: 'المجموعة أ',
        performance: 88,
        preferred_roles: ['كاتب_جلسة', 'شاهد']
      },
      {
        id: 'student-5',
        name: 'عمر عبدالله',
        email: 'omar@law.edu',
        group: 'المجموعة ب',
        performance: 81,
        preferred_roles: ['محامي_دفاع', 'نائب_عام']
      }
    ]

    setCases(mockCases)
    setStudents(mockStudents)
    setSelectedCase(mockCases[0])
  }, [])

  const assignRole = (roleId: string, studentId: string) => {
    setAssignments(prev => ({
      ...prev,
      [roleId]: studentId
    }))
  }

  const unassignRole = (roleId: string) => {
    setAssignments(prev => {
      const newAssignments = { ...prev }
      delete newAssignments[roleId]
      return newAssignments
    })
  }

  const autoAssignRoles = async () => {
    setAutoAssignLoading(true)
    try {
      // محاكاة التوزيع التلقائي الذكي
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newAssignments: Record<string, string> = {}
      const availableStudents = [...students]
      const requiredRoles = selectedCase?.roles.filter(role => role.required) || []

      // توزيع الأدوار المطلوبة أولاً بناءً على الأداء والتفضيلات
      requiredRoles.forEach(role => {
        if (availableStudents.length > 0) {
          // إيجاد أفضل طالب لهذا الدور
          const bestStudent = availableStudents.reduce((best, student) => {
            const bestScore = best.preferred_roles.includes(role.type) ? best.performance + 20 : best.performance
            const currentScore = student.preferred_roles.includes(role.type) ? student.performance + 20 : student.performance
            return currentScore > bestScore ? student : best
          })

          newAssignments[role.id] = bestStudent.id
          // إزالة الطالب من القائمة المتاحة
          const index = availableStudents.findIndex(s => s.id === bestStudent.id)
          availableStudents.splice(index, 1)
        }
      })

      setAssignments(newAssignments)
    } catch (error) {
      console.error('Error in auto assignment:', error)
    } finally {
      setAutoAssignLoading(false)
    }
  }

  const getAssignedStudent = (roleId: string) => {
    return students.find(student => student.id === assignments[roleId])
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'منخفض': return 'text-green-400'
      case 'متوسط': return 'text-yellow-400'
      case 'مرتفع': return 'text-red-400'
      default: return 'text-white/60'
    }
  }

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-400'
    if (performance >= 80) return 'text-yellow-400'
    if (performance >= 70) return 'text-orange-400'
    return 'text-red-400'
  }

  const isAssignmentComplete = selectedCase?.roles.every(role => 
    !role.required || assignments[role.id]
  )

  return (
    <div className="p-6 bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-green-400">🎭 تعيين الأدوار</h2>
            <p className="text-white/60 mt-2">توزيع أدوار المحاكاة على الطلاب</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={autoAssignRoles}
              disabled={autoAssignLoading || !selectedCase}
              className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {autoAssignLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  جاري التوزيع...
                </div>
              ) : (
                '🤖 توزيع تلقائي'
              )}
            </button>
            
            <button
              disabled={!isAssignmentComplete}
              className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 disabled:opacity-50 transition-colors font-bold"
            >
              ✅ تأكيد التعيين
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* قائمة القضايا */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">📋 القضايا المتاحة</h3>
              <div className="space-y-3">
                {cases.map(courtCase => (
                  <div
                    key={courtCase.id}
                    onClick={() => setSelectedCase(courtCase)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedCase?.id === courtCase.id
                        ? 'bg-green-500/20 border border-green-500/30'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <h4 className="font-semibold text-white">{courtCase.title}</h4>
                    <p className="text-white/60 text-sm mt-1">{courtCase.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        {courtCase.type}
                      </span>
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                        {courtCase.difficulty}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* معلومات القضية المحددة */}
            {selectedCase && (
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mt-6">
                <h3 className="text-xl font-bold text-white mb-4">ℹ️ معلومات القضية</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-white/60 text-sm">العنوان:</span>
                    <p className="text-white font-medium">{selectedCase.title}</p>
                  </div>
                  <div>
                    <span className="text-white/60 text-sm">الوصف:</span>
                    <p className="text-white/80 text-sm">{selectedCase.description}</p>
                  </div>
                  <div className="flex justify-between text-white/60 text-sm">
                    <span>⏱️ {selectedCase.estimated_duration} دقيقة</span>
                    <span>👥 {selectedCase.roles.length} أدوار</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* تعيين الأدوار */}
          <div className="lg:col-span-2">
            {selectedCase ? (
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">🎭 أدوار القضية: {selectedCase.title}</h3>
                  <div className="text-white/60 text-sm">
                    {Object.keys(assignments).length} / {selectedCase.roles.filter(r => r.required).length} مكتمل
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedCase.roles.map(role => {
                    const assignedStudent = getAssignedStudent(role.id)
                    
                    return (
                      <motion.div
                        key={role.id}
                        layout
                        className={`p-4 rounded-xl border transition-all ${
                          assignedStudent
                            ? 'bg-green-500/10 border-green-500/30'
                            : role.required
                            ? 'bg-white/5 border-white/10'
                            : 'bg-white/3 border-white/5'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-white text-lg">{role.name}</h4>
                            <p className="text-white/60 text-sm mt-1">{role.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(role.difficulty)} bg-white/10`}>
                              {role.difficulty}
                            </span>
                            {role.required && (
                              <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                                مطلوب
                              </span>
                            )}
                          </div>
                        </div>

                        {assignedStudent ? (
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-green-400 font-medium">{assignedStudent.name}</span>
                              <div className="flex items-center gap-2 text-white/60 text-xs mt-1">
                                <span>الأداء: </span>
                                <span className={getPerformanceColor(assignedStudent.performance)}>
                                  {assignedStudent.performance}%
                                </span>
                                <span>• {assignedStudent.group}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => unassignRole(role.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <select
                            value=""
                            onChange={(e) => e.target.value && assignRole(role.id, e.target.value)}
                            className="w-full p-2 rounded bg-white/10 border border-white/20 text-white text-sm focus:border-green-400 focus:outline-none"
                          >
                            <option value="">اختر طالب...</option>
                            {students.map(student => (
                              <option key={student.id} value={student.id}>
                                {student.name} ({student.performance}%) - {student.group}
                              </option>
                            ))}
                          </select>
                        )}
                      </motion.div>
                    )
                  })}
                </div>

                {/* ملخص التوزيع */}
                {Object.keys(assignments).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/30"
                  >
                    <h4 className="text-blue-400 font-bold mb-3">📋 ملخص التعيين</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedCase.roles
                        .filter(role => assignments[role.id])
                        .map(role => {
                          const student = getAssignedStudent(role.id)
                          return (
                            <div key={role.id} className="flex justify-between items-center text-sm">
                              <span className="text-white/80">{role.name}:</span>
                              <span className="text-green-400 font-medium">{student?.name}</span>
                            </div>
                          )
                        })}
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
                <div className="text-6xl mb-4">⚖️</div>
                <h3 className="text-xl text-white/70 mb-2">اختر قضية لبدء التعيين</h3>
                <p className="text-white/50">اختر قضية من القائمة لتعيين الأدوار على الطلاب</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}