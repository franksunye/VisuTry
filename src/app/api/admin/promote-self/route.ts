import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * TEMPORARY ENDPOINT: Promote current user to ADMIN
 * 
 * This is a one-time use endpoint to fix the admin access issue.
 * After using it once, this endpoint should be removed or protected.
 * 
 * Security: Only works if the user's email matches a whitelist
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

    // Whitelist of emails that can be promoted to admin
    // IMPORTANT: Change this to your actual admin email
    const ADMIN_WHITELIST = [
      'franksunye@hotmail.com',
      // Add other admin emails here if needed
    ]

    if (!ADMIN_WHITELIST.includes(session.user.email || '')) {
      return NextResponse.json({
        success: false,
        error: 'Email not in admin whitelist'
      }, { status: 403 })
    }

    // Update user role to ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        role: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User promoted to ADMIN successfully',
      user: updatedUser,
      nextSteps: [
        '1. Sign out',
        '2. Sign in again',
        '3. Try accessing /admin',
        '4. Remove this API endpoint from the codebase for security'
      ]
    })
  } catch (error) {
    console.error('Promote user error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

