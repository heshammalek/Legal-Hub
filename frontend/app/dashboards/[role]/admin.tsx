

import React from "react"
import AdminTabs from "@/components/dashboard/admin-dashboard/AdminTabs"

const AdminDashboardPage = () => {
  // لا حاجة لـ DashboardNavbar هنا لأنه موجود بالفعل في DashboardLayout
  // لا حاجة لـ div أو main إضافي أو padding (pt-16)
  return <AdminTabs />
}

export default AdminDashboardPage