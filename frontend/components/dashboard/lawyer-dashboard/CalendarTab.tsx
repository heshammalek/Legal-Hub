// frontend/components/lawyer-dashboard/CalendarTab.tsx
'use client';

import React, { useState, useCallback, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import rrulePlugin from '@fullcalendar/rrule';
import { EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';
import arLocale from '@fullcalendar/core/locales/ar';

import { fetchEvents, createEvent, updateEvent, deleteEvent } from '@/services/api';
import EventModal from '@/components/common/EventModal';

export default function CalendarTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const calendarRef = useRef<any>(null);

  // دالة لجلب الأحداث
  const handleFetchEvents = useCallback(async (fetchInfo: any, successCallback: any, failureCallback: any) => {
    try {
      console.log('📅 جلب الأحداث للنطاق:', {
        start: fetchInfo.start,
        end: fetchInfo.end
      });

      const events = await fetchEvents(fetchInfo.start, fetchInfo.end);
      console.log('✅ عدد الأevents التي تم جلبها:', events.length);
      console.log('📋 تفاصيل الأevents:', events);
      
      successCallback(events);
    } catch (error) {
      console.error("❌ خطأ في جلب الأevents:", error);
      successCallback([]);
    }
  }, []);

  // عند تحديد تاريخ لإنشاء حدث جديد
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    console.log('📅 تحديد تاريخ:', selectInfo);
    
    // تحويل التواريخ لتنسيق input
    const formatForInput = (date: Date) => {
      return date.toISOString().slice(0, 16);
    };

    const endDate = selectInfo.end || new Date(selectInfo.start.getTime() + 60 * 60 * 1000); // +1 hour

    setSelectedEvent({
      start_time: formatForInput(selectInfo.start),
      end_time: formatForInput(endDate),
      is_all_day: selectInfo.allDay,
    });
    setModalOpen(true);
    
    // إلغاء التحديد البصري
    selectInfo.view.calendar.unselect();
  };

  // عند النقر على حدث موجود
  const handleEventClick = (clickInfo: EventClickArg) => {
    console.log('🖱️ النقر على حدث:', clickInfo.event);
    
    // تحويل التواريخ لتنسيق input
    const formatForInput = (date: Date | null) => {
      if (!date) return '';
      return date.toISOString().slice(0, 16);
    };

    setSelectedEvent({
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start_time: formatForInput(clickInfo.event.start),
      end_time: formatForInput(clickInfo.event.end),
      is_all_day: clickInfo.event.allDay,
      event_type: clickInfo.event.extendedProps?.event_type || 'task',
      description: clickInfo.event.extendedProps?.description,
      location: clickInfo.event.extendedProps?.location,
      color: clickInfo.event.backgroundColor
    });
    setModalOpen(true);
  };

  // عند سحب وإفلات حدث
  const handleEventDrop = async (dropInfo: EventDropArg) => {
    try {
      console.log('🔄 تحديث موعد الحدث:', dropInfo.event.id);
      
      await updateEvent(dropInfo.event.id, {
        start_time: dropInfo.event.start?.toISOString(),
        end_time: dropInfo.event.end?.toISOString(),
        is_all_day: dropInfo.event.allDay,
      });
      
      console.log('✅ تم تحديث موعد الحدث بنجاح');
    } catch (error) {
      console.error("❌ فشل في تحديث موعد الحدث:", error);
      dropInfo.revert();
    }
  };

  // عند حفظ البيانات من الـ Modal
  const handleSaveEvent = async (eventData: any) => {
    try {
      console.log('💾 حفظ الحدث:', eventData);

      let savedEvent;
      
      if (eventData.id) {
        // تحديث حدث موجود
        savedEvent = await updateEvent(eventData.id, eventData);
        console.log('✅ تم تحديث الحدث بنجاح:', savedEvent);
      } else {
        // إنشاء حدث جديد
        savedEvent = await createEvent(eventData);
        console.log('✅ تم إنشاء الحدث بنجاح:', savedEvent);
      }

      // ✅ إعادة تحميل الأحداث من الخادم
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        console.log('🔄 إعادة تحميل الأحداث...');
        calendarApi.refetchEvents();
      }

      setModalOpen(false);
      setSelectedEvent(null);
      
    } catch (error) {
      console.error("❌ فشل في حفظ الحدث:", error);
      alert('فشل في حفظ الحدث: ' + (error as Error).message);
    }
  };

  // إضافة زر تحديث يدوي للمساعدة في الاختبار
  const handleRefreshEvents = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      console.log('🔄 تحديث الأevents يدوياً...');
      calendarApi.refetchEvents();
      alert('تم تحديث الأevents');
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm h-full">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">الأجندة</h2>
          <p className="text-gray-600">نظم مواعيدك وجلساتك المحكمة</p>
        </div>
        <button
          onClick={handleRefreshEvents}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm"
        >
          تحديث الأحداث
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 h-[600px]">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          initialView="dayGridMonth"
          locale={arLocale}
          direction="rtl"
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          events={handleFetchEvents}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventContent={(eventInfo) => (
            <div className="p-1">
              <div className="font-semibold text-xs truncate">
                {eventInfo.event.title}
              </div>
              {eventInfo.event.extendedProps.description && (
                <div className="text-xs opacity-75 truncate">
                  {eventInfo.event.extendedProps.description}
                </div>
              )}
            </div>
          )}
          eventDidMount={(info) => {
            // تحسين ظهور الأevents
            info.el.style.border = 'none';
            info.el.style.borderRadius = '6px';
            info.el.style.padding = '2px';
            info.el.style.fontSize = '12px';
          }}
          loading={(isLoading) => {
            console.log('🔄 حالة التحميل:', isLoading);
          }}
        />
      </div>
      
      <EventModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedEvent(null);
        }}
        onSave={handleSaveEvent}
        eventInfo={selectedEvent}
      />
    </div>
  );
}