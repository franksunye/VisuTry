import { getAcquisitionContext } from '@/lib/analytics'
import {
  getCampaignAnalyticsContext,
} from '@/lib/analytics-v2'
import {
  MERCHANT_ACTIVATION_EVENT,
  type MerchantActivationAttributionInput,
  type MerchantActivationEventType,
} from '@/modules/merchant/domain/merchant-activation'

const WORKSPACE_SESSION_KEY = 'visutry_merchant_activation_session_id'
const SIGNUP_CORRELATION_KEY = 'visutry_merchant_signup_correlation_id'

function opaqueId(prefix: string): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}-${crypto.randomUUID()}`
    }
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const values = new Uint32Array(4)
      crypto.getRandomValues(values)
      return `${prefix}-${Array.from(values).map((value) => value.toString(36)).join('')}`.slice(0, 96)
    }
  } catch {
    // Fall through to a bounded, non-sensitive best-effort identifier.
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`
}

function getOrCreateSessionValue(key: string, prefix: string): string {
  if (typeof window === 'undefined') return opaqueId(prefix)
  try {
    const current = window.sessionStorage.getItem(key)
    if (current) return current
    const created = opaqueId(prefix)
    window.sessionStorage.setItem(key, created)
    return created
  } catch {
    return opaqueId(prefix)
  }
}

export function getMerchantActivationContext() {
  return {
    sessionId: getOrCreateSessionValue(WORKSPACE_SESSION_KEY, 'ms'),
    signupCorrelationId: getOrCreateSessionValue(SIGNUP_CORRELATION_KEY, 'signup'),
  }
}

export function getMerchantActivationAttribution(commercialIntent?: string | null): MerchantActivationAttributionInput {
  const acquisition = getAcquisitionContext()
  const campaign = getCampaignAnalyticsContext()
  const { signupCorrelationId } = getMerchantActivationContext()
  return {
    landingPage: acquisition.landing_page,
    acquisitionSource: acquisition.acquisition_source,
    acquisitionMedium: acquisition.acquisition_medium,
    referrerHost: acquisition.referrer_host,
    utmSource: acquisition.utm_source,
    utmMedium: acquisition.utm_medium,
    utmCampaign: acquisition.utm_campaign ?? campaign.campaign_name,
    commercialIntent,
    signupCorrelationId,
    landingLocale: acquisition.landing_locale,
  }
}

export async function recordMerchantActivationClientEvent(input: {
  merchantId: string
  eventType: Extract<MerchantActivationEventType, 'merchant_workspace_entered' | 'merchant_catalog_started' | 'merchant_store_previewed' | 'merchant_commercial_intent'>
  resourceId?: string | null
  commercialIntent?: string | null
}): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const context = getMerchantActivationContext()
  const response = await fetch(`/api/merchant/${encodeURIComponent(input.merchantId)}/activation-events`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      eventType: input.eventType,
      sessionId: context.sessionId,
      correlationId: context.signupCorrelationId,
      resourceId: input.resourceId ?? undefined,
      commercialIntent: input.commercialIntent ?? undefined,
      attribution: getMerchantActivationAttribution(input.commercialIntent),
    }),
    keepalive: true,
  })
  return response.ok
}

export const merchantActivationClientEvents = MERCHANT_ACTIVATION_EVENT
