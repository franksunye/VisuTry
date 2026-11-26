export type ConsumerMediaKind = 'user' | 'item' | 'result' | 'face'
export type ConsumerMediaProvider = 'vercel-blob' | 'r2'

const R2_KEY = /^(?:tryon\/(?:user|item|result)|face-analysis)\/[a-zA-Z0-9_-]+$/
const R2_PREFIX = 'r2:'

// Persist a provider-qualified key in the existing, server-only URL columns.
export function r2Reference(key: string): string {
  if (!R2_KEY.test(key)) throw new Error('Invalid consumer R2 media key')
  return R2_PREFIX + key
}

export function r2Key(reference: string, kind?: ConsumerMediaKind): string | null {
  if (!reference.startsWith(R2_PREFIX)) return null
  const key = reference.slice(R2_PREFIX.length)
  const prefix = kind === 'face' ? 'face-analysis/' : kind ? `tryon/${kind}/` : null
  if (!R2_KEY.test(key) || (prefix && !key.startsWith(prefix))) {
    throw new Error('Invalid consumer R2 media reference')
  }
  return key
}

export function consumerMediaProvider(value = process.env.CONSUMER_MEDIA_WRITE_PROVIDER): ConsumerMediaProvider {
  const provider = value?.trim()
  if (!provider || provider === 'vercel-blob') return 'vercel-blob'
  if (provider === 'r2') return provider
  throw new Error('Invalid CONSUMER_MEDIA_WRITE_PROVIDER')
}

export function consumerMediaWriteProvider(userId: string): ConsumerMediaProvider {
  const provider = consumerMediaProvider()
  const canary = process.env.CONSUMER_MEDIA_R2_CANARY_USER_IDS
  if (provider !== 'r2' || canary === undefined) return provider
  const userIds = canary.split(',').map(value => value.trim())
  if (userIds.some(id => !/^[a-zA-Z0-9_-]+$/.test(id))) {
    throw new Error('Invalid CONSUMER_MEDIA_R2_CANARY_USER_IDS')
  }
  return userIds.includes(userId) ? 'r2' : 'vercel-blob'
}

export function requirePrivateConsumerBlob<T extends { access: 'public' | 'private' }>(options: T): T {
  if ((process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview') &&
      options.access !== 'private') {
    throw new Error('Hosted consumer Blob writes require a private store')
  }
  return options
}

export function pinnedTryOnResultStorage(
  metadata: Record<string, unknown> | null | undefined,
): 'r2' | 'public' | 'private' | undefined {
  const target = metadata?.consumerResultStorage
  if (target === undefined || target === 'r2') return target
  if (target === 'vercel-blob-public') return 'public'
  if (target === 'vercel-blob-private') return 'private'
  throw new Error('Unknown consumer Try-On result storage')
}

export function r2TryOnResultReference(taskId: string): string {
  return r2Reference(`tryon/result/${taskId}`)
}
