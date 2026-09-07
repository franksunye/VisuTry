import { getCloudflareSql } from '@/data/neon-cloudflare'
import { logger } from '@/lib/logger'
import {
  buildMerchantActivationDedupeKey,
  isMerchantActivationEventType,
  sanitizeMerchantActivationAttribution,
  sanitizeMerchantActivationId,
  summarizeMerchantActivationEvents,
  type MerchantActivationAttributionInput,
  type MerchantActivationEventRecord,
  type MerchantActivationEventSource,
  type MerchantActivationEventType,
  type MerchantActivationSummary,
} from '../domain/merchant-activation'

export type { MerchantActivationAttributionInput, MerchantActivationSummary }

export type MerchantActivationEventInput = {
  merchantId: string
  eventType: MerchantActivationEventType
  source: MerchantActivationEventSource
  correlationId?: string | null
  sessionId?: string | null
  resourceId?: string | null
  intent?: string | null
  occurredAt?: Date
  attribution?: MerchantActivationAttributionInput | null
  metadata?: Record<string, unknown> | null
}

const METADATA_STRING_KEYS = new Set([
  'classification', 'classification_source', 'commercial_intent', 'landing_page',
  'acquisition_source', 'acquisition_medium', 'referrer_host', 'utm_source',
  'utm_medium', 'utm_campaign', 'signup_correlation_id', 'landing_locale',
  'store_id', 'frame_id', 'status', 'reason',
])
const METADATA_NUMBER_KEYS = new Set(['frame_count', 'catalog_count'])

function safeMetadataString(value: string, max = 240): string | undefined {
  const normalized = value.trim().slice(0, max)
  if (!normalized || /@|:\/\/|[\u0000-\u001f\u007f]/u.test(normalized)) return undefined
  return normalized
}

