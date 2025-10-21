import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect all /admin routes
  if (pathname.startsWith('/admin')) {
    const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // 1. Check if session token exists
    if (!session) {
      // Not authenticated, redirect to login page
      const url = new URL('/api/auth/signin', req.url);
      url.searchParams.set('callbackUrl', req.url);
      return NextResponse.redirect(url);
    }

    // 2. Check if the user has the ADMIN role
    // Note: The role is stored in the `user` object within the JWT payload.
    // The structure might vary based on your `jwt` callback in `[...nextauth]`.
    // Ensure your session token contains the user's role.
    // @ts-ignore
    if (session.role !== 'ADMIN') {
      // Not an admin, redirect to a "not authorized" page or the homepage
      const url = new URL('/', req.url); // Redirect to homepage
      url.searchParams.set('error', 'Forbidden');
      return NextResponse.redirect(url);
    }

    // 3. If authenticated and is an admin, proceed to the requested page
    return NextResponse.next();
  }

  // For all other routes, do nothing
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/admin/:path*'],
};
