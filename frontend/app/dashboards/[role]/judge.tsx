import React from "react"
import JudgeTabs from "@/components/dashboard/judge-dashboard/JudgeTabs"

const JudgeDashboardPage = () => {
  // لا حاجة لـ DashboardNavbar هنا لأنه موجود بالفعل في DashboardLayout
  // لا حاجة لـ div أو main إضافي أو padding (pt-16)
  return <JudgeTabs />
}

export default JudgeDashboardPage