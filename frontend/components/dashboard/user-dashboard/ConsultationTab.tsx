'use client'

import { useState, useEffect } from 'react'
import { Search, Star, Clock, Users, DollarSign, MapPin } from 'lucide-react'

// أنواع الدول بالعربية والإنجليزية
interface Country {
  arabic: string
  english: string
}

const COUNTRIES: Country[] = [
  { arabic: 'مصر', english: 'Egypt' },
  { arabic: 'السعودية', english: 'Saudi Arabia' },
  { arabic: 'الإمارات', english: 'UAE' },
  { arabic: 'الأردن', english: 'Jordan' },
  { arabic: 'لبنان', english: 'Lebanon' },
  { arabic: 'الكويت', english: 'Kuwait' },
  { arabic: 'قطر', english: 'Qatar' },
  { arabic: 'عمان', english: 'Oman' },
  { arabic: 'البحرين', english: 'Bahrain' },
  { arabic: 'العراق', english: 'Iraq' },
  { arabic: 'الجزائر', english: 'Algeria' },
  { arabic: 'المغرب', english: 'Morocco' },
  { arabic: 'تونس', english: 'Tunisia' },
  { arabic: 'السودان', english: 'Sudan' },
  { arabic: 'اليمن', english: 'Yemen' }
]

// دوال مساعدة للتحويل
const getEnglishCountry = (arabicCountry: string): string => {
  const country = COUNTRIES.find(c => c.arabic === arabicCountry)
  return country ? country.english : 'Egypt' // قيمة افتراضية
}

const getArabicCountry = (englishCountry: string): string => {
  const country = COUNTRIES.find(c => c.english === englishCountry)
  return country ? country.arabic : 'مصر' // قيمة افتراضية
}

interface Lawyer {
  id: string
  name: string
  specialization: string
  rating: number
  consultation_fee: number
  experience_years: number
  consultations_count: number
  response_time: string
  description: string
  country: string
  phone: string
}

