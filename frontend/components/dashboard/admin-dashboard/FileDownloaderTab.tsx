// frontend/components/dashboard/admin-dashboard/FileDownloaderTab.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface DownloadItem {
  id: string;
  url: string;
  country: string;
  category: string;
  metadata: {
    law_number?: string;
    year?: string;
    issuing_authority?: string;
    [key: string]: any;
  };
}

const FileDownloaderTab: React.FC = () => {
  const [downloads, setDownloads] = useState<DownloadItem[]>([
    { id: '1', url: '', country: '', category: '', metadata: {} }
  ]);
  const [countries, setCountries] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // جلب البيانات الأولية
  useEffect(() => {
    fetchCountries();
    fetchCategories();
  }, []);

  const fetchCountries = async () => {
    try {
      const response = await fetch('/api/v1/data-acquisition/data-acquisition/countries');
      const data = await response.json();
      setCountries(data.countries || []); // ⬅️ تأكد من وجود قيمة افتراضية
    } catch (error) {
      console.error('Error fetching countries:', error);
      setCountries([]); // ⬅️ قيمة افتراضية في حالة الخطأ
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/v1/data-acquisition/data-acquisition/categories');
      const data = await response.json();
      setCategories(data.categories || []); // ⬅️ تأكد من وجود قيمة افتراضية
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]); // ⬅️ قيمة افتراضية في حالة الخطأ
    }
  };

  const addDownloadField = () => {
    setDownloads(prev => [
      ...prev,
      { id: Date.now().toString(), url: '', country: '', category: '', metadata: {} }
    ]);
  };

  const removeDownloadField = (id: string) => {
    if (downloads.length > 1) {
      setDownloads(prev => prev.filter(item => item.id !== id));
    }
  };

  const updateDownloadField = (id: string, field: string, value: any) => {
    setDownloads(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const updateMetadata = (id: string, field: string, value: string) => {
    setDownloads(prev => prev.map(item => 
      item.id === id ? { 
        ...item, 
        metadata: { ...item.metadata, [field]: value } 
      } : item
    ));
  };

  const handleDownload = async () => {
    setLoading(true);
    setMessage('');

    try {
      const validDownloads = downloads.filter(d => d.url && d.country && d.category);
      
      if (validDownloads.length === 0) {
        setMessage('⚠️ يرجى إدخال بيانات صحيحة');
        return;
      }

      const response = await fetch('/api/v1/data-acquisition/data-acquisition/batch-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          downloads: validDownloads
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage(`✅ ${result.message}`);
        // إعادة تعيين الحقول
        setDownloads([{ id: '1', url: '', country: '', category: '', metadata: {} }]);
      } else {
        setMessage(`❌ ${result.detail || 'حدث خطأ'}`);
      }
    } catch (error) {
      setMessage('❌ خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      '01_constitutions': 'دساتير',
      '02_decisions': 'قرارات',
      '03_reports': 'تقارير',
      '04_laws': 'قوانين',
      '05_judgments': 'أحكام قضائية',
      '06_international_agreements': 'اتفاقيات دولية',
      '07_legal_templates': 'صيغ قانونية'
    };
    return labels[category] || category;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">تحميل الملفات القانونية</h2>
      
      {/* رسائل التنبيه */}
      {message && (
        <div className={`p-4 mb-6 rounded ${
          message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* قائمة التحميلات */}
      {downloads.map((download, index) => (
        <div key={download.id} className="mb-6 p-4 border border-gray-200 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">ملف #{index + 1}</h3>
            {downloads.length > 1 && (
              <button
                onClick={() => removeDownloadField(download.id)}
                className="text-red-600 hover:text-red-800"
              >
                حذف
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* رابط الملف */}
            <div>
              <label className="block text-sm font-medium mb-2">رابط الملف *</label>
              <input
                type="url"
                value={download.url}
                onChange={(e) => updateDownloadField(download.id, 'url', e.target.value)}
                placeholder="https://example.com/document.pdf"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* الدولة */}
            <div>
              <label className="block text-sm font-medium mb-2">الدولة *</label>
              <select
                value={download.country}
                onChange={(e) => updateDownloadField(download.id, 'country', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">اختر الدولة</option>
                {countries && countries.map(country => ( // ⬅️ تأكد من وجود countries
                  <option key={country} value={country}>
                    {country.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* التصنيف */}
            <div>
              <label className="block text-sm font-medium mb-2">التصنيف *</label>
              <select
                value={download.category}
                onChange={(e) => updateDownloadField(download.id, 'category', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">اختر التصنيف</option>
                {categories && categories.map(category => ( // ⬅️ تأكد من وجود categories
                  <option key={category} value={category}>
                    {getCategoryLabel(category)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* الميتاداتا الإضافية */}
          <div className="mt-4">
            <h4 className="text-md font-medium mb-3">معلومات إضافية (اختياري)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="رقم القانون"
                onChange={(e) => updateMetadata(download.id, 'law_number', e.target.value)}
                className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="سنة الإصدار"
                onChange={(e) => updateMetadata(download.id, 'year', e.target.value)}
                className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="الجهة المصدرة"
                onChange={(e) => updateMetadata(download.id, 'issuing_authority', e.target.value)}
                className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      ))}

      {/* أزرار التحكم */}
      <div className="flex flex-col sm:flex-row gap-4 mt-6">
        <button
          onClick={addDownloadField}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          + إضافة رابط آخر
        </button>
        
        <button
          onClick={handleDownload}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
        >
          {loading ? 'جاري التحميل...' : 'بدء تحميل الملفات'}
        </button>
      </div>

      {/* معلومات */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800">معلومات:</h4>
        <ul className="mt-2 text-blue-700 text-sm list-disc list-inside">
          <li>يدعم الروابط المباشرة لملفات PDF, DOC, DOCX, etc</li>
          <li>الملفات سيتم حفظها في المجلدات المناسبة تلقائياً</li>
          <li>الميتاداتا سيتم حفظها مع كل ملف</li>
        </ul>
      </div>
    </div>
  );
};

export default FileDownloaderTab;