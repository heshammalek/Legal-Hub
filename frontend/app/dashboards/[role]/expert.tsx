

import React from "react"
import ExpertTabs from "@/components/dashboard/expert-dashboard/ExpertTabs"

const ExpertDashboardPage = () => {
  // لا حاجة لـ DashboardNavbar هنا لأنه موجود بالفعل في DashboardLayout
  // لا حاجة لـ div أو main إضافي أو padding (pt-16)
  return <ExpertTabs />
}

export default ExpertDashboardPage