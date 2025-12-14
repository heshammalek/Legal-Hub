// app/dashboards/[role]/user.tsx

'use client'

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Menu, X, AlertCircle, MapPin, Mic, Search, Star, Clock, Users, DollarSign, Square, Video } from 'lucide-react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Sidebar from 'components/dashboard/Sidebar'
import Section from 'components/dashboard/Section'
import StatsGrid from 'components/dashboard/StatsGrid'
import ConsultationsList from 'components/dashboard/ConsultationsList'
import NotificationsList from 'components/dashboard/NotificationsList'

const InteractiveMap = dynamic(
  () => import('@/components/map/InteractiveMap'),
  { ssr: false }
)

// الأنواع
interface DashboardData {
  profile: {
    full_name?: string
    email: string
    role: string
  }
  stats: {
    total_consultations: number
    active_cases: number
    completed_consultations: number
    favorite_lawyers: number
  }
  consultations: Array<{
    id: string
    title: string
    status: string
    date: string
    lawyer_name?: string
  }>
  notifications: Array<{
    id: string
    message: string
    read: boolean
    created_at: string
  }>
}

interface EmergencyLawyer {
  id: string
  name: string
  lat: number
  lng: number
  specialization: string
  rating: number
  distance: string
}

interface MapPoint {
  lat: number
  lng: number
  name?: string
}

interface LawyerRecording {
  isRecording: boolean
  audioBlob: Blob | null
  duration: number
  mediaRecorder?: MediaRecorder
  timer?: NodeJS.Timeout
}

interface Consultation {
  id: string
  subject: string
  lawyer_name: string
  scheduled_time: string | null
  status: string
  zoom_link?: string
  meeting_password?: string
}

