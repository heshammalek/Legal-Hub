'use client';

import React, { useState } from 'react';

interface VideoTab {
  id: string;
  country: string;
  flag: string;
  author: {
    name: string;
    image: string;
    subscribers: string;
  };
  title: string;
  description: string;
  videoId: string;
  publishedDate: string;
  views: string;
  active?: boolean;
}

const HowToTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState('egypt');

  const videoTabs: VideoTab[] = [
    {
      id: 'egypt',
      country: 'الدليل الشامل',
      flag: '📚',
      author: {
        name: 'فريق Legal Hub',
        image: '/images/team.jpg',
        subscribers: 'خبراء تقنية قانونية'
      },
      title: '"الدليل الكامل لمنصة الذكاء الاصطناعي القانوني"',
      description: 'جولة متكاملة في جميع ميزات المنصة - من الإعداد الأساسي إلى الميزات المتقدمة',
      videoId: 'MASTER_GUIDE',
      publishedDate: 'يناير 15, 2025',
      views: '50K+ مشاهدة',
      active: true
    },
    {
      id: 'setup',
      country: 'الإعداد والتشغيل',
      flag: '⚙️',
      author: {
        name: 'مهندسو النظام',
        image: '/images/engineers.jpg',
        subscribers: 'متخصصون في النشر والتشغيل'
      },
      title: '"إعداد النظام في خطوات بسيطة"',
      description: 'شرح مفصل لعملية الإعداد والتكوين للنظام بالكامل',
      videoId: 'SETUP_GUIDE',
      publishedDate: 'يناير 12, 2025',
      views: '35K+ مشاهدة'
    },
    {
      id: 'ai',
      country: 'الذكاء الاصطناعي',
      flag: '🤖',
      author: {
        name: 'باحثو الذكاء الاصطناعي',
        image: '/images/ai-team.jpg',
        subscribers: 'متخصصون في تعلم الآلة'
      },
      title: '"تقنيات الذكاء الاصطناعي في الخدمات القانونية"',
      description: 'كيفية عمل النماذج اللغوية المتقدمة ونظام RAG المتكامل',
      videoId: 'AI_TECHNIQUES',
      publishedDate: 'يناير 10, 2025',
      views: '42K+ مشاهدة'
    },
    {
      id: 'search',
      country: 'البحث المتقدم',
      flag: '🔍',
      author: {
        name: 'محللو النظم',
        image: '/images/analysts.jpg',
        subscribers: 'خبراء في البحث الدلالي'
      },
      title: '"إتقان البحث الدلالي في التشريعات"',
      description: 'تقنيات البحث المتقدم والتصفية الذكية عبر القوانين العربية',
      videoId: 'SEARCH_TECHNIQUES',
      publishedDate: 'يناير 8, 2025',
      views: '28K+ مشاهدة'
    },
    {
      id: 'automation',
      country: 'الأتمتة',
      flag: '⚡',
      author: {
        name: 'خبراء الأتمتة',
        image: '/images/automation.jpg',
        subscribers: 'متخصصون في أتمتة العمليات'
      },
      title: '"أتمتة العمليات القانونية بالكامل"',
      description: 'كيف تحول المهام اليدوية إلى عمليات ذكية تلقائية',
      videoId: 'AUTOMATION_GUIDE',
      publishedDate: 'يناير 5, 2025',
      views: '33K+ مشاهدة'
    },
    {
      id: 'integration',
      country: 'التكامل',
      flag: '🔄',
      author: {
        name: 'مهندسو التكامل',
        image: '/images/integration.jpg',
        subscribers: 'متخصصون في أنظمة التكامل'
      },
      title: '"التكامل مع الأنظمة القضائية"',
      description: 'كيفية دمج النظام مع المنصات والأنظمة القائمة',
      videoId: 'INTEGRATION_GUIDE',
      publishedDate: 'يناير 3, 2025',
      views: '25K+ مشاهدة'
    },
    {
      id: 'analysis',
      country: 'التحليل',
      flag: '📊',
      author: {
        name: 'محللو البيانات',
        image: '/images/analytics.jpg',
        subscribers: 'خبراء في التحليل القانوني'
      },
      title: '"تقنيات التحليل الذكي للمستندات"',
      description: 'استخراج الرؤى وتحليل الأنماط في النصوص القانونية',
      videoId: 'ANALYSIS_TECHNIQUES',
      publishedDate: 'ديسمبر 30, 2024',
      views: '31K+ مشاهدة'
    }
  ];

  const activeVideo = videoTabs.find(tab => tab.id === activeTab) || videoTabs[0];

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/30 rounded-xl p-4 md:p-6 mb-12"> {/* ← فاصل مع الفوتر + خلفية محسنة */}
      
      
      {/* Active Tab Content */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-200/60 shadow-lg">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
          
          {/* Left Side - Info */}
          <div className="space-y-4 md:space-y-6 order-2 xl:order-1"> {/* ← ترتيب متجاوب */}
            
            {/* Author Info */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg shrink-0">
                {activeVideo.author.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 text-sm md:text-base truncate">{activeVideo.author.name}</div>
                <div className="text-xs md:text-sm text-gray-600 truncate">{activeVideo.author.subscribers}</div>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                {activeVideo.title}
              </h3>
              <p className="text-gray-700 leading-relaxed text-sm md:text-base lg:text-lg">
                {activeVideo.description}
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs md:text-sm text-gray-600">نشر في</div>
                  <div className="font-semibold text-gray-900 text-sm md:text-base">{activeVideo.publishedDate}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs md:text-sm text-gray-600">المشاهدات</div>
                  <div className="font-semibold text-gray-900 text-sm md:text-base">{activeVideo.views}</div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 md:py-4 px-4 md:px-6 rounded-lg font-semibold text-base md:text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 md:gap-3">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span>مشاهدة الفيديو التعليمي</span>
            </button>

             {/* Tabs Menu - أعلى الصفحة */}
      <div className="flex flex-wrap gap-2 mb-6 md:mb-8 justify-center"> {/* ← مركز + مسافات محسنة */}
        {videoTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center justify-between px-4 py-2 md:px-5 md:py-3 rounded-lg transition-all duration-300 border text-sm md:text-base ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg transform scale-105' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-base md:text-lg">{tab.flag}</span>
              <span className="font-medium whitespace-nowrap">{tab.country}</span>
            </div>
            <svg 
              className={`w-3 h-3 md:w-4 md:h-4 transition-transform duration-300 ${
                activeTab === tab.id ? 'text-white' : 'text-gray-400'
              }`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        ))}
      </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 pt-4 border-t border-gray-200">
              <div className="bg-blue-50 p-2 md:p-3 rounded-lg text-center border border-blue-200 shadow-sm">
                <div className="text-lg md:text-xl font-bold text-blue-600">{videoTabs.length}</div>
                <div className="text-xs text-gray-600 mt-1">فيديو شرح</div>
              </div>
              <div className="bg-green-50 p-2 md:p-3 rounded-lg text-center border border-green-200 shadow-sm">
                <div className="text-lg md:text-xl font-bold text-green-600">7+</div>
                <div className="text-xs text-gray-600 mt-1">ساعات محتوى</div>
              </div>
              <div className="bg-purple-50 p-2 md:p-3 rounded-lg text-center border border-purple-200 shadow-sm">
                <div className="text-lg md:text-xl font-bold text-purple-600">5</div>
                <div className="text-xs text-gray-600 mt-1">فرق متخصصة</div>
              </div>
              <div className="bg-orange-50 p-2 md:p-3 rounded-lg text-center border border-orange-200 shadow-sm">
                <div className="text-lg md:text-xl font-bold text-orange-600">200K+</div>
                <div className="text-xs text-gray-600 mt-1">مشاهدات إجمالية</div>
              </div>
            </div>

          </div>

          {/* Right Side - Video Placeholder */}
          <div className="relative order-1 xl:order-2"> {/* ← ترتيب متجاوب */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-2xl border-2 md:border-4 border-white">
              <div className="aspect-video bg-gray-800 flex items-center justify-center p-4">
                <div className="text-center text-white">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-lg">
                    <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-base md:text-xl font-semibold mb-1 md:mb-2">فيديو الشرح</div>
                  <div className="text-gray-300 text-xs md:text-sm">سيظهر هنا عند رفع الفيديو</div>
                </div>
              </div>
              
              {/* Video Info Bar */}
              <div className="bg-gray-900 p-3 md:p-4 border-t border-gray-700">
                <div className="flex justify-between items-center text-white">
                  <div className="font-semibold text-xs md:text-sm truncate pr-2">{activeVideo.title}</div>
                  <div className="flex items-center gap-1 md:gap-2 text-xs text-gray-300">
                    <span>⏱️ 15:30</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-2 -right-2 w-4 h-4 md:w-6 md:h-6 bg-blue-500 rounded-full animate-pulse border border-white"></div>
            <div className="absolute -bottom-2 -left-2 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full animate-pulse border border-white"></div>
          </div>

        </div>  
      </div>

    </div>
  );
};

export default HowToTab;