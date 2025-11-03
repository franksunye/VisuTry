import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n'

// Create i18n middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always' // Always show locale in URL
})

/**
 * Combined Middleware: i18n + Admin Authentication
 *
 * 1. For /admin routes: Apply admin authentication
 * 2. For all other routes: Apply i18n routing
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip middleware for static files, API routes, and special Next.js routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Handle /admin routes with authentication
  if (pathname.startsWith('/admin')) {
    const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    console.log('[Admin Middleware] Access attempt:', {
      pathname,
      hasSession: !!session,
      userEmail: session?.email,
      userRole: session?.role,
      timestamp: new Date().toISOString()
    })

    if (!session) {
      console.log('[Admin Middleware] No session - redirecting to login')
      const url = new URL('/api/auth/signin', req.url)
      url.searchParams.set('callbackUrl', req.url)
      return NextResponse.redirect(url)
    }

    // @ts-ignore
    const userRole = session.role

    if (userRole !== 'ADMIN') {
      console.log('[Admin Middleware] Access DENIED - User role:', userRole, 'Email:', session.email)
      const url = new URL(`/${defaultLocale}`, req.url)
      url.searchParams.set('error', 'Forbidden')
      return NextResponse.redirect(url)
    }

    console.log('[Admin Middleware] Access GRANTED - Admin user:', session.email)
    return NextResponse.next()
  }

  // Apply i18n middleware for all other routes
  return intlMiddleware(req)
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // However, match all pathnames within `/admin`
    '/admin/:path*'
  ]
}
