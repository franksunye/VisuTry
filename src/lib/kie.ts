import { randomUUID } from 'node:crypto'
import { buildTryOnPrompt } from '@/lib/prompt-builder'
import type { GrsAiResult } from '@/lib/grsai'
import { KIE_TRY_ON_MODEL } from '@/lib/generation/providers'

// Fixed endpoints: credentials and user photographs must never be forwarded
// through client-controlled provider URLs.
const UPLOAD_URL = 'https://kieai.redpandaai.co/api/file-stream-upload'
const CREATE_URL = 'https://api.kie.ai/api/v1/jobs/createTask'
const RECORD_URL = 'https://api.kie.ai/api/v1/jobs/recordInfo'
const REQUEST_TIMEOUT_MS = 20_000
const MAX_REFERENCE_BYTES = 10 * 1024 * 1024

type JsonObject = Record<string, unknown>

export class KieProviderError extends Error {
  constructor(
    public readonly stage: 'upload' | 'submit' | 'poll',
    public readonly acceptance: 'not-sent' | 'unknown',
    message: string,
  ) {
    super(message)
    this.name = 'KieProviderError'
  }
}

function config() {
  const apiKey = process.env.KIE_API_KEY
  if (!apiKey) throw new KieProviderError('upload', 'not-sent', 'Kie is not configured')
  return { Authorization: `Bearer ${apiKey}` }
}

function object(value: unknown): JsonObject | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : null
}

function safeHttpsUrl(value: unknown, allowedHost: (hostname: string) => boolean): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !allowedHost(url.hostname)) return null
    return url.toString()
  } catch {
    return null
  }
}

function allowedKieUpload(hostname: string): boolean {
  return hostname === 'tempfile.redpandaai.co'
}

function allowedKieOutput(hostname: string): boolean {
  // Keep a restrictive allowlist until a synthetic live task confirms all
  // of Kie's actual output hosts. Never fetch arbitrary URLs as our server.
  return hostname === 'tempfile.redpandaai.co' ||
    hostname === 'kie.ai' || hostname.endsWith('.kie.ai') ||
    hostname === 'redpandaai.co' || hostname.endsWith('.redpandaai.co')
}

async function parseEnvelope(response: Response): Promise<JsonObject | null> {
  try {
    return object(await response.json())
  } catch {
    return null
  }
}

function mediaFromDataUri(value: string): { bytes: Uint8Array; mime: string } {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)
  if (!match) throw new KieProviderError('upload', 'not-sent', 'Unsupported Kie reference image')
  const bytes = Buffer.from(match[2], 'base64')
  if (!bytes.length || bytes.length > MAX_REFERENCE_BYTES) {
    throw new KieProviderError('upload', 'not-sent', 'Invalid Kie reference image size')
  }
  return { bytes, mime: match[1] }
}

