import type { User } from '@prisma/client'
import type { Session } from 'next-auth'
import type { AuthResult, AuthWithUserResult } from './api-auth'
import { requireAuth as canonicalRequireAuth, requireAuthWithUser as canonicalRequireAuthWithUser, requireAdmin as canonicalRequireAdmin } from './api-auth'

export type { AuthResult, AuthWithUserResult }
export type AuthenticatedSession = Session
export type AuthenticatedUser = User
export const requireAuth = canonicalRequireAuth
export const requireAuthWithUser = canonicalRequireAuthWithUser
export const requireAdmin = canonicalRequireAdmin
