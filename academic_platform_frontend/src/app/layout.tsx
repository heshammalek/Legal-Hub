import type { Metadata } from 'next'
import { Tajawal, Amiri } from 'next/font/google'
import './globals.css'

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-tajawal'
})

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-amiri'
})

export const metadata: Metadata = {
  title: 'منصة التعلم الأكاديمية',
  description: 'منصة متكاملة للتعلم القانوني والمحاكاة القضائية',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="ar" 
      dir="rtl" 
      className={`${tajawal.variable} ${amiri.variable}`}
      suppressHydrationWarning={true}  // ⚠️ أضف هذا السطر
    >
      <body className="font-tajawal antialiased" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  )
}