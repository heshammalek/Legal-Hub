import React, { useState } from "react"
import { Menu, X } from 'lucide-react'
import Sidebar from "../Sidebar"
import { CasesTab } from "./CasesTab"
import { TranslationTab } from '@/components/common'
import EmergencyRequestsTab from "./EmergencyRequestsTab"
import DocumentsTab from "./LegalDocumentsTab"
import CalendarTab from "./CalendarTab"
import DelegationTab from "./DelegationTab"
import LawsuitTab from "./LawsuitTab"
import AutomationTab from "./AutomationTab"
import AskRobotTab from "./AskRobotTab"
import AskPeersTab from "./AskPeersTab"
import NotificationsTab from "./NotificationsTab"
import SettingsTab from "./SettingsTab"
import ConsultationRequestsTab from './ConsultationRequestsTab'
import ActiveConsultationsTab from './ActiveConsultationsTab'
import AllCourtsSimulationTab from "@/components/common/AllCourtsSimulationTab"




const LawyerTabs = () => {
  const [activeTab, setActiveTab] = useState("cases")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // إغلاق القائمة عند اختيار تاب في الموبايل
    setMobileMenuOpen(false)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "cases":
        return <CasesTab />
      case "translation":
        return <TranslationTab />
      case "emergencyRequests":
        return <EmergencyRequestsTab />
      case "consultationRequests":
        return <ConsultationRequestsTab />
      case "activeConsultations":
        return <ActiveConsultationsTab />
      case "documents":
        return <DocumentsTab />
      case "calendar":
        return <CalendarTab />
      case "delegation":
        return <DelegationTab />
      case "lawsuit":
        return <LawsuitTab />
      case "automation":
        return <AutomationTab />
      case "ask_robot":
        return <AskRobotTab />
      case "ask_peers":
        return <AskPeersTab />
      case "AllCourtsSimulation":
        return <AllCourtsSimulationTab />
      case "notifications":
        return <NotificationsTab />
      case "settings":
        return <SettingsTab />
      default:
        return <div>اختر تبويب من القائمة الجانبية</div>
    }
  }

  return (
    <div className="flex gap-6 relative">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block lg:w-64">
        <Sidebar role="lawyer" activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* Mobile Menu Button - يظهر فقط في الشاشات الصغيرة */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="فتح القائمة"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50 flex">
          {/* Sidebar */}
          <aside className="w-80 max-w-[85vw] bg-white dark:bg-gray-800 overflow-y-auto relative">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                لوحة المحامي
              </h2>
              <button
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="إغلاق القائمة"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Sidebar Content */}
            <div className="p-4">
              <Sidebar 
                role="lawyer" 
                activeTab={activeTab} 
                onTabChange={handleTabChange} 
              />
            </div>
          </aside>
          
          {/* Overlay - الضغط عليه يغلق القائمة */}
          <div 
            className="flex-1" 
            onClick={() => setMobileMenuOpen(false)} 
          />
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">لوحة المحامي</h1>
          {/* مؤشر التاب الحالي للموبايل */}
          <div className="lg:hidden text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
            {/* يمكنك إضافة اسم التاب الحالي هنا إذا أردت */}
          </div>
        </div>
        {renderTabContent()}
      </div>
    </div>
  )
}

export default LawyerTabs