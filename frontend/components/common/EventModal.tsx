// frontend/components/common/EventModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { AgendaEvent } from '@/services/api';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: any) => void;
  eventInfo: Partial<AgendaEvent> | null;
}

export default function EventModal({ isOpen, onClose, onSave, eventInfo }: EventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    event_type: 'task',
    is_all_day: false,
    location: '',
    color: '#3b82f6'
  });

  // تهيئة النموذج عند فتح الـ Modal
  useEffect(() => {
    if (eventInfo) {
      setFormData({
        title: eventInfo.title || '',
        description: eventInfo.description || '',
        start_time: eventInfo.start_time || '',
        end_time: eventInfo.end_time || '',
        event_type: eventInfo.event_type || 'task',
        is_all_day: eventInfo.is_all_day || false,
        location: eventInfo.location || '',
        color: eventInfo.color || '#3b82f6'
      });
    } else {
      // إعادة التعيين إذا لم يكن هناك eventInfo
      setFormData({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        event_type: 'task',
        is_all_day: false,
        location: '',
        color: '#3b82f6'
      });
    }
  }, [eventInfo, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من البيانات الأساسية
    if (!formData.title.trim()) {
      alert('يرجى إدخال عنوان للحدث');
      return;
    }

    if (!formData.start_time || !formData.end_time) {
      alert('يرجى إدخال وقت البداية والنهاية');
      return;
    }

    const eventData = {
      ...formData,
      id: eventInfo?.id, // إضافة ID إذا كان تعديلاً
      start: formData.start_time,
      end: formData.end_time
    };

    onSave(eventData);
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      event_type: 'task',
      is_all_day: false,
      location: '',
      color: '#3b82f6'
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* الهيدر */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {eventInfo?.id ? 'تعديل الموعد' : 'إضافة موعد جديد'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* النموذج */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* العنوان */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              عنوان الحدث *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="أدخل عنوان الحدث"
              required
            />
          </div>

          {/* الوصف */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الوصف
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="أدخل وصف الحدث (اختياري)"
            />
          </div>

          {/* نوع الحدث */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              نوع الحدث
            </label>
            <select
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="session">جلسة محكمة</option>
              <option value="consultation">استشارة</option>
              <option value="deadline">موعد نهائي</option>
              <option value="meeting">اجتماع</option>
              <option value="task">مهمة</option>
              <option value="personal">شخصي</option>
            </select>
          </div>

          {/* الموقع */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الموقع
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="أدخل موقع الحدث (اختياري)"
            />
          </div>

          {/* طوال اليوم */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_all_day}
              onChange={(e) => setFormData({ ...formData, is_all_day: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ml-2"
            />
            <label className="text-sm font-medium text-gray-700">
              حدث طوال اليوم
            </label>
          </div>

          {/* وقت البداية */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              وقت البداية *
            </label>
            <input
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* وقت النهاية */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              وقت النهاية *
            </label>
            <input
              type="datetime-local"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* اللون */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              لون الحدث
            </label>
            <div className="flex items-center space-x-2 space-x-reverse">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10 w-10 cursor-pointer"
              />
              <span className="text-sm text-gray-600">اختر لوناً للحدث</span>
            </div>
          </div>

          {/* الأزرار */}
          <div className="flex justify-end space-x-2 space-x-reverse pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {eventInfo?.id ? 'تحديث' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}