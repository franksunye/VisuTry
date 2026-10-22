/**
 * G1-R1-B Kie contract laboratory — TEST SUPPORT ONLY.
 *
 * Never import this module from src/, production routes, or a real network client.
 * The only accepted request media hosts are *.invalid (RFC 2606 reserved domain);
 * real face photos, secrets, network requests, and provider costs are out of scope.
 *
 * Specifications checked 2026-10-22:
 * https://docs.kie.ai/market/google/nano-banana-2-lite
 * https://docs.kie.ai/market/flux2/pro-image-to-image
 * https://docs.kie.ai/market/common/get-task-detail
 */

export const KIE_CREATE_PATH = '/api/v1/jobs/createTask' as const
export const KIE_RECORD_PATH = '/api/v1/jobs/recordInfo' as const

export const KIE_MODELS = [
  'nano-banana-2-lite',
  'flux-2/pro-image-to-image',
] as const

export type KieModel = typeof KIE_MODELS[number]

export type SyntheticCase = {
  fixtureId: string
  faceUrl: string
  frameUrl: string
  prompt: string
}

export type KieCreateBody =
  | {
      model: 'nano-banana-2-lite'
      input: {
        prompt: string
        image_urls: [string, string]
        aspect_ratio: 'auto'
      }
    }
  | {
      model: 'flux-2/pro-image-to-image'
      input: {
        prompt: string
        input_urls: [string, string]
        aspect_ratio: '1:1'
        resolution: '1K'
        nsfw_checker: false
      }
    }

export type HttpEnvelope = { httpStatus: number; body: unknown }

export type CreateOutcome =
  | { kind: 'accepted'; taskId: string }
  | { kind: 'rejected'; code: number; message: string }
  | { kind: 'unknown'; reason: string }

export type RecordOutcome =
  | { kind: 'pending'; state: 'waiting' | 'queuing' | 'generating'; creditsConsumed: number | null }
  | { kind: 'completed'; resultUrl: string; creditsConsumed: number | null }
  | { kind: 'failed'; failCode: string | null; failMessage: string | null; creditsConsumed: number | null }
  | { kind: 'unknown'; reason: string }

export const SYNTHETIC_CASES: readonly SyntheticCase[] = Object.freeze(
  Array.from({ length: 8 }, (_, index) => {
    const n = String(index + 1).padStart(2, '0')
    return Object.freeze({
      fixtureId: 'G1-TRYON-' + n,
      faceUrl: 'https://g1-fixtures.invalid/media/face-' + n + '.jpg',
      frameUrl: 'https://g1-fixtures.invalid/media/frame-' + n + '.jpg',
      prompt: 'Place the exact synthetic reference glasses on the fictional adult face for fixture G1-TRYON-' + n + '; preserve identity, frame silhouette and color.',
    })
  })
)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isTestOnlyUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' &&
      (url.hostname === 'invalid' || url.hostname.endsWith('.invalid')) &&
      url.username === '' &&
      url.password === '' &&
      url.search === '' &&
      url.hash === ''
  } catch {
    return false
  }
}

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.username === '' && url.password === ''
  } catch {
    return false
  }
}

export function buildOfflineKieCreateBody(model: KieModel, sample: SyntheticCase): KieCreateBody {
  if (!KIE_MODELS.includes(model)) throw new Error('Unapproved Kie model')
  if (!/^G1-TRYON-0[1-8]$/.test(sample.fixtureId)) throw new Error('Unexpected synthetic fixture ID')
  if (!isTestOnlyUrl(sample.faceUrl) || !isTestOnlyUrl(sample.frameUrl)) {
    throw new Error('Only reserved .invalid synthetic URLs can enter this offline contract')
  }
  if (sample.faceUrl === sample.frameUrl) throw new Error('Expected distinct face and frame references')
  if (typeof sample.prompt !== 'string' || !sample.prompt.trim() || sample.prompt.length > 4096) {
    throw new Error('Invalid synthetic editing prompt')
  }
  const references: [string, string] = [sample.faceUrl, sample.frameUrl]
  if (model === 'nano-banana-2-lite') {
    return {
      model,
      input: { prompt: sample.prompt, image_urls: references, aspect_ratio: 'auto' },
    }
  }
  return {
    model: 'flux-2/pro-image-to-image',
    input: {
      prompt: sample.prompt,
      input_urls: references,
      aspect_ratio: '1:1',
      resolution: '1K',
      nsfw_checker: false,
    },
  }
}

export function buildOfflineKieRecordQuery(taskId: string): {
  path: typeof KIE_RECORD_PATH
  query: { taskId: string }
} {
  if (typeof taskId !== 'string' || !/^[-_a-zA-Z0-9]{1,128}$/.test(taskId)) {
    throw new Error('Invalid test task ID')
  }
  return { path: KIE_RECORD_PATH, query: { taskId } }
}

/**
 * A transport error or ambiguous HTTP/body response can represent an accepted
 * and billed task. Nothing in this contract authorizes automatic resubmission.
 */
