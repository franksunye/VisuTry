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
  experienceSlug?: string
  locale?: string
  anonymousVisitorId?: string
  deviceType?: string
  acquisition?: {
    source?: string
    medium?: string
    campaign?: string
    surface?: string
    acquisitionSurface?: string
    referrer?: string
    landingUrl?: string
    aiAgentSource?: string
  }
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

  let acquisition: CreateSessionRequest['acquisition']
  if (record.acquisition && typeof record.acquisition === 'object' && !Array.isArray(record.acquisition)) {
    const a = record.acquisition as Record<string, unknown>
    acquisition = {
      source: typeof a.source === 'string' ? a.source : undefined,
      medium: typeof a.medium === 'string' ? a.medium : undefined,
      campaign: typeof a.campaign === 'string' ? a.campaign : undefined,
      surface: typeof a.surface === 'string' ? a.surface : undefined,
      acquisitionSurface: typeof a.acquisitionSurface === 'string' ? a.acquisitionSurface : undefined,
      referrer: typeof a.referrer === 'string' ? a.referrer : undefined,
      landingUrl: typeof a.landingUrl === 'string' ? a.landingUrl : undefined,
      aiAgentSource: typeof a.aiAgentSource === 'string' ? a.aiAgentSource : undefined,
    }
  }

  return ok({
    merchantSlug: String(record.merchantSlug).trim(),
    experienceSlug: typeof record.experienceSlug === 'string' ? record.experienceSlug.trim() : undefined,
    locale: typeof record.locale === 'string' ? record.locale : undefined,
    anonymousVisitorId:
      typeof record.anonymousVisitorId === 'string'
        ? record.anonymousVisitorId
        : undefined,
    deviceType: typeof record.deviceType === 'string' ? record.deviceType : undefined,
    acquisition,
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
  productUrl?: string
  locale?: string
  deviceType?: string
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
    productUrl: typeof record.productUrl === 'string' ? record.productUrl : undefined,
    locale: typeof record.locale === 'string' ? record.locale : undefined,
    deviceType: typeof record.deviceType === 'string' ? record.deviceType : undefined,
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

export type RecommendGeometryAnalysis = {
  status?: 'measured' | 'unavailable'
  measuredShape?: string
  alternativeShapes?: string[]
  measuredConfidence?: number
  qualityScore?: number
  ratios?: {
    faceAspectRatio?: number
    jawToCheekWidth?: number
    foreheadToCheekWidth?: number
  }
}

export type RecommendFramesRequest = {
  merchantSlug: string
  merchantSessionId: string
  measuredShape?: string
  faceAspectRatio?: number
  styleHints?: string[]
  geometryAnalysis?: RecommendGeometryAnalysis
  locale?: string
  deviceType?: string
  limit?: number
  clientActionId?: string
}

export function parseRecommendFramesRequest(
  body: unknown,
): ValidationResult<RecommendFramesRequest> {
  if (!body || typeof body !== 'object') {
    return fail([{ path: 'body', message: 'Request body must be an object' }])
  }
  const record = body as Record<string, unknown>
  const issues = [
    requireString(record.merchantSlug, 'merchantSlug', 120),
    requireString(record.merchantSessionId, 'merchantSessionId', 120),
  ].filter(Boolean) as { path: string; message: string }[]

  if (
    record.faceAspectRatio !== undefined &&
    record.faceAspectRatio !== null &&
    (typeof record.faceAspectRatio !== 'number' || !Number.isFinite(record.faceAspectRatio))
  ) {
    issues.push({ path: 'faceAspectRatio', message: 'faceAspectRatio must be a number' })
  }

  const geometryAnalysis = parseRecommendGeometryAnalysis(record.geometryAnalysis, issues)

  if (record.styleHints !== undefined && !Array.isArray(record.styleHints)) {
    issues.push({ path: 'styleHints', message: 'styleHints must be an array of strings' })
  }

  if (issues.length) return fail(issues)

  const styleHints = Array.isArray(record.styleHints)
    ? record.styleHints.filter((h): h is string => typeof h === 'string').slice(0, 12)
    : undefined

  const limit =
    typeof record.limit === 'number' && Number.isInteger(record.limit)
      ? Math.min(8, Math.max(4, record.limit))
      : undefined

  return ok({
    merchantSlug: String(record.merchantSlug).trim(),
    merchantSessionId: String(record.merchantSessionId).trim(),
    measuredShape:
      typeof record.measuredShape === 'string' ? record.measuredShape : undefined,
    faceAspectRatio:
      typeof record.faceAspectRatio === 'number' ? record.faceAspectRatio : undefined,
    styleHints,
    geometryAnalysis,
    locale: typeof record.locale === 'string' ? record.locale : undefined,
    deviceType: typeof record.deviceType === 'string' ? record.deviceType : undefined,
    limit,
    clientActionId:
      typeof record.clientActionId === 'string' ? record.clientActionId : undefined,
  })
}

function parseRecommendGeometryAnalysis(
  value: unknown,
  issues: { path: string; message: string }[],
): RecommendFramesRequest['geometryAnalysis'] {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'object' || Array.isArray(value)) {
    issues.push({ path: 'geometryAnalysis', message: 'geometryAnalysis must be an object' })
    return undefined
  }

  const record = value as Record<string, unknown>
  const status = record.status === undefined
    ? undefined
    : record.status === 'measured' || record.status === 'unavailable'
      ? record.status
      : undefined
  if (record.status !== undefined && status === undefined) {
    issues.push({ path: 'geometryAnalysis.status', message: 'status must be measured or unavailable' })
  }

  const alternativeShapes = parseGeometryStringArray(record.alternativeShapes, 'alternativeShapes', issues)
  const ratiosValue = record.ratios
  let ratios: RecommendGeometryAnalysis['ratios']
  if (ratiosValue !== undefined && ratiosValue !== null) {
    if (typeof ratiosValue !== 'object' || Array.isArray(ratiosValue)) {
      issues.push({ path: 'geometryAnalysis.ratios', message: 'ratios must be an object' })
    } else {
      const ratioRecord = ratiosValue as Record<string, unknown>
      ratios = {
        faceAspectRatio: parseClampedGeometryNumber(
          ratioRecord.faceAspectRatio,
          0.6,
          2.2,
          'geometryAnalysis.ratios.faceAspectRatio',
          issues,
        ),
        jawToCheekWidth: parseClampedGeometryNumber(
          ratioRecord.jawToCheekWidth,
          0.4,
          1.3,
          'geometryAnalysis.ratios.jawToCheekWidth',
          issues,
        ),
        foreheadToCheekWidth: parseClampedGeometryNumber(
          ratioRecord.foreheadToCheekWidth,
          0.4,
          1.3,
          'geometryAnalysis.ratios.foreheadToCheekWidth',
          issues,
        ),
      }
    }
  }

  return {
    status,
    measuredShape: typeof record.measuredShape === 'string' ? record.measuredShape.trim() : undefined,
    alternativeShapes,
    measuredConfidence: parseClampedGeometryNumber(
      record.measuredConfidence,
      0,
      1,
      'geometryAnalysis.measuredConfidence',
      issues,
    ),
    qualityScore: parseClampedGeometryNumber(
      record.qualityScore,
      0,
      100,
      'geometryAnalysis.qualityScore',
      issues,
    ),
    ratios,
  }
}

function parseGeometryStringArray(
  value: unknown,
  path: string,
  issues: { path: string; message: string }[],
): string[] | undefined {
  if (value === undefined || value === null) return undefined
  if (!Array.isArray(value)) {
    issues.push({ path: `geometryAnalysis.${path}`, message: `${path} must be an array of strings` })
    return undefined
  }
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, 2)
}

