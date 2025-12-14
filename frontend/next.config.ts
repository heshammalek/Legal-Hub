
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // إعداد الـ proxy للـ API calls
  async rewrites() {
    return [
       {
        source: "/api/:path*",
        destination: process.env.NEXT_PUBLIC_API_URL 
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
          : "http://localhost:8000/api/:path*",
      },
    ]
  },
  
 
  
  // إعداد متغيرات البيئة
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8000',
  },
  
  // إعداد الصور إذا كنت تستخدم Next.js Image
  images: {
    domains: ['localhost'],
  },
    // ✅ مهم: السماح بـ trailing slashes
  trailingSlash: false,
  
  // ✅ تعطيل strict mode مؤقتاً لتجنب double renders
  reactStrictMode: false,
}

module.exports = nextConfig






// الكود الاصلي يعمل مع الاوثنتكيشن والاعلي تم اضافته لصفحة الاتصال 
//import { NextConfig } from 'next';

//const nextConfig: NextConfig = {
  //async rewrites() {
  //  return [
  //    {
  //      source: '/api/v1/:path*',
  //      destination: 'http://localhost:8000/v1/:path*'  // غيّر المنفذ إذا اختلف
  //    }
  //  ];
  //},
//};

//export default nextConfig;