function newRecordId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `activation-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function safeMetadata(input: Record<string, unknown> | null | undefined, attribution: MerchantActivationAttributionInput | null | undefined): Record<string, unknown> | null {
  const snapshot = sanitizeMerchantActivationAttribution(attribution)
  const value: Record<string, unknown> = { ...snapshot }
  if (input) {
    for (const [key, raw] of Object.entries(input)) {
      if (METADATA_STRING_KEYS.has(key) && typeof raw === 'string') {
        const normalized = safeMetadataString(raw)
        if (normalized) value[key] = normalized
      } else if (METADATA_NUMBER_KEYS.has(key) && typeof raw === 'number' && Number.isFinite(raw)) {
        value[key] = Math.max(0, Math.floor(raw))
      } else if (key === 'ready' && typeof raw === 'boolean') {
        value[key] = raw
      }
    }
  }
  return Object.keys(value).length > 0 ? value : null
}

function normalizeInput(input: MerchantActivationEventInput) {
  if (!input.merchantId.trim()) throw new Error('Merchant activation event requires a merchantId.')
  if (!isMerchantActivationEventType(input.eventType)) throw new Error('Unsupported Merchant activation event.')
  if (input.source !== 'SERVER' && input.source !== 'CLIENT') throw new Error('Unsupported Merchant activation event source.')
  const correlationId = sanitizeMerchantActivationId(input.correlationId)
  const sessionId = sanitizeMerchantActivationId(input.sessionId)
  const resourceId = input.resourceId?.trim().slice(0, 96) || null
  const dedupeKey = buildMerchantActivationDedupeKey({
    merchantId: input.merchantId,
    eventType: input.eventType,
    sessionId,
    correlationId,
    resourceId,
    intent: input.intent?.trim().toUpperCase() || null,
  })
  return {
    merchantId: input.merchantId.trim(),
    eventType: input.eventType,
    source: input.source,
    occurredAt: input.occurredAt ?? new Date(),
    correlationId: correlationId ?? null,
    sessionId: sessionId ?? null,
    dedupeKey,
    metadata: safeMetadata(input.metadata, input.attribution),
  }
}

type CloudflareSql = ReturnType<typeof getCloudflareSql>

/** Build an INSERT statement so state changes can include the milestone in the same Neon transaction. */
export function merchantActivationEventInsertStatement(sql: CloudflareSql, input: MerchantActivationEventInput, options?: { ifMemberOfUserId?: string }) {
  const normalized = normalizeInput(input)
  const metadata = normalized.metadata ? JSON.stringify(normalized.metadata) : null
  if (options?.ifMemberOfUserId) {
    return sql`
      INSERT INTO "MerchantActivationEvent" ("id", "merchantId", "eventType", "occurredAt", "source", "correlationId", "sessionId", "dedupeKey", "metadata", "createdAt")
      SELECT ${newRecordId()}, ${normalized.merchantId}, ${normalized.eventType}, ${normalized.occurredAt}, ${normalized.source}, ${normalized.correlationId}, ${normalized.sessionId}, ${normalized.dedupeKey}, ${metadata}::jsonb, NOW()
      WHERE EXISTS (
        SELECT 1 FROM "MerchantMembership"
        WHERE "userId" = ${options.ifMemberOfUserId} AND "merchantId" = ${normalized.merchantId}
      )
      ON CONFLICT ("merchantId", "dedupeKey") DO NOTHING
      RETURNING "id", "merchantId", "eventType", "occurredAt", "source", "correlationId", "sessionId", "dedupeKey", "metadata"
    `
  }
  return sql`
    INSERT INTO "MerchantActivationEvent" ("id", "merchantId", "eventType", "occurredAt", "source", "correlationId", "sessionId", "dedupeKey", "metadata", "createdAt")
    VALUES (${newRecordId()}, ${normalized.merchantId}, ${normalized.eventType}, ${normalized.occurredAt}, ${normalized.source}, ${normalized.correlationId}, ${normalized.sessionId}, ${normalized.dedupeKey}, ${metadata}::jsonb, NOW())
    ON CONFLICT ("merchantId", "dedupeKey") DO NOTHING
    RETURNING "id", "merchantId", "eventType", "occurredAt", "source", "correlationId", "sessionId", "dedupeKey", "metadata"
  `
}

function logActivationEvent(input: ReturnType<typeof normalizeInput>) {
  logger.info('merchant', 'Merchant activation event recorded', {
    domain: 'merchant',
    event: 'merchant_activation',
    activationEvent: input.eventType,
    merchantId: input.merchantId,
    correlationId: input.correlationId,
    source: input.source,
    environment: process.env.APP_ENV ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
  })
}

/** Log only after the surrounding Neon transaction has committed the row. */
export function logMerchantActivationEventIfInserted(input: MerchantActivationEventInput, result: unknown): boolean {
  if (!Array.isArray(result) || result.length === 0) return false
  logActivationEvent(normalizeInput(input))
  return true
}

export async function recordMerchantActivationEvent(input: MerchantActivationEventInput): Promise<void> {
  const sql = getCloudflareSql()
  const result = await sql.transaction([merchantActivationEventInsertStatement(sql, input)], { isolationLevel: 'ReadCommitted' })
  logMerchantActivationEventIfInserted(input, result[0])
}

/**
 * Build-graph compatibility for shared modules that use the Prisma writer's
 * transaction-shaped API. Cloudflare mutation modules use
 * `merchantActivationEventInsertStatement` directly so the activation row can
 * stay inside their Neon transaction; the current Cloudflare profile-write
 * boundary is intentionally unsupported and never calls this fallback.
 */
export async function recordMerchantActivationEventWithClient(
  _client: unknown,
  input: MerchantActivationEventInput,
): Promise<void> {
  await recordMerchantActivationEvent(input)
}

function mapEvent(row: Record<string, unknown>): MerchantActivationEventRecord {
  const eventType = String(row.eventType)
  if (!isMerchantActivationEventType(eventType)) throw new Error('Invalid persisted Merchant activation event type.')
  const source = String(row.source)
  if (source !== 'SERVER' && source !== 'CLIENT') throw new Error('Invalid persisted Merchant activation event source.')
  return {
    id: String(row.id),
    merchantId: String(row.merchantId),
    eventType,
    occurredAt: row.occurredAt instanceof Date ? row.occurredAt : new Date(String(row.occurredAt)),
    source,
    correlationId: row.correlationId == null ? null : String(row.correlationId),
    sessionId: row.sessionId == null ? null : String(row.sessionId),
    dedupeKey: String(row.dedupeKey),
    metadata: row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata) ? row.metadata as Record<string, unknown> : null,
  }
}

export async function getMerchantActivationEvents(input: { merchantId: string }): Promise<MerchantActivationEventRecord[]> {
  const sql = getCloudflareSql()
  const rows = await sql`
    SELECT "id", "merchantId", "eventType", "occurredAt", "source", "correlationId", "sessionId", "dedupeKey", "metadata"
    FROM "MerchantActivationEvent"
    WHERE "merchantId" = ${input.merchantId}
    ORDER BY "occurredAt" ASC, "createdAt" ASC
  `
  return (rows as Record<string, unknown>[]).map(mapEvent)
}

export async function getMerchantActivationSummary(input: { merchantId: string }): Promise<MerchantActivationSummary> {
  return summarizeMerchantActivationEvents(await getMerchantActivationEvents(input))
}
