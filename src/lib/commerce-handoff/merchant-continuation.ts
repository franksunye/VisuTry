import { isValidLocale, type Locale } from '@/i18n'
import { parseMerchantPurchaseIntent, type MerchantPurchaseIntent } from '@/modules/merchant/domain/merchant-purchase-intent'

/**
 * The only URL state that is allowed to cross the shopper auth/payment
 * boundary for a Merchant Experience.
 *
 * This is deliberately independent from merchantSessionId. A session may be
 * recreated after sign-in or Checkout; the originating experience remains
 * the stable continuation key.
 */
export type MerchantContinuationContext = Readonly<{
  locale: Locale
  merchantSlug: string
  experienceType: 'STORE' | 'CAMPAIGN'
  experienceSlug?: string
  canonicalReturnPath: string
}>

export type MerchantContinuationInput = {
  locale: string
  merchantSlug: string
  experienceType: 'STORE' | 'CAMPAIGN'
  experienceSlug?: string | null
}

export const MERCHANT_CONTINUATION_PARAM = 'merchantContinuation'
export const MERCHANT_RUNTIME_CONTINUATION_PREFIX = 'vt_store_continuation'

const MAX_CONTINUATION_LENGTH = 1200
const MAX_SLUG_LENGTH = 120
const SAFE_SLUG = /^[a-z0-9](?:[a-z0-9-]{0,118}[a-z0-9])?$/i
const INTERNAL_URL_BASE = 'https://visutry.invalid'

function isSafeSlug(value: unknown): value is string {
  return typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_SLUG_LENGTH &&
    SAFE_SLUG.test(value)
}

function canonicalPathForInput(input: MerchantContinuationInput): string | null {
  if (!isValidLocale(input.locale) || !isSafeSlug(input.merchantSlug)) return null
  const locale: Locale = input.locale

  if (input.experienceType === 'STORE') {
    if (input.experienceSlug) return null
    return `/${locale}/store/${input.merchantSlug}`
  }

  if (input.experienceType !== 'CAMPAIGN' || !isSafeSlug(input.experienceSlug)) return null
    return `/${locale}/c/${input.merchantSlug}/${input.experienceSlug}`
}

export function createMerchantContinuation(
  input: MerchantContinuationInput,
): MerchantContinuationContext | null {
  const canonicalReturnPath = canonicalPathForInput(input)
  if (!canonicalReturnPath) return null
  const locale = input.locale as Locale

  return input.experienceType === 'CAMPAIGN'
    ? {
        locale,
        merchantSlug: input.merchantSlug,
        experienceType: 'CAMPAIGN',
        experienceSlug: input.experienceSlug!,
        canonicalReturnPath,
      }
    : {
        locale,
        merchantSlug: input.merchantSlug,
        experienceType: 'STORE',
        canonicalReturnPath,
      }
}

function isValidContext(value: unknown): value is MerchantContinuationContext {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<MerchantContinuationContext>
  const recreated = createMerchantContinuation({
    locale: typeof candidate.locale === 'string' ? candidate.locale : '',
    merchantSlug: typeof candidate.merchantSlug === 'string' ? candidate.merchantSlug : '',
    experienceType: candidate.experienceType === 'CAMPAIGN' ? 'CAMPAIGN' : 'STORE',
    experienceSlug: typeof candidate.experienceSlug === 'string' ? candidate.experienceSlug : null,
  })

  if (!recreated || candidate.canonicalReturnPath !== recreated.canonicalReturnPath) return false
  if (candidate.experienceType !== recreated.experienceType) return false
  if (recreated.experienceType === 'CAMPAIGN' && candidate.experienceSlug !== recreated.experienceSlug) return false
  return true
}

/** Encode only the bounded, typed context. The URL layer performs its own query escaping. */
export function encodeMerchantContinuation(context: MerchantContinuationContext): string {
  if (!isValidContext(context)) throw new Error('Invalid merchant continuation context')
  const encoded = encodeURIComponent(JSON.stringify(context))
  if (encoded.length > MAX_CONTINUATION_LENGTH) throw new Error('Merchant continuation is too large')
  return encoded
}

export function parseMerchantContinuation(value: unknown): MerchantContinuationContext | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_CONTINUATION_LENGTH) return null

  try {
    const decoded = decodeURIComponent(value)
    if (decoded.length > MAX_CONTINUATION_LENGTH) return null
    const parsed = JSON.parse(decoded) as unknown
    return isValidContext(parsed) ? parsed : null
  } catch {
    return null
  }
}

function parseRelativeUrl(value: unknown): URL | null {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null

  try {
    const url = new URL(value, INTERNAL_URL_BASE)
    return url.origin === INTERNAL_URL_BASE ? url : null
  } catch {
    return null
  }
}

function contextFromPath(pathname: string): MerchantContinuationContext | null {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 3 && segments[1] === 'store') {
    return createMerchantContinuation({
      locale: segments[0],
      merchantSlug: segments[2],
      experienceType: 'STORE',
    })
  }

  if (segments.length === 4 && segments[1] === 'c') {
    return createMerchantContinuation({
      locale: segments[0],
      merchantSlug: segments[2],
      experienceType: 'CAMPAIGN',
      experienceSlug: segments[3],
    })
  }

  return null
}

