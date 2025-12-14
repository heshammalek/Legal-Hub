'use client';

import React, { useState } from 'react';

interface VideoCard {
  id: string;
  category: string;
  icon: string;
  theme: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  title: string;
  description: string;
  highlights: string[];
  level: 'مبتدئ' | 'متوسط' | 'متقدم';
  duration: string;
  videoUrl?: string;
}

const HowToTab: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const videoCategories = [
    { id: 'all', name: 'الكورسات المتكاملة', icon: '🎯', count: 8 },
    { id: 'setup', name: 'الإعداد والتشغيل', icon: '⚙️', count: 3 },
    { id: 'ai', name: 'الذكاء الاصطناعي', icon: '🤖', count: 4 },
    { id: 'legal', name: 'الأدوات القانونية', icon: '⚖️', count: 3 },
    { id: 'advanced', name: 'الميزات المتقدمة', icon: '🚀', count: 2 },
  ];

  const videoCards: VideoCard[] = [
    {
      id: 'master-guide',
      category: 'all',
      icon: '👑',
      theme: 'from-purple-500 to-pink-500',
      author: {
        name: 'د. أحمد التقني',
        role: 'خبير أنظمة ذكية',
        avatar: '👨‍💻'
      },
      title: 'الدليل الشامل لـ Legal Hub',
      description: 'جولة كاملة في منصة الذكاء الاصطناعي القانوني - من البداية إلى الإحتراف',
      highlights: ['الإعداد الكامل', 'تحميل المستندات', 'البحث الدلالي', 'التحليل الذكي'],
      level: 'مبتدئ',
      duration: '45 دقيقة'
    },
    {
      id: 'ai-magic',
      category: 'ai',
      icon: '✨',
      theme: 'from-blue-500 to-cyan-400',
      author: {
        name: 'م. سارة الذكية',
        role: 'مطورة ذكاء اصطناعي',
        avatar: '👩‍🔬'
      },
      title: 'سحر الذكاء الاصطناعي في الخدمات القانونية',
      description: 'كيف يحول الـ AI العمل القانوني من تقليدي إلى ذكي ومبتكر',
      highlights: ['نماذج اللغة المتعددة', 'المعالجة الآلية', 'التصنيف الذكي', 'التنبؤات'],
      level: 'متوسط',
      duration: '32 دقيقة'
    },
    {
      id: 'search-pro',
      category: 'legal',
      icon: '🔍',
      theme: 'from-green-500 to-emerald-400',
      author: {
        name: 'أ. محمد المحامي',
        role: 'محامي ومستشار تقني',
        avatar: '👨‍⚖️'
      },
      title: 'إتقان البحث القانوني الذكي',
      description: 'تقنيات متقدمة للبحث في التشريعات عبر 22 دولة عربية',
      highlights: ['بحث دلالي', 'ترتيب النتائج', 'تصفية متقدمة', 'تحليل السياق'],
      level: 'متقدم',
      duration: '28 دقيقة'
    },
    {
      id: 'automation',
      category: 'advanced',
      icon: '⚡',
      theme: 'from-orange-500 to-red-500',
      author: {
        name: 'م. خالد الأتمتة',
        role: 'مهندس أتمتة العمليات',
        avatar: '👨‍💼'
      },
      title: 'أتمتة العمليات القانونية بالكامل',
      description: 'كيف تحول مكاتب المحاماة إلى منصات ذكية تعمل تلقائياً',
      highlights: ['سير العمل', 'المعالجة التلقائية', 'التقارير', 'التكامل'],
      level: 'متقدم',
      duration: '38 دقيقة'
    },
    {
      id: 'setup-easy',
      category: 'setup',
      icon: '🎮',
      theme: 'from-indigo-500 to-purple-400',
      author: {
        name: 'ت. لينا التقنية',
        role: 'أخصائية نظم وتقنية',
        avatar: '👩‍💻'
      },
      title: 'الإعداد في 10 دقائق فقط',
      description: 'دليل سريع ومبسط لإعداد النظام كامل من الصفر',
      highlights: ['تثبيت سريع', 'ضبط الإعدادات', 'ربط القواعد', 'اختبار الخدمات'],
      level: 'مبتدئ',
      duration: '15 دقيقة'
    },
    {
      id: 'multi-llm',
      category: 'ai',
      icon: '🔄',
      theme: 'from-teal-500 to-blue-400',
      author: {
        name: 'د. ياسمين البيانات',
        role: 'باحثة في تعلم الآلة',
        avatar: '👩‍🎓'
      },
      title: 'إدارة النماذج المتعددة بذكاء',
      description: 'كيف تختار النموذج الأمثل لكل مهمة قانونية تلقائياً',
      highlights: ['مقارنة النماذج', 'التوجيه الذكي', 'تحسين التكلفة', 'رفع الدقة'],
      level: 'متوسط',
      duration: '25 دقيقة'
    }
  ];

  const filteredVideos = selectedCategory === 'all' 
    ? videoCards 
    : videoCards.filter(video => video.category === selectedCategory);

  const getGradient = (theme: string) => {
    return `bg-gradient-to-r ${theme}`;
  };

  const getLevelColor = (level: string) => {
    switch(level) {
      case 'مبتدئ': return 'bg-green-100 text-green-800';
      case 'متوسط': return 'bg-blue-100 text-blue-800';
      case 'متقدم': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-white/20 mb-6">
          <span className="text-3xl">🎓</span>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            أكاديمية Legal Hub
          </h1>
          <span className="text-3xl">⚖️</span>
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          استعد لرحلة إبداعية في عالم الذكاء الاصطناعي القانوني. شاهد، تعلّم، وطوّر مهاراتك.
        </p>
      </div>

      {/* Categories Navigation */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {videoCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`group relative flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-500 ${
              selectedCategory === category.id
                ? 'bg-white shadow-2xl shadow-blue-200/50 border-2 border-blue-200 transform scale-105'
                : 'bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105 border border-white/40'
            }`}
          >
            <span className="text-2xl transition-transform duration-300 group-hover:scale-125">
              {category.icon}
            </span>
            <div className="text-left">
              <div className={`font-semibold ${
                selectedCategory === category.id 
                  ? 'text-blue-600' 
                  : 'text-gray-700'
              }`}>
                {category.name}
              </div>
              <div className="text-sm text-gray-500">{category.count} فيديو</div>
            </div>
            
            {/* Active Indicator */}
            {selectedCategory === category.id && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-pulse border-2 border-white"></div>
            )}
          </button>
        ))}
      </div>

      {/* Video Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            className="group relative bg-white rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-700 hover:scale-105 overflow-hidden border border-white/20"
          >
            {/* Header Gradient */}
            <div className={`${getGradient(video.theme)} h-32 relative overflow-hidden`}>
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute top-6 left-6 text-4xl bg-white/20 rounded-2xl p-3 backdrop-blur-sm">
                {video.icon}
              </div>
              <div className="absolute bottom-6 left-6">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(video.level)}`}>
                  {video.level}
                </span>
              </div>
              <div className="absolute top-6 right-6 text-white/80 text-sm bg-black/20 rounded-full px-3 py-1 backdrop-blur-sm">
                {video.duration}
              </div>
              
              {/* Animated Background Elements */}
              <div className="absolute -top-10 -right-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-5 -left-5 w-16 h-16 bg-white/10 rounded-full animate-pulse delay-1000"></div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Author */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center text-2xl">
                  {video.author.avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{video.author.name}</div>
                  <div className="text-sm text-gray-500">{video.author.role}</div>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                {video.title}
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                {video.description}
              </p>

              {/* Highlights */}
              <div className="flex flex-wrap gap-2 mb-6">
                {video.highlights.map((highlight, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full text-sm border border-gray-300/50"
                  >
                    {highlight}
                  </span>
                ))}
              </div>

              {/* CTA Button */}
              <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group">
                <span className="flex items-center justify-center gap-2">
                  <span>🎥 شاهد الفيديو</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              </button>
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 border-2 border-transparent bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none"></div>
          </div>
        ))}
      </div>

      {/* Stats Footer */}
      <div className="text-center mt-16">
        <div className="inline-grid grid-cols-2 md:grid-cols-4 gap-8 bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
          <div>
            <div className="text-3xl font-bold text-blue-600">{videoCards.length}+</div>
            <div className="text-gray-600">فيديو تعليمي</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600">7+</div>
            <div className="text-gray-600">ساعات محتوى</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">5</div>
            <div className="text-gray-600">مدربين محترفين</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600">3</div>
            <div className="text-gray-600">مستويات متدرجة</div>
          </div>
        </div>
      </div>

      {/* CSS Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap');
      `}</style>
      
    </div>
  );
};

export default HowToTab;