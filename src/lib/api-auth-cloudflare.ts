import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import type { Prisma, User } from '@prisma/client'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/auth-cloudflare'
import { getCloudflareAuthUser } from '@/data/auth-cloudflare'

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

export const QUOTA_SELECT = {
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
  return { ok: false, response: NextResponse.json({ success: false, error }, { status: 401 }) }
}

function forbidden(error = 'Forbidden - Admin access required'): AuthFailure {
  return { ok: false, response: NextResponse.json({ success: false, error }, { status: 403 }) }
}

function notFound(error = 'User not found'): AuthFailure {
  return { ok: false, response: NextResponse.json({ success: false, error }, { status: 404 }) }
}

export async function requireAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return unauthorized()
  return { ok: true, session, userId: session.user.id }
}

export async function requireAuthWithUser(
  _select: Prisma.UserSelect = QUOTA_SELECT,
): Promise<AuthWithUserResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return unauthorized()
  const user = await getCloudflareAuthUser(session.user.id)
  if (!user) return notFound()
  return { ok: true, session, userId: session.user.id, user: user as unknown as User }
}

export async function requireAdmin(): Promise<AuthResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return unauthorized()
  if (session.user.role !== 'ADMIN') return forbidden()
  if (!session.user.id) return unauthorized()
  return { ok: true, session, userId: session.user.id }
}
