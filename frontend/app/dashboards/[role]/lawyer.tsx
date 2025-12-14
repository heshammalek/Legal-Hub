import React from "react"
import LawyerTabs from "@/components/dashboard/lawyer-dashboard/LawyerTabs"

const LawyerDashboardPage = () => {
  // لا حاجة لـ DashboardNavbar هنا لأنه موجود بالفعل في DashboardLayout
  // لا حاجة لـ div أو main إضافي أو padding (pt-16)
  return <LawyerTabs />
}

export default LawyerDashboardPage