export default function ConsultationTab() {
  const [arabicCountry, setArabicCountry] = useState('') // القيمة المعروضة للمستخدم
  const [category, setCategory] = useState('')
  const [lawyers, setLawyers] = useState<Lawyer[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null)

  const fetchLawyers = async () => {
    if (!arabicCountry) {
      alert('⚠️ يرجى اختيار الدولة أولاً')
      return
    }
    
    // تحويل الدولة من العربية إلى الإنجليزية
    const countryToSend = getEnglishCountry(arabicCountry)
    
    setLoading(true)
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/consultations/available-lawyers?country=${encodeURIComponent(countryToSend)}&category=${encodeURIComponent(category)}`,
        { 
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
      if (response.ok) {
        const data = await response.json()
        setLawyers(data)
        console.log('✅ Lawyers fetched:', data)
      } else {
        console.error('Failed to fetch lawyers:', response.status)
        alert('❌ فشل في جلب قائمة المحامين')
      }
    } catch (error) {
      console.error('Error fetching lawyers:', error)
      alert('🚨 حدث خطأ في الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestConsultation = (lawyer: Lawyer) => {
    console.log('🎯 Requesting consultation with:', lawyer.name)
    setSelectedLawyer(lawyer)
  }

  const handleCloseForm = () => {
    setSelectedLawyer(null)
  }

  return (
    <div className="space-y-6">
      {/* فلترة البحث */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4 text-right">طلب استشارة قانونية</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              الدولة
            </label>
            <select 
              value={arabicCountry}
              onChange={(e) => setArabicCountry(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-right"
            >
              <option value="">اختر الدولة</option>
              {COUNTRIES.map((country) => (
                <option key={country.english} value={country.arabic}>
                  {country.arabic}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              التخصص
            </label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-right"
            >
              <option value="">جميع التخصصات</option>
              <option value="مدني">قانون مدني</option>
              <option value="تجاري">قانون تجاري</option>
              <option value="جنائي">قانون جنائي</option>
              <option value="عمال">قانون عمال</option>
              <option value="أسرة">قانون أسرة</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={fetchLawyers}
              disabled={!arabicCountry}
              className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center"
            >
              <Search className="ml-2" size={18} />
              بحث عن محامين
            </button>
          </div>
        </div>
        
        {/* عرض الدولة المختارة */}
        {arabicCountry && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-right">
            <p className="text-sm text-blue-700">
              <strong>الدولة المختارة:</strong> {arabicCountry}
            </p>
          </div>
        )}
      </div>

      {/* قائمة المحامين */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">جاري البحث عن المحامين...</p>
        </div>
      )}

      {!loading && lawyers.length === 0 && arabicCountry && (
        <div className="text-center py-8 bg-yellow-50 rounded-lg">
          <p className="text-yellow-700">⚠️ لم يتم العثور على محامين متاحين في {arabicCountry}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lawyers.map((lawyer) => (
          <LawyerCard 
            key={lawyer.id} 
            lawyer={lawyer} 
            onRequestConsultation={handleRequestConsultation}
          />
        ))}
      </div>

      {/* نموذج طلب الاستشارة */}
      {selectedLawyer && (
        <ConsultationRequestForm 
          lawyer={selectedLawyer}
          arabicCountry={arabicCountry}
          category={category}
          onClose={handleCloseForm}
        />
      )}
    </div>
  )
}

function LawyerCard({ lawyer, onRequestConsultation }: { 
  lawyer: Lawyer
  onRequestConsultation: (lawyer: Lawyer) => void
}) {
  // تحويل الدولة من الإنجليزية إلى العربية للعرض
  const displayCountry = getArabicCountry(lawyer.country)

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="text-right space-y-4">
        {/* معلومات المحامي */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{lawyer.name}</h3>
          <p className="text-gray-600 mt-1">{lawyer.specialization}</p>
          <div className="flex items-center mt-1 text-sm text-gray-500">
            <MapPin size={14} className="ml-1" />
            {displayCountry}
          </div>
        </div>

        {/* التقييم والخبرة */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Star className="text-yellow-400 ml-1" size={18} />
            <span className="text-gray-700">{lawyer.rating}</span>
          </div>
          <div className="text-gray-600 text-sm">
            {lawyer.experience_years} سنة خبرة
          </div>
        </div>

        {/* الإحصائيات */}
        <div className="flex justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <Users size={16} className="ml-1" />
            {lawyer.consultations_count} استشارة
          </div>
          <div className="flex items-center">
            <Clock size={16} className="ml-1" />
            {lawyer.response_time}
          </div>
        </div>

        {/* الوصف */}
        <div className="text-sm text-gray-600">
          {lawyer.description}
        </div>

        {/* الرسوم */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center text-lg font-semibold text-green-600">
            <DollarSign size={18} />
            {lawyer.consultation_fee} €
          </div>
          <button
            onClick={() => onRequestConsultation(lawyer)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            طلب استشارة
          </button>
        </div>
      </div>
    </div>
  )
}

function ConsultationRequestForm({ lawyer, arabicCountry, category, onClose }: { 
  lawyer: Lawyer, 
  arabicCountry: string,
  category: string,
  onClose: () => void 
}) {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    urgency_level: 'normal'
  })
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.subject.trim() || !formData.message.trim()) {
      alert('⚠️ يرجى ملء جميع الحقول المطلوبة')
      return
    }

    setSubmitting(true)

    try {
      // تحويل الدولة من العربية إلى الإنجليزية قبل الإرسال
      const countryToSend = getEnglishCountry(arabicCountry)
      
      console.log('📤 Sending consultation request:', {
        lawyer_id: lawyer.id,
        ...formData,
        country: countryToSend,
        category,
        consultation_fee: lawyer.consultation_fee
      })

      const response = await fetch('http://localhost:8000/api/v1/consultations/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          lawyer_id: lawyer.id,
          subject: formData.subject,
          message: formData.message,
          country: countryToSend,
          category: category,
          urgency_level: formData.urgency_level,
          consultation_fee: lawyer.consultation_fee,
          duration_minutes: 30
        })
      })

      console.log('📥 Response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Request successful:', result)
        alert('🎉 تم إرسال طلب الاستشارة بنجاح! سيتم إعلامك بقبول المحامي للطلب.')
        onClose()
      } else {
        const errorData = await response.json()
        console.error('❌ Request failed:', errorData)
        alert(`❌ حدث خطأ في إرسال الطلب: ${errorData.detail || 'يرجى المحاولة مرة أخرى'}`)
      }
    } catch (error) {
      console.error('🚨 Network error:', error)
      alert('🚨 حدث خطأ في الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-right flex-1">
            طلب استشارة من {lawyer.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* معلومات المحامي */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <div className="text-right">
              <h4 className="font-semibold">{lawyer.name}</h4>
              <p className="text-gray-600 text-sm">{lawyer.specialization}</p>
              <p className="text-gray-500 text-sm">{getArabicCountry(lawyer.country)}</p>
            </div>
            <div className="text-left">
              <p className="text-green-600 font-semibold">{lawyer.consultation_fee} €</p>
              <p className="text-gray-500 text-sm">رسوم الاستشارة</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              موضوع الاستشارة *
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg text-right"
              placeholder="أدخل موضوع الاستشارة..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              تفاصيل الاستشارة *
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={6}
              className="w-full p-3 border border-gray-300 rounded-lg text-right"
              placeholder="صف مشكلتك القانونية بالتفصيل..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              مستوى الاستعجال
            </label>
            <select 
              name="urgency_level"
              value={formData.urgency_level}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg text-right"
            >
              <option value="low">منخفض</option>
              <option value="normal">عادي</option>
              <option value="high">عالي</option>
            </select>
          </div>
          
          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                  جاري الإرسال...
                </>
              ) : (
                'إرسال الطلب'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}