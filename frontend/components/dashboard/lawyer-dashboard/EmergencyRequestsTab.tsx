// components/dashboard/lawyer-dashboard/EmergencyRequestsTab.tsx

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { AlertCircle, MapPin, Clock, CheckCircle, Phone, Volume2, Play, Pause, Target } from 'lucide-react'

interface EmergencyRequest {
  id: string
  user_id: string
  description: string
  user_latitude: number
  user_longitude: number
  user_location_name: string | null
  preferred_specialization: string | null
  priority: string
  status: string
  created_at: string
  expires_at: string
  contact_phone: string | null
  contact_method: string
  voice_note_url: string | null
  is_directed_to_me: boolean
}

export default function EmergencyRequestsTab() {
  const [requests, setRequests] = useState<EmergencyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({})

  const fetchRequests = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
      const res = await fetch(`${backendUrl}/api/v1/emergency-requests/nearby-requests`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      })

      if (!res.ok) {
        if (res.status === 403 || res.status === 400) {
          const errorData = await res.json()
          setError(errorData.detail || 'يجب تفعيل خدمة الطوارئ في ملفك الشخصي')
          setRequests([])
          return
        }
        const errorData = await res.json()
        throw new Error(errorData.detail || 'فشل في جلب الطلبات')
      }

      const data = await res.json()
      setRequests(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
    const interval = setInterval(fetchRequests, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleAccept = async (requestId: string) => {
    if (!confirm('هل تريد قبول هذا الطلب؟\n\nستحصل فوراً على معلومات الاتصال بالعميل')) return

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
      const res = await fetch(
        `${backendUrl}/api/v1/emergency-requests/${requestId}/accept`,
        { method: 'POST', credentials: 'include' }
      )

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.detail || 'فشل في قبول الطلب')
      }

      const result = await res.json()
      const clientInfo = result.client_info
      
      const message = `✅ تم قبول الطلب بنجاح!

📞 معلومات العميل:
- الاسم: ${clientInfo.name}
- الهاتف: ${clientInfo.phone || 'غير متاح'}
- الموقع: ${clientInfo.location.address || 'غير محدد'}

${result.voice_note_url ? '🎵 يوجد رسالة صوتية من العميل' : ''}

يرجى الاتصال بالعميل فوراً على: ${clientInfo.phone}`
      
      alert(message)
      
      if (clientInfo.phone) {
        const callNow = confirm('هل تريد الاتصال الآن؟')
        if (callNow) {
          window.location.href = `tel:${clientInfo.phone}`
        }
      }
      
      fetchRequests()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ')
    }
  }

  const playVoiceNote = (requestId: string, url: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
    const fullUrl = `${backendUrl}${url}`
    
    if (playingAudio && playingAudio !== requestId) {
      audioRefs.current[playingAudio]?.pause()
    }

    if (!audioRefs.current[requestId]) {
      const audio = new Audio(fullUrl)
      audioRefs.current[requestId] = audio
      audio.onended = () => setPlayingAudio(null)
      audio.onerror = () => {
        alert('فشل في تشغيل الرسالة الصوتية')
        setPlayingAudio(null)
      }
    }

    const audio = audioRefs.current[requestId]
    
    if (playingAudio === requestId) {
      audio.pause()
      setPlayingAudio(null)
    } else {
      audio.play()
      setPlayingAudio(requestId)
    }
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-green-100 text-green-800 border-green-300'
    }
    return colors[priority.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      critical: 'حرجة', high: 'عالية', medium: 'متوسطة', low: 'منخفضة'
    }
    return labels[priority.toLowerCase()] || priority
  }

  const getTimeAgo = (dateString: string) => {
    const diffMs = new Date().getTime() - new Date(dateString).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'الآن'
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `منذ ${diffHours} ساعة`
    return `منذ ${Math.floor(diffHours / 24)} يوم`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
        <p className="text-red-700 mb-4">{error}</p>
        <button onClick={fetchRequests} className="bg-red-600 text-white px-4 py-2 rounded">
          إعادة المحاولة
        </button>
      </div>
    )
  }

  // فصل الطلبات الموجهة والعامة
  const directedRequests = requests.filter(r => r.is_directed_to_me)
  const generalRequests = requests.filter(r => !r.is_directed_to_me)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <AlertCircle className="h-7 w-7 text-red-600 ml-2" />
            طلبات الطوارئ
          </h2>
          <p className="text-gray-600 mt-1">
            {directedRequests.length} طلب موجه لك • {generalRequests.length} طلب عام
          </p>
        </div>
        <button onClick={fetchRequests} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          تحديث
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="bg-gray-50 border p-12 rounded-lg text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 text-lg">لا توجد طلبات طوارئ حالياً</p>
        </div>
      ) : (
        <>
          {/* الطلبات الموجهة */}
          {directedRequests.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-red-600" />
                <h3 className="font-bold text-lg">طلبات موجهة لك مباشرة</h3>
              </div>
              <div className="grid gap-4 mb-6">
                {directedRequests.map((request) => (
                  <RequestCard 
                    key={request.id} 
                    request={request} 
                    onAccept={handleAccept}
                    onPlayVoice={playVoiceNote}
                    isPlaying={playingAudio === request.id}
                    getPriorityColor={getPriorityColor}
                    getPriorityLabel={getPriorityLabel}
                    getTimeAgo={getTimeAgo}
                    isDirected={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* الطلبات العامة */}
          {generalRequests.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-4">طلبات عامة</h3>
              <div className="grid gap-4">
                {generalRequests.map((request) => (
                  <RequestCard 
                    key={request.id} 
                    request={request} 
                    onAccept={handleAccept}
                    onPlayVoice={playVoiceNote}
                    isPlaying={playingAudio === request.id}
                    getPriorityColor={getPriorityColor}
                    getPriorityLabel={getPriorityLabel}
                    getTimeAgo={getTimeAgo}
                    isDirected={false}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// مكون بطاقة الطلب
function RequestCard({ 
  request, 
  onAccept, 
  onPlayVoice, 
  isPlaying,
  getPriorityColor,
  getPriorityLabel,
  getTimeAgo,
  isDirected
}: {
  request: EmergencyRequest
  onAccept: (id: string) => void
  onPlayVoice: (id: string, url: string) => void
  isPlaying: boolean
  getPriorityColor: (priority: string) => string
  getPriorityLabel: (priority: string) => string
  getTimeAgo: (date: string) => string
  isDirected: boolean
}) {
  return (
    <div className={`border-2 ${isDirected ? 'border-red-400 bg-red-100' : 'border-red-200 bg-red-50'} p-6 rounded-lg`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(request.priority)}`}>
            أولوية {getPriorityLabel(request.priority)}
          </span>
          <span className="text-sm text-gray-500 flex items-center">
            <Clock className="h-4 w-4 ml-1" />
            {getTimeAgo(request.created_at)}
          </span>
        </div>
        <div className="flex gap-2">
          {isDirected && (
            <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
              <Target className="h-3 w-3" />
              موجه لك
            </span>
          )}
          <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full">
            طوارئ
          </span>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold text-lg mb-2">وصف الحالة:</h3>
        <p className="text-gray-700">{request.description}</p>
      </div>

      {request.voice_note_url && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">رسالة صوتية من العميل</span>
            </div>
            <button
              onClick={() => onPlayVoice(request.id, request.voice_note_url!)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4" />
                  إيقاف
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  تشغيل
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 ml-2" />
          <span>{request.user_location_name || 'موقع العميل'}</span>
        </div>
        {request.preferred_specialization && (
          <div className="text-sm text-blue-600">
            التخصص: {request.preferred_specialization}
          </div>
        )}
        {request.contact_phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 ml-2" />
            <span>{request.contact_phone}</span>
          </div>
        )}
      </div>

      <button
        onClick={() => onAccept(request.id)}
        className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center"
      >
        <CheckCircle className="h-5 w-5 ml-2" />
        قبول الطلب
      </button>
    </div>
  )
}