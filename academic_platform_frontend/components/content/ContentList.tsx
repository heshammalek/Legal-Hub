// src/components/content/ContentList.tsx
'use client'

import { useState } from 'react'
import CreateContentModal from './CreateContentModal'

interface ContentItem {
  id: number
  title: string
  description: string
  contentType: string
  legalDomain: string
  difficulty: string
  duration: number
  status: string
  created_at: string
  studentCount?: number
  submissionCount?: number
}

export default function ContentList() {
  const [contents, setContents] = useState<ContentItem[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [filter, setFilter] = useState('all')

  // بيانات تجريبية
  const mockContents: ContentItem[] = [
    {
      id: 1,
      title: 'قضية سرقة مسلحة',
      description: 'محاكاة قضية سرقة مع أدلة متناقضة',
      contentType: 'case',
      legalDomain: 'جنائي',
      difficulty: 'متوسط',
      duration: 45,
      status: 'نشط',
      created_at: '2024-01-15',
      studentCount: 15,
      submissionCount: 12
    },
    {
      id: 2,
      title: 'بحث في المسؤولية المدنية',
      description: 'تحليل مسؤولية المستشفيات عن الأخطاء الطبية',
      contentType: 'research',
      legalDomain: 'مدني',
      difficulty: 'متقدم',
      duration: 120,
      status: 'نشط',
      created_at: '2024-01-14',
      studentCount: 8,
      submissionCount: 6
    }
  ]

  const contentTypes = {
    case: { label: '⚖️ قضية', color: 'purple' },
    task: { label: '📋 مهمة', color: 'blue' },
    assignment: { label: '📝 واجب', color: 'green' },
    research: { label: '🔍 بحث', color: 'orange' }
  }

  const getContentTypeInfo = (type: string) => {
    return contentTypes[type as keyof typeof contentTypes] || { label: type, color: 'gray' }
  }

  const handleContentCreated = (newContent: any) => {
    setContents(prev => [newContent, ...prev])
  }

  const filteredContents = filter === 'all' 
    ? contents 
    : contents.filter(content => content.contentType === filter)

  return (
    <div className="p-6">
      {/* الرأس */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-yellow-400">📚 المحتوى التعليمي</h2>
          <p className="text-white/60">إدارة القضايا، المهام، والأبحاث</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-yellow-500 text-white px-6 py-3 rounded-xl hover:bg-yellow-600 transition-colors font-bold"
        >
          ➕ إنشاء محتوى جديد
        </button>
      </div>

      {/* الفلاتر */}
      <div className="flex gap-2 mb-6">
        {['all', 'case', 'task', 'assignment', 'research'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === type
                ? 'bg-yellow-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/15'
            }`}
          >
            {type === 'all' ? 'الكل' : getContentTypeInfo(type).label}
          </button>
        ))}
      </div>

      {/* قائمة المحتوى */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockContents.map((content) => {
          const typeInfo = getContentTypeInfo(content.contentType)
          
          return (
            <div key={content.id} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-yellow-400/30 transition-all">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-white font-bold text-lg">{content.title}</h3>
                <span className={`px-2 py-1 rounded text-xs bg-${typeInfo.color}-500/20 text-${typeInfo.color}-400`}>
                  {typeInfo.label}
                </span>
              </div>
              
              <p className="text-white/70 text-sm mb-4 line-clamp-2">{content.description}</p>
              
              <div className="text-white/60 text-sm space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>المجال:</span>
                  <span>{content.legalDomain}</span>
                </div>
                <div className="flex justify-between">
                  <span>المستوى:</span>
                  <span>{content.difficulty}</span>
                </div>
                <div className="flex justify-between">
                  <span>المدة:</span>
                  <span>{content.duration} دقيقة</span>
                </div>
                {content.studentCount && (
                  <div className="flex justify-between">
                    <span>الطلاب:</span>
                    <span>{content.studentCount} طالب</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-blue-500/20 text-blue-400 py-2 rounded-lg text-sm hover:bg-blue-500/30 transition-colors">
                  تعديل
                </button>
                <button className="flex-1 bg-green-500/20 text-green-400 py-2 rounded-lg text-sm hover:bg-green-500/30 transition-colors">
                  {content.submissionCount ? `تصحيح (${content.submissionCount})` : 'عرض'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      <CreateContentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onContentCreated={handleContentCreated}
      />
    </div>
  )
}