import { r2Key, type ConsumerMediaKind } from '@/lib/consumer-media-reference'
import { TRY_ON_MEDIA_ALLOWED_IMAGE_TYPES, TRY_ON_MEDIA_MAX_BYTES } from '@/lib/tryon-media'

const CACHE_CONTROL = 'private, no-store'
const REQUEST_TIMEOUT_MS = 15_000

type S3 = typeof import('@aws-sdk/client-s3')
let storage: Promise<{ client: InstanceType<S3['S3Client']>; bucket: string; sdk: S3 }> | undefined

function getStorage() {
  return storage ??= createStorage()
}

async function createStorage() {
  const account = process.env.CONSUMER_MEDIA_R2_ACCOUNT_ID?.trim()
  const bucket = process.env.CONSUMER_MEDIA_R2_BUCKET?.trim()
  const accessKeyId = process.env.CONSUMER_MEDIA_R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.CONSUMER_MEDIA_R2_SECRET_ACCESS_KEY?.trim()
  if (!account || !/^[a-f0-9]{32}$/.test(account) ||
      !bucket || !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket) ||
      !accessKeyId || !secretAccessKey) {
    throw new Error('Consumer R2 configuration is missing or invalid')
  }
  const sdk = await import('@aws-sdk/client-s3')
  return {
    bucket,
    sdk,
    client: new sdk.S3Client({
      region: 'auto',
      endpoint: `https://${account}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    }),
  }
}

async function objectParams(reference: string, kind?: ConsumerMediaKind) {
  const key = r2Key(reference, kind)
  if (!key) throw new Error('Expected a consumer R2 media reference')
  const { client, bucket, sdk } = await getStorage()
  return { client, sdk, object: { Bucket: bucket, Key: key } }
}

function options() {
  return { abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
}

function hasStatus(error: unknown, status: number): boolean {
  return (error as { $metadata?: { httpStatusCode?: number } } | null)?.$metadata?.httpStatusCode === status
}

function isMissingObject(error: unknown): boolean {
  if (!hasStatus(error, 404)) return false
  const name = (error as { name?: string }).name
  return name === 'NoSuchKey' || name === 'NotFound'
}

export class ConsumerMediaNotFound extends Error {}

function assertImage(contentType: string | undefined, size: number | undefined): asserts contentType is string {
  if (!contentType || !TRY_ON_MEDIA_ALLOWED_IMAGE_TYPES.has(contentType) ||
      size === undefined || !Number.isSafeInteger(size) || size <= 0 || size > TRY_ON_MEDIA_MAX_BYTES) {
    throw new Error('Invalid consumer R2 image metadata')
  }
}

export async function readR2Media(reference: string, kind: ConsumerMediaKind) {
  const { client, object, sdk } = await objectParams(reference, kind)
  try {
    const result = await client.send(new sdk.GetObjectCommand(object), options())
    assertImage(result.ContentType, result.ContentLength)
    if (!result.Body) throw new Error('Missing consumer R2 image body')
    const reader = result.Body.transformToWebStream().getReader()
    const bytes = new Uint8Array(result.ContentLength!)
    let offset = 0
    try {
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        if (offset + value.byteLength > bytes.byteLength) {
          await reader.cancel()
          throw new Error('Consumer R2 image exceeds its declared size')
        }
        bytes.set(value, offset)
        offset += value.byteLength
      }
    } finally {
      reader.releaseLock()
    }
    if (offset !== bytes.byteLength) throw new Error('Incomplete consumer R2 image')
    return { bytes: bytes.buffer, contentType: result.ContentType }
  } catch (error) {
    if (isMissingObject(error)) throw new ConsumerMediaNotFound()
    throw error
  }
}

/** Verify persisted identity and metadata before adopting an earlier result. */
export async function hasR2Result(reference: string): Promise<boolean> {
  const { client, object, sdk } = await objectParams(reference, 'result')
  try {
    const head = await client.send(new sdk.HeadObjectCommand(object), options())
    assertImage(head.ContentType, head.ContentLength)
    if (head.Metadata?.['visutry-key'] !== object.Key || head.CacheControl !== CACHE_CONTROL) {
      throw new Error('Unexpected object at consumer R2 result key')
    }
    return true
  } catch (error) {
    if (isMissingObject(error)) return false
    throw error
  }
}

export async function writeR2Media(reference: string, file: Blob, kind: ConsumerMediaKind) {
  assertImage(file.type, file.size)
  const { client, object, sdk } = await objectParams(reference, kind)
  try {
    await client.send(new sdk.PutObjectCommand({
      ...object,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
      ContentLength: file.size,
      CacheControl: CACHE_CONTROL,
      IfNoneMatch: '*',
      Metadata: { 'visutry-key': object.Key },
      StorageClass: 'STANDARD',
    }), options())
  } catch (error) {
    if (kind !== 'result' || !hasStatus(error, 412) || !await hasR2Result(reference)) throw error
  }
}

export async function deleteR2Media(reference: string): Promise<void> {
  const { client, object, sdk } = await objectParams(reference)
  try {
    await client.send(new sdk.DeleteObjectCommand(object), options())
  } catch (error) {
    if (!isMissingObject(error)) throw error
  }
}
