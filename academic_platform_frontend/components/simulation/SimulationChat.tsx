// src/components/simulation/SimulationChat.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ChatMessage {
  id: string
  sender: string
  role: string
  message: string
  timestamp: Date
  type: 'نص' | 'وثيقة' | 'تعليق' | 'سؤال'
  reactions?: {
    [key: string]: string[]
  }
}

interface Participant {
  id: string
  name: string
  role: string
  isOnline: boolean
  avatar?: string
}

interface SimulationSession {
  id: string
  caseTitle: string
  participants: Participant[]
  status: 'جارية' | 'منتهية' | 'متوقفة'
  startTime: Date
}

export default function SimulationChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [session, setSession] = useState<SimulationSession | null>(null)
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null)
  const [isTeacher, setIsTeacher] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // بيانات تجريبية
  useEffect(() => {
    const mockSession: SimulationSession = {
      id: 'session-1',
      caseTitle: 'قضية سرقة مسلحة',
      status: 'جارية',
      startTime: new Date(),
      participants: [
        {
          id: 'teacher-1',
          name: 'د. أحمد محمد',
          role: 'مشرف',
          isOnline: true
        },
        {
          id: 'student-1',
          name: 'محمد أحمد',
          role: 'القاضي',
          isOnline: true
        },
        {
          id: 'student-2',
          name: 'فاطمة علي',
          role: 'محامي الدفاع',
          isOnline: true
        },
        {
          id: 'student-3',
          name: 'خالد إبراهيم',
          role: 'النائب العام',
          isOnline: true
        },
        {
          id: 'student-4',
          name: 'سارة محمد',
          role: 'كاتب الجلسة',
          isOnline: false
        }
      ]
    }

    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        sender: 'student-1',
        role: 'القاضي',
        message: 'تبدأ الجلسة، يرجى جميع الحضور الوقوف',
        timestamp: new Date(Date.now() - 300000),
        type: 'نص'
      },
      {
        id: '2',
        sender: 'student-2',
        role: 'محامي الدفاع',
        message: 'أطلب الإذن بالكلام يا سيادة القاضي',
        timestamp: new Date(Date.now() - 240000),
        type: 'نص'
      },
      {
        id: '3',
        sender: 'student-1',
        role: 'القاضي',
        message: 'التفضل محامي الدفاع',
        timestamp: new Date(Date.now() - 180000),
        type: 'نص'
      },
      {
        id: '4',
        sender: 'teacher-1',
        role: 'مشرف',
        message: 'ملاحظة: رائع حتى الآن، يرجى التركيز على الإجراءات القانونية',
        timestamp: new Date(Date.now() - 120000),
        type: 'تعليق'
      },
      {
        id: '5',
        sender: 'student-3',
        role: 'النائب العام',
        message: 'أقدم الأدلة التالية: تقرير الطب الشرعي، صور مكان الحادث، إفادة الشهود',
        timestamp: new Date(Date.now() - 60000),
        type: 'وثيقة'
      }
    ]

    setSession(mockSession)
    setMessages(mockMessages)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = () => {
    if (!newMessage.trim() || !session) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: isTeacher ? 'teacher-1' : 'student-1',
      role: isTeacher ? 'مشرف' : 'طالب',
      message: newMessage,
      timestamp: new Date(),
      type: 'نص'
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')
  }

  const sendDocument = () => {
    // محاكاة إرسال وثيقة
    const documentMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: isTeacher ? 'teacher-1' : 'student-1',
      role: isTeacher ? 'مشرف' : 'طالب',
      message: 'وثيقة الدفاع.pdf',
      timestamp: new Date(),
      type: 'وثيقة'
    }

    setMessages(prev => [...prev, documentMessage])
  }

  const sendQuestion = () => {
    const question = prompt('أدخل سؤالك:')
    if (question) {
      const questionMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: isTeacher ? 'teacher-1' : 'student-1',
        role: isTeacher ? 'مشرف' : 'طالب',
        message: question,
        timestamp: new Date(),
        type: 'سؤال'
      }

      setMessages(prev => [...prev, questionMessage])
    }
  }

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'تعليق': return 'bg-yellow-500/20 border-yellow-500/30'
      case 'وثيقة': return 'bg-blue-500/20 border-blue-500/30'
      case 'سؤال': return 'bg-purple-500/20 border-purple-500/30'
      default: return 'bg-white/5 border-white/10'
    }
  }

  const getSenderName = (senderId: string) => {
    return session?.participants.find(p => p.id === senderId)?.name || 'مستخدم'
  }

  const getSenderRole = (senderId: string) => {
    return session?.participants.find(p => p.id === senderId)?.role || 'مشارك'
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="p-6 bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-orange-400">💬 محادثة المحاكاة</h2>
            <p className="text-white/60 mt-2">غرفة المحادثة التفاعلية لجلسات المحاكاة</p>
          </div>
          
          {session && (
            <div className="flex items-center gap-4">
              <div className="text-white">
                <span className="text-orange-400">الحالة:</span> 
                <span className={`ml-2 ${
                  session.status === 'جارية' ? 'text-green-400' : 
                  session.status === 'متوقفة' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {session.status}
                </span>
              </div>
              <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors">
                ⏸️ إيقاف مؤقت
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-200px)]">
          {/* قائمة المشاركين */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 h-full">
              <h3 className="text-xl font-bold text-white mb-4">👥 المشاركون</h3>
              
              {session ? (
                <div className="space-y-3">
                  {session.participants.map(participant => (
                    <div
                      key={participant.id}
                      className={`p-3 rounded-lg transition-all ${
                        selectedParticipant === participant.id
                          ? 'bg-orange-500/20 border border-orange-500/30'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          participant.isOnline ? 'bg-green-400' : 'bg-red-400'
                        }`}></div>
                        <div className="flex-1">
                          <div className="font-semibold text-white">{participant.name}</div>
                          <div className="text-white/60 text-sm">{participant.role}</div>
                        </div>
                        {participant.role === 'مشرف' && (
                          <span className="text-yellow-400 text-lg">👑</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">👥</div>
                  <p className="text-white/60">لا توجد جلسة نشطة</p>
                </div>
              )}
            </div>
          </div>

          {/* منطقة المحادثة */}
          <div className="lg:col-span-3 flex flex-col">
            <div className="bg-white/5 rounded-2xl border border-white/10 flex flex-col h-full">
              {/* رأس المحادثة */}
              {session && (
                <div className="p-4 border-b border-white/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-white font-bold text-lg">{session.caseTitle}</h3>
                      <p className="text-white/60 text-sm">
                        بدأت في {session.startTime.toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-white/60 text-sm">
                      <span>{session.participants.filter(p => p.isOnline).length} متصل</span>
                      <span>•</span>
                      <span>{messages.length} رسالة</span>
                    </div>
                  </div>
                </div>
              )}

              {/* الرسائل */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {messages.map(message => {
                    const sender = session?.participants.find(p => p.id === message.sender)
                    const isOwnMessage = message.sender === (isTeacher ? 'teacher-1' : 'student-1')
                    
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-md rounded-2xl p-4 border ${getMessageColor(message.type)} ${
                          isOwnMessage ? 'rounded-br-none' : 'rounded-bl-none'
                        }`}>
                          {/* رأس الرسالة */}
                          <div className="flex items-center gap-2 mb-2">
                            {!isOwnMessage && (
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            )}
                            <span className="font-semibold text-white text-sm">
                              {sender?.name || getSenderName(message.sender)}
                            </span>
                            <span className="text-white/40 text-xs">({sender?.role || getSenderRole(message.sender)})</span>
                            {isOwnMessage && (
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            )}
                          </div>

                          {/* محتوى الرسالة */}
                          <div className="text-white/80 mb-2">
                            {message.type === 'وثيقة' ? (
                              <div className="flex items-center gap-2 text-blue-400">
                                <span>📎</span>
                                <span>{message.message}</span>
                                <button className="text-xs bg-blue-500/20 px-2 py-1 rounded hover:bg-blue-500/30">
                                  تحميل
                                </button>
                              </div>
                            ) : (
                              message.message
                            )}
                          </div>

                          {/* تذييل الرسالة */}
                          <div className="flex justify-between items-center text-white/40 text-xs">
                            <span>{formatTime(message.timestamp)}</span>
                            {message.type !== 'نص' && (
                              <span className="px-2 py-1 rounded bg-white/10">
                                {message.type === 'وثيقة' && '📎 وثيقة'}
                                {message.type === 'تعليق' && '💡 تعليق'}
                                {message.type === 'سؤال' && '❓ سؤال'}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* إدخال الرسالة */}
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={sendDocument}
                      className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="إرسال وثيقة"
                    >
                      📎
                    </button>
                    <button
                      onClick={sendQuestion}
                      className="p-2 text-purple-400 hover:bg-purple-500/20 rounded-lg transition-colors"
                      title="إرسال سؤال"
                    >
                      ❓
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="اكتب رسالتك هنا..."
                    className="flex-1 p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-orange-400 focus:outline-none"
                  />
                  
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    إرسال
                  </button>
                </div>
                
                {/* أدوات إضافية للمدرس */}
                {isTeacher && (
                  <div className="flex gap-2 mt-3">
                    <button className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded hover:bg-yellow-500/30 transition-colors">
                      💡 إرسال ملاحظة
                    </button>
                    <button className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded hover:bg-red-500/30 transition-colors">
                      ⚠️ تنبيه
                    </button>
                    <button className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded hover:bg-green-500/30 transition-colors">
                      ✅ توجيه إيجابي
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}