const SAFE_METADATA_KEYS = [
  'externalTaskId',
  'telemetryOrigin',
  'telemetryIsTest',
  'framePresetId',
  'framePresetName',
  'batchId',
  'batchIndex',
  'source',
  'serviceType',
  'isAsync',
  'retryCount',
  'storeId',
  'campaignId',
] as const

export type SafeTryOnMetadata = Partial<Record<(typeof SAFE_METADATA_KEYS)[number], unknown>>

/**
 * Project TryOnTask.metadata for telemetry reconciliation.
 * Omits prompts, image URLs, base64, and other user content.
 */
export function pickSafeTryOnMetadata(metadata: unknown): SafeTryOnMetadata {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return {}
  const source = metadata as Record<string, unknown>
  const picked: SafeTryOnMetadata = {}
  for (const key of SAFE_METADATA_KEYS) {
    if (key in source && source[key] !== undefined) {
      picked[key] = source[key]
    }
  }
  return picked
}
