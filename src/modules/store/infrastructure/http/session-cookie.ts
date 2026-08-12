/**
 * HttpOnly capability cookie for anonymous MerchantSession.
 * Token is never logged; only the hash is persisted.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  ANONYMOUS_SHOPPER_IDENTITY_TTL_DAYS,
  createAnonymousShopperIdentity,
  hashSessionCapability,
  MERCHANT_SESSION_TTL_HOURS,
} from '../../domain/session'

export const STORE_CAPABILITY_COOKIE = 'vt_store_cap'
export const STORE_VISITOR_COOKIE = 'vt_store_visitor'

const MAX_AGE_SECONDS = MERCHANT_SESSION_TTL_HOURS * 60 * 60
const VISITOR_MAX_AGE_SECONDS = ANONYMOUS_SHOPPER_IDENTITY_TTL_DAYS * 24 * 60 * 60

export function readStoreCapabilityToken(request: NextRequest): string | null {
  const value = request.cookies.get(STORE_CAPABILITY_COOKIE)?.value
  return value && value.length > 0 ? value : null
}

export function applyStoreCapabilityCookie(
  response: NextResponse,
  token: string,
): void {
  response.cookies.set(STORE_CAPABILITY_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export function clearStoreCapabilityCookie(response: NextResponse): void {
  response.cookies.set(STORE_CAPABILITY_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

export function readStoreVisitorIdentity(request: NextRequest): {
  token: string
  tokenHash: string
} | null {
  const token = request.cookies.get(STORE_VISITOR_COOKIE)?.value
  return token ? { token, tokenHash: hashSessionCapability(token) } : null
}

export function ensureStoreVisitorIdentity(request: NextRequest): {
  identity: { token: string; tokenHash: string }
  created: boolean
} {
  const existing = readStoreVisitorIdentity(request)
  if (existing) return { identity: existing, created: false }
  return { identity: createAnonymousShopperIdentity(), created: true }
}

export function applyStoreVisitorCookie(
  response: NextResponse,
  token: string,
): void {
  response.cookies.set(STORE_VISITOR_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: VISITOR_MAX_AGE_SECONDS,
  })
}
