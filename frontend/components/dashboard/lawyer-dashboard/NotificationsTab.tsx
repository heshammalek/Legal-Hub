// frontend/components/lawyer-dashboard/NotificationsTab.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadNotificationsCount } from '@/services/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  status: string;
  related_model?: string;
  related_id?: string;
  created_at: string;
  read_at?: string;
}

export default function NotificationsTab() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // جلب التنبيهات من الـ API الحقيقي
  // في NotificationsTab.tsx - استبدال دالة fetchNotifications

const fetchNotifications = async () => {
  try {
    setLoading(true);
    setError(null);
    
    console.log('🔄 جلب التنبيهات من الخادم...');
    
    // استخدام fetch مباشرة للتحكم الكامل
    const response = await fetch('http://localhost:8000/api/v1/notifications/', {
      method: 'GET',
      headers: { 
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      credentials: "include",
    });

    console.log('📨 حالة الاستجابة:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`فشل في جلب الإشعارات: ${response.status}`);
    }

    const notificationsData = await response.json();
    console.log('✅ التنبيهات المستلمة:', notificationsData);
    
    if (Array.isArray(notificationsData)) {
      setNotifications(notificationsData);
      console.log('📊 عدد التنبيهات:', notificationsData.length);
      
      // حساب عدد التنبيهات غير المقروءة محلياً
      const localUnread = notificationsData.filter((notif: Notification) => notif.status === 'unread').length;
      setUnreadCount(localUnread);
      console.log('🔢 عدد التنبيهات غير المقروءة:', localUnread);
    } else {
      console.warn('⚠️ البيانات المستلمة ليست مصفوفة:', notificationsData);
      setNotifications([]);
      setUnreadCount(0);
    }
    
  } catch (error) {
    console.error('❌ فشل في جلب التنبيهات:', error);
    setError('تعذر تحميل التنبيهات. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.');
    setNotifications([]);
    setUnreadCount(0);
  } finally {
    setLoading(false);
  }
};
  // تعليم تنبيه كمقروء
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      console.log(`📭 تعليم الإشعار ${notificationId} كمقروء...`);
      
      await markNotificationAsRead(notificationId);
      
      // تحديث الحالة المحلية
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, status: 'read', read_at: new Date().toISOString() }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      console.log(`✅ تم تعليم الإشعار ${notificationId} كمقروء`);
      
    } catch (error) {
      console.error('❌ فشل في تعليم التنبيه كمقروء:', error);
      alert('فشل في تعليم التنبيه كمقروء. يرجى المحاولة مرة أخرى.');
    }
  };

  // تعليم الكل كمقروء
  const handleMarkAllAsRead = async () => {
    try {
      console.log('📭 تعليم جميع الإشعارات كمقروءة...');
      
      await markAllNotificationsAsRead();
      
      // تحديث الحالة المحلية لجميع التنبيهات
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          status: 'read', 
          read_at: notif.read_at || new Date().toISOString() 
        }))
      );
      setUnreadCount(0);
      
      console.log('✅ تم تعليم جميع الإشعارات كمقروءة');
      alert('✅ تم تعليم جميع التنبيهات كمقروءة');
      
    } catch (error) {
      console.error('❌ فشل في تعليم جميع التنبيهات كمقروءة:', error);
      alert('فشل في تعليم جميع التنبيهات كمقروءة. يرجى المحاولة مرة أخرى.');
    }
  };

  // جلب التنبيهات عند تحميل المكون
  useEffect(() => {
    fetchNotifications();
  }, []);

  // تنسيق الوقت
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'الآن';
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      if (diffDays < 7) return `منذ ${diffDays} يوم`;
      
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // الحصول على لون حسب نوع التنبيه
  const getNotificationColor = (type: string) => {
    const colors: { [key: string]: string } = {
      delegation_request: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700',
      delegation_accepted: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700',
      delegation_rejected: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700',
      consultation_request: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-700',
      emergency_request: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-700',
      session_reminder: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-700',
      deadline_reminder: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700',
      agenda_event: 'bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-700',
      system_announcement: 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-700'
    };
    return colors[type] || 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-700';
  };

  // الحصول على أيقونة حسب نوع التنبيه
  const getNotificationIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      delegation_request: '🔄',
      delegation_accepted: '✅',
      delegation_rejected: '❌',
      consultation_request: '💬',
      emergency_request: '🚨',
      session_reminder: '⏰',
      deadline_reminder: '📅',
      agenda_event: '📝',
      system_announcement: '📢'
    };
    return icons[type] || '🔔';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">🔔 التنبيهات</h2>
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-20 rounded"></div>
        </div>
        
        {/* عناصر تحميل */}
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* الهيدر */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          🔔 التنبيهات 
          {unreadCount > 0 && (
            <span className="mr-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount} جديد
            </span>
          )}
        </h2>
        
        <div className="flex space-x-2 space-x-reverse">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              تعليم الكل كمقروء
            </button>
          )}
          <button
            onClick={fetchNotifications}
            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            🔄 تحديث
          </button>
        </div>
      </div>

      {/* رسالة خطأ */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-yellow-600 mr-2">⚠️</span>
            <p className="text-yellow-800">{error}</p>
          </div>
        </div>
      )}

      {/* عدد التنبيهات */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-300">
          لديك <span className="font-bold">{notifications.length}</span> تنبيه
          {unreadCount > 0 && (
            <span className="mr-2">، منها <span className="font-bold text-red-500">{unreadCount}</span> غير مقروء</span>
          )}
        </p>
      </div>

      {/* قائمة التنبيهات */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔕</div>
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
              لا توجد تنبيهات
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              سيظهر هنا جميع التنبيهات والإشعارات الخاصة بك
            </p>
            <button
              onClick={fetchNotifications}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              🔄 تحديث التنبيهات
            </button>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border rounded-lg p-4 transition-all duration-200 ${
                notification.status === 'unread' 
                  ? 'border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'bg-white dark:bg-gray-800'
              } ${getNotificationColor(notification.type)}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  <h3 className={`font-semibold ${
                    notification.status === 'unread' 
                      ? 'text-blue-800 dark:text-blue-300' 
                      : 'text-gray-800 dark:text-gray-200'
                  }`}>
                    {notification.title}
                  </h3>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(notification.created_at)}
                  </span>
                  
                  {notification.status === 'unread' && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                    >
                      تعليم كمقروء
                    </button>
                  )}
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                {notification.message}
              </p>
              
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span>النوع: {notification.type}</span>
                {notification.read_at && (
                  <span>قرئت: {formatTime(notification.read_at)}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}