export function getMerchantContinuationFromUrl(value: unknown): MerchantContinuationContext | null {
  const url = parseRelativeUrl(value)
  if (!url) return null

  const encodedContext = url.searchParams.get(MERCHANT_CONTINUATION_PARAM)
  if (encodedContext !== null) return parseMerchantContinuation(encodedContext)
  return contextFromPath(url.pathname)
}

export function getMerchantContinuationFromSearchParams(
  searchParams: { get(name: string): string | null },
): MerchantContinuationContext | null {
  return parseMerchantContinuation(searchParams.get(MERCHANT_CONTINUATION_PARAM))
}

/** Add the single continuation parameter while preserving only the supplied relative path. */
export function appendMerchantContinuation(
  path: string,
  context: MerchantContinuationContext,
): string {
  const url = parseRelativeUrl(path)
  if (!url || !isValidContext(context)) throw new Error('Invalid merchant continuation URL')
  url.searchParams.set(MERCHANT_CONTINUATION_PARAM, encodeMerchantContinuation(context))
  return `${url.pathname}${url.search}${url.hash}`
}

export function merchantPricingPath(context: MerchantContinuationContext): string {
  return appendMerchantContinuation(`/${context.locale}/pricing`, context)
}

/**
 * Scope same-tab shopper resume state to the originating experience. The
 * value is not an authorization token; server-side session capability and
 * entitlement checks remain authoritative after a resume.
 */
export function merchantRuntimeContinuationStorageKey(
  context: MerchantContinuationContext,
): string {
  return [
    MERCHANT_RUNTIME_CONTINUATION_PREFIX,
    context.locale,
    context.experienceType,
    context.merchantSlug,
    context.experienceSlug || 'store',
  ].join(':')
}

function localizedPathname(pathname: string, locale: Locale): string | null {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 1 && ['pricing', 'try-on', 'face-analysis', 'face-shape-detector', 'style-explorer', 'dashboard'].includes(segments[0])) {
    return `/${locale}/${segments[0]}`
  }
  if (segments.length === 0) return `/${locale}`
  if (segments.length < 2 || !isValidLocale(segments[0])) return null
  return pathname
}

function isAllowedConsumerCallbackPath(pathname: string, locale: Locale): boolean {
  const normalized = localizedPathname(pathname, locale)
  if (!normalized) return false
  const segments = normalized.split('/').filter(Boolean)
  return segments.length === 2 &&
    segments[0] === locale &&
    ['pricing', 'try-on', 'face-analysis', 'face-shape-detector', 'style-explorer', 'dashboard'].includes(segments[1])
}

/**
 * Sanitize a NextAuth callback without changing ordinary Consumer callbacks.
 * Merchant callbacks are reduced to the canonical Store/Campaign or Pricing
 * path plus the one validated context parameter. Merchant admin, admin, API,
 * external, and malformed destinations are rejected.
 */
export function getSafeShopperAuthCallbackUrl(
  value: unknown,
  locale: string,
): string | null {
  if (!isValidLocale(locale)) return null
  const url = parseRelativeUrl(value)
  if (!url) return null

  const context = getMerchantContinuationFromUrl(value)
  if (context) {
    const allowedMerchantPath = url.pathname === context.canonicalReturnPath
    const allowedPricingPath = url.pathname === `/${context.locale}/pricing`
    if (!allowedMerchantPath && !allowedPricingPath) return null
    return appendMerchantContinuation(url.pathname, context)
  }

  const normalizedPathname = localizedPathname(url.pathname, locale)
  if (!normalizedPathname || !isAllowedConsumerCallbackPath(normalizedPathname, locale)) return null
  return `${normalizedPathname}${url.search}${url.hash}`
}

/**
 * Sanitize the merchant acquisition callback separately from Consumer
 * continuation. Only the localized Merchant entry point and the bounded
 * commercial intent may cross Auth0/NextAuth. Merchant IDs and arbitrary
 * return paths are intentionally not accepted from the browser.
 */
export function getSafeMerchantAuthCallbackUrl(
  value: unknown,
  locale: string,
): string | null {
  if (!isValidLocale(locale)) return null
  const url = parseRelativeUrl(value)
  if (!url || url.pathname !== `/${locale}/merchant`) return null

  const keys = [...url.searchParams.keys()]
  if (keys.some((key) => key !== 'commercialIntent') || keys.length > 1) return null
  const rawIntent = url.searchParams.get('commercialIntent')
  if (rawIntent === null) return `/${locale}/merchant`
  const intent = parseMerchantPurchaseIntent(rawIntent)
  return intent ? merchantIntentCallbackPath(locale, intent) : null
}

function merchantIntentCallbackPath(locale: string, intent: MerchantPurchaseIntent): string {
  return `/${locale}/merchant?commercialIntent=${intent}`
}

export function isSafeMerchantCheckoutReturnUrl(value: unknown, requestOrigin: string): boolean {
  if (typeof value !== 'string') return false

  try {
    const url = new URL(value)
    if (url.origin !== requestOrigin) return false
    const context = getMerchantContinuationFromUrl(`${url.pathname}${url.search}`)
    if (!context) return false
    return url.pathname === context.canonicalReturnPath ||
      url.pathname === `/${context.locale}/pricing` ||
      url.pathname === `/${context.locale}/success`
  } catch {
    return false
  }
}
