'use client'

import { ReactNode, useState } from 'react'
import DashboardNavbar from 'components/dashboard/DashboardNavbar'
import localFont from 'next/font/local'
import { X } from 'lucide-react'

// استيراد خط Tajawal من ملفات محلية
const tajawal = localFont({
  src: [
    { path: '../../public/fonts/Tajawal-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../../public/fonts/Tajawal-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-tajawal',
  display: 'swap',
})

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${tajawal.variable} font-sans min-h-screen bg-[#fefce8] text-[#0f172a]`}>
      <DashboardNavbar />
      <main className="pt-20 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}