// app/(static)/layout.tsx
'use client'

import Navbar from 'components/common/Navbar'
import Footer from 'components/common/Footer'
import { Toaster } from 'react-hot-toast'
//import { ThemeProvider } from '@/components/common/ThemeProvider'



export default function StaticLayout({ children }: { children: React.ReactNode }) {
  return (
      <div className="flex flex-col min-h-screen font-['Tajawal']">
        <Navbar />

        <main className="flex-grow pt-16">
          
            {children}
          
        </main>

        <Footer />

        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            error: {
              duration: 6000,
              icon: '❌',
              style: {
                background: '#fee2e2',
                color: '#dc2626',
              },
            },
            success: {
              duration: 3000,
              icon: '✅',
              style: {
                background: '#d1fae5',
                color: '#065f46',
              },
            },
          }}
        />
      </div>
  )
}
