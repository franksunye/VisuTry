export const DEFAULT_KIOSK_IDLE_TIMEOUT_SECONDS = 120
export const MIN_KIOSK_IDLE_TIMEOUT_SECONDS = 30
export const MAX_KIOSK_IDLE_TIMEOUT_SECONDS = 900

export type ExperienceDeliveryPolicy = {
  kioskEnabled: boolean
  kioskIdleTimeoutSeconds: number
}

export const DEFAULT_EXPERIENCE_DELIVERY_POLICY: ExperienceDeliveryPolicy = {
  kioskEnabled: false,
  kioskIdleTimeoutSeconds: DEFAULT_KIOSK_IDLE_TIMEOUT_SECONDS,
}

export function resolveExperienceDeliveryPolicy(value: unknown): ExperienceDeliveryPolicy {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...DEFAULT_EXPERIENCE_DELIVERY_POLICY }
  try {
    assertExperienceDeliveryPolicy(value)
    return { kioskEnabled: value.kioskEnabled, kioskIdleTimeoutSeconds: value.kioskIdleTimeoutSeconds }
  } catch {
    return { ...DEFAULT_EXPERIENCE_DELIVERY_POLICY }
  }
}

export function assertExperienceDeliveryPolicy(value: unknown): asserts value is ExperienceDeliveryPolicy {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('deliveryPolicy must be an object')
  const policy = value as Record<string, unknown>
  if (Object.keys(policy).some((key) => !['kioskEnabled', 'kioskIdleTimeoutSeconds'].includes(key))) {
    throw new Error('deliveryPolicy contains unsupported fields')
  }
  if (typeof policy.kioskEnabled !== 'boolean') throw new Error('deliveryPolicy.kioskEnabled must be a boolean')
  if (typeof policy.kioskIdleTimeoutSeconds !== 'number'
    || !Number.isInteger(policy.kioskIdleTimeoutSeconds)
    || policy.kioskIdleTimeoutSeconds < MIN_KIOSK_IDLE_TIMEOUT_SECONDS
    || policy.kioskIdleTimeoutSeconds > MAX_KIOSK_IDLE_TIMEOUT_SECONDS) {
    throw new Error(`deliveryPolicy.kioskIdleTimeoutSeconds must be an integer from ${MIN_KIOSK_IDLE_TIMEOUT_SECONDS} to ${MAX_KIOSK_IDLE_TIMEOUT_SECONDS}`)
  }
}

export function resolveRequestedDeliveryProfile(input: {
  requested: string | null | undefined
  policy: ExperienceDeliveryPolicy
}): 'WEB' | 'KIOSK' {
  return input.requested === 'kiosk' && input.policy.kioskEnabled ? 'KIOSK' : 'WEB'
}
