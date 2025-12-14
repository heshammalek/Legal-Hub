// src/components/dashboard/StudentManagement.tsx
'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface Student {
  id: string
  name: string
  email: string
  group: string
  completedCases: number
  averageScore: number
  status: 'نشط' | 'غير نشط'
}

interface StudentManagementProps {
  onBack: () => void
}

export default function StudentManagement({ onBack }: StudentManagementProps) {
  const [students, setStudents] = useState<Student[]>([
    {
      id: '1',
      name: 'أحمد محمود',
      email: 'ahmed@law.edu',
      group: 'المجموعة أ',
      completedCases: 8,
      averageScore: 85,
      status: 'نشط'
    },
    {
      id: '2', 
      name: 'فاطمة علي',
      email: 'fatima@law.edu',
      group: 'المجموعة ب',
      completedCases: 12,
      averageScore: 92,
      status: 'نشط'
    }
  ])

  const [selectedStudents, setSelectedStudents] = useState<string[]>([])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* الشريط العلوي */}
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={onBack}
            className="text-green-400 hover:text-green-300 transition-colors flex items-center gap-2"
          >
            ← العودة
          </button>
          <h1 className="text-3xl font-bold text-green-400">👥 إدارة الطلاب</h1>
          <button className="bg-green-500 text-white px-6 py-2 rounded-xl hover:bg-green-600 transition-colors">
            ➕ إضافة طالب
          </button>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
            <div className="text-green-400 text-2xl font-bold">{students.length}</div>
            <div className="text-white/70">إجمالي الطلاب</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
            <div className="text-blue-400 text-2xl font-bold">
              {students.filter(s => s.status === 'نشط').length}
            </div>
            <div className="text-white/70">طلاب نشطين</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
            <div className="text-yellow-400 text-2xl font-bold">
              {Math.round(students.reduce((acc, s) => acc + s.averageScore, 0) / students.length)}%
            </div>
            <div className="text-white/70">متوسط الأداء</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
            <div className="text-purple-400 text-2xl font-bold">
              {students.reduce((acc, s) => acc + s.completedCases, 0)}
            </div>
            <div className="text-white/70">قضية مكتملة</div>
          </div>
        </div>

        {/* جدول الطلاب */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-right pb-4 text-green-400 font-bold">
                    <input 
                      type="checkbox" 
                      className="mr-2"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents(students.map(s => s.id))
                        } else {
                          setSelectedStudents([])
                        }
                      }}
                    />
                    الطالب
                  </th>
                  <th className="text-right pb-4 text-green-400 font-bold">المجموعة</th>
                  <th className="text-right pb-4 text-green-400 font-bold">القضايا المكتملة</th>
                  <th className="text-right pb-4 text-green-400 font-bold">متوسط الأداء</th>
                  <th className="text-right pb-4 text-green-400 font-bold">الحالة</th>
                  <th className="text-right pb-4 text-green-400 font-bold">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <motion.tr 
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={selectedStudents.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents([...selectedStudents, student.id])
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== student.id))
                            }
                          }}
                        />
                        <div>
                          <div className="text-white font-semibold">{student.name}</div>
                          <div className="text-white/60 text-sm">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-white">{student.group}</td>
                    <td className="py-4">
                      <div className="text-white font-semibold">{student.completedCases}</div>
                    </td>
                    <td className="py-4">
                      <div className={`font-semibold ${
                        student.averageScore >= 90 ? 'text-green-400' :
                        student.averageScore >= 70 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {student.averageScore}%
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        student.status === 'نشط' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <button className="text-blue-400 hover:text-blue-300 transition-colors">
                          ✏️ تعديل
                        </button>
                        <button className="text-red-400 hover:text-red-300 transition-colors">
                          🗑️ حذف
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}