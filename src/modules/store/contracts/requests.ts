import { MERCHANT_INTENT_TYPES, STORE_EVENT_TYPES } from '../domain/enums'
import { isHttpOrHttpsUrl } from '../domain/privacy'
import {
  fail,
  ok,
  requireEnum,
  requireString,
  type ValidationResult,
} from './validate'

export type CreateSessionRequest = {
  merchantSlug: string
  locale?: string
  anonymousVisitorId?: string
  deviceType?: string
}

export function parseCreateSessionRequest(body: unknown): ValidationResult<CreateSessionRequest> {
  if (!body || typeof body !== 'object') {
    return fail([{ path: 'body', message: 'Request body must be an object' }])
  }
  const record = body as Record<string, unknown>
  const issues = [
    requireString(record.merchantSlug, 'merchantSlug', 120),
  ].filter(Boolean) as { path: string; message: string }[]

  if (issues.length) return fail(issues)

  return ok({
    merchantSlug: String(record.merchantSlug).trim(),
    locale: typeof record.locale === 'string' ? record.locale : undefined,
    anonymousVisitorId:
      typeof record.anonymousVisitorId === 'string'
        ? record.anonymousVisitorId
        : undefined,
    deviceType: typeof record.deviceType === 'string' ? record.deviceType : undefined,
  })
}

export type RecordIntentRequest = {
  merchantSlug: string
  merchantSessionId: string
  type: (typeof MERCHANT_INTENT_TYPES)[number]
  merchantFrameId?: string
  clientActionId: string
  email?: string
  name?: string
  note?: string
}

export function parseRecordIntentRequest(body: unknown): ValidationResult<RecordIntentRequest> {
  if (!body || typeof body !== 'object') {
    return fail([{ path: 'body', message: 'Request body must be an object' }])
  }
  const record = body as Record<string, unknown>
  const issues = [
    requireString(record.merchantSlug, 'merchantSlug', 120),
    requireString(record.merchantSessionId, 'merchantSessionId', 120),
    requireString(record.clientActionId, 'clientActionId', 200),
    requireEnum(record.type, 'type', MERCHANT_INTENT_TYPES),
  ].filter(Boolean) as { path: string; message: string }[]

  if (issues.length) return fail(issues)

  return ok({
    merchantSlug: String(record.merchantSlug).trim(),
    merchantSessionId: String(record.merchantSessionId).trim(),
    type: record.type as (typeof MERCHANT_INTENT_TYPES)[number],
    merchantFrameId:
      typeof record.merchantFrameId === 'string' ? record.merchantFrameId : undefined,
    clientActionId: String(record.clientActionId).trim(),
    email: typeof record.email === 'string' ? record.email : undefined,
    name: typeof record.name === 'string' ? record.name : undefined,
    note: typeof record.note === 'string' ? record.note : undefined,
  })
}

export type AppendEventRequest = {
  merchantSlug: string
  type: (typeof STORE_EVENT_TYPES)[number]
  merchantSessionId?: string
  merchantFrameId?: string
  tryOnTaskId?: string
  clientActionId?: string
  locale?: string
  deviceType?: string
  metadata?: Record<string, unknown>
}

export function parseAppendEventRequest(body: unknown): ValidationResult<AppendEventRequest> {
  if (!body || typeof body !== 'object') {
    return fail([{ path: 'body', message: 'Request body must be an object' }])
  }
  const record = body as Record<string, unknown>
  const issues = [
    requireString(record.merchantSlug, 'merchantSlug', 120),
    requireEnum(record.type, 'type', STORE_EVENT_TYPES),
  ].filter(Boolean) as { path: string; message: string }[]

  if (issues.length) return fail(issues)

  const metadata =
    record.metadata && typeof record.metadata === 'object' && !Array.isArray(record.metadata)
      ? (record.metadata as Record<string, unknown>)
      : undefined

  return ok({
    merchantSlug: String(record.merchantSlug).trim(),
    type: record.type as (typeof STORE_EVENT_TYPES)[number],
    merchantSessionId:
      typeof record.merchantSessionId === 'string' ? record.merchantSessionId : undefined,
    merchantFrameId:
      typeof record.merchantFrameId === 'string' ? record.merchantFrameId : undefined,
    tryOnTaskId: typeof record.tryOnTaskId === 'string' ? record.tryOnTaskId : undefined,
    clientActionId:
      typeof record.clientActionId === 'string' ? record.clientActionId : undefined,
    locale: typeof record.locale === 'string' ? record.locale : undefined,
    deviceType: typeof record.deviceType === 'string' ? record.deviceType : undefined,
    metadata,
  })
}

export type ProductRedirectRequest = {
  productUrl: string
}

export function parseProductRedirectRequest(
  body: unknown,
): ValidationResult<ProductRedirectRequest> {
  if (!body || typeof body !== 'object') {
    return fail([{ path: 'body', message: 'Request body must be an object' }])
  }
  const record = body as Record<string, unknown>
  if (typeof record.productUrl !== 'string' || !isHttpOrHttpsUrl(record.productUrl)) {
    return fail([{ path: 'productUrl', message: 'productUrl must be http or https' }])
  }
  return ok({ productUrl: record.productUrl })
}

/** Shared API error envelope for Store routes. */
export type StoreApiErrorBody = {
  success: false
  error: string
  code: string
  issues?: { path: string; message: string }[]
}

export function storeApiError(
  code: string,
  error: string,
  issues?: { path: string; message: string }[],
): StoreApiErrorBody {
  return { success: false, error, code, ...(issues ? { issues } : {}) }
}
