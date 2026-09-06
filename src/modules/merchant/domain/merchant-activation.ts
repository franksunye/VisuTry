import { validateMerchantFrameReadiness, type MerchantFrameReadinessInput } from './merchant-frame-readiness'

/**
 * Canonical Merchant activation event names. Values intentionally match the
 * existing GA4 vocabulary where one exists, while the database event remains
 * the durable cohort source of truth.
 */
export const MERCHANT_ACTIVATION_EVENT = {
  WORKSPACE_CREATED: 'merchant_workspace_created',
  WORKSPACE_ENTERED: 'merchant_workspace_entered',
  PROFILE_UPDATED: 'merchant_profile_updated',
  CATALOG_STARTED: 'merchant_catalog_started',
  FIRST_ITEM_ADDED: 'merchant_first_item_added',
  CATALOG_READY: 'merchant_catalog_ready',
  STORE_CONFIGURED: 'merchant_store_configured',
  STORE_PREVIEWED: 'merchant_store_previewed',
  STORE_PUBLISHED: 'merchant_store_published',
  FIRST_SHOPPER_SESSION: 'merchant_first_shopper_session',
  COMMERCIAL_INTENT: 'merchant_commercial_intent',
  CHECKOUT_STARTED: 'merchant_checkout_started',
} as const

export type MerchantActivationEventType = (typeof MERCHANT_ACTIVATION_EVENT)[keyof typeof MERCHANT_ACTIVATION_EVENT]
export type MerchantActivationEventSource = 'SERVER' | 'CLIENT'

export const MERCHANT_ACTIVATION_CLIENT_EVENTS = [
  MERCHANT_ACTIVATION_EVENT.WORKSPACE_ENTERED,
  MERCHANT_ACTIVATION_EVENT.CATALOG_STARTED,
  MERCHANT_ACTIVATION_EVENT.STORE_PREVIEWED,
  MERCHANT_ACTIVATION_EVENT.COMMERCIAL_INTENT,
] as const satisfies readonly MerchantActivationEventType[]

export const MERCHANT_ACTIVATION_SERVER_EVENTS = [
  MERCHANT_ACTIVATION_EVENT.WORKSPACE_CREATED,
  MERCHANT_ACTIVATION_EVENT.PROFILE_UPDATED,
  MERCHANT_ACTIVATION_EVENT.FIRST_ITEM_ADDED,
  MERCHANT_ACTIVATION_EVENT.CATALOG_READY,
  MERCHANT_ACTIVATION_EVENT.STORE_CONFIGURED,
  MERCHANT_ACTIVATION_EVENT.STORE_PUBLISHED,
  MERCHANT_ACTIVATION_EVENT.FIRST_SHOPPER_SESSION,
  MERCHANT_ACTIVATION_EVENT.CHECKOUT_STARTED,
] as const satisfies readonly MerchantActivationEventType[]

const SAFE_ID = /^[A-Za-z0-9_-]{8,96}$/u
const COMMERCIAL_INTENTS = new Set(['FREE', 'FOUNDING_PILOT', 'LAUNCH', 'GROWTH', 'SCALE'])
const MAX_PATH_LENGTH = 240

export type MerchantActivationAttributionInput = {
  landingPage?: unknown
  acquisitionSource?: unknown
  acquisitionMedium?: unknown
  referrerHost?: unknown
  utmSource?: unknown
  utmMedium?: unknown
  utmCampaign?: unknown
  commercialIntent?: unknown
  signupCorrelationId?: unknown
  landingLocale?: unknown
}

export type MerchantActivationAttributionSnapshot = {
  landing_page?: string
  acquisition_source?: string
  acquisition_medium?: string
  referrer_host?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  commercial_intent?: string
  signup_correlation_id?: string
  landing_locale?: string
}

function boundedString(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : undefined
}

function boundedSafeLabel(value: unknown, max: number): string | undefined {
  const normalized = boundedString(value, max)
  if (!normalized || /@|:\/\/|[\u0000-\u001f\u007f]/u.test(normalized)) return undefined
  return normalized
}