export function decodeKieCreate(envelope: HttpEnvelope): CreateOutcome {
  const { httpStatus, body } = envelope
  if (httpStatus !== 200) {
    if ([400, 401, 403, 404, 422].includes(httpStatus)) {
      const code = isRecord(body) && typeof body.code === 'number' ? body.code : httpStatus
      const message = isRecord(body) && typeof body.msg === 'string' ? body.msg : 'HTTP rejection'
      return { kind: 'rejected', code, message }
    }
    return { kind: 'unknown', reason: 'Uncertain HTTP outcome: ' + httpStatus }
  }
  if (!isRecord(body) || typeof body.code !== 'number') {
    return { kind: 'unknown', reason: 'Missing Kie business code' }
  }
  if (body.code !== 200) {
    if ([400, 401, 403, 404, 422].includes(body.code)) {
      return {
        kind: 'rejected',
        code: body.code,
        message: typeof body.msg === 'string' ? body.msg : 'Business rejection',
      }
    }
    return { kind: 'unknown', reason: 'Uncertain Kie business outcome: ' + body.code }
  }
  if (!isRecord(body.data) || typeof body.data.taskId !== 'string' || !body.data.taskId.trim()) {
    return { kind: 'unknown', reason: 'Success without taskId; acceptance cannot be proven' }
  }
  return { kind: 'accepted', taskId: body.data.taskId }
}

function readCredits(data: Record<string, unknown>): number | null | 'invalid' {
  if (data.creditsConsumed == null) return null
  if (typeof data.creditsConsumed !== 'number' ||
      !Number.isFinite(data.creditsConsumed) ||
      data.creditsConsumed < 0) return 'invalid'
  return data.creditsConsumed
}

export function decodeKieRecord(envelope: HttpEnvelope, expectedTaskId: string): RecordOutcome {
  const { httpStatus, body } = envelope
  if (httpStatus !== 200 || !isRecord(body) || body.code !== 200 || !isRecord(body.data)) {
    return { kind: 'unknown', reason: 'Task read transport/business response not authoritative' }
  }
  const data = body.data
  if (data.taskId !== expectedTaskId) {
    return { kind: 'unknown', reason: 'Task ID mismatch' }
  }
  const credits = readCredits(data)
  if (credits === 'invalid') return { kind: 'unknown', reason: 'Invalid creditsConsumed' }
  if (data.state === 'waiting' || data.state === 'queuing' || data.state === 'generating') {
    return { kind: 'pending', state: data.state, creditsConsumed: credits }
  }
  if (data.state === 'fail') {
    return {
      kind: 'failed',
      failCode: typeof data.failCode === 'string' && data.failCode ? data.failCode : null,
      failMessage: typeof data.failMsg === 'string' && data.failMsg ? data.failMsg : null,
      creditsConsumed: credits,
    }
  }
  if (data.state !== 'success') return { kind: 'unknown', reason: 'Unknown task state' }
  if (typeof data.resultJson !== 'string') {
    return { kind: 'unknown', reason: 'Missing resultJson' }
  }
  let result: unknown
  try {
    result = JSON.parse(data.resultJson)
  } catch {
    return { kind: 'unknown', reason: 'Malformed resultJson' }
  }
  if (!isRecord(result) || !Array.isArray(result.resultUrls) ||
      result.resultUrls.length !== 1 || !isHttpsUrl(result.resultUrls[0])) {
    return { kind: 'unknown', reason: 'Expected exactly one HTTPS result URL' }
  }
  // MIME must be determined from downloaded bytes in a future approved test.
  // Kie documents JPEG-only for Nano Lite, JPEG or PNG for FLUX Pro;
  // signed output URLs and extensions are not a trusted MIME authority.
  return { kind: 'completed', resultUrl: result.resultUrls[0], creditsConsumed: credits }
}

export type OfflineKieTransport = {
  createTask: (path: typeof KIE_CREATE_PATH, body: KieCreateBody) => Promise<HttpEnvelope>
  recordInfo: (path: typeof KIE_RECORD_PATH, query: { taskId: string }) => Promise<HttpEnvelope>
}

/**
 * Only an injected transport is accepted; this file does not contain fetch,
 * provider hostnames, credentials, timers, or any integration configuration.
 * Promise caching before the first await fences concurrent and later replays.
 */
export class OfflineKieHarness {
  private readonly submissions = new Map<string, { fingerprint: string; outcome: Promise<CreateOutcome> }>()

  constructor(private readonly transport: OfflineKieTransport) {}

  submit(model: KieModel, sample: SyntheticCase): Promise<CreateOutcome> {
    const body = buildOfflineKieCreateBody(model, sample)
    const key = sample.fixtureId + ':' + model
    const fingerprint = JSON.stringify(body)
    const existing = this.submissions.get(key)
    if (existing) {
      if (existing.fingerprint !== fingerprint) throw new Error('Same fixture/model key with changed request')
      return existing.outcome
    }
    const outcome = Promise.resolve()
      .then(() => this.transport.createTask(KIE_CREATE_PATH, body))
      .then(decodeKieCreate)
      .catch((): CreateOutcome => ({ kind: 'unknown', reason: 'Transport exception; acceptance unknown' }))
    this.submissions.set(key, { fingerprint, outcome })
    return outcome
  }

  async poll(taskId: string): Promise<RecordOutcome> {
    const query = buildOfflineKieRecordQuery(taskId)
    try {
      return decodeKieRecord(await this.transport.recordInfo(query.path, query.query), taskId)
    } catch {
      return { kind: 'unknown', reason: 'Task read exception; retain prior task state' }
    }
  }

  getUniqueSubmitCount(): number {
    return this.submissions.size
  }
}
