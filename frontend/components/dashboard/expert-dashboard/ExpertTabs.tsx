import React, { useState } from "react"
import { Menu, X } from "lucide-react"
import Sidebar from "../Sidebar"

const ExpertTabs = () => {
  const [activeTab, setActiveTab] = useState("profile")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setMobileMenuOpen(false)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <div>بياناتي</div>
      case "reports":
        return <div>التقارير</div>
      case "assignments":
        return <div>المهام</div>
      case "settings":
        return <div>الإعدادات</div>
      default:
        return <div>اختر تبويب من القائمة الجانبية</div>
    }
  }

  return (
    <div className="flex gap-6 relative">
      <div className="hidden lg:block lg:w-64">
        <Sidebar role="expert" activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="فتح القائمة"
      >
        <Menu className="h-6 w-6" />
      </button>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50 flex">
          <aside className="w-80 max-w-[85vw] bg-white dark:bg-gray-800 overflow-y-auto relative">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold">لوحة الخبير</h2>
              <button
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <Sidebar role="expert" activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
          </aside>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h1 className="text-2xl font-bold mb-4">لوحة الخبير</h1>
        {renderTabContent()}
      </div>
    </div>
  )
}

export default ExpertTabs
