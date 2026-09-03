import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { CONSUMER_FUNNEL_EVENT_NAMES } from '@/lib/consumer-funnel'
import { inferAiReferralSource } from '@/lib/commerce-handoff/ai-referral'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 12_000
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

function safeString(value: unknown, max = 200): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : undefined
}

function hasKnownTestCookie(request: NextRequest): boolean {
  return Boolean(request.cookies.get('test-session'))
}

function matchesDomain(value: string | undefined, domains: readonly string[]): boolean {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) return false
  const host = normalized
    .replace(/^https?:\/\//, '')
    .split(/[/?#]/, 1)[0]
    .replace(/:\d+$/, '')
    .replace(/^www\./, '')
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`))
}

function classifySource(input: {
  source?: string
  medium?: string
  referrerHost?: string
}): { sourceClass: string; agentSource?: string } {
  const referrer = input.referrerHost ? 'https://' + input.referrerHost : null
  const agentSource = inferAiReferralSource({
    source: input.source ?? null,
    referrer,
  })
  if (agentSource) {
    return { sourceClass: 'agent', agentSource }
  }

  const source = input.source?.toLowerCase() ?? ''
  const medium = input.medium?.toLowerCase() ?? ''
  if ((!source || source === 'direct') && (!medium || medium === 'none') && !input.referrerHost) {
    return { sourceClass: 'direct' }
  }
  if (medium === 'organic' || medium === 'seo') return { sourceClass: 'organic_search' }
  if (/paid|cpc|ppc|display|sponsored/.test(medium)) return { sourceClass: 'paid' }
  if (source === 'reddit' || matchesDomain(source, ['reddit.com', 'redd.it']) || matchesDomain(input.referrerHost, ['reddit.com', 'redd.it'])) {
    return { sourceClass: 'reddit' }
  }
  if (source === 'youtube' || matchesDomain(source, ['youtube.com', 'youtu.be']) || matchesDomain(input.referrerHost, ['youtube.com', 'youtu.be'])) {
    return { sourceClass: 'youtube' }
  }
  if (/social/.test(medium) || /facebook|instagram|reddit|youtube|tiktok|linkedin/.test(source)) {
    return { sourceClass: 'social' }
  }
  if (medium === 'referral' || input.referrerHost) return { sourceClass: 'generic_referral' }
  return { sourceClass: 'other' }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    const rawBody = await request.text()
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'payload_too_large' }, { status: 413 })
    }
    const parsed = JSON.parse(rawBody)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
    }
    body = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const eventName = safeString(body.event_name, 80)
  const eventId = safeString(body.event_id, 128)
  const funnelId = safeString(body.consumer_funnel_id, 128)
  const entryPoint = safeString(body.entry_point, 80)
  if (
    !eventName ||
    !(CONSUMER_FUNNEL_EVENT_NAMES as readonly string[]).includes(eventName) ||
    !eventId ||
    !ID_PATTERN.test(eventId) ||
    !funnelId ||
    !ID_PATTERN.test(funnelId) ||
    entryPoint === 'b2b'
  ) {
    return NextResponse.json({ error: 'invalid_event' }, { status: 400 })
  }

  const telemetry: Record<string, unknown> = {
    event_id: eventId,
    event_name: eventName,
    consumer_funnel_id: funnelId,
    // The server determines this boundary. A client cannot self-label traffic
    // as TEST and thereby remove it from the production evidence review.
    traffic_class: hasKnownTestCookie(request) ? 'test' : 'production_candidate',
  }

  for (const field of SAFE_STRING_FIELDS) {
    const value = safeString(body[field])
    if (value) telemetry[field] = value
  }
  const sourceClassification = classifySource({
    source: safeString(body.acquisition_source),
    medium: safeString(body.acquisition_medium),
    referrerHost: safeString(body.referrer_host),
  })
  telemetry.source_class = sourceClassification.sourceClass
  if (sourceClassification.agentSource) telemetry.agent_source = sourceClassification.agentSource
  if (typeof body.success === 'boolean') telemetry.success = body.success

  logger.info('web', 'consumer_funnel_event', telemetry)

  return NextResponse.json(
    { accepted: true },
    { status: 202, headers: { 'Cache-Control': 'no-store' } },
  )
}
