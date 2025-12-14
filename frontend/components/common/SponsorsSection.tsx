'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'

const SponsorsSection = () => {
  const sponsors = [
    { name: 'مجلس الوزراء', logo: '/sponsors/cabinet.png' },
    { name: 'مبادرة مصر الرقمية', logo: '/sponsors/digital-egypt.jpg' },
    { name: 'جامعة القاهرة', logo: '/sponsors/cairo-university.png' },
    { name: 'محكمة النقض', logo: '/sponsors/court-of-cassation.png' },
    { name: 'المحكمة الدستورية', logo: '/sponsors/constitutional-court.png' },
    { name: 'نقابة المحامين', logo: '/sponsors/lawyers-syndicate.jpg' },
    { name: 'صندوق تحيا مصر', logo: '/sponsors/tahya-masr.webp' },
    { name: 'جامعة النيل', logo: '/sponsors/nile-university.jpg' },
    { name: 'جامعة عين شمس', logo: '/sponsors/ain-shams-university.jpg' },
    { name: 'وزارة الاتصالات', logo: '/sponsors/ministry-of-communications.png' }
  ]

  const [displayedSponsors, setDisplayedSponsors] = useState<any[]>([])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [usedSponsors, setUsedSponsors] = useState<Set<number>>(new Set())
  const [currentStage, setCurrentStage] = useState<'idle' | 'folding' | 'unfolding'>('idle')

  const generateRandomSponsors = () => {
    const availableSponsors = sponsors.filter((_, index) => !usedSponsors.has(index))
    
    if (availableSponsors.length === 0) {
      setUsedSponsors(new Set())
      return sponsors.sort(() => 0.5 - Math.random()).slice(0, 5)
    }

    const shuffled = [...availableSponsors].sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, 5)

    const newUsedSponsors = new Set(usedSponsors)
    selected.forEach(sponsor => {
      const index = sponsors.findIndex(s => s.name === sponsor.name)
      if (index !== -1) newUsedSponsors.add(index)
    })
    setUsedSponsors(newUsedSponsors)

    return selected
  }

  const startTransition = () => {
    setCurrentStage('folding')
    setIsTransitioning(true)
    
    setTimeout(() => {
      setDisplayedSponsors(generateRandomSponsors())
      setCurrentStage('unfolding')
      
      setTimeout(() => {
        setIsTransitioning(false)
        setCurrentStage('idle')
      }, 800)
    }, 800)
  }

  useEffect(() => {
    setDisplayedSponsors(generateRandomSponsors())

    const interval = setInterval(() => {
      startTransition()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getCardAnimation = (index: number) => {
    if (currentStage === 'folding') {
      return {
        transform: `rotateY(90deg) scale(0.8) translateY(${index * 10}px)`,
        opacity: 0,
        filter: 'blur(10px)'
      }
    }
    if (currentStage === 'unfolding') {
      return {
        transform: 'rotateY(0deg) scale(1) translateY(0px)',
        opacity: 1,
        filter: 'blur(0px)'
      }
    }
    return {}
  }

  const getLogoAnimation = (index: number) => {
    if (currentStage === 'folding') {
      return {
        transform: `rotate(-180deg) scale(0.5)`,
        opacity: 0
      }
    }
    if (currentStage === 'unfolding') {
      return {
        transform: 'rotate(0deg) scale(1)',
        opacity: 1
      }
    }
    return {}
  }

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* تأثيرات الخلفية */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse-slow" />
      <div className="absolute top-10 left-1/4 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-float-reverse" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
            الرعاة والداعمون
          </h2>
          <div className="w-32 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mb-6 rounded-full shadow-lg" />
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            شركاء النجاح في رحلتنا نحو تحسين النظام القانوني
          </p>
        </div>

        {/* شبكة الرعاء مع أنيميشن متطور */}
        <div className="flex justify-center items-center min-h-[280px] perspective-1000">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 w-full max-w-6xl">
            {displayedSponsors.map((sponsor, index) => (
              <div
                key={`${sponsor.name}-${index}`}
                className="relative group"
                style={{
                  transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.1}s`,
                  ...getCardAnimation(index)
                }}
              >
                {/* تأثير الظل المتحرك */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-1000 transform group-hover:scale-110" />
                
                {/* البطاقة الرئيسية */}
                <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white/20 transform transition-all duration-700 group-hover:scale-105 group-hover:shadow-3xl group-hover:bg-white">
                  {/* الدائرة المتحركة */}
                  <div 
                    className="relative w-24 h-24 mx-auto mb-5"
                    style={{
                      transition: `all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) ${index * 0.15}s`,
                      ...getLogoAnimation(index)
                    }}
                  >
                    {/* حلقة متحركة */}
                    <div className="absolute inset-0 border-4 border-blue-200/50 rounded-full animate-spin-slow" />
                    <div className="absolute inset-2 border-2 border-purple-200/50 rounded-full animate-spin-slow-reverse" />
                    
                    {/* الصورة */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center overflow-hidden shadow-inner">
                      <Image
                        src={sponsor.logo}
                        alt={sponsor.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-contain p-3 transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = 'text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent';
                            fallback.textContent = sponsor.name.split(' ')[0].charAt(0);
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    </div>
                    
                    {/* نقاط متحركة */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-500 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
                  </div>

                  {/* الاسم */}
                  <h3 className="text-center font-bold text-gray-800 transition-all duration-500 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transform group-hover:translate-y-1">
                    {sponsor.name}
                  </h3>
                  
                  {/* خط متحرك */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 group-hover:w-3/4 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* مؤشر تقدم متطور */}
        <div className="flex justify-center mt-16 space-x-4">
          {[1, 2, 3, 4, 5].map((dot, index) => (
            <div
              key={dot}
              className="relative"
            >
              <div 
                className={`w-4 h-4 rounded-full transition-all duration-1000 transform ${
                  isTransitioning 
                    ? 'bg-gradient-to-r from-blue-400 to-purple-400 scale-125 rotate-180' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 scale-100 rotate-0'
                }`}
                style={{
                  animation: `glow 2s infinite ${index * 0.2}s`
                }}
              />
              <div className="absolute inset-0 w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-ping" />
            </div>
          ))}
        </div>
      </div>

      {/* أنيميشن مخصص */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(20px) rotate(-180deg); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes spin-slow-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        
        @keyframes glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 30px rgba(147, 51, 234, 0.8);
            transform: scale(1.1);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        
        .animate-float-reverse {
          animation: float-reverse 10s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 15s linear infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </section>
  )
}

export default SponsorsSection