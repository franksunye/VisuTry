import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n'
import { logger, getRequestContext } from '@/lib/logger'

// Create i18n middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always', // Always show locale in URL
  localeCookie: false,
})

/**
 * Combined Middleware: i18n + Admin Authentication
 *
 * 1. For /admin routes: Apply admin authentication
 * 2. For routes without a locale prefix: Apply i18n locale detection and redirect
 * 3. Routes with an existing locale prefix (e.g. /en/blog) are excluded by the
 *    matcher below — they are served directly as static or dynamic pages without
 *    middleware overhead. Locale is resolved from the [locale] route segment,
 *    not from middleware.
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

  const ctx = getRequestContext(req)
  logger.debug('web', 'Page request', { pathname }, ctx)

  // Handle /admin routes with authentication
  if (pathname.startsWith('/admin')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
      const url = new URL('/api/auth/signin', req.url)
      url.searchParams.set('callbackUrl', req.url)
      return NextResponse.redirect(url)
    }

    const userRole = token.role

    if (userRole !== 'ADMIN') {
      const url = new URL(`/${defaultLocale}`, req.url)
      url.searchParams.set('error', 'Forbidden')
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  }

  // Apply i18n middleware for routes without a locale prefix
  return intlMiddleware(req)
}

export const config = {
  matcher: [
    // Root path — needs locale detection redirect (e.g. / → /en)
    '/',
    // Admin routes — need JWT authentication
    '/admin/:path*',
    // Routes without a locale prefix — needs locale detection redirect.
    // Excludes: locale-prefixed paths (en/id/ar/ru/de/ja/es/pt/fr),
    // api, _next, _vercel, admin, and paths containing a dot.
    '/((?!(?:en|id|ar|ru|de|ja|es|pt|fr)(?:/|$)|api|_next|_vercel|admin|.*\\..*).*)',
  ]
}
