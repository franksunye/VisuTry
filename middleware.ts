import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function mask(value?: string | null) {
  if (!value) return value as any
  if (value.length <= 6) return '***'
  return `${value.slice(0, 3)}***${value.slice(-3)}`
}

export function middleware(req: NextRequest) {
  try {
    const p = req.nextUrl.pathname
    if (process.env.NODE_ENV === 'development' && p.startsWith('/api/auth/callback/twitter')) {
      const query = Object.fromEntries(req.nextUrl.searchParams)
      const cookies: Record<string, string> = {}
      req.cookies.getAll().forEach((c) => {
        cookies[c.name] = mask(c.value)
      })

      console.log('[OAuth Debug] Twitter callback hit', {
        method: req.method,
        url: req.url,
        query,
        cookies,
      })
    }
  } catch (e) {
    console.warn('[OAuth Debug] middleware logging failed', e)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/auth/:path*'],
}

