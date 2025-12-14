// src/components/evaluation/AIEvaluationPanel.tsx
'use client'

import { useState, useEffect } from 'react'
import { apiService } from '../../lib/api'

interface AIEvaluation {
  score: number
  feedback: string
  legal_accuracy: number
  completeness: number
  clarity: number
  suggestions: string[]
  analyzed_sections: string[]
  confidence: number
}

interface EvaluationRequest {
  student_text: string
  content_type: string
  legal_domain: string
  difficulty: string
  learning_objectives: string[]
}

export default function AIEvaluationPanel() {
  const [studentText, setStudentText] = useState('')
  const [evaluation, setEvaluation] = useState<AIEvaluation | null>(null)
  const [loading, setLoading] = useState(false)
  const [contentType, setContentType] = useState('case')
  const [legalDomain, setLegalDomain] = useState('جنائي')
  const [difficulty, setDifficulty] = useState('متوسط')

  const legalDomains = [
    'جنائي', 'مدني', 'تجاري', 'دستوري', 'إداري', 'دولي'
  ]

  const evaluateWithAI = async () => {
    if (!studentText.trim()) {
      alert('يرجى إدخال نص الإجابة')
      return
    }

    setLoading(true)
    setEvaluation(null)

    try {
      // محاكاة التقييم بالذكاء الاصطناعي - سيتم استبدالها بالخدمة الحقيقية
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const mockEvaluation: AIEvaluation = {
        score: 78,
        feedback: 'الإجابة تُظهر فهمًا جيدًا للمفاهيم الأساسية ولكن تحتاج إلى تعمق أكبر في التحليل القانوني',
        legal_accuracy: 82,
        completeness: 75,
        clarity: 70,
        confidence: 0.87,
        suggestions: [
          'إضافة المزيد من السوابق القضائية ذات الصلة',
          'توضيح العلاقة بين الوقائع والتشريعات',
          'تحليل أكثر تعمقاً للبعد الاجتماعي للقضية'
        ],
        analyzed_sections: [
          'التحليل القانوني',
          'ربط الوقائع بالأحكام',
          'الاستدلال المنطقي',
          'اللغة القانونية'
        ]
      }
      
      setEvaluation(mockEvaluation)
    } catch (error) {
      console.error('Error in AI evaluation:', error)
      alert('حدث خطأ في التقييم')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 80) return 'text-yellow-400'
    if (score >= 70) return 'text-orange-400'
    return 'text-red-400'
  }

  const getScoreLevel = (score: number) => {
    if (score >= 90) return 'ممتاز'
    if (score >= 80) return 'جيد جداً'
    if (score >= 70) return 'جيد'
    if (score >= 60) return 'مقبول'
    return 'ضعيف'
  }

  return (
    <div className="p-6 bg-slate-900 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-blue-400">🧠 التقييم بالذكاء الاصطناعي</h2>
          <div className="text-white/60 text-sm">
            نظام التقييم الذكي للمحتوى القانوني
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* إدخال النص */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">📝 إدخال الإجابة للتقييم</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-white/80 mb-2">نوع المحتوى</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-blue-400 focus:outline-none"
                  >
                    <option value="case">⚖️ قضية</option>
                    <option value="assignment">📝 واجب</option>
                    <option value="research">🔍 بحث</option>
                    <option value="analysis">📊 تحليل</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 mb-2">المجال القانوني</label>
                  <select
                    value={legalDomain}
                    onChange={(e) => setLegalDomain(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-blue-400 focus:outline-none"
                  >
                    {legalDomains.map(domain => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-white/80 mb-2">نص الإجابة</label>
                <textarea
                  value={studentText}
                  onChange={(e) => setStudentText(e.target.value)}
                  rows={12}
                  className="w-full p-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:outline-none resize-none"
                  placeholder="الصق نص الإجابة هنا للتقييم الآلي..."
                />
              </div>

              <button
                onClick={evaluateWithAI}
                disabled={loading || !studentText.trim()}
                className="w-full bg-blue-500 text-white py-4 rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    جاري التقييم بالذكاء الاصطناعي...
                  </div>
                ) : (
                  '🧠 بدء التقييم الذكي'
                )}
              </button>
            </div>
          </div>

          {/* نتائج التقييم */}
          <div className="lg:col-span-1">
            {evaluation ? (
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10 sticky top-6">
                <h3 className="text-xl font-bold text-white mb-6">📊 نتائج التقييم</h3>
                
                {/* النتيجة الرئيسية */}
                <div className="text-center mb-6">
                  <div className={`text-5xl font-bold ${getScoreColor(evaluation.score)} mb-2`}>
                    {evaluation.score}%
                  </div>
                  <div className="text-white/70 text-lg">{getScoreLevel(evaluation.score)}</div>
                  <div className="text-white/50 text-sm mt-1">
                    ثقة النظام: {(evaluation.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                {/* المقاييس الفرعية */}
                <div className="space-y-4 mb-6">
                  <div>
                    <div className="flex justify-between text-white/80 text-sm mb-1">
                      <span>الدقة القانونية</span>
                      <span>{evaluation.legal_accuracy}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${evaluation.legal_accuracy}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-white/80 text-sm mb-1">
                      <span>الاكتمال</span>
                      <span>{evaluation.completeness}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${evaluation.completeness}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-white/80 text-sm mb-1">
                      <span>الوضوح</span>
                      <span>{evaluation.clarity}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full transition-all"
                        style={{ width: `${evaluation.clarity}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* التغذية الراجعة */}
                <div className="mb-6">
                  <h4 className="text-green-400 font-bold mb-3">📋 التغذية الراجعة</h4>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {evaluation.feedback}
                  </p>
                </div>

                {/* الاقتراحات */}
                <div>
                  <h4 className="text-yellow-400 font-bold mb-3">💡 مقترحات للتحسين</h4>
                  <ul className="text-white/70 text-sm space-y-2">
                    {evaluation.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-yellow-400 mt-1">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* الأقسام التي تم تحليلها */}
                <div className="mt-6 pt-4 border-t border-white/10">
                  <h4 className="text-blue-400 font-bold mb-2 text-sm">🔍 الأقسام التي تم تحليلها</h4>
                  <div className="flex flex-wrap gap-2">
                    {evaluation.analyzed_sections.map((section, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs"
                      >
                        {section}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center h-full flex items-center justify-center">
                <div>
                  <div className="text-6xl mb-4">🤖</div>
                  <h3 className="text-xl text-white/70 mb-2">انتظار التقييم</h3>
                  <p className="text-white/50 text-sm">
                    أدخل النص واضغط على "بدء التقييم" لرؤية التحليل الذكي
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}