async function uploadReference(imageDataUri: string): Promise<string> {
  const { bytes, mime } = mediaFromDataUri(imageDataUri)
  const form = new FormData()
  const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
  const fileName = `${randomUUID()}.${extension}`
  const imageBuffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(imageBuffer).set(bytes)
  form.append('file', new Blob([imageBuffer], { type: mime }), fileName)
  form.append('uploadPath', 'visutry/tryon/references')
  form.append('fileName', fileName)

  let response: Response
  try {
    response = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: config(),
      body: form,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch {
    throw new KieProviderError('upload', 'not-sent', 'Kie reference upload unavailable')
  }
  const body = await parseEnvelope(response)
  const url = safeHttpsUrl(object(body?.data)?.downloadUrl, allowedKieUpload)
  if (!response.ok || body?.code !== 200 || body?.success !== true || !url) {
    throw new KieProviderError('upload', 'not-sent', 'Kie reference upload rejected')
  }
  return url
}

/**
 * Upload two request-local image references then submit one non-idempotent
 * asynchronous task. The caller MUST persist UNKNOWN before calling this.
 * Never retry createTask automatically when acceptance is uncertain.
 */
export async function submitKieTask(
  userImageDataUri: string,
  itemImageDataUri: string,
  detailedInstructions: string,
  promptVersion?: string,
): Promise<string> {
  // No Kie network call is made if the feature flag is off.
  if (!process.env.KIE_API_KEY) throw new KieProviderError('upload', 'not-sent', 'Kie is not configured')
  const [personUrl, frameUrl] = await Promise.all([
    uploadReference(userImageDataUri),
    uploadReference(itemImageDataUri),
  ])

  let response: Response
  try {
    response = await fetch(CREATE_URL, {
      method: 'POST',
      headers: { ...config(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: KIE_TRY_ON_MODEL,
        input: {
          prompt: buildTryOnPrompt(detailedInstructions, promptVersion),
          image_urls: [personUrl, frameUrl],
          aspect_ratio: 'auto',
        },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch {
    throw new KieProviderError('submit', 'unknown', 'Kie task submission outcome unknown')
  }
  const body = await parseEnvelope(response)
  const taskId = object(body?.data)?.taskId
  if (response.ok && body?.code === 200 && typeof taskId === 'string' && /^[a-zA-Z0-9_-]{1,180}$/.test(taskId)) {
    return taskId
  }
  // Even an HTTP 200 with a non-success business code is not proof that
  // createTask did not reach the queue. Fail closed: no automatic re-submit.
  throw new KieProviderError('submit', 'unknown', 'Kie task admission could not be confirmed')
}

/** Read-only polling; only an explicit remote `fail` is terminal. */
export async function pollKieTask(externalTaskId: string): Promise<GrsAiResult> {
  if (!/^[a-zA-Z0-9_-]{1,180}$/.test(externalTaskId)) {
    return { status: 'processing', progress: 0, diagnostics: { code: 503 } }
  }
  try {
    const url = new URL(RECORD_URL)
    url.searchParams.set('taskId', externalTaskId)
    const response = await fetch(url, {
      headers: config(),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    const body = await parseEnvelope(response)
    if (!response.ok || body?.code !== 200) {
      return {
        status: 'failed', progress: 0, error: 'Kie status temporarily unavailable',
        diagnostics: { code: 503 },
      }
    }
    const data = object(body.data)
    if (!data || data.taskId !== externalTaskId) {
      return { status: 'failed', progress: 0, error: 'Kie task metadata unavailable', diagnostics: { code: 503 } }
    }
    const state = data.state
    const progress = typeof data.progress === 'number' && Number.isFinite(data.progress)
      ? Math.max(0, Math.min(100, data.progress)) : 0
    if (state === 'waiting' || state === 'queuing' || state === 'generating') {
      return { status: 'processing', progress }
    }
    if (state === 'fail') {
      return {
        status: 'failed', progress,
        error: typeof data.failCode === 'string' && data.failCode
          ? `Kie task failed (${data.failCode.slice(0, 60)})`
          : 'Kie task failed',
      }
    }
    if (state === 'success') {
      let result: JsonObject | null = null
      try {
        result = typeof data.resultJson === 'string' ? object(JSON.parse(data.resultJson)) : null
      } catch {
        // Malformed success envelope can still conceal a usable media result.
      }
      const urls = result?.resultUrls
      const imageUrl = Array.isArray(urls) && urls.length === 1
        ? safeHttpsUrl(urls[0], allowedKieOutput) : null
      if (!imageUrl) {
        return { status: 'failed', progress, error: 'Kie result requires reconciliation', diagnostics: { code: 503 } }
      }
      return { status: 'succeeded', progress: 100, imageUrl }
    }
    return { status: 'failed', progress, error: 'Unknown Kie task state', diagnostics: { code: 503 } }
  } catch {
    return { status: 'failed', progress: 0, error: 'Kie polling network error', diagnostics: { code: 503 } }
  }
}
