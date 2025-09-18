import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

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

    // Set the test session cookie (simple JSON)
    const testSession = JSON.stringify(mockUser)

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

    // Set test session cookie
    response.cookies.set('test-session', testSession, {
      httpOnly: false, // Allow client-side access for testing
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
export async function GET(request: NextRequest) {
  try {
    // Check NextAuth session
    const session = await getServerSession(authOptions)

    // Check test session cookie
    const testSessionCookie = request.cookies.get('test-session')
    let testSession = null

    if (testSessionCookie) {
      try {
        testSession = JSON.parse(testSessionCookie.value)
      } catch (e) {
        console.error("Failed to parse test session:", e)
      }
    }

    return NextResponse.json({
      success: true,
      authenticated: !!session || !!testSession,
      session: session ? {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
        },
        source: 'nextauth'
      } : null,
      testSession: testSession ? {
        user: testSession,
        source: 'test'
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
