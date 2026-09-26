import { isHttpOrHttpsUrl } from './privacy'

/** Closed business vocabulary; provider-specific URL syntax stays in adapters. */
export const MERCHANT_HANDOFF_ACTIONS = [
  'VISIT_STORE',
  'BOOK_APPOINTMENT',
  'WHATSAPP',
  'EMAIL',
  'PRODUCT',
  'CUSTOM_LINK',
] as const
export type MerchantHandoffAction = (typeof MERCHANT_HANDOFF_ACTIONS)[number]

export type MerchantHandoff = {
  action: MerchantHandoffAction
  label: string
  url: string
}

const LEGACY_ACTIONS: Record<string, MerchantHandoffAction> = {
  PRODUCT_OR_COLLECTION: 'PRODUCT',
  LINK: 'CUSTOM_LINK',
}

export function isSupportedMerchantHandoffType(value: unknown): value is string {
  return normalizeMerchantHandoffAction(value) !== null
}

export function isMerchantHandoffAction(value: unknown): value is MerchantHandoffAction {
  return typeof value === 'string' && (MERCHANT_HANDOFF_ACTIONS as readonly string[]).includes(value)
}

/** Accept legacy inputs, but return only a canonical action for new writes. */
export function normalizeMerchantHandoffAction(value: unknown): MerchantHandoffAction | null {
  if (isMerchantHandoffAction(value)) return value
  return typeof value === 'string' ? LEGACY_ACTIONS[value] ?? null : null
}

/** Legacy CTA types stay readable, while unknown persisted values fail closed. */
export function resolveMerchantHandoff(input: {
  action?: unknown
  type?: unknown
  label?: unknown
  url?: unknown
}): MerchantHandoff | null {
  const action = input.action !== undefined
    ? normalizeMerchantHandoffAction(input.action)
    : input.type === null ? 'CUSTOM_LINK' : normalizeMerchantHandoffAction(input.type)
  if (!action || typeof input.label !== 'string' || !input.label.trim() || typeof input.url !== 'string') return null
  const url = input.url.trim()
  if (input.label.trim().length > 240 || /\s|[\u0000-\u001f\u007f]/u.test(url)) return null
  const internal = url.startsWith('/') && !url.startsWith('//') && !url.includes('\\')
  if (!internal && !isHttpOrHttpsUrl(url)) return null
  return { action, label: input.label.trim(), url }
}

/**
 * Canonical invocation metadata is an allow-list, never a URL or arbitrary
 * caller payload. PRODUCT_CLICK is reserved for frame-level commerce intent;
 * a configured CTA without a frame records only the handoff event.
 */
export function merchantHandoffEventMetadata(input: {
  action: MerchantHandoffAction
  surface: 'DISCOVERY' | 'RESULT'
  clientActionId: string
}) {
  return {
    action: input.action,
    surface: input.surface,
    clientActionId: input.clientActionId,
  }
}
