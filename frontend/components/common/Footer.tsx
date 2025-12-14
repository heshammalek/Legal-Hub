'use client'

import { Scale, Phone, Mail, MapPin, Clock } from 'lucide-react'
import {
  FaFacebookF,
  FaTwitter,
  FaYoutube,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
} from 'react-icons/fa'
import Link from 'next/link'

export default function Footer() {
  const socialMedia = [
    { name: 'Facebook', icon: FaFacebookF, color: 'hover:bg-blue-600', url: '#' },
    { name: 'Twitter', icon: FaTwitter, color: 'hover:bg-blue-400', url: '#' },
    { name: 'YouTube', icon: FaYoutube, color: 'hover:bg-red-600', url: '#' },
    { name: 'Instagram', icon: FaInstagram, color: 'hover:bg-pink-600', url: '#' },
    { name: 'LinkedIn', icon: FaLinkedinIn, color: 'hover:bg-blue-700', url: '#' },
    { name: 'TikTok', icon: FaTiktok, color: 'hover:bg-black', url: '#' },
  ]

  return (
    <footer id="contact" className="bg-gradient-to-b from-gray-900 to-black text-white py-16 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Company Info */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Scale className="h-10 w-10 text-blue-400" />
                  <div className="absolute -inset-2 bg-blue-500 rounded-full opacity-30 blur-sm"></div>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Legal Hub
                </span>
              </div>
            </div>

            <p className="text-gray-300 leading-relaxed mb-6 text-right">
              منصة قانونية ذكية متطورة تهدف إلى تسهيل الوصول للعدالة وتطوير الخدمات القانونية
              في العالم العربي من خلال التكنولوجيا المتقدمة والذكاء الصناعي.
            </p>

            <div className="mb-6">
              <h4 className="text-lg font-medium mb-4 text-center">
                تابعنا على وسائل التواصل الاجتماعي
              </h4>
              <div className="flex justify-center space-x-3">
                {socialMedia.map((social, i) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={i}
                      href={social.url}
                      aria-label={social.name}
                      className={`
                        bg-gray-700 w-10 h-10 rounded-full flex items-center justify-center
                        transition-all duration-300 transform hover:scale-110
                        ${social.color}
                      `}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </a>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <span className="text-sm text-gray-400">الدعم الفني متاح 24/7</span>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 relative">
              تواصل معنا
              <div className="absolute -bottom-2 right-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
            </h3>

            <div className="space-y-4">
              {/** هاتف */}
              <div className="flex items-center justify-between p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors duration-300 group">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-900 p-2 rounded-lg group-hover:bg-blue-800 transition-colors">
                    <Phone className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-300 group-hover:text-white transition-colors text-sm">
                      هاتف
                    </span>
                    <span className="text-white font-medium">00201013541925</span>
                  </div>
                </div>
                <div className="bg-blue-600 p-1 rounded-md hover:bg-blue-500 transition-colors cursor-pointer">
                  <span className="text-white text-xs">اتصال</span>
                </div>
              </div>

              {/** بريد إلكتروني */}
              <div className="flex items-center justify-between p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors duration-300 group">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-900 p-2 rounded-lg group-hover:bg-blue-800 transition-colors">
                    <Mail className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-300 group-hover:text-white transition-colors text-sm">
                      بريد إلكتروني
                    </span>
                    <span className="text-white font-medium">info@legalhub.com</span>
                  </div>
                </div>
                <div className="bg-blue-600 p-1 rounded-md hover:bg-blue-500 transition-colors cursor-pointer">
                  <span className="text-white text-xs">إرسال</span>
                </div>
              </div>

              {/** عنوان */}
              <div className="flex items-center justify-between p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors duration-300 group">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-900 p-2 rounded-lg group-hover:bg-blue-800 transition-colors">
                    <MapPin className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-300 group-hover:text-white transition-colors text-sm">
                      عنوان
                    </span>
                    <span className="text-white font-medium">جمهورية مصر العربية</span>
                  </div>
                </div>
                <div className="bg-blue-600 p-1 rounded-md hover:bg-blue-500 transition-colors cursor-pointer">
                  <span className="text-white text-xs">خريطة</span>
                </div>
              </div>
            </div>

            {/** أوقات العمل */}
            <div className="mt-6 pt-4 border-t border-gray-700">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Clock className="h-4 w-4" />
                <span>أوقات العمل: الأحد - الخميس ٨ ص - ٥ م</span>
              </div>
            </div>

            {/** الروابط القانونية وأي حقوق */}
            <div className="border-t border-gray-800 pt-8">
              <div className="flex flex-wrap justify-center items-center gap-6 mb-6">
                <a href="#privacy" className="text-gray-400 hover:text-white text-sm hover:scale-105">
                  سياسة الخصوصية
                </a>
                <span className="text-gray-600">|</span>
                <a href="#terms" className="text-gray-400 hover:text-white text-sm hover:scale-105">
                  الشروط والأحكام
                </a>
                <span className="text-gray-600">|</span>
                <a href="#usage" className="text-gray-400 hover:text-white text-sm hover:scale-105">
                  سياسة الاستخدام
                </a>
                <span className="text-gray-600">|</span>
                <a href="#disclaimer" className="text-gray-400 hover:text-white text-sm hover:scale-105">
                  إخلاء المسؤولية
                </a>
              </div>
              <p className="text-center text-gray-400 text-sm">
                © 2025 جميع الحقوق محفوظة Legal Hub Team
              </p>
            </div>
          </div>
        </div>

        {/** شعار صغير ثابت */}
        <div className="fixed bottom-4 right-4 z-50">
          <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-lg p-2 shadow-lg">
            <Scale className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Legal Hub</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
