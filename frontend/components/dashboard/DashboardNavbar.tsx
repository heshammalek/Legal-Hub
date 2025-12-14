'use client'

import { useState, useEffect, FC } from 'react'
import { Scale } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface AuthUser {
  id: string
  email: string
  role: string
  redirect_url: string
}

const LINK_CLASSES =
  'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-base'
const PRIMARY_BUTTON_CLASSES =
  'bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg font-medium text-base'

const AuthButtons: FC<{
  user: AuthUser | null
  loading: boolean
}> = ({ user, loading }) => {
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' })
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
  }

  return user ? (
   <button onClick={logout} className="text-xl font-bold bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent">
  تسجيل الخروج
</button>
  ) : (
    <>
      <Link href="/login" className={LINK_CLASSES}>
        تسجيل الدخول
      </Link>
      <Link href="/signup" className={PRIMARY_BUTTON_CLASSES}>
        حساب جديد
      </Link>
    </>
  )
}

export default function DashboardNavbar() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/auth/me', { credentials: 'include' })
      .then(res => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: AuthUser) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const homeLink = user?.redirect_url || '/'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={homeLink} className="flex items-center space-x-2 rtl:space-x-reverse">
  <Scale className="h-8 w-8 text-amber-300" />
  <span className="text-xl font-bold bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent">
    Legal Hub
  </span>
</Link>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <AuthButtons user={user} loading={loading} />
          </div>
        </div>
      </div>
    </nav>
  )
}