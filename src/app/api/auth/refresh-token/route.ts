import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Force refresh the user's session by updating the JWT token
 * This is useful when user data in the database has changed
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Fetch latest user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        username: true,
        role: true,
        freeTrialsUsed: true,
        premiumUsageCount: true,
        creditsPurchased: true,
        creditsUsed: true,
        isPremium: true,
        premiumExpiresAt: true,
        currentSubscriptionType: true,
      }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Session will be refreshed on next request',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      instructions: 'Please sign out and sign in again to get the updated session with role information'
    })
  } catch (error) {
    console.error('Refresh token error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

