'use client'

import Navbar from 'components/common/Navbar'
import Footer  from 'components/common/Footer'
import { BookOpen, FileText, ClipboardList, Users } from 'lucide-react'
import SponsorsSection from '@/components/common/SponsorsSection'

export default function ServicesPage() {
  const services = [
    {
      icon: BookOpen,
      title: 'صياغة العقود',
      desc: 'نقوم بإعداد ومراجعة كافة أنواع العقود التجارية والمدنية بدقة عالية.'
    },
    {
      icon: ClipboardList,
      title: 'البحث القانوني',
      desc: 'فريقنا يقدم بحوث قانونية عميقة لدعم قضيتك أو مشروعك.'
    },
    {
      icon: FileText,
      title: 'تقديم الاستشارات',
      desc: 'استشارة فورية مع خبرائنا لتوجيهك نحو القرار القانوني الأمثل.'
    },
    {
      icon: Users,
      title: 'دعم التقاضي',
      desc: 'متابعة الإجراءات القانونية وتقديم الدعم أثناء التقاضي أمام المحاكم.'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 font-['Tajawal']" dir="rtl">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 bg-gradient-to-br from-green-900 via-green-800 to-blue-900 overflow-hidden">
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <h1 className="text-5xl font-bold text-white mb-4">خدماتنا</h1>
          <p className="text-xl text-green-200 mb-8 leading-relaxed">
            نقدم مجموعة متكاملة من الخدمات القانونية لتغطية كل احتياجاتك.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((svc, i) => {
              const Icon = svc.icon
              return (
                <div
                  key={i}
                  className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-transform hover:-translate-y-2"
                >
                  <Icon className="h-10 w-10 text-green-600 mb-4" />
                  <h3 className="text-2xl font-semibold mb-2">{svc.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{svc.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="text-4xl font-bold text-green-600">1,200+</h4>
              <p className="text-gray-600 mt-2">عقد مُنَجز</p>
            </div>
            <div>
              <h4 className="text-4xl font-bold text-blue-600">950+</h4>
              <p className="text-gray-600 mt-2">بحث قانوني</p>
            </div>
            <div>
              <h4 className="text-4xl font-bold text-purple-600">3,400+</h4>
              <p className="text-gray-600 mt-2">استشارة مقدمة</p>
            </div>
          </div>
        </div>
      </section>


{/* Sponsors Section - المكون المستقل */}
      <SponsorsSection />
      {/* Global Font Import */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap');
      `}</style>
    </div>
  )
}
