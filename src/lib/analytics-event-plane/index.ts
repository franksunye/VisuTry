import { createClient, type Client } from '@libsql/client'
import { logger } from '@/lib/logger'

export const ANALYTICS_EVENT_VERSION = 1 as const
export const ANALYTICS_EVENT_TYPES = ['merchant_page_viewed'] as const
export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number]

export type AnalyticsEvent = {
  eventId: string
  eventVersion: typeof ANALYTICS_EVENT_VERSION
  eventType: AnalyticsEventType
  occurredAt: Date
  receivedAt?: Date
  merchantId?: string | null
  experienceId?: string | null
  storeId?: string | null
  campaignId?: string | null
  sessionId?: string | null
  anonymousActorId?: string | null
  payload?: Record<string, unknown> | null
}

export interface AnalyticsEventSink {
  write(event: AnalyticsEvent): Promise<void>
}

export type AnalyticsEventEnvironment = {
  NODE_ENV?: string
  ANALYTICS_EVENT_PROVIDER?: string
  TURSO_DATABASE_URL?: string
  TURSO_AUTH_TOKEN?: string
}

export type AnalyticsEventProviderConfig = {
  provider: 'disabled' | 'turso'
  url?: string
  authToken?: string
}

const TURSO_WRITE_TIMEOUT_MS = 250
const SENSITIVE_KEY_PARTS = [
  'password',
  'secret',
  'token',
  'credential',
  'authorization',
  'cookie',
  'email',
  'name',
  'note',
  'image',
  'photo',
  'face',
  'landmark',
  'payment',
  'credit',
]

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase()
  return SENSITIVE_KEY_PARTS.some((part) => normalized.includes(part))
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 3 || value === null || typeof value === 'boolean') return value
  if (typeof value === 'string') return value.slice(0, 256)
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitizeValue(item, depth + 1))
  if (typeof value !== 'object') return undefined

  const output: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 40)) {
    if (isSensitiveKey(key)) continue
    const sanitized = sanitizeValue(item, depth + 1)
    if (sanitized !== undefined) output[key.slice(0, 64)] = sanitized
  }
  return output
}

export function sanitizeAnalyticsPayload(
  payload: Record<string, unknown> | null | undefined,
): Record<string, unknown> | undefined {
  if (!payload) return undefined
  const sanitized = sanitizeValue(payload)
  if (!sanitized || typeof sanitized !== 'object' || Array.isArray(sanitized)) return undefined
  return Object.keys(sanitized).length > 0 ? sanitized as Record<string, unknown> : undefined
}

function normalizedProvider(value: string | undefined): string {
  return value?.trim().toLowerCase() || 'disabled'
}

function validTursoUrl(value: string): boolean {
  try {
    const url = new URL(value)
    const supported = url.protocol === 'https:' || url.protocol === 'http:' || url.protocol === 'libsql:'
    return supported && !url.username && !url.password
  } catch {
    return false
  }
}

export function resolveAnalyticsEventProviderConfig(
  env: AnalyticsEventEnvironment = process.env,
): AnalyticsEventProviderConfig {
  const provider = normalizedProvider(env.ANALYTICS_EVENT_PROVIDER)
  if (provider === 'disabled' || provider === 'none') return { provider: 'disabled' }
  if (provider !== 'turso') {
    throw new Error('Unsupported analytics event provider. Use "turso" or leave it disabled.')
  }

  const url = env.TURSO_DATABASE_URL?.trim()
  const authToken = env.TURSO_AUTH_TOKEN?.trim()
  if (!url || !authToken || !validTursoUrl(url)) {
    if (env.NODE_ENV === 'production') {
      throw new Error('Turso analytics is required in production but its configuration is incomplete.')
    }
    return { provider: 'disabled' }
  }
  return { provider: 'turso', url, authToken }
}

export class NoopAnalyticsEventSink implements AnalyticsEventSink {
  async write(_event: AnalyticsEvent): Promise<void> {
    // Analytics is optional and must never affect the core PostgreSQL path.
  }
}

export class TursoAnalyticsEventSink implements AnalyticsEventSink {
  private readonly client: Pick<Client, 'execute'>

  constructor(client: Pick<Client, 'execute'>) {
    this.client = client
  }

  async write(event: AnalyticsEvent): Promise<void> {
    const payload = JSON.stringify(sanitizeAnalyticsPayload(event.payload) ?? {})
    await this.client.execute({
      sql: `
        INSERT OR IGNORE INTO analytics_events (
          event_id, event_version, event_type, occurred_at, received_at,
          merchant_id, experience_id, store_id, campaign_id, session_id,
          anonymous_actor_id, payload
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        event.eventId,
        event.eventVersion,
        event.eventType,
        event.occurredAt.toISOString(),
        (event.receivedAt ?? new Date()).toISOString(),
        event.merchantId ?? null,
        event.experienceId ?? null,
        event.storeId ?? null,
        event.campaignId ?? null,
        event.sessionId ?? null,
        event.anonymousActorId ?? null,
        payload,
      ],
    })
  }
}

export function createAnalyticsEventSink(
  env: AnalyticsEventEnvironment = process.env,
): AnalyticsEventSink {
  const config = resolveAnalyticsEventProviderConfig(env)
  if (config.provider !== 'turso') return new NoopAnalyticsEventSink()
  return new TursoAnalyticsEventSink(createClient({ url: config.url!, authToken: config.authToken }))
}

function errorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code.slice(0, 64)
  }
  return error instanceof Error ? error.name.slice(0, 64) : 'UNKNOWN'
}

/**
 * Best-effort emission after a successful PostgreSQL operation. The timeout
 * bounds provider latency and the catch path deliberately contains all Turso
 * failures so analytics cannot turn a successful request into a 5xx.
 */
export async function emitAnalyticsEvent(
  sink: AnalyticsEventSink,
  event: AnalyticsEvent,
  timeoutMs = TURSO_WRITE_TIMEOUT_MS,
): Promise<void> {
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('analytics sink timeout')), timeoutMs)
      try {
        sink.write(event).then(
          () => {
            clearTimeout(timer)
            resolve()
          },
          (error) => {
            clearTimeout(timer)
            reject(error)
          },
        )
      } catch (error) {
        clearTimeout(timer)
        reject(error)
      }
    })
  } catch (error) {
    try {
      logger.warn('general', 'Analytics event sink failed open', {
        provider: 'turso',
        eventType: event.eventType,
        errorCode: errorCode(error),
      })
    } catch {
      // Logging is also best-effort for this non-authoritative signal.
    }
  }
}

export function createMerchantPageViewedEvent(input: {
  eventId: string
  merchantId: string
  experienceId?: string | null
  merchantSessionId: string
  anonymousVisitorId?: string | null
  locale?: string | null
  deviceType?: string | null
  acquisition?: Record<string, unknown> | null
}): AnalyticsEvent {
  return {
    eventId: input.eventId,
    eventVersion: ANALYTICS_EVENT_VERSION,
    eventType: 'merchant_page_viewed',
    occurredAt: new Date(),
    merchantId: input.merchantId,
    experienceId: input.experienceId ?? null,
    sessionId: input.merchantSessionId,
    anonymousActorId: input.anonymousVisitorId ?? null,
    payload: sanitizeAnalyticsPayload({
      locale: input.locale ?? undefined,
      deviceType: input.deviceType ?? undefined,
      ...(input.acquisition ?? {}),
    }),
  }
}
