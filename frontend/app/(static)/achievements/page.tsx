'use client'

import Navbar from 'components/common/Navbar'
import Footer from 'components/common/Footer'

import { Trophy, Calendar, Award, UserCheck } from 'lucide-react'
import SponsorsSection from '@/components/common/SponsorsSection'

export default function AchievementsPage() {
  const milestones = [
    { year: '2025', icon: Calendar, text: 'تأسيس المنصة وبداية رحلة الابتكار.' },
    { year: '2026', icon: Award, text: 'إطلاق ميزة الاستشارات المباشرة وخدمة 500 مستخدم.' },
    { year: '2027', icon: UserCheck, text: 'تعاون مع 200 مكتب محاماة وشراكات استراتيجية.' },
    { year: '2028', icon: Trophy, text: 'جائزة أفضل منصة قانونية في الشرق الأوسط.' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 font-['Tajawal']" dir="rtl">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 bg-gradient-to-br from-purple-900 via-purple-800 to-blue-800 overflow-hidden">
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <h1 className="text-5xl font-bold text-white mb-4">إنجازاتنا</h1>
          <p className="text-xl text-purple-200 mb-8 leading-relaxed">
            فخورون بما حققناه وما نطمح إليه في رحلة تطوير العدالة الرقمية.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-12">
            {milestones.map((m, idx) => {
              const Icon = m.icon
              const isLeft = idx % 2 === 0
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isLeft ? 'md:flex-row-reverse' : 'md:flex-row'} items-center`}
                >
                  <div className="md:w-1/3 text-center mb-4 md:mb-0">
                    <span className="text-3xl font-bold text-gray-900">{m.year}</span>
                  </div>
                  <div className="md:w-2/3 bg-white p-6 rounded-2xl shadow-lg flex items-center gap-4">
                    <Icon className="h-8 w-8 text-purple-600" />
                    <p className="text-gray-700 leading-relaxed">{m.text}</p>
                  </div>
                </div>
              )
            })}
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
