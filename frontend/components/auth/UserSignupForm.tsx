'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';


const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';





interface SignupFormProps {
  role: string;
  onError?: (error: any) => void;
  isLoading?: boolean;
  setIsLoading?: (loading: boolean) => void;
}

export default function SignupForm({ role, onError, isLoading, setIsLoading }: SignupFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    nationalId: '',
    country: '',
    password: '',
    confirmPassword: '',
    // حقول خاصة بالمحامي
    barAssociation: '',
    barNumber: '',
    yearOfAdmission: '',
    specialization: '',
    officeAddress: '',
    paymentMethod: '',
    paymentDetails: '',
    // حقول خاصة بالقاضي
    court: '',
    department: '',
    // حقول خاصة بالخبير
    workplace: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // مسح الخطأ عند التعديل
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // التحقق من الحقول الأساسية
    if (!formData.fullName.trim()) newErrors.fullName = 'الاسم الكامل مطلوب';
    if (!formData.email.trim()) newErrors.email = 'البريد الإلكتروني مطلوب';
    if (!formData.phone.trim()) newErrors.phone = 'رقم الهاتف مطلوب';
    if (!formData.nationalId.trim()) newErrors.nationalId = 'الرقم القومي مطلوب';
    if (!formData.country.trim()) newErrors.country = 'البلد مطلوب';
    if (!formData.password) newErrors.password = 'كلمة المرور مطلوبة';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمة المرور غير متطابقة';
    }

    // التحقق من حقول خاصة بكل دور
    if (role === 'lawyer') {
      if (!formData.barAssociation.trim()) newErrors.barAssociation = 'نقابة المحامين مطلوبة';
      if (!formData.specialization.trim()) newErrors.specialization = 'التخصص مطلوب';
      if (!formData.paymentDetails.trim()) {newErrors.paymentDetails = 'تفاصيل الدفع مطلوبة';
}

    }

    if (role === 'judge') {
      if (!formData.court.trim()) newErrors.court = 'المحكمة مطلوبة';
    }

    if (role === 'expert') {
      if (!formData.workplace.trim()) newErrors.workplace = 'مكان العمل مطلوب';
      if (!formData.specialization.trim()) newErrors.specialization = 'التخصص مطلوب';
      if (!formData.paymentDetails.trim()) {newErrors.paymentDetails = 'تفاصيل الدفع مطلوبة';
}

    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  //////////////////////////////////////////

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) return;
  if (setIsLoading) setIsLoading(true);

  try {
    const submitData: any = {
      full_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      national_id: formData.nationalId,
      country: formData.country,
      password: formData.password,
      verify_password: formData.confirmPassword,
      user_type: role,
      specialized_fields: {}
    };

    if (role === 'lawyer') {
      submitData.specialized_fields = {
        bar_association: formData.barAssociation,
        registration_number: formData.barNumber,
        year_of_admission: parseInt(formData.yearOfAdmission) || new Date().getFullYear(),
        specialization: formData.specialization,
        office_address: formData.officeAddress,
        payments: [{
          method: formData.paymentMethod || 'bank',
          details: formData.paymentDetails
        }]
      };
    }

    if (role === 'judge') {
      submitData.specialized_fields = {
        court: formData.court,
        court_circuit: formData.department,
        registration_number: formData.barNumber
      };
    }

    if (role === 'expert') {
      submitData.specialized_fields = {
        workplace: formData.workplace,
        specialization: formData.specialization,
        payments: [{
          method: formData.paymentMethod || 'bank',
          details: formData.paymentDetails
        }]
      };
    }

    console.log('Sending data:', submitData);

    const response = await fetch(`${API_BASE}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitData)
    });

    const responseText = await response.text();
    if (!responseText || responseText.trim() === '') throw new Error('الخادم أرجع استجابة فارغة');

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error('خطأ في تنسيق الاستجابة من الخادم');
    }

    if (!response.ok) {
      const errorMessage = data?.detail || data?.message || `خطأ من الخادم: ${response.status}`;
      throw new Error(errorMessage);
    }

    if (!data.access_token) throw new Error('لم يتم استلام رمز التوثيق من الخادم');

    if (typeof window !== 'undefined') {
      localStorage.setItem('token', data.access_token);
    }

    router.push('/login');
  } catch (error: any) {
    const errorMessage = error.message || 'حدث خطأ غير متوقع';
    if (onError) onError({ message: errorMessage });
    else alert(errorMessage);
  } finally {
    if (setIsLoading) setIsLoading(false);
  }
};


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* الحقول الأساسية */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
          الاسم الكامل <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            errors.fullName ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={isLoading}
        />
        {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          البريد الإلكتروني <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={isLoading}
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          رقم الهاتف <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            errors.phone ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={isLoading}
        />
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
      </div>

      <div>
        <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700">
          الرقم القومي <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="nationalId"
          name="nationalId"
          value={formData.nationalId}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            errors.nationalId ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={isLoading}
        />
        {errors.nationalId && <p className="mt-1 text-sm text-red-600">{errors.nationalId}</p>}
      </div>

      <div>
        <label htmlFor="country" className="block text-sm font-medium text-gray-700">
          البلد <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="country"
          name="country"
          value={formData.country}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            errors.country ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={isLoading}
        />
        {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          كلمة المرور <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={isLoading}
        />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          تأكيد كلمة المرور <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={isLoading}
        />
        {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
      </div>

      {/* حقول خاصة بالمحامي */}
      {role === 'lawyer' && (
  <>
    <div>
      <label htmlFor="barAssociation" className="block text-sm font-medium text-gray-700">
        نقابة المحامين <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        id="barAssociation"
        name="barAssociation"
        value={formData.barAssociation}
        onChange={handleInputChange}
        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
          errors.barAssociation ? 'border-red-500' : 'border-gray-300'
        }`}
        disabled={isLoading}
      />
      {errors.barAssociation && <p className="mt-1 text-sm text-red-600">{errors.barAssociation}</p>}
    </div>

    <div>
      <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
        التخصص <span className="text-red-500">*</span>
      </label>
      <select
        id="specialization"
        name="specialization"
        value={formData.specialization}
        onChange={handleInputChange}
        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
          errors.specialization ? 'border-red-500' : 'border-gray-300'
        }`}
        disabled={isLoading}
      >
        <option value="">اختر التخصص</option>
        <option value="عام">عام</option>
        <option value="جنائي">جنائي</option>
        <option value="مدني">مدني</option>
        <option value="تجاري">تجاري</option>
        <option value="أحوال شخصية">أحوال شخصية</option>
        <option value="عمالي">عمالي</option>
        <option value="إداري">إداري</option>
      </select>
      {errors.specialization && <p className="mt-1 text-sm text-red-600">{errors.specialization}</p>}
    </div>

    <div>
      <label htmlFor="barNumber" className="block text-sm font-medium text-gray-700">
        رقم القيد
      </label>
      <input
        type="text"
        id="barNumber"
        name="barNumber"
        value={formData.barNumber}
        onChange={handleInputChange}
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        disabled={isLoading}
      />
    </div>

    <div>
      <label htmlFor="yearOfAdmission" className="block text-sm font-medium text-gray-700">
        سنة القيد
      </label>
      <input
        type="number"
        id="yearOfAdmission"
        name="yearOfAdmission"
        value={formData.yearOfAdmission}
        onChange={handleInputChange}
        min="1900"
        max={new Date().getFullYear()}
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        disabled={isLoading}
      />
    </div>

    <div>
      <label htmlFor="officeAddress" className="block text-sm font-medium text-gray-700">
        عنوان المكتب
      </label>
      <input
        type="text"
        id="officeAddress"
        name="officeAddress"
        value={formData.officeAddress}
        onChange={handleInputChange}
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        disabled={isLoading}
      />
    </div>

    <div>
      <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
        طريقة الدفع
      </label>
      <select
        id="paymentMethod"
        name="paymentMethod"
        value={formData.paymentMethod}
        onChange={handleInputChange}
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        disabled={isLoading}
      >
        <option value="">اختر طريقة الدفع</option>
        <option value="bank">تحويل بنكي</option>
        <option value="instapay">إنستاباي</option>
        <option value="wallet">محفظة إلكترونية</option>
        <option value="vodafone_cash">فودافون كاش</option>
      </select>
    </div>

    <div>
      <label htmlFor="paymentDetails" className="block text-sm font-medium text-gray-700">
        تفاصيل الدفع <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        id="paymentDetails"
        name="paymentDetails"
        value={formData.paymentDetails}
        onChange={handleInputChange}
        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
          errors.paymentDetails ? 'border-red-500' : 'border-gray-300'
        }`}
        disabled={isLoading}
      />
      {errors.paymentDetails && <p className="mt-1 text-sm text-red-600">{errors.paymentDetails}</p>}
    </div>
  </>
)}


      {/* حقول خاصة بالقاضي */}
      {role === 'judge' && (
        <>
          <div>
            <label htmlFor="court" className="block text-sm font-medium text-gray-700">
              المحكمة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="court"
              name="court"
              value={formData.court}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.court ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
            {errors.court && <p className="mt-1 text-sm text-red-600">{errors.court}</p>}
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">
              الدائرة
            </label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="barNumber" className="block text-sm font-medium text-gray-700">
              رقم القيد
            </label>
            <input
              type="text"
              id="barNumber"
              name="barNumber"
              value={formData.barNumber}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>
        </>
      )}

      {/* حقول خاصة بالخبير */}
      {role === 'expert' && (
        <>
          <div>
            <label htmlFor="workplace" className="block text-sm font-medium text-gray-700">
              مكان العمل <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="workplace"
              name="workplace"
              value={formData.workplace}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.workplace ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
            {errors.workplace && <p className="mt-1 text-sm text-red-600">{errors.workplace}</p>}
          </div>

          <div>
            <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
              التخصص <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="specialization"
              name="specialization"
              value={formData.specialization}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.specialization ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
            {errors.specialization && <p className="mt-1 text-sm text-red-600">{errors.specialization}</p>}
          </div>

          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
              طريقة الدفع
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="">اختر طريقة الدفع</option>
              <option value="bank">تحويل بنكي</option>
              <option value="instapay">إنستاباي</option>
              <option value="wallet">محفظة إلكترونية</option>
              <option value="vodafone_cash">فودافون كاش</option>
            </select>
          </div>
          <div>
      <label htmlFor="paymentDetails" className="block text-sm font-medium text-gray-700">
        تفاصيل الدفع <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        id="paymentDetails"
        name="paymentDetails"
        value={formData.paymentDetails}
        onChange={handleInputChange}
        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
          errors.paymentDetails ? 'border-red-500' : 'border-gray-300'
        }`}
        disabled={isLoading}
      />
      {errors.paymentDetails && <p className="mt-1 text-sm text-red-600">{errors.paymentDetails}</p>}
    </div>
        </>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? 'جاري التسجيل...' : 'تسجيل'}
      </button>
    </form>
  );
}