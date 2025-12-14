'use client'

import React, { useState, useEffect, useRef } from 'react'

interface Country {
  code: string
  name: string 
  flag: string
}

// نعدل الـ interface ليتوافق مع الـ Backend
interface AIModel {
  model_name: string        // تغيير من id إلى model_name
  country_code: string
  version: string
  accuracy: number
  is_active: boolean
  description?: string      // إضافة حقل اختياري
}

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  citations?: string[]
  confidence?: number
}

export default function AskRobotTab() {
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [conversation, setConversation] = useState<Message[]>([])
  const [availableModels, setAvailableModels] = useState<AIModel[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isTyping, setIsTyping] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const countries: Country[] = [
    { code: 'SA', name: 'المملكة العربية السعودية', flag: '🇸🇦' },
    { code: 'AE', name: 'دولة الإمارات العربية المتحدة', flag: '🇦🇪' },
    { code: 'EG', name: 'جمهورية مصر العربية', flag: '🇪🇬' },
    { code: 'QA', name: 'دولة قطر', flag: '🇶🇦' },
    { code: 'KW', name: 'دولة الكويت', flag: '🇰🇼' },
    { code: 'BH', name: 'مملكة البحرين', flag: '🇧🇭' },
    { code: 'OM', name: 'سلطنة عُمان', flag: '🇴🇲' },
  ]

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation, isTyping])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [message])

  // Fetch available models
  useEffect(() => {
    fetchAvailableModels()
  }, [])

  // Filter models when country changes
  useEffect(() => {
    if (selectedCountry && availableModels.length > 0) {
      const countryModels = availableModels.filter(model => model.country_code === selectedCountry)
      if (countryModels.length > 0 && !selectedModel) {
        setSelectedModel(countryModels[0].model_name) // استخدام model_name بدلاً من id
      }
    }
  }, [selectedCountry, availableModels, selectedModel])

  const fetchAvailableModels = async () => {
    try {
      setError('')
      console.log('🔄 جاري جلب النماذج المتاحة...')
      
      const response = await fetch('/api/v1/ai/available-models')
      
      if (!response.ok) {
        throw new Error(`فشل في جلب النماذج: ${response.status}`)
      }
      
      const models = await response.json()
      console.log('✅ النماذج المستلمة:', models)
      
      setAvailableModels(Array.isArray(models) ? models : [])
    } catch (error) {
      console.error('Error fetching models:', error)
      setError('تعذر تحميل النماذج المتاحة - استخدام النماذج الافتراضية')
      setAvailableModels(getDefaultModels())
    }
  }

  const getDefaultModels = (): AIModel[] => [
    {
      model_name: "legal_model_sa", // استخدام model_name بدلاً من id
      country_code: "SA",
      version: "1.0",
      accuracy: 0.87,
      is_active: true,
      description: "مدرب على الأنظمة واللوائح السعودية"
    },
    {
      model_name: "legal_model_ae", // استخدام model_name بدلاً من id
      country_code: "AE",
      version: "1.0", 
      accuracy: 0.84,
      is_active: true,
      description: "مدرب على القوانين الاتحادية والمحلية"
    },
    {
      model_name: "legal_model_eg", // استخدام model_name بدلاً من id
      country_code: "EG",
      version: "1.0",
      accuracy: 0.82,
      is_active: true,
      description: "مدرب على التشريعات والقوانين المصرية"
    }
  ]

  const simulateTyping = async (message: string, delay: number = 30): Promise<void> => {
    return new Promise((resolve) => {
      let index = 0
      const typingInterval = setInterval(() => {
        if (index < message.length) {
          setConversation(prev => {
            const newConv = [...prev]
            const lastMessage = newConv[newConv.length - 1]
            if (lastMessage && lastMessage.type === 'ai') {
              lastMessage.content = message.substring(0, index + 1)
            }
            return newConv
          })
          index++
        } else {
          clearInterval(typingInterval)
          resolve()
        }
      }, delay)
    })
  }

  const sendMessage = async () => {
    if (!message.trim() || !selectedCountry || !selectedModel || isLoading) return

    setIsLoading(true)
    setError('')
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message.trim(),
      timestamp: new Date()
    }
    
    setConversation(prev => [...prev, userMessage])
    const currentMessage = message
    setMessage('')

    try {
      // Add temporary AI message
      const tempAiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '',
        timestamp: new Date()
      }
      setConversation(prev => [...prev, tempAiMessage])
      setIsTyping(true)

      console.log('🔄 إرسال الاستفسار:', {
        query: currentMessage,
        country_code: selectedCountry,
        model_name: selectedModel
      })

      const response = await fetch('/api/v1/ai/ask-robot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: currentMessage,
          country_code: selectedCountry,
          model_name: selectedModel
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`فشل في الحصول على الإجابة: ${response.status} - ${errorText}`)
      }
      
      const result = await response.json()
      console.log('✅ نتيجة الاستفسار:', result)
      
      // Simulate typing effect
      await simulateTyping(result.answer)
      
      // Update the AI message with final content and citations
      setConversation(prev => prev.map(msg => 
        msg.id === tempAiMessage.id 
          ? { 
              ...msg, 
              content: result.answer, 
              citations: result.citations, 
              confidence: result.confidence 
            }
          : msg
      ))
      
    } catch (error) {
      console.error('Error sending message:', error)
      setError('عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.')
      
      // Remove temporary message and show error
      setConversation(prev => prev.filter(msg => msg.id !== (Date.now() + 1).toString()))
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: '⚠️ عذراً، حدث خطأ في الاتصال. يرجى التحقق من اتصال الشبكة والمحاولة مرة أخرى.',
        timestamp: new Date()
      }
      setConversation(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearConversation = () => {
    setConversation([])
    setError('')
  }

  const getCountryName = (code: string) => {
    return countries.find(c => c.code === code)?.name || code
  }

  const getModelName = (name: string) => {
    return availableModels.find(m => m.model_name === name)?.model_name || name
  }

  const getModelDescription = (name: string) => {
    return availableModels.find(m => m.model_name === name)?.description || 'نموذج مساعد قانوني متخصص'
  }

  const getCountryFlag = (code: string) => {
    return countries.find(c => c.code === code)?.flag || '🏳️'
  }

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500'
    if (confidence >= 0.8) return 'text-green-500'
    if (confidence >= 0.6) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getConfidenceText = (confidence?: number) => {
    if (!confidence) return 'غير معروف'
    if (confidence >= 0.8) return 'عالي'
    if (confidence >= 0.6) return 'متوسط'
    return 'منخفض'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-white/20">
            <div className="text-4xl">⚖️</div>
            <div className="text-right">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                المساعد القانوني الذكي
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                استشارات قانونية مدعومة بالذكاء الاصطناعي - دقة وموثوقية
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Country & Model Selection */}
          <div className="lg:col-span-1 space-y-6">
            {/* Country Selection */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 transform hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-xl">
                  <span className="text-2xl">🌍</span>
                </div>
                <div className="text-right flex-1">
                  <h3 className="font-bold text-gray-800 dark:text-white">اختر الدولة</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">النظام القانوني المستهدف</p>
                </div>
              </div>
              
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-inner"
              >
                <option value="">اختر الدولة...</option>
                {countries.map(country => (
                  <option key={country.code} value={country.code} className="text-right">
                    {country.flag} {country.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Selection */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 transform hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-xl">
                  <span className="text-2xl">🤖</span>
                </div>
                <div className="text-right flex-1">
                  <h3 className="font-bold text-gray-800 dark:text-white">النموذج الذكي</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">المساعد المتخصص</p>
                </div>
              </div>
              
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={!selectedCountry}
                className="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 shadow-inner disabled:opacity-50"
              >
                <option value="">
                  {selectedCountry ? 'اختر النموذج...' : 'اختر الدولة أولاً'}
                </option>
                {availableModels && availableModels
                  .filter(model => model.country_code === selectedCountry)
                  .map(model => (
                    <option key={model.model_name} value={model.model_name} className="text-right">
                      {model.model_name} - دقة {(model.accuracy * 100).toFixed(0)}%
                    </option>
                  ))
                }
              </select>

              {selectedModel && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="text-right">
                    <h4 className="font-semibold text-green-800 dark:text-green-300">
                      {getModelName(selectedModel)}
                    </h4>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      {getModelDescription(selectedModel)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${(availableModels.find(m => m.model_name === selectedModel)?.accuracy || 0) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        {((availableModels.find(m => m.model_name === selectedModel)?.accuracy || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <h3 className="font-bold text-gray-800 dark:text-white mb-4 text-right">⚡ إجراءات سريعة</h3>
              <div className="space-y-3">
                <button
                  onClick={clearConversation}
                  disabled={conversation.length === 0}
                  className="w-full p-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 rounded-xl text-right text-gray-700 dark:text-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                >
                  🗑️ مسح المحادثة
                </button>
                
                <button
                  onClick={fetchAvailableModels}
                  className="w-full p-3 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 hover:from-blue-200 hover:to-blue-300 dark:hover:from-blue-800/30 dark:hover:to-blue-700/30 rounded-xl text-right text-blue-700 dark:text-blue-300 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                >
                  🔄 تحديث النماذج
                </button>
                
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <p className="text-red-600 dark:text-red-400 text-sm text-right">⚠️ {error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                      <span className="text-2xl">💬</span>
                    </div>
                    <div className="text-right">
                      <h2 className="font-bold text-gray-800 dark:text-white">المحادثة القانونية</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {selectedCountry ? `النظام القانوني: ${getCountryName(selectedCountry)} ${getCountryFlag(selectedCountry)}` : 'اختر الدولة لبدء المحادثة'}
                      </p>
                    </div>
                  </div>
                  
                  {conversation.length > 0 && (
                    <div className="text-left">
                      <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        {conversation.filter(m => m.type === 'user').length} رسالة
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50">
                {conversation.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="text-6xl mb-4">👨‍⚖️</div>
                    <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-2">
                      مرحباً بك في المساعد القانوني
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md">
                      اختر الدولة والنموذج الذكي من القائمة، ثم ابدأ بمحادثة قانونية متخصصة
                    </p>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg">
                      {['ما هي شروط رفع الدعوى؟', 'كيفية إثبات الملكية؟', 'عقوبة المخالفات المرورية', 'شروط إنهاء العقد'].map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setMessage(suggestion)}
                          className="p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl text-blue-700 dark:text-blue-300 text-sm transition-all duration-200 border border-blue-200 dark:border-blue-800"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  conversation.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-4 relative transition-all duration-300 ${
                          msg.type === 'user'
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 rounded-br-md'
                            : 'bg-gradient-to-br from-gray-100 to-white dark:from-gray-700 dark:to-gray-800 text-gray-800 dark:text-gray-200 shadow-lg shadow-gray-500/10 dark:shadow-gray-900/50 rounded-bl-md border border-gray-200/50 dark:border-gray-600/50'
                        }`}
                      >
                        {/* Message Content */}
                        <p className="text-right leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        
                        {/* Message Footer */}
                        <div className={`flex items-center justify-between mt-3 pt-3 ${
                          msg.type === 'user' ? 'border-blue-400/30' : 'border-gray-300/50 dark:border-gray-600/50'
                        } border-t`}>
                          <div className="text-xs opacity-70">
                            {msg.timestamp.toLocaleTimeString('ar-EG', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                          
                          {msg.type === 'ai' && msg.confidence && (
                            <div className="text-xs flex items-center gap-1">
                              <span className={getConfidenceColor(msg.confidence)}>
                                الثقة: {getConfidenceText(msg.confidence)}
                              </span>
                              <div className={`w-2 h-2 rounded-full ${getConfidenceColor(msg.confidence)}`}></div>
                            </div>
                          )}
                        </div>
                        
                        {/* Citations */}
                        {msg.type === 'ai' && msg.citations && msg.citations.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-300/50 dark:border-gray-600/50">
                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 text-right">📚 المراجع القانونية:</p>
                            <div className="space-y-1">
                              {msg.citations.map((citation, idx) => (
                                <p 
                                  key={idx} 
                                  className="text-xs text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg text-right border border-gray-200 dark:border-gray-700"
                                >
                                  📄 {citation}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start animate-pulse">
                    <div className="bg-gradient-to-br from-gray-100 to-white dark:from-gray-700 dark:to-gray-800 rounded-2xl rounded-bl-md p-4 shadow-lg">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm">جاري الكتابة...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-b-2xl">
                <div className="flex gap-3">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="اكتب استفسارك القانوني هنا... (اضغط Enter للإرسال)"
                    disabled={isLoading || !selectedCountry || !selectedModel}
                    rows={1}
                    className="flex-1 p-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl resize-none text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-inner disabled:opacity-50 min-h-[60px] max-h-[120px]"
                  />
                  
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !selectedCountry || !selectedModel || !message.trim()}
                    className="self-end px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:scale-100 disabled:shadow-md disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>جاري المعالجة...</span>
                      </>
                    ) : (
                      <>
                        <span>إرسال</span>
                        <span className="text-lg">🚀</span>
                      </>
                    )}
                  </button>
                </div>
                
                {(!selectedCountry || !selectedModel) && (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <p className="text-amber-700 dark:text-amber-400 text-sm text-right flex items-center gap-2 justify-end">
                      <span>⚠️</span>
                      يرجى اختيار الدولة والنموذج الذكي لبدء المحادثة
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '⚡',
              title: 'استجابة فورية',
              description: 'إجابات قانونية دقيقة في ثوانٍ'
            },
            {
              icon: '🌍',
              title: 'تعدد الأنظمة',
              description: 'دعم القوانين المحلية والدولية'
            },
            {
              icon: '🔒',
              title: 'موثوقية عالية',
              description: 'مستند إلى مصادر قانونية معتمدة'
            }
          ].map((feature, index) => (
            <div 
              key={index}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-bold text-gray-800 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}