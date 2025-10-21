import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware only runs on /admin routes (configured in matcher below)
// This ensures zero performance impact on regular user pages
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Get session token (only called for /admin routes due to matcher)
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Debug logging for admin access attempts
  console.log('[Admin Middleware] Access attempt:', {
    pathname,
    hasSession: !!session,
    userEmail: session?.email,
    userRole: session?.role,
    timestamp: new Date().toISOString()
  });

  // 1. Check if session token exists
  if (!session) {
    console.log('[Admin Middleware] No session - redirecting to login');
    // Not authenticated, redirect to login page
    const url = new URL('/api/auth/signin', req.url);
    url.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(url);
  }

  // 2. Check if the user has the ADMIN role
  // @ts-ignore
  const userRole = session.role;

  if (userRole !== 'ADMIN') {
    console.log('[Admin Middleware] Access DENIED - User role:', userRole, 'Email:', session.email);
    // Not an admin, redirect to homepage with error
    const url = new URL('/', req.url);
    url.searchParams.set('error', 'Forbidden');
    return NextResponse.redirect(url);
  }

  // 3. If authenticated and is an admin, proceed to the requested page
  console.log('[Admin Middleware] Access GRANTED - Admin user:', session.email);
  return NextResponse.next();
}

// Matcher configuration - ONLY run middleware on /admin routes
// This ensures zero performance impact on regular pages
// Middleware will NOT run on:
// - Homepage, blog, product pages, etc.
// - API routes
// - Static files
export const config = {
  matcher: [
    '/admin/:path*',  // Only match /admin and all sub-routes
  ],
};
