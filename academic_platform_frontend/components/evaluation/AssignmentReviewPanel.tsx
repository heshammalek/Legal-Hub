// src/components/evaluation/AssignmentReviewPanel.tsx
'use client'

import { useState, useEffect } from 'react'
import { apiService } from '../../lib/api'

interface Assignment {
  id: number
  student_name: string
  submission_text: string
  submitted_at: string
  content_title: string
  status: string
}

interface AIEvaluation {
  score: number
  feedback: string
  legal_accuracy: number
  completeness: number
  suggestions: string[]
}

export default function AssignmentReviewPanel() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [aiEvaluation, setAiEvaluation] = useState<AIEvaluation | null>(null)
  const [teacherFeedback, setTeacherFeedback] = useState('')
  const [finalScore, setFinalScore] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAssignments()
  }, [])

  const loadAssignments = async () => {
    try {
      // سيتم استبدال هذا ببيانات حقيقية من API
      const mockAssignments: Assignment[] = [
        {
          id: 1,
          student_name: 'محمد أحمد',
          submission_text: 'إجابة الطالب على القضية الجنائية...',
          submitted_at: '2024-01-15',
          content_title: 'قضية سرقة مسلحة',
          status: 'submitted'
        },
        {
          id: 2,
          student_name: 'فاطمة علي',
          submission_text: 'تحليل المسؤولية المدنية...',
          submitted_at: '2024-01-14',
          content_title: 'بحث في المسؤولية المدنية',
          status: 'submitted'
        }
      ]
      setAssignments(mockAssignments)
    } catch (error) {
      console.error('Error loading assignments:', error)
    }
  }

  const evaluateWithAI = async (assignment: Assignment) => {
    setLoading(true)
    try {
      // محاكاة تقييم الذكاء الاصطناعي
      const mockEvaluation: AIEvaluation = {
        score: 85,
        feedback: 'الإجابة جيدة وتظهر فهمًا جيدًا للمفاهيم القانونية',
        legal_accuracy: 90,
        completeness: 80,
        suggestions: [
          'إضافة المزيد من السوابق القضائية',
          'توضيح العلاقة بين الوقائع والتشريعات'
        ]
      }
      setAiEvaluation(mockEvaluation)
      setFinalScore(mockEvaluation.score)
    } catch (error) {
      console.error('Error in AI evaluation:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitEvaluation = async () => {
    if (!selectedAssignment) return

    try {
      // إرسال التقييم النهائي
      console.log('Submitting evaluation:', {
        assignmentId: selectedAssignment.id,
        aiEvaluation,
        teacherFeedback,
        finalScore
      })
      alert('تم حفظ التقييم بنجاح')
    } catch (error) {
      console.error('Error submitting evaluation:', error)
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-green-400 mb-6">📝 مراجعة وتقييم المهام</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* قائمة المهام */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-green-400 font-bold mb-4">المهام المقدمة</h3>
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedAssignment?.id === assignment.id
                      ? 'bg-green-500/20 border border-green-500/30'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                  onClick={() => setSelectedAssignment(assignment)}
                >
                  <div className="font-semibold text-white">{assignment.student_name}</div>
                  <div className="text-white/60 text-sm">{assignment.content_title}</div>
                  <div className="text-white/40 text-xs">{assignment.submitted_at}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* منطقة التقييم */}
        <div className="lg:col-span-2">
          {selectedAssignment ? (
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedAssignment.content_title}</h3>
                  <p className="text-white/60">الطالب: {selectedAssignment.student_name}</p>
                </div>
                <button
                  onClick={() => evaluateWithAI(selectedAssignment)}
                  disabled={loading}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'جاري التقييم...' : '🧠 تقييم بالذكاء الاصطناعي'}
                </button>
              </div>

              {/* إجابة الطالب */}
              <div className="mb-6">
                <h4 className="text-green-400 font-bold mb-2">إجابة الطالب:</h4>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <p className="text-white/80 whitespace-pre-wrap">{selectedAssignment.submission_text}</p>
                </div>
              </div>

              {/* تقييم الذكاء الاصطناعي */}
              {aiEvaluation && (
                <div className="mb-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <h4 className="text-blue-400 font-bold mb-3">تقييم الذكاء الاصطناعي:</h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <span className="text-white/60">الدرجة: </span>
                      <span className="text-white font-bold">{aiEvaluation.score}%</span>
                    </div>
                    <div>
                      <span className="text-white/60">الدقة القانونية: </span>
                      <span className="text-white font-bold">{aiEvaluation.legal_accuracy}%</span>
                    </div>
                  </div>
                  <p className="text-white/80 mb-3">{aiEvaluation.feedback}</p>
                  <div>
                    <span className="text-yellow-400 font-bold text-sm">الاقتراحات:</span>
                    <ul className="text-white/70 text-sm list-disc list-inside mt-1">
                      {aiEvaluation.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* تقييم المدرس */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 mb-2">التقييم النهائي:</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={finalScore}
                    onChange={(e) => setFinalScore(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-center text-white font-bold mt-2">{finalScore}%</div>
                </div>

                <div>
                  <label className="block text-white/80 mb-2">ملاحظات المدرس:</label>
                  <textarea
                    value={teacherFeedback}
                    onChange={(e) => setTeacherFeedback(e.target.value)}
                    rows={4}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-green-400 focus:outline-none"
                    placeholder="أضف ملاحظاتك وتقييمك النهائي..."
                  />
                </div>

                <button
                  onClick={submitEvaluation}
                  className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-bold"
                >
                  ✅ حفظ التقييم النهائي
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl text-white/70 mb-2">اختر مهمة للمراجعة</h3>
              <p className="text-white/50">اختر أحد المهام المقدمة من القائمة لبدء التقييم</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}