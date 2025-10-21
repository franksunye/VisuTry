import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Log ALL middleware invocations for debugging
  console.log('[Middleware] Invoked for path:', pathname);

  // Protect all /admin routes
  if (pathname.startsWith('/admin')) {
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
    // Note: The role is stored in the JWT token
    // @ts-ignore
    const userRole = session.role;

    if (userRole !== 'ADMIN') {
      console.log('[Admin Middleware] Access DENIED - User role:', userRole, 'Email:', session.email);
      // Not an admin, redirect to a "not authorized" page or the homepage
      const url = new URL('/', req.url); // Redirect to homepage
      url.searchParams.set('error', 'Forbidden');
      return NextResponse.redirect(url);
    }

    // 3. If authenticated and is an admin, proceed to the requested page
    console.log('[Admin Middleware] Access GRANTED - Admin user:', session.email);
    return NextResponse.next();
  }

  // For all other routes, do nothing
  return NextResponse.next();
}

// Matcher configuration for Next.js middleware
// This ensures middleware runs for all /admin routes
export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
  ],
};
