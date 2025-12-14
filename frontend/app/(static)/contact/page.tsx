'use client'

import { useState } from 'react'
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle,
  AlertCircle,
  Loader2,
  MessageSquare,
  Globe,
  HeadphonesIcon
} from 'lucide-react'
import Navbar from '@/components/common/Navbar'

// أنواع البيانات
interface ContactFormData {
  fullName: string
  email: string
  phone: string
  subject: string
  message: string
  contactMethod: 'email' | 'phone' | 'both'
  
}

interface ApiResponse {
  success: boolean
  message: string
  data?: any
}

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    contactMethod: 'email',
   
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  // تحديث بيانات النموذج
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // إرسال البيانات للباكند
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSubmitStatus({ type: null, message: '' })

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE}/v1/pages/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result: ApiResponse = await response.json()

      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: 'تم إرسال رسالتك بنجاح! سنتواصل معك في أقرب وقت ممكن.'
        })
        // إعادة تعيين النموذج
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          contactMethod: 'email'
        })
      } else {
        throw new Error(result.message || 'حدث خطأ في الإرسال')
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const contactInfo = [
    {
      icon: Phone,
      title: 'اتصل بنا',
      items: ['+20 123 456 7890', '+20 123 456 7891'],
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      icon: Mail,
      title: 'البريد الإلكتروني',
      items: ['info@legalhub.com', 'support@legalhub.com'],
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      icon: MapPin,
      title: 'العنوان',
      items: ['القاهرة، مصر', 'شارع التحرير، وسط البلد'],
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      icon: Clock,
      title: 'أوقات العمل',
      items: ['الأحد - الخميس: 9 صباحاً - 6 مساءً', 'الجمعة - السبت: مغلق'],
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    }
  ]

  const contactMethods = [
    { value: 'email', label: 'بريد إلكتروني', icon: Mail },
    { value: 'phone', label: 'مكالمة هاتفية', icon: Phone },
    { value: 'both', label: 'كلاهما', icon: MessageSquare }
  ]

  return (
    <div className="min-h-screen bg-gray-50 font-['Tajawal']" dir="rtl">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black/30"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            تواصل معنا
          </h1>
          <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            نحن هنا لمساعدتك في جميع احتياجاتك القانونية. تواصل معنا في أي وقت
          </p>
          <div className="flex items-center justify-center space-x-8 text-blue-200">
            <div className="flex items-center space-x-2">
              <HeadphonesIcon className="h-5 w-5" />
              <span>دعم 24/7</span>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>خدمة عالمية</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 -mt-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => {
              const IconComponent = info.icon
              return (
                <div
                  key={index}
                  className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-full h-1 bg-gradient-to-r ${info.color}`}></div>
                  <div className="relative z-10">
                    <div className={`w-16 h-16 ${info.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`h-8 w-8 ${info.iconColor}`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{info.title}</h3>
                    <div className="space-y-2">
                      {info.items.map((item, itemIndex) => (
                        <p key={itemIndex} className="text-gray-600 text-sm leading-relaxed">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">أرسل لنا رسالة</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              املأ النموذج أدناه وسنتواصل معك في أقرب وقت ممكن
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                
                {submitStatus.type && (
                  <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
                    submitStatus.type === 'success' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    {submitStatus.type === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    )}
                    <p className={`text-sm ${
                      submitStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {submitStatus.message}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* الاسم والايميل */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">
                        الاسم الكامل <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                        placeholder="أدخل اسمك الكامل"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">
                        البريد الإلكتروني <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                        placeholder="أدخل بريدك الإلكتروني"
                        required
                      />
                    </div>
                  </div>

                  {/* رقم الهاتف والموضوع */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">
                        رقم الهاتف <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                        placeholder="أدخل رقم هاتفك"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">
                        موضوع الرسالة <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                        placeholder="اختر موضوع الرسالة"
                        required
                      />
                    </div>
                  </div>

                  {/* طريقة التواصل المفضلة */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-4">
                      طريقة التواصل المفضلة
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {contactMethods.map((method) => {
                        const IconComponent = method.icon
                        return (
                          <label
                            key={method.value}
                            className={`cursor-pointer p-4 border-2 rounded-xl transition-all duration-300 ${
                              formData.contactMethod === method.value
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="contactMethod"
                              value={method.value}
                              checked={formData.contactMethod === method.value}
                              onChange={handleInputChange}
                              className="sr-only"
                            />
                            <div className="flex items-center space-x-3">
                              <IconComponent className={`h-5 w-5 ${
                                formData.contactMethod === method.value ? 'text-blue-600' : 'text-gray-400'
                              }`} />
                              <span className={`text-sm font-medium ${
                                formData.contactMethod === method.value ? 'text-blue-900' : 'text-gray-700'
                              }`}>
                                {method.label}
                              </span>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* الرسالة */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      الرسالة <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={6}
                      className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-gray-900 placeholder-gray-400"
                      placeholder="اكتب رسالتك هنا... أخبرنا كيف يمكننا مساعدتك"
                      required
                    />
                  </div>

                  {/* زر الإرسال */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-3"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>جاري الإرسال...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        <span>إرسال الرسالة</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-8">
              {/* Quick Contact */}
              <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-8 rounded-2xl text-white">
                <h3 className="text-2xl font-bold mb-4">تواصل سريع</h3>
                <p className="text-blue-100 mb-6 leading-relaxed">
                  هل تحتاج لمساعدة فورية؟ تواصل معنا مباشرة
                </p>
                <div className="space-y-4">
                  <a
                    href="tel:+201234567890"
                    className="flex items-center space-x-3 text-white hover:text-blue-200 transition-colors"
                  >
                    <Phone className="h-5 w-5" />
                    <span>+20 123 456 7890</span>
                  </a>
                  <a
                    href="mailto:info@legalhub.com"
                    className="flex items-center space-x-3 text-white hover:text-blue-200 transition-colors"
                  >
                    <Mail className="h-5 w-5" />
                    <span>info@legalhub.com</span>
                  </a>
                </div>
              </div>

              {/* FAQ */}
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4">أسئلة شائعة</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">كم يستغرق الرد على الرسائل؟</h4>
                    <p className="text-gray-600">نرد على جميع الرسائل خلال 24 ساعة كحد أقصى</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">هل الاستشارة الأولى مجانية؟</h4>
                    <p className="text-gray-600">نعم، نقدم استشارة أولية مجانية لمدة 30 دقيقة</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">ما هي لغات التواصل المتاحة؟</h4>
                    <p className="text-gray-600">نتحدث العربية والإنجليزية والفرنسية</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      

      {/* CSS Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap');
      `}</style>
    </div>
  )
}