/**
 * Privacy rules for Store events, insights, and logs.
 */

const SENSITIVE_METADATA_KEYS = new Set([
  'imageUrl',
  'image_url',
  'photoUrl',
  'photo_url',
  'userImageUrl',
  'rawImageUrl',
  'signedUrl',
  'signed_url',
  'faceLandmarks',
  'face_landmarks',
  'faceAnalysis',
  'face_analysis',
  'fullFacePayload',
  'email',
  'name',
  'note',
  'inquiryNote',
  'capabilityToken',
  'sessionToken',
  'sessionCapability',
])

export function isSensitiveMetadataKey(key: string): boolean {
  return SENSITIVE_METADATA_KEYS.has(key)
}

/**
 * Strip sensitive fields from event metadata before persistence or GA mirror.
 * Returns a new object; never mutates input.
 */
export function sanitizeEventMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Record<string, unknown> | undefined {
  if (!metadata) return undefined

  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (isSensitiveMetadataKey(key)) continue
    if (value === undefined) continue
    sanitized[key] = value
  }
  return Object.keys(sanitized).length > 0 ? sanitized : undefined
}

/**
 * Merchant insight responses must never include raw shopper image URLs.
 */
export function assertNoShopperImageInInsightPayload(
  payload: Record<string, unknown>,
): void {
  const serialized = JSON.stringify(payload).toLowerCase()
  const forbidden = ['shopperphoto', 'userimageurl', 'photoasset', 'rawimage']
  for (const needle of forbidden) {
    if (serialized.includes(needle)) {
      throw new Error('Merchant insight payload must not expose shopper images')
    }
  }
}

export function isHttpOrHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
