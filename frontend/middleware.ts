import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * دالة مساعدة لجلب role المستخدم من API
 * ⚠️ هذه دالة async وقد تبطئ الـ middleware قليلاً
 */
async function getUserRole(token: string, baseUrl: string): Promise<string | null> {
  try {
    const response = await fetch(`${baseUrl}/api/me`, {
      headers: {
        'Cookie': `access_token=${token}`,
      },
    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    return data.role || null
  } catch (error) {
    console.error('خطأ في جلب role:', error)
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('access_token')?.value

  console.log(`🔍 Middleware: ${pathname}`)
  console.log(`🍪 Token: ${token ? '✅ موجود' : '❌ غير موجود'}`)

  // ✅ المسارات العامة
  const publicPaths = [
    '/about',
    '/services',
    '/achievement',
    '/contact',
  ]

  const authPaths = ['/login', '/signup']

  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))
  const isAuthPath = authPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))

  // ✅ السماح بالمسارات العامة
  if (isPublicPath) {
    return NextResponse.next()
  }

  // ✅ إعادة توجيه المستخدمين المسجلين من صفحات Auth
  if (isAuthPath && token) {
    console.log('🔄 مستخدم مسجل يحاول الوصول لصفحة Auth')
    
    const role = await getUserRole(token, request.nextUrl.origin)
    const dashboardPath = role ? `/dashboards/${role}` : '/dashboards/lawyer'
    
    return NextResponse.redirect(new URL(dashboardPath, request.url))
  }

  // ✅ إعادة توجيه من الصفحة الرئيسية
  if (pathname === '/' && token) {
    console.log('🏠 مستخدم مسجل في الصفحة الرئيسية')
    
    const role = await getUserRole(token, request.nextUrl.origin)
    const dashboardPath = role ? `/dashboards/${role}` : '/dashboards/lawyer'
    
    return NextResponse.redirect(new URL(dashboardPath, request.url))
  }

  // ✅ حماية Dashboard
  if (pathname.startsWith('/dashboards')) {
    if (!token) {
      console.log('❌ لا يوجد token - إعادة توجيه للـ login')
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    console.log('✅ يوجد token - السماح بالوصول')
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}