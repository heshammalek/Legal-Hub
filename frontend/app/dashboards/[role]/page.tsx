'use client'

import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

// Layout عام موجود في app/dashboards/layout.tsx
import DashboardLayout from 'components/layouts/DashboardLayout'


// مكوّن NotFound في frontend/components/common/NotFound.tsx
import NotFound from '../../../components/common/NotFound'

// خريطة الأدوار إلى المكوّن الملائم
const componentsMap: Record<string, React.ComponentType> = {
  user: dynamic(() => import('./user')),
  lawyer: dynamic(() => import('./lawyer')),
  judge: dynamic(() => import('./judge')),
  expert: dynamic(() => import('./expert')),
  admin: dynamic(() => import('./admin')),
}

export default function RoleBasedDashboard() {
  const params = useParams()
  const roleParam = Array.isArray(params?.role) ? params.role[0] : params?.role ?? ''
  const Component = componentsMap[roleParam] ?? NotFound

  return (
    <DashboardLayout>
      
      <Component />
    </DashboardLayout>
  )
}
