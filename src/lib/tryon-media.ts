export type TryOnMediaKind = 'user' | 'item' | 'result'

export const TRY_ON_MEDIA_MAX_BYTES = 15 * 1024 * 1024
export const TRY_ON_MEDIA_MAX_BASE64_CHARS = Math.ceil(TRY_ON_MEDIA_MAX_BYTES / 3) * 4 + 4
export const TRY_ON_MEDIA_ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const CLIENT_METADATA_KEYS = [
  'serviceType',
  'isAsync',
  'source',
  'framePresetId',
  'framePresetName',
  'framePresetStyle',
  'batchId',
  'batchSize',
  'batchIndex',
  'styleIntent',
  'occasion',
  'category',
  'lookKey',
] as const

export function tryOnMediaPath(taskId: string, kind: TryOnMediaKind): string {
  return `/api/try-on/${encodeURIComponent(taskId)}/media/${kind}`
}

export function adminTryOnMediaPath(taskId: string, kind: TryOnMediaKind): string {
  return `/api/admin/try-on/${encodeURIComponent(taskId)}/media/${kind}`
}

export function publicTryOnShareResultPath(taskId: string): string {
  return `/api/share/try-on/${encodeURIComponent(taskId)}/result`
}

export function tryOnMediaUrls(task: {
  id: string
  userImageUrl?: string | null
  itemImageUrl?: string | null
  glassesImageUrl?: string | null
  resultImageUrl?: string | null
}) {
  return {
    userImageUrl: task.userImageUrl ? tryOnMediaPath(task.id, 'user') : null,
    itemImageUrl: (task.itemImageUrl || task.glassesImageUrl) ? tryOnMediaPath(task.id, 'item') : null,
    glassesImageUrl: task.glassesImageUrl ? tryOnMediaPath(task.id, 'item') : null,
    resultImageUrl: task.resultImageUrl ? tryOnMediaPath(task.id, 'result') : null,
  }
}

export function adminTryOnMediaUrls(task: {
  id: string
  userImageUrl?: string | null
  itemImageUrl?: string | null
  glassesImageUrl?: string | null
  resultImageUrl?: string | null
}) {
  return {
    userImageUrl: task.userImageUrl ? adminTryOnMediaPath(task.id, 'user') : null,
    itemImageUrl: (task.itemImageUrl || task.glassesImageUrl) ? adminTryOnMediaPath(task.id, 'item') : null,
    glassesImageUrl: task.glassesImageUrl ? adminTryOnMediaPath(task.id, 'item') : null,
    resultImageUrl: task.resultImageUrl ? adminTryOnMediaPath(task.id, 'result') : null,
  }
}

export function tryOnClientMetadata(metadata: unknown): Record<string, unknown> | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null

  const source = metadata as Record<string, unknown>
  const safe: Record<string, unknown> = {}
  for (const key of CLIENT_METADATA_KEYS) {
    const value = source[key]
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      safe[key] = value
    }
  }

  return Object.keys(safe).length ? safe : null
}

export function decodeLegacyTryOnDataUrl(
  sourceUrl: string,
): { bytes: ArrayBuffer; contentType: string } | null {
  if (!sourceUrl.startsWith('data:')) return null

  const match = /^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/=\s]+)$/i.exec(sourceUrl)
  if (!match) throw new Error('Unsupported Try-On data URL')

  const contentType = match[1].toLowerCase()
  const encoded = match[2].replace(/\s/g, '')
  if (
    !TRY_ON_MEDIA_ALLOWED_IMAGE_TYPES.has(contentType) ||
    encoded.length === 0 ||
    encoded.length > TRY_ON_MEDIA_MAX_BASE64_CHARS
  ) {
    throw new Error('Try-On media is invalid or exceeds the size limit')
  }

  const buffer = Buffer.from(encoded, 'base64')
  if (buffer.byteLength === 0 || buffer.byteLength > TRY_ON_MEDIA_MAX_BYTES) {
    throw new Error('Try-On media is empty or exceeds the size limit')
  }

  const bytes = new Uint8Array(buffer.byteLength)
  bytes.set(buffer)
  return { bytes: bytes.buffer, contentType }
}

export function parseLegacyTryOnHttpUrl(sourceUrl: string): URL {
  const url = new URL(sourceUrl)
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Unsupported Try-On media URL')
  }
  return url
}