function parseClampedGeometryNumber(
  value: unknown,
  min: number,
  max: number,
  path: string,
  issues: { path: string; message: string }[],
): number | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    issues.push({ path, message: 'must be a finite number' })
    return undefined
  }
  return Math.min(max, Math.max(min, value))
}

export type SelectFramesRequest = {
  merchantSlug: string
  merchantSessionId: string
  frameIds: string[]
  locale?: string
  deviceType?: string
  clientActionId?: string
}

export function parseSelectFramesRequest(body: unknown): ValidationResult<SelectFramesRequest> {
  if (!body || typeof body !== 'object') {
    return fail([{ path: 'body', message: 'Request body must be an object' }])
  }
  const record = body as Record<string, unknown>
  const issues = [
    requireString(record.merchantSlug, 'merchantSlug', 120),
    requireString(record.merchantSessionId, 'merchantSessionId', 120),
  ].filter(Boolean) as { path: string; message: string }[]

  if (!Array.isArray(record.frameIds) || record.frameIds.length === 0) {
    issues.push({ path: 'frameIds', message: 'frameIds must be a non-empty array' })
  }

  if (issues.length) return fail(issues)

  const frameIds = (record.frameIds as unknown[])
    .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    .map((id) => id.trim())
    .slice(0, 4)

  if (frameIds.length === 0) {
    return fail([{ path: 'frameIds', message: 'frameIds must include valid ids' }])
  }

  return ok({
    merchantSlug: String(record.merchantSlug).trim(),
    merchantSessionId: String(record.merchantSessionId).trim(),
    frameIds,
    locale: typeof record.locale === 'string' ? record.locale : undefined,
    deviceType: typeof record.deviceType === 'string' ? record.deviceType : undefined,
    clientActionId:
      typeof record.clientActionId === 'string' ? record.clientActionId : undefined,
  })
}

