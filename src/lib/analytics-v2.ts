/**
 * Campaign Intelligence Event Layer (analytics v2)
 *
 * Owns transport (GA4 + dataLayer) and automatic campaign/business context.
 * Feature code should call `analytics.ts` APIs; those route here.
 */

import {
  ANALYTICS_SCHEMA_VERSION,
  AnalyticsEvent,
  type AnalyticsEntryPoint,
  type AnalyticsEventName,
  type AnalyticsSurface,
} from './analytics-events'

const CAMPAIGN_CONTEXT_KEY = 'visutry_campaign_context'

export type CampaignRuntimeContext = {
  campaign_id?: string
  merchant_id?: string
  store_id?: string
  surface?: AnalyticsSurface
  entry_point?: AnalyticsEntryPoint
}

function readStoredCampaignContext(): CampaignRuntimeContext {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.sessionStorage.getItem(CAMPAIGN_CONTEXT_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as CampaignRuntimeContext
    return {
      ...(parsed.campaign_id ? { campaign_id: parsed.campaign_id } : {}),
      ...(parsed.merchant_id ? { merchant_id: parsed.merchant_id } : {}),
      ...(parsed.store_id ? { store_id: parsed.store_id } : {}),
      ...(parsed.surface ? { surface: parsed.surface } : {}),
      ...(parsed.entry_point ? { entry_point: parsed.entry_point } : {}),
    }
  } catch {
    return {}
  }
}

function writeStoredCampaignContext(context: CampaignRuntimeContext) {
  if (typeof window === 'undefined') return

  try {
    const next = {
      ...readStoredCampaignContext(),
      ...context,
    }
    window.sessionStorage.setItem(CAMPAIGN_CONTEXT_KEY, JSON.stringify(next))
  } catch {
    // Analytics must never block UX.
  }
}

function resolveSurface(): AnalyticsSurface {
  if (typeof window === 'undefined') return 'web'

  try {
    if (window.location.pathname.includes('/store')) return 'merchant_store'
    if (window.matchMedia?.('(display-mode: standalone)').matches) return 'pwa'
    if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) return 'mobile_web'
  } catch {
    // fall through
  }

  return 'web'
}

function resolveEntryPoint(context: CampaignRuntimeContext): AnalyticsEntryPoint {
  if (context.entry_point) return context.entry_point
  if (context.merchant_id || context.store_id || context.surface === 'merchant_store') {
    return 'store'
  }
  if (context.campaign_id) return 'campaign'

  if (typeof window !== 'undefined') {
    try {
      const path = window.location.pathname
      if (path.includes('/blog') || path.includes('/articles')) return 'blog'
    } catch {
      // fall through
    }
  }

  return 'consumer'
}

function readUrlCampaignContext(): CampaignRuntimeContext {
  if (typeof window === 'undefined') return {}

  try {
    const params = new URLSearchParams(window.location.search)
    const campaignId = params.get('campaign_id') || params.get('utm_campaign') || undefined
    const merchantId = params.get('merchant_id') || undefined
    const storeId = params.get('store_id') || undefined

    return {
      ...(campaignId ? { campaign_id: campaignId } : {}),
      ...(merchantId ? { merchant_id: merchantId } : {}),
      ...(storeId ? { store_id: storeId } : {}),
    }
  } catch {
    return {}
  }
}

/**
 * Persist campaign/merchant/store context for the browser session.
 * Never invent IDs — only store values that callers or the URL provide.
 */
export function setCampaignAnalyticsContext(context: CampaignRuntimeContext) {
  const cleaned: CampaignRuntimeContext = {
    ...(context.campaign_id ? { campaign_id: context.campaign_id } : {}),
    ...(context.merchant_id ? { merchant_id: context.merchant_id } : {}),
    ...(context.store_id ? { store_id: context.store_id } : {}),
    ...(context.surface ? { surface: context.surface } : {}),
    ...(context.entry_point ? { entry_point: context.entry_point } : {}),
  }
  writeStoredCampaignContext(cleaned)
}

export function getCampaignAnalyticsContext(): CampaignRuntimeContext {
  const stored = readStoredCampaignContext()
  const fromUrl = readUrlCampaignContext()

  // First-touch: freeze campaign/merchant/store once set for the session.
  const merged: CampaignRuntimeContext = {
    campaign_id: stored.campaign_id || fromUrl.campaign_id,
    merchant_id: stored.merchant_id || fromUrl.merchant_id,
    store_id: stored.store_id || fromUrl.store_id,
    surface: stored.surface,
    entry_point: stored.entry_point,
  }

  if (
    (fromUrl.campaign_id && !stored.campaign_id) ||
    (fromUrl.merchant_id && !stored.merchant_id) ||
    (fromUrl.store_id && !stored.store_id)
  ) {
    writeStoredCampaignContext({
      ...(fromUrl.campaign_id && !stored.campaign_id ? { campaign_id: fromUrl.campaign_id } : {}),
      ...(fromUrl.merchant_id && !stored.merchant_id ? { merchant_id: fromUrl.merchant_id } : {}),
      ...(fromUrl.store_id && !stored.store_id ? { store_id: fromUrl.store_id } : {}),
    })
  }

  const surface = merged.surface || resolveSurface()
  const entryPoint = resolveEntryPoint({ ...merged, surface })

  return {
    ...(merged.campaign_id ? { campaign_id: merged.campaign_id } : {}),
    ...(merged.merchant_id ? { merchant_id: merged.merchant_id } : {}),
    ...(merged.store_id ? { store_id: merged.store_id } : {}),
    surface,
    entry_point: entryPoint,
  }
}

/**
 * Emit a Campaign Intelligence event to GA4 + dataLayer.
 * Callers may pass acquisition/locale fields; this layer always injects schema + campaign context.
 */
export function trackCampaignEvent(
  eventName: AnalyticsEventName | string,
  properties: Record<string, unknown> = {},
) {
  if (typeof window === 'undefined') return

  const campaignContext = getCampaignAnalyticsContext()

  const payload: Record<string, unknown> = {
    ...campaignContext,
    ...properties,
    analytics_schema_version: ANALYTICS_SCHEMA_VERSION,
  }

  if (window.gtag) {
    window.gtag('event', eventName, payload)
  }

  if (window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...payload,
    })
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Campaign Event:', eventName, payload)
  }
}

export { AnalyticsEvent, ANALYTICS_SCHEMA_VERSION }
