'use client'

import Navbar from 'components/common/Navbar'
import Footer  from 'components/common/Footer'
import { Users, Target, ShieldCheck } from 'lucide-react'
import SponsorsSection from '@/components/common/SponsorsSection'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-['Tajawal']" dir="rtl">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 overflow-hidden">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <h1 className="text-5xl font-bold text-white mb-4">منصة Legal Hub</h1>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            انتقلنا بخدماتنا القانونية إلى مستوى جديد، نجمع بين الخبرة والتكنولوجيا لخدمة شاملة ومتميزة.
          </p>
          <div className="flex justify-center space-x-6 text-blue-200">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>رؤية واضحة</span>
            </div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5" />
              <span>احترافية وأمان</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900">مهمتنا ورؤيتنا</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto my-4" />
            <p className="text-gray-600 max-w-2xl mx-auto">
              نعمل على توفير وصول سريع وموثوق للخدمات القانونية، مع الالتزام بأعلى معايير الجودة والشفافية.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-transform hover:-translate-y-2">
              <Users className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-2xl font-semibold mb-2">فريق متخصص</h3>
              <p className="text-gray-600">
                نخبة من المحامين والخبراء القانونيين جاهزون لدعمك في كل خطوة.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-transform hover:-translate-y-2">
              <Target className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-2xl font-semibold mb-2">أهدافنا</h3>
              <p className="text-gray-600">
                تحقيق العدالة والوصول للخدمات القانونية بأقل جهد وتكلفة ممكنة.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-transform hover:-translate-y-2">
              <ShieldCheck className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-2xl font-semibold mb-2">قيمنا</h3>
              <p className="text-gray-600">
                النزاهة، الاحترافية، والسرية الكاملة في جميع تعاملاتنا.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-blue-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            مستعد لتجربة مختلفة؟
          </h3>
          <p className="text-gray-700 mb-6">
            انضم إلى آلاف المستخدمين الذين وثقوا بـ Legal Hub للحصول على استشاراتهم القانونية.
          </p>
          <a
            href="/signup"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
          >
            أنشئ حسابك الآن
          </a>
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
