/**
 * HttpOnly capability cookie for anonymous MerchantSession.
 * Token is never logged; only the hash is persisted.
 */

import { NextRequest, NextResponse } from 'next/server'
import { MERCHANT_SESSION_TTL_HOURS } from '../../domain/session'

export const STORE_CAPABILITY_COOKIE = 'vt_store_cap'

const MAX_AGE_SECONDS = MERCHANT_SESSION_TTL_HOURS * 60 * 60

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
