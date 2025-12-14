// في frontend/components/dashboard/user-dashboard/UserTabs.tsx
'use client'

import { useState } from 'react'
import AskRobotTab from '../lawyer-dashboard/AskRobotTab'

const tabs = [
  { id: 'profile', label: 'الملف الشخصي' },
  { id: 'map', label: 'محام طواريء' },
  { id: 'consultation', label: 'طلب استشارة' },
  { id: 'ask_robot', label: 'اسأل الروبوت' }, // ⭐ أضف هذا السطر
  { id: 'posts', label: 'اطلب خدمة' },
]

export default function UserTabs() {
  const [activeTab, setActiveTab] = useState('profile')

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'ask_robot':
        return <AskRobotTab />
      // ... باقي الحالات
      default:
        return <div>محتويات {activeTab}</div>
    }
  }

  return (
    <div className="flex-1 bg-white rounded-lg shadow">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="p-6">
        {renderActiveTab()}
      </div>
    </div>
  )
}