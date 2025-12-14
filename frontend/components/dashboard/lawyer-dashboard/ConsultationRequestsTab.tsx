'use client'

import { useState, useEffect } from 'react'
import { Check, X, Clock, User, MapPin, Calendar } from 'lucide-react'

interface ConsultationRequest {
  id: string
  subject: string
  message: string
  status: string
  created_at: string
  user_name: string
  consultation_fee: number
  country: string
  category: string
  urgency_level: string
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export default function ConsultationRequestsTab() {
  const [requests, setRequests] = useState<ConsultationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<ConsultationRequest | null>(null)
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null)

  useEffect(() => {
    fetchConsultationRequests()
  }, [])

  const fetchConsultationRequests = async () => {
    try {
      console.log('🔍 Fetching requests from:', `${API_URL}/api/v1/consultations/lawyer-requests`)
      
      const response = await fetch(`${API_URL}/api/v1/consultations/lawyer-requests`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setRequests(data)
        console.log('✅ Fetched requests:', data.length)
      } else {
        console.error('Failed to fetch requests:', response.status)
      }
    } catch (error) {
      console.error('Error fetching consultation requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptClick = (request: ConsultationRequest) => {
    setSelectedRequest(request)
    setActionType('accept')
  }

  const handleRejectClick = (request: ConsultationRequest) => {
    setSelectedRequest(request)
    setActionType('reject')
  }

  const handleAccept = async (scheduledDateTime: string) => {
    if (!selectedRequest) return
    
    try {
      console.log('📤 Accepting consultation:', selectedRequest.id)
      console.log('📅 Scheduled time:', scheduledDateTime)
      
      const response = await fetch(
        `${API_URL}/api/v1/consultations/${selectedRequest.id}/accept`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            scheduled_time: scheduledDateTime
          })
        }
      )
      
      console.log('📥 Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Accept successful:', result)
        
        await fetchConsultationRequests()
        setSelectedRequest(null)
        setActionType(null)
        
        alert(`✅ تم قبول طلب الاستشارة وإرسال رابط الاجتماع للعميل\n\nرابط الاجتماع: ${result.meeting_info?.zoom_link}`)
      } else {
        const error = await response.json()
        console.error('❌ Accept failed:', error)
        alert(`❌ خطأ: ${error.detail}`)
      }
    } catch (error) {
      console.error('Error accepting consultation:', error)
      alert('حدث خطأ في قبول الطلب')
    }
  }

  const handleReject = async (reason: string) => {
    if (!selectedRequest) return
    
    try {
      console.log('📤 Rejecting consultation:', selectedRequest.id)
      console.log('📝 Reason:', reason)
      
      const response = await fetch(
        `${API_URL}/api/v1/consultations/${selectedRequest.id}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ reason })
        }
      )
      
      console.log('📥 Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Reject successful:', result)
        
        await fetchConsultationRequests()
        setSelectedRequest(null)
        setActionType(null)
        
        alert('✅ تم رفض الطلب وإشعار العميل')
      } else {
        const error = await response.json()
        console.error('❌ Reject failed:', error)
        alert(`❌ خطأ: ${error.detail}`)
      }
    } catch (error) {
      console.error('Error rejecting consultation:', error)
      alert('حدث خطأ في رفض الطلب')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4 text-right">طلبات الاستشارات الواردة</h2>
        
        {requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="mx-auto mb-4 text-gray-400" size={48} />
            <p>لا توجد طلبات استشارات جديدة</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1 text-right space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">{request.subject}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status === 'pending' ? 'قيد الانتظار' :
                         request.status === 'accepted' ? 'مقبول' : 'مرفوض'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600">{request.message}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="ml-2" size={16} />
                        <span>{request.user_name}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="ml-2" size={16} />
                        <span>{request.country}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="ml-2" size={16} />
                        <span>{new Date(request.created_at).toLocaleDateString('ar-EG')}</span>
                      </div>
                      <div className="text-left font-semibold text-green-600">
                        {request.consultation_fee} €
                      </div>
                    </div>
                    
                    <div className="flex gap-2 justify-end">
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAcceptClick(request)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                          >
                            <Check className="ml-2" size={16} />
                            قبول
                          </button>
                          <button
                            onClick={() => handleRejectClick(request)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
                          >
                            <X className="ml-2" size={16} />
                            رفض
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* نافذة القبول - تحديد الموعد */}
      {selectedRequest && actionType === 'accept' && (
        <AcceptModal
          request={selectedRequest}
          onClose={() => {
            setSelectedRequest(null)
            setActionType(null)
          }}
          onAccept={handleAccept}
        />
      )}

      {/* نافذة الرفض */}
      {selectedRequest && actionType === 'reject' && (
        <RejectModal
          request={selectedRequest}
          onClose={() => {
            setSelectedRequest(null)
            setActionType(null)
          }}
          onReject={handleReject}
        />
      )}
    </div>
  )
}

function AcceptModal({ request, onClose, onAccept }: {
  request: ConsultationRequest
  onClose: () => void
  onAccept: (scheduledDateTime: string) => void
}) {
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!scheduledDate || !scheduledTime) {
      alert('⚠️ يرجى تحديد التاريخ والوقت')
      return
    }

    const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00`
    console.log('📅 Submitting scheduled time:', scheduledDateTime)
    onAccept(scheduledDateTime)
  }

  // الحد الأدنى: غداً
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4 text-right">قبول طلب الاستشارة</h3>
        
        <div className="mb-4 p-4 bg-green-50 rounded-lg text-right">
          <p className="text-sm text-green-800">
            <strong>العميل:</strong> {request.user_name}
          </p>
          <p className="text-sm text-green-800">
            <strong>الموضوع:</strong> {request.subject}
          </p>
          <p className="text-sm text-green-800">
            <strong>الرسوم:</strong> {request.consultation_fee} €
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              تاريخ الاجتماع *
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={minDate}
              className="w-full p-3 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              وقت الاجتماع *
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg text-right">
            <p className="text-sm text-blue-800">
              سيتم إنشاء رابط Zoom تلقائياً وإرساله للعميل
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              تأكيد القبول
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RejectModal({ request, onClose, onReject }: {
  request: ConsultationRequest
  onClose: () => void
  onReject: (reason: string) => void
}) {
  const [reason, setReason] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (reason.trim()) {
      onReject(reason)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4 text-right">رفض طلب الاستشارة</h3>

        <div className="mb-4 p-4 bg-yellow-50 rounded-lg text-right">
          <p className="text-sm text-yellow-800">
            سيتم إشعار العميل <strong>{request.user_name}</strong> برفض الطلب وسبب الرفض
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              سبب الرفض *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg text-right"
              placeholder="مثال: لا أملك الخبرة الكافية في هذا التخصص، أو جدول أعمالي ممتلئ حالياً..."
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              تأكيد الرفض
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}