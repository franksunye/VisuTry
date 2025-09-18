import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { SignJWT } from "jose"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, userType } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      )
    }

    // Create a mock user session
    const mockUser = {
      id: userType === 'premium' ? 'mock-user-2' : 'mock-user-1',
      email: email,
      name: userType === 'premium' ? 'Premium User' : 'Test User',
      image: 'https://via.placeholder.com/150',
      username: userType === 'premium' ? 'premiumuser' : 'testuser',
      freeTrialsUsed: userType === 'premium' ? 0 : 1,
      isPremium: userType === 'premium',
      premiumExpiresAt: userType === 'premium' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
    }

    // Create a JWT token for the mock session
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')
    
    const token = await new SignJWT({
      sub: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      picture: mockUser.image,
      username: mockUser.username,
      freeTrialsUsed: mockUser.freeTrialsUsed,
      isPremium: mockUser.isPremium,
      premiumExpiresAt: mockUser.premiumExpiresAt,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(secret)

    // Set the session cookie
    const response = NextResponse.json({
      success: true,
      message: `Mock login successful as ${userType} user`,
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        image: mockUser.image,
        username: mockUser.username,
        freeTrialsUsed: mockUser.freeTrialsUsed,
        isPremium: mockUser.isPremium,
      }
    })

    // Set NextAuth session cookie
    response.cookies.set('next-auth.session-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })

    return response

  } catch (error) {
    console.error("Mock login failed:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Mock login failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// GET method to check current session
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      success: true,
      authenticated: !!session,
      session: session ? {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
        }
      } : null
    })

  } catch (error) {
    console.error("Session check failed:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Session check failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
