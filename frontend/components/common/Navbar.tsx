'use client'

import { useState, useEffect } from 'react'
import { Scale, Menu, X, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface AuthUser {
  id: string
  email: string
  role: string
  redirect_url: string
}

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    fetch('/api/v1/auth/me', { credentials: 'include' })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then((data: AuthUser) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const logout = async () => {
    await fetch('/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
    setUser(null)
    router.push('/')
  }

  const menuLinks = [
    { href: loading ? '/' : user?.redirect_url || '/', label: 'الرئيسية', external: false },
    { href: '/academy',     label: 'الاكاديمية',    external: true  },
    { href: '/services',     label: 'الخدمات',    external: true  },
    { href: '/achievements', label: 'الإنجازات',  external: true  },
    { href: '/about',        label: 'من نحن',      external: true  },
    { href: '/contact',      label: 'اتصل بنا',   external: true  },
  ]

  return (
    <>
      {/* Spacer لتجنب تغطية المحتوى */}
      <div className="h-24"></div>
      
      <nav className="bg-gradient-to-b from-gray-900 to-black fixed inset-x-0 top-0 z-50 border-b border-gray-800 shadow-2xl h-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            {/* Logo مع Animation دائري */}
            <Link 
              href="/"
              className="flex items-center space-x-3 group cursor-pointer"
            >
              <div className="relative">
                <div className="animate-rotate-scale">
                  <Scale className="h-10 w-10 text-blue-400" />
                </div>
                <div className="absolute -inset-2 bg-blue-500 rounded-full opacity-30 blur-sm"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap">
                Legal Hub
              </span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center space-x-6">
              {menuLinks.map(link =>
                link.external ? (
                  <Link
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white transition-all duration-300 font-medium text-base flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-gray-800 border border-transparent hover:border-gray-700 whitespace-nowrap"
                  >
                    {link.label}
                    <ArrowRight className="h-4 w-4 rotate-45" />
                  </Link>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-all duration-300 font-medium text-base px-4 py-3 rounded-lg hover:bg-gray-800 border border-transparent hover:border-gray-700 whitespace-nowrap"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              {!loading &&
                (user ? (
                  <button 
                    onClick={logout}
                    className="text-gray-300 hover:text-white transition-colors duration-300 font-medium px-4 py-3 rounded-lg hover:bg-gray-800 border border-transparent hover:border-gray-700 whitespace-nowrap"
                  >
                    تسجيل الخروج
                  </button>
                ) : (
                  <>
                    <Link 
                      href="/login" 
                      className="text-gray-300 hover:text-white transition-colors duration-300 font-medium px-6 py-3 rounded-lg hover:bg-gray-800 border border-transparent hover:border-gray-700 whitespace-nowrap"
                    >
                      تسجيل الدخول
                    </Link>
                    <Link 
                      href="/signup" 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium border border-blue-500 whitespace-nowrap min-w-[120px] text-center"
                    >
                      حساب جديد
                    </Link>
                  </>
                ))}
            </div>

            {/* Mobile Toggle */}
            <button
              className="md:hidden p-3 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-300 border border-gray-700"
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-gray-900 border-t border-gray-800 shadow-2xl py-6">
              <div className="flex flex-col space-y-3 px-4">
                {menuLinks.map(link =>
                  link.external ? (
                    <Link
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-4 rounded-xl hover:bg-gray-800 transition-all duration-300 text-gray-300 hover:text-white font-medium border border-transparent hover:border-gray-700"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                      <ArrowRight className="h-4 w-4 rotate-45 text-blue-400" />
                    </Link>
                  ) : (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="px-4 py-4 rounded-xl hover:bg-gray-800 transition-all duration-300 text-gray-300 hover:text-white font-medium border border-transparent hover:border-gray-700 text-right"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  )
                )}

                <div className="flex flex-col space-y-3 pt-4 border-t border-gray-800">
                  {!loading &&
                    (user ? (
                      <button
                        onClick={() => {
                          logout()
                          setMobileOpen(false)
                        }}
                        className="px-4 py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 text-gray-300 hover:text-white font-medium border border-transparent hover:border-gray-700 text-right"
                      >
                        تسجيل الخروج
                      </button>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="px-4 py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 text-gray-300 hover:text-white font-medium border border-transparent hover:border-gray-700 text-center"
                          onClick={() => setMobileOpen(false)}
                        >
                          تسجيل الدخول
                        </Link>
                        <Link
                          href="/signup"
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg text-center font-medium border border-blue-500"
                          onClick={() => setMobileOpen(false)}
                        >
                          حساب جديد
                        </Link>
                      </>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <style jsx global>{`
          @keyframes rotate-scale {
            0% {
              transform: rotate(0deg) scale(1);
            }
            25% {
              transform: rotate(-5deg) scale(1.05);
            }
            50% {
              transform: rotate(0deg) scale(1.1);
            }
            75% {
              transform: rotate(5deg) scale(1.05);
            }
            100% {
              transform: rotate(0deg) scale(1);
            }
          }
          .animate-rotate-scale {
            animation: rotate-scale 3s ease-in-out infinite;
          }
        `}</style>
      </nav>
    </>
  )
}