import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Debug endpoint to check session and JWT token
// Access: /api/check-session
export async function GET(req: NextRequest) {
  try {
    // Get JWT token (what middleware sees)
    const jwtToken = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Get server session (what server components see)
    const serverSession = await getServerSession(authOptions);

    return NextResponse.json({
      success: true,
      debug: {
        jwtToken: jwtToken ? {
          sub: jwtToken.sub,
          email: jwtToken.email,
          role: jwtToken.role,
          name: jwtToken.name,
          iat: jwtToken.iat,
          exp: jwtToken.exp,
        } : null,
        serverSession: serverSession ? {
          user: {
            id: serverSession.user.id,
            email: serverSession.user.email,
            role: serverSession.user.role,
            name: serverSession.user.name,
          }
        } : null,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('[Check Session] Error:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}

