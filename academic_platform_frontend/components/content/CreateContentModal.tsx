// src/components/content/CreateContentModal.tsx
'use client'

import { useState } from 'react'

interface CreateContentModalProps {
  isOpen: boolean
  onClose: () => void
  onContentCreated: (content: any) => void
}

type ContentType = 'case' | 'task' | 'assignment' | 'research'

export default function CreateContentModal({ isOpen, onClose, onContentCreated }: CreateContentModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contentType: 'case' as ContentType,
    legalDomain: 'جنائي',
    difficulty: 'متوسط',
    duration: 60,
    learningObjectives: [''],
    useAI: false,
    customPrompt: ''
  })
  const [loading, setLoading] = useState(false)

  const legalDomains = [
    { value: 'جنائي', label: '🔫 جنائي' },
    { value: 'تجاري', label: '💼 تجاري' },
    { value: 'مدني', label: '📝 مدني' },
    { value: 'دستوري', label: '⚖️ دستوري' },
    { value: 'إداري', label: '🏛️ إداري' },
    { value: 'دولي', label: '🌍 دولي' }
  ]

  const difficulties = [
    { value: 'مبتدئ', label: '🟢 مبتدئ' },
    { value: 'متوسط', label: '🟡 متوسط' },
    { value: 'متقدم', label: '🔴 متقدم' }
  ]

  const addLearningObjective = () => {
    setFormData(prev => ({
      ...prev,
      learningObjectives: [...prev.learningObjectives, '']
    }))
  }

  const updateLearningObjective = (index: number, value: string) => {
    const updated = [...formData.learningObjectives]
    updated[index] = value
    setFormData(prev => ({ ...prev, learningObjectives: updated }))
  }

  const removeLearningObjective = (index: number) => {
    setFormData(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter((_, i) => i !== index)
    }))
  }

  const generateWithAI = async () => {
    setLoading(true)
    try {
      // محاكاة توليد المحتوى بالذكاء الاصطناعي
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const generatedContent = {
        title: `قضية ${formData.legalDomain} - ${formData.difficulty}`,
        description: `تم إنشاء هذا المحتوى تلقائياً في مجال ${formData.legalDomain} للمستوى ${formData.difficulty}.`,
        aiGenerated: true
      }
      
      setFormData(prev => ({
        ...prev,
        title: generatedContent.title,
        description: generatedContent.description
      }))
    } catch (error) {
      console.error('Error generating content:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // محاكاة إنشاء المحتوى
      const newContent = {
        id: Date.now(),
        ...formData,
        created_at: new Date().toISOString(),
        status: 'نشط'
      }
      
      onContentCreated(newContent)
      onClose()
    } catch (error) {
      console.error('Error creating content:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-yellow-400">➕ إنشاء محتوى جديد</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* نوع المحتوى */}
          <div>
            <label className="block text-white/80 mb-2">نوع المحتوى</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'case', label: '⚖️ قضية', icon: '🏛️' },
                { value: 'task', label: '📋 مهمة', icon: '🎯' },
                { value: 'assignment', label: '📝 واجب', icon: '✍️' },
                { value: 'research', label: '🔍 بحث', icon: '📚' }
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, contentType: type.value as ContentType }))}
                  className={`p-3 rounded-lg text-center transition-all ${
                    formData.contentType === type.value
                      ? 'bg-yellow-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/15'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-sm font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* المجال القانوني والمستوى */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/80 mb-2">المجال القانوني</label>
              <select
                value={formData.legalDomain}
                onChange={(e) => setFormData(prev => ({ ...prev, legalDomain: e.target.value }))}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-yellow-400 focus:outline-none"
              >
                {legalDomains.map(domain => (
                  <option key={domain.value} value={domain.value}>{domain.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white/80 mb-2">مستوى الصعوبة</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-yellow-400 focus:outline-none"
              >
                {difficulties.map(diff => (
                  <option key={diff.value} value={diff.value}>{diff.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* العنوان والوصف */}
          <div>
            <label className="block text-white/80 mb-2">عنوان المحتوى</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-yellow-400 focus:outline-none"
              placeholder="أدخل عنوان المحتوى..."
              required
            />
          </div>

          <div>
            <label className="block text-white/80 mb-2">الوصف</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-yellow-400 focus:outline-none"
              placeholder="أدخل وصف المحتوى..."
              required
            />
          </div>

          {/* المدة الزمنية */}
          <div>
            <label className="block text-white/80 mb-2">
              المدة الزمنية المتوقعة: {formData.duration} دقيقة
            </label>
            <input
              type="range"
              min="15"
              max="180"
              step="15"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
              className="w-full"
            />
            <div className="flex justify-between text-white/60 text-sm mt-1">
              <span>15 د</span>
              <span>180 د</span>
            </div>
          </div>

          {/* الأهداف التعليمية */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-white/80">الأهداف التعليمية</label>
              <button
                type="button"
                onClick={addLearningObjective}
                className="text-yellow-400 hover:text-yellow-300 text-sm"
              >
                + إضافة هدف
              </button>
            </div>
            <div className="space-y-2">
              {formData.learningObjectives.map((objective, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={objective}
                    onChange={(e) => updateLearningObjective(index, e.target.value)}
                    className="flex-1 p-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-yellow-400 focus:outline-none"
                    placeholder={`الهدف التعليمي ${index + 1}...`}
                  />
                  {formData.learningObjectives.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLearningObjective(index)}
                      className="px-3 text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* الذكاء الاصطناعي */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.useAI}
                onChange={(e) => setFormData(prev => ({ ...prev, useAI: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-white/80">🤖 استخدام الذكاء الاصطناعي للمساعدة</span>
            </label>

            {formData.useAI && (
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={generateWithAI}
                  disabled={loading}
                  className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'جاري التوليد...' : '🧠 توليد المحتوى تلقائياً'}
                </button>

                <div>
                  <label className="block text-white/80 mb-2">تعليمات مخصصة للذكاء الاصطناعي (اختياري)</label>
                  <textarea
                    value={formData.customPrompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, customPrompt: e.target.value }))}
                    rows={2}
                    className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                    placeholder="أدخل تعليمات مخصصة لتوليد المحتوى..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* أزرار التنفيذ */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white/10 text-white rounded-lg hover:bg-white/15 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors font-bold"
            >
              {loading ? 'جاري الإنشاء...' : 'إنشاء المحتوى'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}