// مكون عرض الاستشارات
const MyConsultationsTab = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchMyConsultations()
  }, [])
  
  const fetchMyConsultations = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
      const res = await fetch(`${backendUrl}/api/v1/consultations/my-consultations`, {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setConsultations(data)
      }
    } catch (error) {
      console.error('Error fetching consultations:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
      </div>
    )
  }
  
  return (
    <Section title="استشاراتي">
      {consultations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>لا توجد استشارات</p>
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map(consultation => (
            <div key={consultation.id} className="border rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start">
                <div className="flex-1 text-right">
                  <h4 className="font-semibold text-lg">{consultation.subject}</h4>
                  <p className="text-sm text-gray-600">{consultation.lawyer_name}</p>
                  {consultation.scheduled_time && (
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(consultation.scheduled_time).toLocaleString('ar-EG')}
                    </p>
                  )}
                  <span className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${
                    consultation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    consultation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {consultation.status === 'accepted' ? 'مقبولة' :
                     consultation.status === 'pending' ? 'قيد الانتظار' : 'مرفوضة'}
                  </span>
                </div>
                {consultation.status === 'accepted' && consultation.zoom_link && (
                  <a 
                    href={consultation.zoom_link} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Video size={16} />
                    دخول الاجتماع
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}

// مكون نموذج طلب الاستشارة
const ConsultationRequestForm = ({ 
  lawyer, 
  country, 
  category, 
  onClose 
}: { 
  lawyer: any, 
  country: string, 
  category: string,
  onClose: () => void 
}) => {
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
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
      
      const response = await fetch(`${backendUrl}/api/v1/consultations/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          lawyer_id: lawyer.id,
          subject: formData.subject,
          message: formData.message,
          country: country,
          category: category,
          urgency_level: formData.urgency_level,
          consultation_fee: lawyer.consultation_fee,
          duration_minutes: 30
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert('🎉 تم إرسال طلب الاستشارة بنجاح! سيتم إعلامك بقبول المحامي للطلب.')
        onClose()
      } else {
        const errorData = await response.json()
        alert(`❌ حدث خطأ في إرسال الطلب: ${errorData.detail || 'يرجى المحاولة مرة أخرى'}`)
      }
    } catch (error) {
      console.error('Network error:', error)
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

// مكون محتوى طلب الاستشارة
const ConsultationRequestContent = () => {
  const [country, setCountry] = useState('')
  const [category, setCategory] = useState('')
  const [lawyers, setLawyers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [selectedLawyer, setSelectedLawyer] = useState<any>(null)

  const fetchLawyers = async () => {
    if (!country) {
      alert('⚠️ يرجى اختيار الدولة أولاً')
      return
    }
    
    setLoading(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
      const response = await fetch(
        `${backendUrl}/api/v1/consultations/available-lawyers?country=${country}&category=${category}`,
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
      } else {
        alert('❌ فشل في جلب قائمة المحامين')
      }
    } catch (error) {
      console.error('Error fetching lawyers:', error)
      alert('🚨 حدث خطأ في الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }
  
  const handleRequestConsultation = (lawyer: any) => {
    setSelectedLawyer(lawyer)
    setShowRequestForm(true)
  }

  if (showRequestForm) {
    return (
      <ConsultationRequestForm 
        lawyer={selectedLawyer}
        country={country}
        category={category}
        onClose={() => {
          setShowRequestForm(false)
          setSelectedLawyer(null)
        }}
      />
    )
  }

  return (
    <Section title="ابحث عن المحامين المتاحين">
      <div className="bg-white p-6 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              الدولة
            </label>
            <select 
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-right"
            >
              <option value="">اختر الدولة</option>
              <option value="Egypt">مصر</option>
              <option value="Saudi Arabia">السعودية</option>
              <option value="UAE">الإمارات</option>
              <option value="Jordan">الأردن</option>
              <option value="Lebanon">لبنان</option>
              <option value="Kuwait">الكويت</option>
              <option value="Qatar">قطر</option>
              <option value="Oman">عمان</option>
              <option value="Bahrain">البحرين</option>
              <option value="Iraq">العراق</option>
              <option value="Algeria">الجزائر</option>
              <option value="Morocco">المغرب</option>
              <option value="Tunisia">تونس</option>
              <option value="Yemen">اليمن</option>
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
              <option value="عام">قانون عام</option>
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
              disabled={!country}
              className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center"
            >
              <Search className="ml-2" size={18} />
              بحث عن محامين
            </button>
          </div>
        </div>

        {/* قائمة المحامين */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">جاري البحث عن المحامين...</p>
          </div>
        )}

        {!loading && lawyers.length === 0 && country && (
          <div className="text-center py-8 bg-yellow-50 rounded-lg">
            <p className="text-yellow-700">⚠️ لم يتم العثور على محامين متاحين في {country}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lawyers.map((lawyer) => (
            <div key={lawyer.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="text-right space-y-4">
                {/* معلومات المحامي */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{lawyer.name}</h3>
                  <p className="text-gray-600 mt-1">{lawyer.specialization}</p>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <MapPin size={14} className="ml-1" />
                    {lawyer.country}
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

                {/* الرسوم */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex items-center text-lg font-semibold text-green-600">
                    <DollarSign size={18} />
                    {lawyer.consultation_fee} €
                  </div>
                  <button
                    onClick={() => handleRequestConsultation(lawyer)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    طلب استشارة
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

// المكون الرئيسي
export default function UserDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("profile")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [emergencyLawyers, setEmergencyLawyers] = useState<EmergencyLawyer[]>([])
  const [isEmergencyLoading, setEmergencyLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  // تسجيلات منفصلة لكل محامي
  const [lawyerRecordings, setLawyerRecordings] = useState<Record<string, LawyerRecording>>({})

  // تحميل بيانات Dashboard
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/v1/users/dashboard', { credentials: 'include' })
        if (res.status === 401) {
          router.push('/login')
          return
        }
        if (!res.ok) throw new Error(`خطأ: ${res.status}`)
        const json: DashboardData = await res.json()
        setData(json)
      } catch (e: any) {
        setError(e.message || 'فشل جلب البيانات')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  // البحث عن محامي طوارئ
  const fetchEmergencyLawyers = useCallback(async (lat: number, lng: number) => {
    setEmergencyLoading(true)
    setLocationError(null)
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
      const res = await fetch(
        `${backendUrl}/api/v1/nearby?lat=${lat}&lng=${lng}&radius_km=20&emergency_only=true`,
        { credentials: 'include' }
      )
      
      if (!res.ok) throw new Error('فشل في جلب المحامين')
      
      const lawyers = await res.json()
      setEmergencyLawyers(lawyers)
    } catch (error) {
      setLocationError('فشل في تحميل المحامين القريبين')
      setEmergencyLawyers([])
    } finally {
      setEmergencyLoading(false)
    }
  }, [])

  const handleEmergencyRequest = () => {
    setActiveTab('map')
    
    if (!userLocation) {
      setEmergencyLoading(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation([latitude, longitude])
          fetchEmergencyLawyers(latitude, longitude)
        },
        (error) => {
          setLocationError('فشل في تحديد موقعك')
          setEmergencyLoading(false)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else {
      fetchEmergencyLawyers(userLocation[0], userLocation[1])
    }
  }

  // بدء التسجيل لمحامٍ محدد
  const startRecordingForLawyer = async (lawyerId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setLawyerRecordings(prev => ({
          ...prev,
          [lawyerId]: { 
            ...prev[lawyerId], 
            audioBlob: blob, 
            isRecording: false 
          }
        }))
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      
      const timer = setInterval(() => {
        setLawyerRecordings(prev => {
          const current = prev[lawyerId]
          if (!current || current.duration >= 60) {
            clearInterval(timer)
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop()
            }
            return prev
          }
          return {
            ...prev,
            [lawyerId]: { ...current, duration: current.duration + 1 }
          }
        })
      }, 1000)
      
      setLawyerRecordings(prev => ({
        ...prev,
        [lawyerId]: { 
          isRecording: true, 
          audioBlob: null, 
          duration: 0,
          mediaRecorder,
          timer
        }
      }))
      
    } catch (error) {
      alert('فشل في الوصول للميكروفون. يرجى السماح بالوصول للميكروفون.')
    }
  }

  const stopRecordingForLawyer = (lawyerId: string) => {
    const recording = lawyerRecordings[lawyerId]
    if (recording?.mediaRecorder && recording.isRecording) {
      recording.mediaRecorder.stop()
      if (recording.timer) {
        clearInterval(recording.timer)
      }
    }
  }

  const deleteRecording = (lawyerId: string) => {
    setLawyerRecordings(prev => {
      const newState = { ...prev }
      delete newState[lawyerId]
      return newState
    })
  }

  const handleRequestEmergency = async (lawyerId: string) => {
    if (!userLocation) {
      setLocationError('لا يمكن تحديد موقعك')
      return
    }

    const lawyer = emergencyLawyers.find(l => l.id === lawyerId)
    if (!lawyer) return

    const recording = lawyerRecordings[lawyerId]

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
      
      const formData = new FormData()
      formData.append('description', `طلب مساعدة طارئة موجه للمحامي: ${lawyer.name}`)
      formData.append('user_latitude', userLocation[0].toString())
      formData.append('user_longitude', userLocation[1].toString())
      formData.append('user_location_name', 'موقعي الحالي')
      formData.append('priority', 'high')
      formData.append('contact_method', 'app')
      formData.append('preferred_lawyer_id', lawyerId)
      
      if (recording?.audioBlob) {
        formData.append('voice_note', recording.audioBlob, 'voice_note.webm')
      }

      const res = await fetch(`${backendUrl}/api/v1/emergency-request`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.detail || 'فشل في إنشاء الطلب')
      }

      const result = await res.json()
      alert(`✅ تم إرسال طلب الطوارئ للمحامي ${lawyer.name} بنجاح!\n\nرقم الطلب: ${result.id}`)
      
      deleteRecording(lawyerId)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'حدث خطأ')
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setMobileMenuOpen(false)
  }

  // تبويب الملف الشخصي
  const ProfileTab = () => (
    <div className="space-y-6">
      <Section>
        <h2 className="text-2xl font-bold">{`مرحباً، ${data?.profile.full_name || data?.profile.email.split('@')[0]}`}</h2>
        <p className="text-gray-600">{data?.profile.role} — {data?.profile.email}</p>
      </Section>

      <Section>
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-lg text-white shadow-lg">
          <div className="flex items-center justify-center mb-3">
            <AlertCircle className="h-8 w-8 ml-2" />
            <h3 className="text-xl font-bold">محامي طوارئ</h3>
          </div>
          <p className="mb-4 text-center">هل تحتاج مساعدة قانونية عاجلة؟</p>
          <button
            onClick={handleEmergencyRequest}
            disabled={isEmergencyLoading}
            className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold w-full hover:bg-gray-100 transition-colors disabled:bg-gray-300"
          >
            {isEmergencyLoading ? 'جاري البحث...' : 'العثور على محامي طوارئ'}
          </button>
        </div>
      </Section>

      <Section title="إحصائيات">
        {data && (
          <StatsGrid stats={{
            total: { label: 'إجمالي الاستشارات', value: data.stats.total_consultations, color: 'blue' },
            active: { label: 'القضايا النشطة', value: data.stats.active_cases, color: 'green' },
            completed: { label: 'المكتملة', value: data.stats.completed_consultations, color: 'yellow' },
            favorites: { label: 'المحامون المفضلون', value: data.stats.favorite_lawyers, color: 'purple' }
          }} />
        )}
      </Section>
    </div>
  )

  // تبويب الخريطة
  const MapTab = () => {
    const mapPoints: MapPoint[] = emergencyLawyers.map(l => ({
      lat: l.lat, lng: l.lng, name: `${l.name} - ${l.distance}`
    }))
    const allPoints = userLocation ? [{ lat: userLocation[0], lng: userLocation[1], name: 'موقعك' }, ...mapPoints] : mapPoints

    return (
      <div className="space-y-6">
        <Section title="محامو الطوارئ القريبون">
          {isEmergencyLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full" />
            </div>
          ) : userLocation && emergencyLawyers.length > 0 ? (
            <>
              <div className="h-96 rounded-lg overflow-hidden border-2 mb-6">
                <InteractiveMap points={allPoints} center={userLocation} zoom={12} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {emergencyLawyers.map((lawyer) => {
                  const recording = lawyerRecordings[lawyer.id]
                  
                  return (
                    <div key={lawyer.id} className="border-2 border-red-200 bg-red-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{lawyer.name}</h3>
                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                          طوارئ
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm mb-3">
                        <p className="flex items-center text-gray-600">
                          <MapPin className="h-3 w-3 ml-1" />
                          {lawyer.distance}
                        </p>
                        <p className="text-blue-600">{lawyer.specialization}</p>
                        {lawyer.rating > 0 && (
                          <p className="text-yellow-600">★ {lawyer.rating}/5</p>
                        )}
                      </div>
                      
                      {/* Voice Recording */}
                      <div className="mb-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                        <p className="text-xs font-medium mb-2 text-gray-700">رسالة صوتية (اختياري)</p>
                        
                        {!recording?.isRecording && !recording?.audioBlob && (
                          <button
                            onClick={() => startRecordingForLawyer(lawyer.id)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            <Mic className="h-3 w-3" />
                            تسجيل رسالة
                          </button>
                        )}
                        
                        {recording?.isRecording && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => stopRecordingForLawyer(lawyer.id)}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                            >
                              <Square className="h-3 w-3" />
                              إيقاف ({recording.duration}ث)
                            </button>
                            <div className="animate-pulse text-red-600 text-xs">● جاري التسجيل</div>
                          </div>
                        )}
                        
                        {recording?.audioBlob && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-green-600">✓ تم التسجيل ({recording.duration}ث)</span>
                            <button 
                              onClick={() => deleteRecording(lawyer.id)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              حذف
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleRequestEmergency(lawyer.id)}
                        className="w-full py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                      >
                        طلب مساعدة من {lawyer.name.split(' ')[0]}
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <p className="text-center py-12 text-gray-500">لا يوجد محامون متاحون</p>
          )}
        </Section>
      </div>
    )
  }

  // تبويب الاستشارات
  const ConsultationTab = () => {
    const [view, setView] = useState<'list' | 'request'>('list')
    
    return (
      <div className="space-y-6">
        {/* Toggle Buttons */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              view === 'list' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            استشاراتي
          </button>
          <button
            onClick={() => setView('request')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              view === 'request' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            طلب استشارة جديدة
          </button>
        </div>

        {/* Content */}
        {view === 'list' ? <MyConsultationsTab /> : <ConsultationRequestContent />}
      </div>
    )
  }

  // تبويب الدردشة
  const ChatTab = () => (
    <Section title="الدردشة القانونية">
      <div className="bg-green-50 p-6 rounded-lg text-center">
        <h3 className="text-lg font-semibold mb-2">دردشة فورية</h3>
        <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
          بدء دردشة
        </button>
      </div>
    </Section>
  )

  // تبويب المنشورات
  const PostsTab = () => (
    <div className="space-y-6">
      <Section title="بوست خدمات">
        <div className="bg-purple-50 p-6 rounded-lg text-center">
          <h3 className="text-lg font-semibold">خدمات قانونية</h3>
          <button className="bg-purple-600 text-white px-6 py-2 rounded-lg mt-4 hover:bg-purple-700 transition-colors">
            استعراض
          </button>
        </div>
      </Section>
      <Section title="الإشعارات">
        {data && <NotificationsList notifications={data.notifications} />}
      </Section>
    </div>
  )

  // عرض المحتوى بناءً على التبويب النشط
  const renderTabContent = () => {
    switch (activeTab) {
      case "profile": return <ProfileTab />
      case "map": return <MapTab />
      case "consultation": return <ConsultationTab />
      case "chat": return <ChatTab />
      case "posts": return <PostsTab />
      default: return <div className="text-center p-6">اختر تبويب</div>
    }
  }

  // حالات التحميل والخطأ
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"/>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="py-20 flex justify-center">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
          <p className="text-red-700 mb-4">حدث خطأ: {error}</p>
          <button 
            onClick={() => router.refresh()} 
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-6 relative">
      {/* الشريط الجانبي */}
      <div className="hidden lg:block lg:w-64">
        <Sidebar role="user" activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* زر القائمة للموبايل */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* القائمة المنزلقة للموبايل */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50 flex">
          <aside className="w-80 max-w-[85vw] bg-white overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">لوحة المستخدم</h2>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <Sidebar role="user" activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
          </aside>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* المحتوى الرئيسي */}
      <div className="flex-1 bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">لوحة المستخدم</h1>
        {renderTabContent()}
      </div>
    </div>
  )
}