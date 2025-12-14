'use client'

import { useState, useEffect } from 'react'
import { 
  Scale, 
  Users, 
  FileText, 
  Shield, 
  Clock, 
  Star,
  ArrowRight,
  Map,
  Edit,
  BarChart3,
  Bot,
  ChevronDown
} from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/common/Navbar'
import Footer from '@/components/common/Footer'
import SponsorsSection from '@/components/common/SponsorsSection'
import PricingPlans from '@/components/common/PricingPlans'
import HowToTab from '@/components/common/HowToTab'

// مكون تأثير الكتابة المتحركة
const TypewriterText = () => {
  const [currentText, setCurrentText] = useState('للأفراد والمحامين')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [typingSpeed, setTypingSpeed] = useState(100)
  
  const texts = [
    'للأفراد والمحامين',
    'للقضاة والخبراء',
    'للمتخصصين القانونيين',
    'للمؤسسات والشركات'
  ]

  useEffect(() => {
    let timer: NodeJS.Timeout

    if (isDeleting) {
      timer = setTimeout(() => {
        setCurrentText(texts[currentIndex].substring(0, currentText.length - 1))
        setTypingSpeed(50)
      }, typingSpeed)
    } else {
      timer = setTimeout(() => {
        setCurrentText(texts[currentIndex].substring(0, currentText.length + 1))
        setTypingSpeed(100)
      }, typingSpeed)
    }

    if (!isDeleting && currentText === texts[currentIndex]) {
      setTimeout(() => setIsDeleting(true), 2000)
    } 
    else if (isDeleting && currentText === '') {
      setIsDeleting(false)
      setCurrentIndex((prevIndex) => (prevIndex + 1) % texts.length)
      setTypingSpeed(100)
    }

    return () => clearTimeout(timer)
  }, [currentText, isDeleting, currentIndex, texts, typingSpeed])

  return (
    <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
      {currentText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

export default function Homepage() {
  const [countersVisible, setCountersVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setCountersVisible(true)
          }
        })
      },
      { threshold: 0.3 }
    )

    const statsSection = document.getElementById('stats-section')
    if (statsSection) {
      observer.observe(statsSection)
    }

    return () => observer.disconnect()
  }, [])

  const Counter = ({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) => {
    const [count, setCount] = useState(0)

    useEffect(() => {
      if (!countersVisible) return

      let startTime: number
      let animationFrame: number

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        setCount(Math.floor(progress * end))
        
        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate)
        }
      }
      
      animationFrame = requestAnimationFrame(animate)

      return () => cancelAnimationFrame(animationFrame)
    }, [countersVisible, end, duration])

    return <span>{count.toLocaleString()}{suffix}</span>
  }

  const stats = [
    { label: "قضية تم حلها", value: 15420, icon: FileText },
    { label: "محام مسجل", value: 2840, icon: Users },
    { label: "قاض نشط", value: 156, icon: Scale },
    { label: "رضا العملاء", value: 98, suffix: "%", icon: Star }
  ]

  const services = [
    {
      icon: FileText,
      title: "إدارة القضايا",
      description: "نظام متطور لإدارة ومتابعة القضايا القانونية بكفاءة عالية",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Users,
      title: "شبكة المحامين",
      description: "منصة تربط بين المحامين والعملاء بطريقة مهنية وآمنة",
      color: "from-green-500 to-green-600"
    },
    {
      icon: Shield,
      title: "الأمان والخصوصية",
      description: "حماية متقدمة للبيانات مع التشفير والأمان العالي",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Clock,
      title: "متابعة مستمرة",
      description: "تحديثات فورية ومتابعة دقيقة لجميع الإجراءات القانونية",
      color: "from-orange-500 to-orange-600"
    }
  ]

  const heroFeatures = [
    { 
      title: "محامي طوارئ", 
      description: "خريطة تفاعلية تمكنك من إيجاد المحامي الأقرب إليك",
      icon: Map,
      color: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
    },
    { 
      title: "محرر نصوص ذكي", 
      description: "محرر نصوص قانوني متصل بمكتبة ضخمة ومدعوم بالذكاء الصناعي",
      icon: Edit,
      color: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
    },
    { 
      title: "داشبورد عصرية", 
      description: "مخصصة لكل محامٍ لإدارة عملائه والأتمتة والكالندر والإنابة",
      icon: BarChart3,
      color: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
    },
    { 
      title: "المستشار روبوت", 
      description: "نموذج ذكاء صناعي مدرب على النصوص القانونية في الدول المختلفة",
      icon: Bot,
      color: "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
    }
  ]

  return (
    <div className="min-h-screen bg-white font-['Tajawal']" dir="rtl">
      {/* استدعاء مكون Navbar منفصل */}
      <Navbar />

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900"></div>
        
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            منصة قانونية ذكية
            <br />
            <TypewriterText />
          </h1>
          
          <p className="text-xl sm:text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed">
            Legal Hub - حلول قانونية متطورة مدعومة بالذكاء الصناعي لخدمة العدالة
          </p>

          {/* Hero Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {heroFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className={`${feature.color} p-6 rounded-xl text-white transform hover:scale-105 transition-all duration-500 cursor-pointer shadow-2xl hover:shadow-xl`}
                >
                  <div className="relative">
                    <IconComponent className="h-10 w-10 mb-4 mx-auto transition-transform duration-300" />
                  </div>
                  <h3 className="text-lg font-bold mb-3">{feature.title}</h3>
                  <p className="text-sm opacity-90 leading-relaxed">{feature.description}</p>
                  <ArrowRight className="h-5 w-5 mt-4 mx-auto transition-transform duration-300" />
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup" className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
              ابدأ الآن
            </Link>
            <Link href="/login" className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-blue-600 transform hover:scale-105 transition-all duration-300 backdrop-blur-sm">
              تسجيل الدخول
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <a 
            href="#services"
            className="flex flex-col items-center text-white hover:text-blue-200 transition-colors"
          >
            <span className="text-sm mb-2">اكتشف المزيد</span>
            <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
              <ChevronDown className="h-5 w-5 mt-1" />
            </div>
          </a>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">خدماتنا المتميزة</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              نقدم مجموعة شاملة من الخدمات القانونية والقضائية المتطورة
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="relative z-10">
                    <div className={`w-16 h-16 bg-gradient-to-r ${service.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 relative">
                      {service.title}
                      <div className="absolute -bottom-2 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300"></div>
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{service.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section id="stats-section" className="py-16 bg-gradient-to-r from-blue-600 to-purple-700 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">أرقام تتحدث عن نفسها</h2>
            <div className="w-16 h-1 bg-white mx-auto mb-4"></div>
            <p className="text-lg text-blue-100">إنجازاتنا في خدمة العدالة</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div 
                  key={index} 
                  className="text-center group transform hover:scale-105 transition-transform duration-300"
                >
                  <div className="bg-white/10 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/20 transition-colors duration-300 shadow-lg">
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-white mb-2">
                    <Counter end={stat.value} suffix={stat.suffix || ""} />
                  </div>
                  <p className="text-blue-100 text-sm md:text-base">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sponsors Section - المكون المستقل */}
      <SponsorsSection />
      <PricingPlans/>
      <HowToTab/>
      <Footer />

      {/* إضافة خط Tajawal عبر CSS */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap');
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }
      `}</style>
    </div>
  )
}