function pathnameOnly(value: unknown): string | undefined {
  const normalized = boundedString(value, MAX_PATH_LENGTH)
  if (!normalized) return undefined
  if (!normalized.startsWith('/')) return undefined
  if (normalized.includes('@') || /[\u0000-\u001f\u007f]/u.test(normalized)) return undefined
  const withoutQuery = normalized.split(/[?#]/u, 1)[0]
  return withoutQuery.slice(0, MAX_PATH_LENGTH) || '/'
}

function hostOnly(value: unknown): string | undefined {
  const normalized = boundedString(value, 255)
  if (!normalized || normalized.includes('/') || normalized.includes('@')) return undefined
  return normalized.toLowerCase()
}

function safeId(value: unknown): string | undefined {
  const normalized = boundedString(value, 96)
  return normalized && SAFE_ID.test(normalized) ? normalized : undefined
}

function commercialIntent(value: unknown): string | undefined {
  const normalized = boundedString(value, 32)?.toUpperCase()
  return normalized && COMMERCIAL_INTENTS.has(normalized) ? normalized : undefined
}

/** Sanitize the first-touch snapshot before it can reach durable storage. */
export function sanitizeMerchantActivationAttribution(
  input: MerchantActivationAttributionInput | null | undefined,
): MerchantActivationAttributionSnapshot {
  if (!input) return {}
  const snapshot: MerchantActivationAttributionSnapshot = {}
  const landingPage = pathnameOnly(input.landingPage)
  const acquisitionSource = boundedSafeLabel(input.acquisitionSource, 80)
  const acquisitionMedium = boundedSafeLabel(input.acquisitionMedium, 40)
  const referrerHost = hostOnly(input.referrerHost)
  const utmSource = boundedSafeLabel(input.utmSource, 80)
  const utmMedium = boundedSafeLabel(input.utmMedium, 40)
  const utmCampaign = boundedSafeLabel(input.utmCampaign, 120)
  const intent = commercialIntent(input.commercialIntent)
  const signupCorrelationId = safeId(input.signupCorrelationId)
  const landingLocale = boundedSafeLabel(input.landingLocale, 16)

  if (landingPage) snapshot.landing_page = landingPage
  if (acquisitionSource) snapshot.acquisition_source = acquisitionSource
  if (acquisitionMedium) snapshot.acquisition_medium = acquisitionMedium
  if (referrerHost) snapshot.referrer_host = referrerHost
  if (utmSource) snapshot.utm_source = utmSource
  if (utmMedium) snapshot.utm_medium = utmMedium
  if (utmCampaign) snapshot.utm_campaign = utmCampaign
  if (intent) snapshot.commercial_intent = intent
  if (signupCorrelationId) snapshot.signup_correlation_id = signupCorrelationId
  if (landingLocale) snapshot.landing_locale = landingLocale

  return snapshot
}

export function sanitizeMerchantActivationId(value: unknown): string | undefined {
  return safeId(value)
}

export function isMerchantActivationEventType(value: unknown): value is MerchantActivationEventType {
  return typeof value === 'string' && (Object.values(MERCHANT_ACTIVATION_EVENT) as string[]).includes(value)
}

export function isMerchantActivationClientEvent(value: unknown): value is (typeof MERCHANT_ACTIVATION_CLIENT_EVENTS)[number] {
  return typeof value === 'string' && (MERCHANT_ACTIVATION_CLIENT_EVENTS as readonly string[]).includes(value)
}

export function buildMerchantActivationDedupeKey(input: {
  merchantId: string
  eventType: MerchantActivationEventType
  sessionId?: string | null
  correlationId?: string | null
  resourceId?: string | null
  intent?: string | null
}): string {
  const merchantId = input.merchantId.trim()
  const firstMilestone: ReadonlySet<MerchantActivationEventType> = new Set([
    MERCHANT_ACTIVATION_EVENT.WORKSPACE_CREATED,
    MERCHANT_ACTIVATION_EVENT.PROFILE_UPDATED,
    MERCHANT_ACTIVATION_EVENT.FIRST_ITEM_ADDED,
    MERCHANT_ACTIVATION_EVENT.CATALOG_READY,
    MERCHANT_ACTIVATION_EVENT.STORE_CONFIGURED,
    MERCHANT_ACTIVATION_EVENT.STORE_PUBLISHED,
    MERCHANT_ACTIVATION_EVENT.FIRST_SHOPPER_SESSION,
  ])
  if (firstMilestone.has(input.eventType)) return `merchant:${merchantId}:${input.eventType.replace(/^merchant_/u, '')}`
  const session = input.sessionId || input.correlationId || 'no-session'
  const resource = input.resourceId ? `:${input.resourceId}` : ''
  const intent = input.intent ? `:${input.intent}` : ''
  return `merchant:${merchantId}:${input.eventType.replace(/^merchant_/u, '')}:${session}${resource}${intent}`
}

export type MerchantActivationEventRecord = {
  id: string
  merchantId: string
  eventType: MerchantActivationEventType
  occurredAt: Date
  source: MerchantActivationEventSource
  correlationId: string | null
  sessionId: string | null
  dedupeKey: string
  metadata: Record<string, unknown> | null
}

export type MerchantActivationSummary = {
  workspaceCreatedAt: string | null
  workspaceEnteredAt: string | null
  profileUpdatedAt: string | null
  firstItemAt: string | null
  catalogReadyAt: string | null
  storeConfiguredAt: string | null
  storePreviewedAt: string | null
  storePublishedAt: string | null
  firstShopperSessionAt: string | null
  commercialIntentAt: string | null
  workspaceSessionCount: number
  returnSessionCount: number
  highestStage: `A${number}` | null
  timeToFirstItemMs: number | null
  timeToStorePublishedMs: number | null
}

const ACTIVATION_STAGE_BY_EVENT: Partial<Record<MerchantActivationEventType, number>> = {
  [MERCHANT_ACTIVATION_EVENT.WORKSPACE_CREATED]: 0,
  [MERCHANT_ACTIVATION_EVENT.WORKSPACE_ENTERED]: 1,
  [MERCHANT_ACTIVATION_EVENT.PROFILE_UPDATED]: 2,
  [MERCHANT_ACTIVATION_EVENT.FIRST_ITEM_ADDED]: 3,
  [MERCHANT_ACTIVATION_EVENT.CATALOG_READY]: 4,
  [MERCHANT_ACTIVATION_EVENT.STORE_CONFIGURED]: 5,
  [MERCHANT_ACTIVATION_EVENT.STORE_PREVIEWED]: 6,
  [MERCHANT_ACTIVATION_EVENT.STORE_PUBLISHED]: 7,
  // A8 is reserved for a future Campaign-created milestone. Campaign
  // functionality is deliberately outside Activation v1.
  [MERCHANT_ACTIVATION_EVENT.FIRST_SHOPPER_SESSION]: 9,
  [MERCHANT_ACTIVATION_EVENT.COMMERCIAL_INTENT]: 11,
  [MERCHANT_ACTIVATION_EVENT.CHECKOUT_STARTED]: 12,
}

function firstEvent(events: MerchantActivationEventRecord[], eventType: MerchantActivationEventType): MerchantActivationEventRecord | undefined {
  return events.find((event) => event.eventType === eventType)
}

function iso(event: MerchantActivationEventRecord | undefined): string | null {
  return event?.occurredAt.toISOString() ?? null
}

/** Pure summary logic shared by Prisma and Neon/Cloudflare adapters. */
export function summarizeMerchantActivationEvents(events: MerchantActivationEventRecord[]): MerchantActivationSummary {
  const ordered = [...events].sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime())
  const workspace = firstEvent(ordered, MERCHANT_ACTIVATION_EVENT.WORKSPACE_CREATED)
  const entered = ordered.filter((event) => event.eventType === MERCHANT_ACTIVATION_EVENT.WORKSPACE_ENTERED)
  const sessions = new Set(entered.map((event) => event.sessionId || event.dedupeKey))
  const firstItem = firstEvent(ordered, MERCHANT_ACTIVATION_EVENT.FIRST_ITEM_ADDED)
  const published = firstEvent(ordered, MERCHANT_ACTIVATION_EVENT.STORE_PUBLISHED)
  const highestStageNumber = ordered.reduce<number | null>((highest, event) => {
    const stageNumber = ACTIVATION_STAGE_BY_EVENT[event.eventType]
    return stageNumber == null || (highest != null && highest >= stageNumber) ? highest : stageNumber
  }, null)
  const stage = highestStageNumber == null ? null : `A${highestStageNumber}` as `A${number}`
  const timeToFirstItemMs = workspace && firstItem ? Math.max(0, firstItem.occurredAt.getTime() - workspace.occurredAt.getTime()) : null
  const timeToStorePublishedMs = workspace && published ? Math.max(0, published.occurredAt.getTime() - workspace.occurredAt.getTime()) : null
  return {
    workspaceCreatedAt: iso(workspace),
    workspaceEnteredAt: iso(entered[0]),
    profileUpdatedAt: iso(firstEvent(ordered, MERCHANT_ACTIVATION_EVENT.PROFILE_UPDATED)),
    firstItemAt: iso(firstItem),
    catalogReadyAt: iso(firstEvent(ordered, MERCHANT_ACTIVATION_EVENT.CATALOG_READY)),
    storeConfiguredAt: iso(firstEvent(ordered, MERCHANT_ACTIVATION_EVENT.STORE_CONFIGURED)),
    storePreviewedAt: iso(firstEvent(ordered, MERCHANT_ACTIVATION_EVENT.STORE_PREVIEWED)),
    storePublishedAt: iso(published),
    firstShopperSessionAt: iso(firstEvent(ordered, MERCHANT_ACTIVATION_EVENT.FIRST_SHOPPER_SESSION)),
    commercialIntentAt: iso(firstEvent(ordered, MERCHANT_ACTIVATION_EVENT.COMMERCIAL_INTENT)),
    workspaceSessionCount: sessions.size,
    returnSessionCount: Math.max(0, sessions.size - 1),
    highestStage: stage,
    timeToFirstItemMs,
    timeToStorePublishedMs,
  }
}

export function merchantCatalogItemIsReady(frame: MerchantFrameReadinessInput): boolean {
  return validateMerchantFrameReadiness(frame).valid
}
