import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma, User } from '@prisma/client'
import type { Session } from 'next-auth'

/**
 * Unified authentication helpers for API routes.
 *
 * Usage:
 *   const auth = await requireAuth()
 *   if (!auth.ok) return auth.response
 *   // use auth.userId
 *
 *   const auth = await requireAuthWithUser({ select: { ... } })
 *   if (!auth.ok) return auth.response
 *   // use auth.user
 *
 *   const auth = await requireAdmin()
 *   if (!auth.ok) return auth.response
 *   // admin-only logic
 */

// ── Types ──────────────────────────────────────────────

interface AuthSuccess {
  ok: true
  session: Session
  userId: string
}

interface AuthWithUserSuccess extends AuthSuccess {
  user: User
}

interface AuthFailure {
  ok: false
  response: NextResponse
}

export type AuthResult = AuthSuccess | AuthFailure
export type AuthWithUserResult = AuthWithUserSuccess | AuthFailure

// ── Helpers ────────────────────────────────────────────

const QUOTA_SELECT = {
  id: true,
  isPremium: true,
  premiumExpiresAt: true,
  currentSubscriptionType: true,
  freeTrialsUsed: true,
  premiumUsageCount: true,
  creditsPurchased: true,
  creditsUsed: true,
} satisfies Prisma.UserSelect

function unauthorized(error = 'Unauthorized'): AuthFailure {
  return {
    ok: false,
    response: NextResponse.json({ success: false, error }, { status: 401 }),
  }
}

function forbidden(error = 'Forbidden - Admin access required'): AuthFailure {
  return {
    ok: false,
    response: NextResponse.json({ success: false, error }, { status: 403 }),
  }
}

function notFound(error = 'User not found'): AuthFailure {
  return {
    ok: false,
    response: NextResponse.json({ success: false, error }, { status: 404 }),
  }
}

// ── Public API ─────────────────────────────────────────

/**
 * Require an authenticated session.
 * Returns userId on success, or a 401 NextResponse on failure.
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return unauthorized()
  }
  return { ok: true, session, userId: session.user.id }
}

/**
 * Require an authenticated session and fetch the user from DB.
 * Pass a custom `select` to override the default quota fields.
 */
export async function requireAuthWithUser(
  select: Prisma.UserSelect = QUOTA_SELECT,
): Promise<AuthWithUserResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return unauthorized()
  }

  const user = (await prisma.user.findUnique({
    where: { id: session.user.id },
    select,
  })) as User | null

  if (!user) {
    return notFound()
  }

  return { ok: true, session, userId: session.user.id, user }
}

/**
 * Require an authenticated admin session.
 * Returns 401 if not logged in, 403 if not admin.
 */
export async function requireAdmin(): Promise<AuthResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return unauthorized()
  }
  // @ts-ignore - role is added by JWT callback but not in default type
  if (session.user.role !== 'ADMIN') {
    return forbidden()
  }
  if (!session.user.id) {
    return unauthorized()
  }
  return { ok: true, session, userId: session.user.id }
}

// Re-export for convenience
export { QUOTA_SELECT }
