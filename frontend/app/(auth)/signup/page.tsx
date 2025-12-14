'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scale, Crown } from 'lucide-react';
import SignupForm from '@/components/auth/UserSignupForm';

const roleOptions = [
  { value: '', label: 'اختر نوع الحساب' },
  { value: 'ordinary', label: 'مستخدم عادي' },
  { value: 'lawyer', label: 'محامي' },
  { value: 'judge', label: 'قاض' },
  { value: 'expert', label: 'خبير / مقدم خدمة' },
] as const;

type Role = typeof roleOptions[number]['value'];

export default function SignupPage() {
  const [selectedRole, setSelectedRole] = useState<Role | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignupError = (error: any) => {
    setIsLoading(false);
    
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.detail || 'فشل في التسجيل';
      
      switch (status) {
        case 400:
          setError('البريد الإلكتروني مسجل مسبقاً');
          break;
        case 422:
          setError('يرجى ملء جميع الحقول المطلوبة');
          break;
        case 500:
          setError('حدث خطأ في السيرفر. يرجى المحاولة مرة أخرى');
          break;
        default:
          setError(message);
      }
    } else if (error.request) {
      setError('خطأ في الاتصال. تحقق من الإنترنت');
    } else {
      setError('حدث خطأ غير متوقع');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center relative overflow-hidden">
      {/* تأثيرات الخلفية */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 backdrop-blur-sm">
          
          {/* الهيدر */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="relative">
                <div className="animate-float">
                  <Scale className="h-10 w-10 text-blue-400" />
                </div>
                <div className="absolute -inset-2 bg-blue-500 rounded-full opacity-30 blur-sm"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Legal Hub
              </span>
            </div>
            
            <div className="inline-flex items-center space-x-2 bg-gray-700/50 rounded-full px-4 py-2 border border-gray-600 mb-3">
              <Crown className="h-4 w-4 text-gold-400" />
              <span className="text-gold-200 text-xs font-semibold">انضم إلى منصة العدالة الذكية</span>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
              إنشاء حساب جديد
            </h1>
            <p className="text-gray-400">ابدأ رحلتك القانونية معنا</p>
          </div>

          {/* عرض الأخطاء */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-sm text-red-200 text-center">
                {error}
              </p>
            </div>
          )}
          
          {/* اختيار نوع الحساب */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              نوع الحساب <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value as Role);
                setError(null);
              }}
              disabled={isLoading}
              className="block w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-all duration-300 disabled:bg-gray-600"
            >
              {roleOptions.map(({ value, label }) => (
                <option key={value} value={value} disabled={value === ''}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* نموذج التسجيل */}
          {selectedRole && (
            <SignupForm 
              role={selectedRole}
              onError={handleSignupError}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}

          {/* رابط تسجيل الدخول */}
          <div className="mt-6 text-center border-t border-gray-700 pt-6">
            <p className="text-gray-400">
              لديك حساب بالفعل؟{' '}
              <button
                onClick={() => router.push('/login')}
                disabled={isLoading}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-300 disabled:text-gray-500"
              >
                تسجيل الدخول
              </button>
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}