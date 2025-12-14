'use client'

import { useState, useEffect } from 'react'
import { Video, Calendar, Clock, User, MapPin, CheckCircle, Copy, Check } from 'lucide-react'

interface ActiveConsultation {
  id: string
  subject: string
  message: string
  status: string
  created_at: string
  scheduled_time: string | null
  user_name: string
  consultation_fee: number
  country: string
  zoom_link?: string
  meeting_password?: string
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export default function ActiveConsultationsTab() {
  const [consultations, setConsultations] = useState<ActiveConsultation[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchActiveConsultations()
  }, [])

  const fetchActiveConsultations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/consultations/lawyer-requests`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        // فقط الاستشارات المقبولة
        const active = data.filter((c: ActiveConsultation) => 
          c.status === 'accepted' || c.status === 'completed'
        )
        setConsultations(active)
      }
    } catch (error) {
      console.error('Error fetching consultations:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getTimeRemaining = (scheduledTime: string) => {
    const now = new Date()
    const scheduled = new Date(scheduledTime)
    const diff = scheduled.getTime() - now.getTime()
    
    if (diff < 0) return 'انتهى الموعد'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `بعد ${days} يوم`
    if (hours > 0) return `بعد ${hours} ساعة`
    return `بعد ${minutes} دقيقة`
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
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2 text-right">الاستشارات النشطة</h2>
        <p className="text-green-100 text-right">
          الاستشارات المقبولة والقادمة ({consultations.length})
        </p>
      </div>

      {consultations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CheckCircle className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-600">لا توجد استشارات نشطة حالياً</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {consultations.map((consultation) => (
            <div 
              key={consultation.id}
              className="bg-white border-2 border-green-200 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 text-right">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {consultation.subject}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <User size={14} />
                    <span>{consultation.user_name}</span>
                    <span>•</span>
                    <MapPin size={14} />
                    <span>{consultation.country}</span>
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  consultation.status === 'accepted' 
                    ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                    : 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                }`}>
                  {consultation.status === 'accepted' ? '✓ مقبول' : '✓ مكتمل'}
                </span>
              </div>

              {/* Message */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-gray-700 text-right">{consultation.message}</p>
              </div>

              {/* Meeting Info */}
              {consultation.status === 'accepted' && consultation.scheduled_time && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 space-y-4">
                  {/* Date & Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <p className="text-xs text-gray-600 mb-2 text-right">موعد الاجتماع</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="text-green-600" size={18} />
                        <p className="font-semibold text-gray-900 text-sm">
                          {new Date(consultation.scheduled_time).toLocaleString('ar-EG', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <p className="text-sm text-green-600 mt-2 font-medium flex items-center gap-1">
                        <Clock size={14} />
                        {getTimeRemaining(consultation.scheduled_time)}
                      </p>
                    </div>

                    {/* Zoom Link */}
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <p className="text-xs text-gray-600 mb-2 text-right">رابط الاجتماع</p>
                      <div className="space-y-2">
                        <a 
                          href={consultation.zoom_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
                        >
                          <Video size={16} />
                          دخول الاجتماع
                        </a>
                        {consultation.meeting_password && (
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-600">كلمة المرور:</p>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                              {consultation.meeting_password}
                            </code>
                            <button
                              onClick={() => copyToClipboard(
                                consultation.meeting_password!, 
                                consultation.id
                              )}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              {copiedId === consultation.id ? 
                                <Check size={12} className="text-green-600" /> : 
                                <Copy size={12} className="text-gray-600" />
                              }
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-end">
                    <a
                      href={consultation.zoom_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Video size={18} />
                      بدء الاجتماع
                    </a>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-600">
                <span className="font-semibold text-green-600">
                  {consultation.consultation_fee} €
                </span>
                <span>#{consultation.id.slice(0, 8)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}