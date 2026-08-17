import type { Prisma, User } from '@prisma/client'
import type { Session } from 'next-auth'
import type { AuthResult, AuthWithUserResult } from './api-auth'

type ApiAuthModule = {
  requireAuth: () => Promise<AuthResult>
  requireAuthWithUser: (select?: Prisma.UserSelect) => Promise<AuthWithUserResult>
  requireAdmin: () => Promise<AuthResult>
}

const runtimeApiAuth = (process.env.CLOUDFLARE_BUILD === '1'
  ? require('./api-auth-cloudflare')
  : require('./api-auth')) as ApiAuthModule

export type { AuthResult, AuthWithUserResult }
export type AuthenticatedSession = Session
export type AuthenticatedUser = User
export const requireAuth = runtimeApiAuth.requireAuth
export const requireAuthWithUser = runtimeApiAuth.requireAuthWithUser
export const requireAdmin = runtimeApiAuth.requireAdmin
