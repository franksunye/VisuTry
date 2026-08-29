/**
 * Durable Store abuse / rate limits (serverless-safe via Postgres counters).
 */

import { prisma } from '@/lib/prisma'
import { StoreDomainError } from '../domain/errors'

export type StoreAbuseLimits = {
  maxSessionCreatesPerIpPerHour: number
  maxPhotoUploadsPerIpPerHour: number
  maxPhotoBytesPerIpPerDay: number
  /**
   * Security / flood ceiling per merchant per UTC day.
   * This is not merchant commercial allowance (plan, sponsored, campaign quota).
   */
  maxAttemptsPerMerchantPerDay: number
  maxFailuresPerMerchantPerDay: number
  maxAttemptsPerIpPerDay: number
}

/**
 * Abuse-protection defaults. Paid/pilot burst traffic is expected to stay
 * well below this ceiling; raise via STORE_MERCHANT_DAILY_ATTEMPT_LIMIT
 * rather than treating this number as a commercial SKU.
 */
export const DEFAULT_STORE_ABUSE_LIMITS: StoreAbuseLimits = {
  maxSessionCreatesPerIpPerHour: 30,
  maxPhotoUploadsPerIpPerHour: 40,
  maxPhotoBytesPerIpPerDay: 200 * 1024 * 1024,
  maxAttemptsPerMerchantPerDay: 2_000,
  maxFailuresPerMerchantPerDay: 200,
  maxAttemptsPerIpPerDay: 40,
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.min(parsed, 1_000_000)
}

/**
 * Runtime abuse limits. Merchant daily attempt/failure ceilings are
 * env-configurable so a paid campaign is not stuck on a hard-coded 200/day.
 * IP upload/session/failure protections stay at the secure defaults unless
 * an explicit override is supplied by the caller.
 */
export function getStoreAbuseLimits(
  env: Record<string, string | undefined> = process.env,
): StoreAbuseLimits {
  return {
    ...DEFAULT_STORE_ABUSE_LIMITS,
    maxAttemptsPerMerchantPerDay: parsePositiveInt(
      env.STORE_MERCHANT_DAILY_ATTEMPT_LIMIT,
      DEFAULT_STORE_ABUSE_LIMITS.maxAttemptsPerMerchantPerDay,
    ),
    maxFailuresPerMerchantPerDay: parsePositiveInt(
      env.STORE_MERCHANT_DAILY_FAILURE_LIMIT,
      DEFAULT_STORE_ABUSE_LIMITS.maxFailuresPerMerchantPerDay,
    ),
  }
}

function hourWindowStart(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours()))
}

export function dayWindowStart(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

export function retryAfterSeconds(windowStart: Date, windowMs: number, now = new Date()): number {
  const end = windowStart.getTime() + windowMs
  return Math.max(1, Math.ceil((end - now.getTime()) / 1000))
}

export function clientIpFromRequest(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  return headers.get('x-real-ip')?.trim() || 'unknown'
}

async function bumpCounter(input: {
  merchantId: string
  bucket: string
  windowStart: Date
  increment?: number
  bytes?: number
}): Promise<{ count: number; bytes: bigint }> {
  const increment = input.increment ?? 1
  const bytes = BigInt(input.bytes ?? 0)
  const row = await prisma.storeAbuseCounter.upsert({
    where: {
      merchantId_bucket_windowStart: {
        merchantId: input.merchantId,
        bucket: input.bucket,
        windowStart: input.windowStart,
      },
    },
    create: {
      merchantId: input.merchantId,
      bucket: input.bucket,
      windowStart: input.windowStart,
      count: increment,
      bytes,
    },
    update: {
      count: { increment },
      bytes: { increment: bytes },
    },
  })
  return { count: row.count, bytes: row.bytes }
}

export async function assertStoreSessionCreateAllowed(input: {
  merchantId: string
  ip: string
  limits?: Partial<StoreAbuseLimits>
}): Promise<void> {
  const limits = { ...getStoreAbuseLimits(), ...input.limits }
  const windowStart = hourWindowStart()
  const { count } = await bumpCounter({
    merchantId: input.merchantId,
    bucket: `session_create:ip:${input.ip}`,
    windowStart,
  })
  if (count > limits.maxSessionCreatesPerIpPerHour) {
    throw new StoreDomainError(
      'ALLOWANCE_EXCEEDED',
      'Too many store sessions from this network. Please try again later.',
      429,
      `retry_after=${retryAfterSeconds(windowStart, 3600_000)}`,
    )
  }
}

export async function assertStorePhotoUploadAllowed(input: {
  merchantId: string
  ip: string
  byteSize: number
  limits?: Partial<StoreAbuseLimits>
}): Promise<void> {
  const limits = { ...getStoreAbuseLimits(), ...input.limits }
  const hourStart = hourWindowStart()
  const dayStart = dayWindowStart()

  const uploads = await bumpCounter({
    merchantId: input.merchantId,
    bucket: `photo_upload:ip:${input.ip}`,
    windowStart: hourStart,
  })
  if (uploads.count > limits.maxPhotoUploadsPerIpPerHour) {
    throw new StoreDomainError(
      'ALLOWANCE_EXCEEDED',
      'Too many photo uploads from this network. Please try again later.',
      429,
      `retry_after=${retryAfterSeconds(hourStart, 3600_000)}`,
    )
  }

  const bytes = await bumpCounter({
    merchantId: input.merchantId,
    bucket: `photo_bytes:ip:${input.ip}`,
    windowStart: dayStart,
    increment: 1,
    bytes: input.byteSize,
  })
  if (Number(bytes.bytes) > limits.maxPhotoBytesPerIpPerDay) {
    throw new StoreDomainError(
      'ALLOWANCE_EXCEEDED',
      'Daily photo upload limit reached for this network.',
      429,
      `retry_after=${retryAfterSeconds(dayStart, 86400_000)}`,
    )
  }
}

export async function assertStoreMerchantAttemptAllowed(input: {
  merchantId: string
  limits?: Partial<StoreAbuseLimits>
}): Promise<void> {
  const limits = { ...getStoreAbuseLimits(), ...input.limits }
  const windowStart = dayWindowStart()
  const { count } = await bumpCounter({
    merchantId: input.merchantId,
    bucket: 'attempt:merchant',
    windowStart,
  })
  if (count > limits.maxAttemptsPerMerchantPerDay) {
    throw new StoreDomainError(
      'ALLOWANCE_EXCEEDED',
      'Merchant daily try-on attempt limit reached.',
      429,
      `retry_after=${retryAfterSeconds(windowStart, 86400_000)}`,
    )
  }
}

export async function recordStoreMerchantFailureAbuse(input: {
  merchantId: string
  limits?: Partial<StoreAbuseLimits>
}): Promise<void> {
  const limits = { ...getStoreAbuseLimits(), ...input.limits }
  const windowStart = dayWindowStart()
  const { count } = await bumpCounter({
    merchantId: input.merchantId,
    bucket: 'failure:merchant',
    windowStart,
  })
  if (count > limits.maxFailuresPerMerchantPerDay) {
    throw new StoreDomainError(
      'ALLOWANCE_EXCEEDED',
      'Merchant daily try-on failure limit reached.',
      429,
      `retry_after=${retryAfterSeconds(windowStart, 86400_000)}`,
    )
  }
}
