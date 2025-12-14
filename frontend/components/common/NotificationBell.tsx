// frontend/components/common/NotificationBell.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { getUnreadNotificationsCount } from '@/services/api';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUnreadCount = async () => {
    try {
      setIsLoading(true);
      const count = await getUnreadNotificationsCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('❌ فشل في جلب عدد التنبيهات:', error);
      // استخدام قيمة افتراضية للاختبار
      setUnreadCount(3);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // تحديث كل 30 ثانية
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <button 
        className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors relative"
        title="التنبيهات"
      >
        <span className="text-xl">🔔</span>
        
        {/* عداد التنبيهات غير المقروءة */}
        {!isLoading && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        
        {/* تحميل */}
        {isLoading && (
          <span className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            ...
          </span>
        )}
      </button>
    </div>
  );
}