export type StoreTryOnSubmitRequest = {
  merchantSlug: string
  merchantSessionId: string
  merchantFrameId: string
  batchId: string
  clientSubmissionId: string
  locale?: string
  deviceType?: string
}

export function parseStoreTryOnSubmitRequest(
  body: unknown,
): ValidationResult<StoreTryOnSubmitRequest> {
  if (!body || typeof body !== 'object') {
    return fail([{ path: 'body', message: 'Request body must be an object' }])
  }
  const record = body as Record<string, unknown>
  const issues = [
    requireString(record.merchantSlug, 'merchantSlug', 120),
    requireString(record.merchantSessionId, 'merchantSessionId', 120),
    requireString(record.merchantFrameId, 'merchantFrameId', 120),
    requireString(record.batchId, 'batchId', 120),
    requireString(record.clientSubmissionId, 'clientSubmissionId', 200),
  ].filter(Boolean) as { path: string; message: string }[]

  if (issues.length) return fail(issues)

  return ok({
    merchantSlug: String(record.merchantSlug).trim(),
    merchantSessionId: String(record.merchantSessionId).trim(),
    merchantFrameId: String(record.merchantFrameId).trim(),
    batchId: String(record.batchId).trim(),
    clientSubmissionId: String(record.clientSubmissionId).trim(),
    locale: typeof record.locale === 'string' ? record.locale : undefined,
    deviceType: typeof record.deviceType === 'string' ? record.deviceType : undefined,
  })
}

export type StoreTryOnPollRequest = {
  merchantSlug: string
  merchantSessionId: string
  taskId: string
  locale?: string
  deviceType?: string
}

export function parseStoreTryOnPollRequest(
  body: unknown,
): ValidationResult<StoreTryOnPollRequest> {
  if (!body || typeof body !== 'object') {
    return fail([{ path: 'body', message: 'Request body must be an object' }])
  }
  const record = body as Record<string, unknown>
  const issues = [
    requireString(record.merchantSlug, 'merchantSlug', 120),
    requireString(record.merchantSessionId, 'merchantSessionId', 120),
    requireString(record.taskId, 'taskId', 120),
  ].filter(Boolean) as { path: string; message: string }[]

  if (issues.length) return fail(issues)

  return ok({
    merchantSlug: String(record.merchantSlug).trim(),
    merchantSessionId: String(record.merchantSessionId).trim(),
    taskId: String(record.taskId).trim(),
    locale: typeof record.locale === 'string' ? record.locale : undefined,
    deviceType: typeof record.deviceType === 'string' ? record.deviceType : undefined,
  })
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
