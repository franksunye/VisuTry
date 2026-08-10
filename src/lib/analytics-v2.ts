import { AnalyticsEvent, ANALYTICS_SCHEMA_VERSION } from './analytics-events'

export type AnalyticsContext = {
  campaign_id?: string
  merchant_id?: string
  store_id?: string
  surface?: string
  entry_point?: string
}

function getRuntimeContext(): AnalyticsContext {
  if (typeof window === 'undefined') return {}

  try {
    const params = new URLSearchParams(window.location.search)
    return {
      campaign_id: params.get('campaign_id') || params.get('utm_campaign') || undefined,
      merchant_id: params.get('merchant_id') || undefined,
      store_id: params.get('store_id') || undefined,
    }
  } catch {
    return {}
  }
}

export function trackCampaignEvent(
  eventName: AnalyticsEvent | string,
  properties: Record<string, unknown> = {},
) {
  if (typeof window === 'undefined') return

  const payload = {
    analytics_schema_version: ANALYTICS_SCHEMA_VERSION,
    ...getRuntimeContext(),
    ...properties,
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
}

export { AnalyticsEvent }
