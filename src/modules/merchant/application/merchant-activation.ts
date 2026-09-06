import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
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

type ActivationEventWriter = {
  merchantActivationEvent: {
    upsert: (args: {
      where: { merchantId_dedupeKey: { merchantId: string; dedupeKey: string } }
      create: {
        merchantId: string
        eventType: string
        occurredAt: Date
        source: string
        correlationId?: string | null
        sessionId?: string | null
        dedupeKey: string
        metadata?: Prisma.InputJsonValue
      }
      update: Record<string, never>
    }) => Promise<unknown>
  }
}

const METADATA_STRING_KEYS = new Set([
  'classification',
  'classification_source',
  'commercial_intent',
  'landing_page',
  'acquisition_source',
  'acquisition_medium',
  'referrer_host',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'signup_correlation_id',
  'landing_locale',
  'store_id',
  'frame_id',
  'status',
  'reason',
])
const METADATA_NUMBER_KEYS = new Set(['frame_count', 'catalog_count'])

function safeMetadataString(value: string, max = 240): string | undefined {
  const normalized = value.trim().slice(0, max)
  if (!normalized || /@|:\/\/|[\u0000-\u001f\u007f]/u.test(normalized)) return undefined
  return normalized
}

function safeMetadata(input: Record<string, unknown> | null | undefined, attribution: MerchantActivationAttributionInput | null | undefined): Prisma.InputJsonValue | undefined {
  const snapshot = sanitizeMerchantActivationAttribution(attribution)
  const value: Record<string, Prisma.InputJsonValue> = { ...snapshot }
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
  return Object.keys(value).length > 0 ? value : undefined
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

function mapEvent(row: Record<string, unknown>): MerchantActivationEventRecord {
  const eventType = String(row.eventType)
  if (!isMerchantActivationEventType(eventType)) throw new Error('Invalid persisted Merchant activation event type.')
  const source = String(row.source)
  if (source !== 'SERVER' && source !== 'CLIENT') throw new Error('Invalid persisted Merchant activation event source.')
  const metadata = row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
    ? row.metadata as Record<string, unknown>
    : null
  return {
    id: String(row.id),
    merchantId: String(row.merchantId),
    eventType,
    occurredAt: row.occurredAt instanceof Date ? row.occurredAt : new Date(String(row.occurredAt)),
    source,
    correlationId: row.correlationId == null ? null : String(row.correlationId),
    sessionId: row.sessionId == null ? null : String(row.sessionId),
    dedupeKey: String(row.dedupeKey),
    metadata,
  }
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

export async function recordMerchantActivationEventWithClient(
  client: ActivationEventWriter,
  input: MerchantActivationEventInput,
): Promise<void> {
  const normalized = normalizeInput(input)
  await client.merchantActivationEvent.upsert({
    where: { merchantId_dedupeKey: { merchantId: normalized.merchantId, dedupeKey: normalized.dedupeKey } },
    create: {
      merchantId: normalized.merchantId,
      eventType: normalized.eventType,
      occurredAt: normalized.occurredAt,
      source: normalized.source,
      correlationId: normalized.correlationId,
      sessionId: normalized.sessionId,
      dedupeKey: normalized.dedupeKey,
      ...(normalized.metadata ? { metadata: normalized.metadata } : {}),
    },
    update: {},
  })
  logActivationEvent(normalized)
}

export async function recordMerchantActivationEvent(input: MerchantActivationEventInput): Promise<void> {
  await recordMerchantActivationEventWithClient(prisma as unknown as ActivationEventWriter, input)
}

export async function getMerchantActivationEvents(input: { merchantId: string }): Promise<MerchantActivationEventRecord[]> {
  const rows = await prisma.merchantActivationEvent.findMany({
    where: { merchantId: input.merchantId },
    orderBy: [{ occurredAt: 'asc' }, { createdAt: 'asc' }],
  })
  return rows.map((row) => mapEvent(row as unknown as Record<string, unknown>))
}

export async function getMerchantActivationSummary(input: { merchantId: string }): Promise<MerchantActivationSummary> {
  return summarizeMerchantActivationEvents(await getMerchantActivationEvents(input))
}
