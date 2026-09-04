import { Axiom } from '@axiomhq/js'
import {
  CONSUMER_FUNNEL_EVENT_NAMES,
  type ConsumerFunnelEventName,
} from '@/lib/consumer-funnel'

export const TRAFFIC_TELEMETRY_SCHEMA_VERSION = '1' as const

/**
 * The complete business-field contract for `visutry-traffic-pro`.
 *
 * This is intentionally flat. Do not add a catch-all payload, nested object,
 * arbitrary array, or provider response to this record.
 */
export const TRAFFIC_TELEMETRY_FIELDS = [
  'timestamp',
  'schema_version',
  'event_id',
  'event_name',
  'consumer_funnel_id',
  'traffic_class',
  'source_class',
  'agent_source',
  'acquisition_source',
  'acquisition_medium',
  'referrer_host',
  'landing_page',
  'page_path',
  'source_page',
  'product_path',
  'destination',
  'surface',
  'entry_point',
  'journey_type',
  'completion_status',
  'success',
] as const

export const TRAFFIC_TELEMETRY_KEY_ALLOWLIST: ReadonlySet<string> = new Set(TRAFFIC_TELEMETRY_FIELDS)

export type TrafficTelemetryRecord = {
  timestamp: string
  schema_version: typeof TRAFFIC_TELEMETRY_SCHEMA_VERSION
  event_id: string
  event_name: ConsumerFunnelEventName
  consumer_funnel_id: string
  traffic_class: 'test' | 'production_candidate'
  source_class?: string
  agent_source?: string
  acquisition_source?: string
  acquisition_medium?: string
  referrer_host?: string
  landing_page?: string
  page_path?: string
  source_page?: string
  product_path?: string
  destination?: string
  surface?: string
  entry_point?: string
  journey_type?: string
  completion_status?: string
  success?: boolean
}

export type TrafficTelemetryInput = Omit<TrafficTelemetryRecord, 'timestamp' | 'schema_version'> & {
  timestamp?: string
}

const OPTIONAL_STRING_FIELDS = [
  'source_class',
  'agent_source',
  'acquisition_source',
  'acquisition_medium',
  'referrer_host',
  'landing_page',
  'page_path',
  'source_page',
  'product_path',
  'destination',
  'surface',
  'entry_point',
  'journey_type',
  'completion_status',
] as const

function boundedString(value: unknown, max = 200): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : undefined
}

function boundedPath(value: unknown): string | undefined {
  const raw = boundedString(value)
  if (!raw) return undefined

  try {
    const parsed = new URL(raw, 'https://visutry.invalid')
    return parsed.pathname.slice(0, 200) || '/'
  } catch {
    return raw.split(/[?#]/, 1)[0].slice(0, 200) || undefined
  }
}

function boundedHost(value: unknown): string | undefined {
  const raw = boundedString(value)
  if (!raw) return undefined

  try {
    return new URL(raw.includes('://') ? raw : `https://${raw}`).hostname.toLowerCase().slice(0, 200) || undefined
  } catch {
    return raw.split(/[/?#]/, 1)[0].replace(/^www\./i, '').toLowerCase().slice(0, 200) || undefined
  }
}

/** Build a flat, privacy-bounded record from the route's validated event. */
export function serializeTrafficTelemetry(input: TrafficTelemetryInput): TrafficTelemetryRecord {
  const record: TrafficTelemetryRecord = {
    timestamp: boundedString(input.timestamp) || new Date().toISOString(),
    schema_version: TRAFFIC_TELEMETRY_SCHEMA_VERSION,
    event_id: boundedString(input.event_id, 128) || '',
    event_name: input.event_name,
    consumer_funnel_id: boundedString(input.consumer_funnel_id, 128) || '',
    traffic_class: input.traffic_class,
  }

  for (const field of OPTIONAL_STRING_FIELDS) {
    const value = field === 'referrer_host'
      ? boundedHost(input[field])
      : ['landing_page', 'page_path', 'source_page', 'product_path', 'destination'].includes(field)
        ? boundedPath(input[field])
        : boundedString(input[field])
    if (value) record[field] = value
  }

  if (typeof input.success === 'boolean') record.success = input.success

  return record
}

export type TrafficTelemetryDestination = {
  dataset: string
  token: string
}

export function resolveTrafficTelemetryDestination(env: NodeJS.ProcessEnv = process.env): TrafficTelemetryDestination | null {
  const environment = (env.VERCEL_ENV || env.NODE_ENV || '').trim().toLowerCase()
  if (environment === 'production') {
    const token = env.AXIOM_TRAFFIC_TOKEN?.trim()
    return token ? { dataset: env.AXIOM_TRAFFIC_DATASET?.trim() || 'visutry-traffic-pro', token } : null
  }
  if (environment === 'preview') {
    const token = (env.AXIOM_TRAFFIC_TOKEN || env.AXIOM_TOKEN)?.trim()
    return token ? { dataset: env.AXIOM_TRAFFIC_PREVIEW_DATASET?.trim() || 'visutry-ppe', token } : null
  }
  return null
}

/**
 * Send traffic evidence without allowing telemetry failure to affect the
 * shopper request. Production and Preview share the same record contract but
 * never share a destination dataset.
 */
export async function emitTrafficTelemetry(input: TrafficTelemetryInput): Promise<void> {
  const destination = resolveTrafficTelemetryDestination()
  if (!destination) return

  try {
    const axiom = new Axiom({
      token: destination.token,
      orgId: process.env.AXIOM_ORG_ID,
    })
    await axiom.ingest(destination.dataset, [serializeTrafficTelemetry(input)])
  } catch (error) {
    console.error('Failed to send traffic telemetry:', error instanceof Error ? error.message : error)
  }
}

export function isTrafficEventName(value: string): value is ConsumerFunnelEventName {
  return (CONSUMER_FUNNEL_EVENT_NAMES as readonly string[]).includes(value)
}
