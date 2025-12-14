// frontend/app/components/common/PricingPlans.tsx
'use client'

import { useState } from 'react'
import { FaCheck, FaCrown, FaStar, FaRocket, FaPhone } from 'react-icons/fa'

export default function PricingPlans() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const plans = [
    {
      id: 'basic',
      name: 'الباقة الأساسية',
      description: 'مناسبة للمحامين المبتدئين',
      monthlyPrice: 100,
      yearlyPrice: 600, // توفير 50%
      currency: 'ج.م',
      popular: false,
      icon: FaStar,
      features: [
        'نظام ادارة قضايا متطور جدا وبعدد غير محدود',
        ' عدد غير محدود من تلقي الاستشارات  ',
        'خريطة تفاعلية لاتاحتك في نظام الطواريء   ',
        'دعم فني عبر البريد الإلكتروني',
        'الوصول إلى مكتبة الوثائق ',
        'إنشاء وتحرير المستندات القانونية',
        'منتدي قانوني متخصص للتعلم وتبادل الخبرات   ',
        'مساحة تخزين 10 جيجابايت',
        
      ],
      buttonText: 'ابدأ مجاناً',
      buttonVariant: 'outline'
    },
    {
      id: 'professional',
      name: 'الباقة الاحترافية',
      description: 'الأكثر شيوعاً بين المحامين المحترفين',
      monthlyPrice: 250,
      yearlyPrice: 1500, // توفير 50%
      currency: 'ج.م',
      popular: true,
      icon: FaCrown,
      features: [
        'قضايا غير محدودة',
        'استشارات قانونية وطلبات طواريء غير محدودة',
        'مساحة تخزين ٥٠ جيجابايت',
        'دعم فني مميز على مدار الساعة',
        ' مكتبات الوثائق المدعومة بالذكاء الصناعي',
        'ادوات الترجمة القانونية ',
        'الكاليندر والروبوت القانوني    ',
        'نسخ احتياطي تلقائي للبيانات'
      ],
      buttonText: 'جرب مجاناً ١٤ يوماً',
      buttonVariant: 'primary'
    },
    {
      id: 'enterprise',
      name: 'باقة المؤسسات والشركات ',
      description: '   بديلك الذكي لفريق قانوني كامل',
      monthlyPrice: 999,
      yearlyPrice: 9999, // توفير 15%
      currency: 'ج.م',
      popular: false,
      icon: FaRocket,
      features: [
        'جميع ميزات الباقة الاحترافية',
        'مساحة تخزين غير محدودة',
        'تقارير أداء متقدمة وتحليلات',
        'دعم فني مخصص مع مستشار مدير حساب',
        'تكامل مع أنظمة المحاكم',
        'أدوات التعاون بين الفريق',
        'روبوت قانوني مدرب بالذكاء الصناعي   ',
        'مكتبة الصيغ - المحرر - الترجمة -الكاليندر -الاوتوميشن  '
      ],
      buttonText: 'اتصل بالبيع',
      buttonVariant: 'outline'
    }
  ]

  const getPrice = (plan: typeof plans[0]) => {
    return billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
  }

  const getSavings = (plan: typeof plans[0]) => {
    if (billingPeriod === 'yearly') {
      const monthlyTotal = plan.monthlyPrice * 12
      const savings = monthlyTotal - plan.yearlyPrice
      return savings
    }
    return 0
  }

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4">
        {/* العنوان */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
            خطط مرنة تناسب جميع احتياجاتك القانونية
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            اختر الباقة التي تناسب ممارستك القانونية. جميع الخطط تشمل أحدث الأدوات التقنية 
            لدعم عملك وزيادة إنتاجيتك.
          </p>
        </div>

        {/* تبديل الفترة */}
        <div className="flex justify-center mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-2 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                الدفع الشهري
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  billingPeriod === 'yearly'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                 سنويا
                <span className="mr-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                 وفر حتي 50% 
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* البطاقات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const IconComponent = plan.icon
            const price = getPrice(plan)
            const savings = getSavings(plan)
            
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl transition-all duration-300 hover:scale-105 ${
                  plan.popular
                    ? 'bg-gradient-to-br from-blue-600 to-purple-700 text-white shadow-2xl border-0'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-xl border border-gray-200 dark:border-gray-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-400 text-gray-900 px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      ⭐ الأكثر شهرة
                    </span>
                  </div>
                )}

                <div className="p-8">
                  {/* الرأس */}
                  <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                      <div className={`p-3 rounded-full ${
                        plan.popular 
                          ? 'bg-white/20' 
                          : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        <IconComponent className={`text-2xl ${
                          plan.popular ? 'text-white' : 'text-blue-600'
                        }`} />
                      </div>
                    </div>
                    <h3 className={`text-2xl font-bold mb-2 ${
                      plan.popular ? 'text-white' : 'text-gray-800 dark:text-white'
                    }`}>
                      {plan.name}
                    </h3>
                    <p className={`text-sm ${
                      plan.popular ? 'text-blue-100' : 'text-gray-600 dark:text-gray-300'
                    }`}>
                      {plan.description}
                    </p>
                  </div>

                  {/* السعر */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-bold">{price}</span>
                      <span className="text-lg opacity-80">{plan.currency}</span>
                    </div>
                    <div className="text-sm mt-2">
                      {billingPeriod === 'monthly' ? 'شهرياً' : 'سنوياً'}
                    </div>
                    {savings > 0 && (
                      <div className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full mt-2 inline-block">
                        وفر {savings} {plan.currency}
                      </div>
                    )}
                  </div>

                  {/* الميزات */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <FaCheck className={`mt-1 flex-shrink-0 ${
                          plan.popular ? 'text-yellow-400' : 'text-green-500'
                        }`} />
                        <span className="text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* زر الاشتراك */}
                  <button
                    className={`w-full py-4 rounded-xl font-bold transition-all ${
                      plan.popular
                        ? 'bg-white text-blue-600 hover:bg-gray-100 hover:shadow-lg'
                        : plan.buttonVariant === 'primary'
                        ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                        : 'bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

          {/* قسم الخدمات المتقدمة للجهات التشريعية */}
          <div className="my-16">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">
                  🧠 خدمات البحث التشريعي المتقدمة بالذكاء الاصطناعي
                </h2>
                <p className="text-emerald-100 text-lg max-w-4xl mx-auto">
                  نظام ذكي متكامل لتحليل البيانات التشريعية والتنبؤ بالتطورات القانونية، 
                  مدعوم بأحدث تقنيات الذكاء الاصطناعي في المجال القانوني
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold mb-3">تحليل التعارضات التشريعية</h3>
                  <p className="text-emerald-100 text-sm">
                    كشف التناقضات والتداخلات بين القوانين واللوائح المختلفة باستخدام الذكاء الاصطناعي
                  </p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold mb-3">التنبؤ بالتطور التشريعي</h3>
                  <p className="text-emerald-100 text-sm">
                    توقع اتجاهات التعديلات القانونية المستقبلية بناءً على تحليل الأنماط التاريخية
                  </p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold mb-3">التقييم الشامل للتشريعات</h3>
                  <p className="text-emerald-100 text-sm">
                    تحليل تأثير القوانين الجديدة على القضايا السابقة وتقديم تقارير تقييمية شاملة
                  </p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold mb-3">الإحصاءات الذكية</h3>
                  <p className="text-emerald-100 text-sm">
                    تحليلات إحصائية متقدمة للبيانات القضائية والتشريعية مدعومة بتعلم الآلة
                  </p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-emerald-200 mb-4 text-lg">
                  👥 متوفر للجهات الحكومية - المراكز البحثية - الجامعات - المؤسسات الدولية
                </p>
                <button className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-3 mx-auto">
                  <FaPhone />
                  اتصل بفريق المبيعات المتخصص
                </button>
              </div>
            </div>
          </div>

        {/* ملاحظة ختامية */}
        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-300">
            🔒 جميع الخطط تشمل تشفير البيانات وأمان متقدم. 
            <span className="text-blue-600 font-medium mr-2">
              جرب أي خطة مجاناً لمدة ١٤ يوماً
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}