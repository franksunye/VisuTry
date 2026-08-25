/**
 * Small, privacy-safe first-party bridge for the Consumer distribution funnel.
 *
 * GA4/dataLayer remain useful event consumers, but they are not a durable
 * first-party join. This module adds an anonymous browser-session identifier
 * and sends only allowlisted decision events to the server-side telemetry
 * stream. It never sends photos, user IDs, face geometry, or free-form text.
 */

export const CONSUMER_FUNNEL_EVENT_NAMES = [
  'face_shape_detection_completed',
  'face_analysis_completed',
  'recommendation_viewed',
  'tryon_started',
  'tryon_completed',
  'comparison_created',
  'comparison_completed',
] as const

export type ConsumerFunnelEventName = (typeof CONSUMER_FUNNEL_EVENT_NAMES)[number]
export type ConsumerFunnelTrafficClass = 'test' | 'production_candidate'

export type ConsumerFunnelContext = {
  consumer_funnel_id: string
  traffic_class: ConsumerFunnelTrafficClass
}

const CONSUMER_FUNNEL_ID_KEY = 'visutry_consumer_funnel_id'
const ID_PATTERN = /^[A-Za-z0-9_-]{16,128}$/
const SAFE_STRING_FIELDS = [
  'acquisition_source',
  'acquisition_medium',
  'referrer_host',
  'landing_page',
  'page_path',
  'source_page',
  'query_cluster',
  'content_cluster',
  'product_path',
  'destination',
  'completion_status',
  'surface',
  'entry_point',
  'journey_type',
] as const

function randomId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    // Fall through to the non-cryptographic browser fallback.
  }

  return `vt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 18)}`
}

function isKnownTestTraffic(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some((cookie) => cookie.trim().startsWith('test-session='))
}

export function getConsumerFunnelContext(): ConsumerFunnelContext | null {
  if (typeof window === 'undefined') return null

  try {
    let funnelId = window.sessionStorage.getItem(CONSUMER_FUNNEL_ID_KEY)
    if (!funnelId || !ID_PATTERN.test(funnelId)) {
      funnelId = randomId()
      window.sessionStorage.setItem(CONSUMER_FUNNEL_ID_KEY, funnelId)
    }

    return {
      consumer_funnel_id: funnelId,
      traffic_class: isKnownTestTraffic() ? 'test' : 'production_candidate',
    }
  } catch {
    return null
  }
}

function safeString(value: unknown, max = 200): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : undefined
}

function isTrackableShopperSurface(_surface: unknown, entryPoint: unknown): boolean {
  // Store/Campaign shoppers are the primary Gate A surface. Exclude only the
  // VisuTry B2B marketing funnel, which uses the same analytics transport.
  return entryPoint !== 'b2b'
}

export function recordConsumerFunnelEvent(input: {
  eventName: string
  payload: Record<string, unknown>
  surface?: string
  entryPoint?: string
}) {
  if (typeof window === 'undefined') return
  if (!(CONSUMER_FUNNEL_EVENT_NAMES as readonly string[]).includes(input.eventName)) return
  if (!isTrackableShopperSurface(input.surface, input.entryPoint)) return

  const context = getConsumerFunnelContext()
  if (!context || typeof window.fetch !== 'function') return

  const body: Record<string, unknown> = {
    event_id: randomId(),
    event_name: input.eventName,
    ...context,
  }

  for (const field of SAFE_STRING_FIELDS) {
    const value = safeString(input.payload[field])
    if (value) body[field] = value
  }

  if (typeof input.payload.success === 'boolean') body.success = input.payload.success

  void window.fetch('/api/analytics/consumer-funnel', {
    method: 'POST',
    credentials: 'same-origin',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {
    // Telemetry must never block or surface as a Consumer product error.
  })
}
