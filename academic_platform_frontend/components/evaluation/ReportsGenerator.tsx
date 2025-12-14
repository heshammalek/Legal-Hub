// src/components/evaluation/ReportsGenerator.tsx
'use client'

import { useState, useEffect } from 'react'
import { apiService } from '../../lib/api'

interface ReportData {
  id: number
  title: string
  type: 'student' | 'group' | 'case' | 'institution'
  generated_at: string
  period: {
    start: string
    end: string
  }
  metrics: {
    total_students?: number
    total_cases?: number
    average_score?: number
    participation_rate?: number
    completion_rate?: number
  }
  details: any
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  type: string
  fields: string[]
}

export default function ReportsGenerator() {
  const [reports, setReports] = useState<ReportData[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('student-performance')
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedCases, setSelectedCases] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'student-performance',
      name: 'تقرير أداء الطلاب',
      description: 'تحليل شامل لأداء الطلاب في المحاكمات',
      type: 'student',
      fields: ['الدرجات', 'المشاركة', 'التقييمات', 'التقدم']
    },
    {
      id: 'case-analysis',
      name: 'تحليل القضايا',
      description: 'إحصائيات وتقييمات لأداء القضايا',
      type: 'case',
      fields: ['معدل الإنجاز', 'الصعوبة', 'التقييمات', 'الملاحظات']
    },
    {
      id: 'group-progress',
      name: 'تقرير تقدم المجموعة',
      description: 'متابعة تقدم المجموعات التعليمية',
      type: 'group',
      fields: ['المشاركة', 'الإنجاز', 'التعاون', 'التقييمات']
    },
    {
      id: 'institution-stats',
      name: 'إحصائيات المؤسسة',
      description: 'نظرة عامة على أداء المؤسسة',
      type: 'institution',
      fields: ['الطلاب', 'المدرسين', 'القضايا', 'التقييمات']
    }
  ]

  // بيانات تجريبية للطلاب
  const mockStudents = [
    { id: '1', name: 'محمد أحمد', group: 'المجموعة أ' },
    { id: '2', name: 'فاطمة علي', group: 'المجموعة أ' },
    { id: '3', name: 'خالد إبراهيم', group: 'المجموعة ب' },
    { id: '4', name: 'سارة محمد', group: 'المجموعة ب' }
  ]

  // بيانات تجريبية للقضايا
  const mockCases = [
    { id: '1', title: 'قضية سرقة مسلحة', type: 'جنائية' },
    { id: '2', title: 'قضية تعويض عن ضرر', type: 'مدنية' },
    { id: '3', title: 'قضية نزاع تجاري', type: 'تجارية' }
  ]

  useEffect(() => {
    loadPreviousReports()
  }, [])

  const loadPreviousReports = async () => {
    setLoading(true)
    try {
      // محاكاة تحميل التقارير السابقة
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockReports: ReportData[] = [
        {
          id: 1,
          title: 'تقرير أداء الطلاب - يناير 2024',
          type: 'student',
          generated_at: '2024-01-20T10:30:00Z',
          period: {
            start: '2024-01-01',
            end: '2024-01-19'
          },
          metrics: {
            total_students: 24,
            total_cases: 8,
            average_score: 78,
            participation_rate: 92,
            completion_rate: 85
          },
          details: {}
        },
        {
          id: 2,
          title: 'تحليل قضايا الربع الأول',
          type: 'case',
          generated_at: '2024-01-15T14:20:00Z',
          period: {
            start: '2024-01-01',
            end: '2024-01-15'
          },
          metrics: {
            total_cases: 12,
            average_score: 82,
            participation_rate: 88
          },
          details: {}
        }
      ]
      
      setReports(mockReports)
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    setGenerating(true)
    try {
      // محاكاة توليد التقرير
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const template = reportTemplates.find(t => t.id === selectedTemplate)
      const newReport: ReportData = {
        id: Date.now(),
        title: `${template?.name} - ${new Date().toLocaleDateString('ar-SA')}`,
        type: template?.type as any,
        generated_at: new Date().toISOString(),
        period: dateRange,
        metrics: {
          total_students: 24,
          total_cases: 8,
          average_score: Math.floor(Math.random() * 20) + 75,
          participation_rate: Math.floor(Math.random() * 20) + 80,
          completion_rate: Math.floor(Math.random() * 20) + 75
        },
        details: {
          students: selectedStudents,
          cases: selectedCases,
          template: template?.id
        }
      }
      
      setReports(prev => [newReport, ...prev])
      alert('✅ تم توليد التقرير بنجاح')
    } catch (error) {
      console.error('Error generating report:', error)
      alert('❌ حدث خطأ في توليد التقرير')
    } finally {
      setGenerating(false)
    }
  }

  const downloadReport = (report: ReportData, format: 'pdf' | 'excel') => {
    // محاكاة تحميل التقرير
    console.log(`Downloading report ${report.id} in ${format} format`)
    alert(`سيبدأ تحميل التقرير بصيغة ${format.toUpperCase()}`)
  }

  const getMetricColor = (value: number, type: 'score' | 'rate' = 'score') => {
    const threshold = type === 'score' ? 70 : 80
    return value >= threshold ? 'text-green-400' : value >= threshold - 15 ? 'text-yellow-400' : 'text-red-400'
  }

  return (
    <div className="p-6 bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-purple-400">📊 مولد التقارير</h2>
            <p className="text-white/60 mt-2">توليد تقارير تحليلية مفصلة عن الأداء</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* لوحة التحكم */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 sticky top-6">
              <h3 className="text-xl font-bold text-white mb-6">⚙️ إعدادات التقرير</h3>

              {/* نموذج التقرير */}
              <div className="mb-6">
                <label className="block text-white/80 mb-3">نموذج التقرير</label>
                <div className="space-y-2">
                  {reportTemplates.map(template => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedTemplate === template.id
                          ? 'bg-purple-500/20 border border-purple-500/30'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="font-semibold text-white text-sm">{template.name}</div>
                      <div className="text-white/60 text-xs mt-1">{template.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* نطاق التاريخ */}
              <div className="mb-6">
                <label className="block text-white/80 mb-3">الفترة الزمنية</label>
                <div className="space-y-3">
                  <div>
                    <label className="text-white/60 text-sm mb-1 block">من</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full p-2 rounded bg-white/10 border border-white/20 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 text-sm mb-1 block">إلى</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full p-2 rounded bg-white/10 border border-white/20 text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* الطلاب (للتقارير المتعلقة بالطلاب) */}
              {selectedTemplate.includes('student') && (
                <div className="mb-6">
                  <label className="block text-white/80 mb-3">الطلاب (اختياري)</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {mockStudents.map(student => (
                      <label key={student.id} className="flex items-center gap-2 text-white/70 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents(prev => [...prev, student.id])
                            } else {
                              setSelectedStudents(prev => prev.filter(id => id !== student.id))
                            }
                          }}
                          className="w-4 h-4"
                        />
                        {student.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* القضايا (للتقارير المتعلقة بالقضايا) */}
              {selectedTemplate.includes('case') && (
                <div className="mb-6">
                  <label className="block text-white/80 mb-3">القضايا (اختياري)</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {mockCases.map(caseItem => (
                      <label key={caseItem.id} className="flex items-center gap-2 text-white/70 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedCases.includes(caseItem.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCases(prev => [...prev, caseItem.id])
                            } else {
                              setSelectedCases(prev => prev.filter(id => id !== caseItem.id)
                              )
                            }
                          }}
                          className="w-4 h-4"
                        />
                        {caseItem.title}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* زر التوليد */}
              <button
                onClick={generateReport}
                disabled={generating}
                className="w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors font-bold"
              >
                {generating ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    جاري توليد التقرير...
                  </div>
                ) : (
                  '🚀 توليد التقرير'
                )}
              </button>
            </div>
          </div>

          {/* التقارير المنشأة */}
          <div className="lg:col-span-3">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-6">📄 التقارير المنشأة</h3>

              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white/60">جاري تحميل التقارير...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-xl text-white/70 mb-2">لا توجد تقارير بعد</h3>
                  <p className="text-white/50">استخدم لوحة التحكم لتوليد أول تقرير لك</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map(report => (
                    <div key={report.id} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-purple-400/30 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-white font-bold text-lg">{report.title}</h4>
                          <p className="text-white/60 text-sm">
                            {new Date(report.generated_at).toLocaleDateString('ar-SA')} • 
                            {report.type === 'student' && ' 👥 تقرير طلاب'}
                            {report.type === 'case' && ' ⚖️ تقرير قضايا'}
                            {report.type === 'group' && ' 🎯 تقرير مجموعة'}
                            {report.type === 'institution' && ' 🏛️ تقرير مؤسسة'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => downloadReport(report, 'pdf')}
                            className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30 transition-colors"
                          >
                            📥 PDF
                          </button>
                          <button
                            onClick={() => downloadReport(report, 'excel')}
                            className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-sm hover:bg-green-500/30 transition-colors"
                          >
                            📊 Excel
                          </button>
                        </div>
                      </div>

                      {/* المقاييس */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {report.metrics.total_students && (
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">{report.metrics.total_students}</div>
                            <div className="text-white/60 text-xs">الطلاب</div>
                          </div>
                        )}
                        {report.metrics.total_cases && (
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{report.metrics.total_cases}</div>
                            <div className="text-white/60 text-xs">القضايا</div>
                          </div>
                        )}
                        {report.metrics.average_score && (
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${getMetricColor(report.metrics.average_score)}`}>
                              {report.metrics.average_score}%
                            </div>
                            <div className="text-white/60 text-xs">متوسط الدرجات</div>
                          </div>
                        )}
                        {report.metrics.participation_rate && (
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${getMetricColor(report.metrics.participation_rate, 'rate')}`}>
                              {report.metrics.participation_rate}%
                            </div>
                            <div className="text-white/60 text-xs">معدل المشاركة</div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-white/50 text-xs">
                        <span>الفترة: {report.period.start} إلى {report.period.end}</span>
                        <span>تم الإنشاء: {new Date(report.generated_at).toLocaleString('ar-SA')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}