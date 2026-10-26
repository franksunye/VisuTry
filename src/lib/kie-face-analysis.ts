import { logger } from '@/lib/logger'
import { uploadKieFaceAnalysisImage } from '@/lib/kie'

/** Kie OpenAI-compatible vision chat; distinct from Kie's image-generation model. */
export const KIE_FACE_ANALYSIS_MODEL = 'gemini-3-8-flash-openai'
const KIE_FACE_CHAT_URL = 'https://api.kie.ai/gemini-3-8-flash-openai/v1/chat/completions'
const FACE_ANALYSIS_BUDGET_MS = 55_000 // Existing route allows 60 seconds.
const RESPONSE_TIMEOUT_MS = 35_000
const MAX_INLINE_IMAGE_BYTES = 800 * 1024

export async function analyzeFaceWithKie(imageDataUri: string, prompt: string): Promise<string> {
  const key = process.env.KIE_API_KEY
  if (!key) throw new Error('KIE_API_KEY is not configured')

  const image = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(imageDataUri)
  if (!image || Math.ceil(image[2].length * 3 / 4) > MAX_INLINE_IMAGE_BYTES) {
    throw new Error('Unsupported or oversized face analysis image')
  }

  const deadlineAt = Date.now() + FACE_ANALYSIS_BUDGET_MS
  // Kie documents hosted HTTPS media inputs. Stage only request-local bytes
  // with Kie itself; do not expose a Vercel Blob URL or persist the temp URL.
  const temporaryImageUrl = await uploadKieFaceAnalysisImage(imageDataUri, deadlineAt)
  const remainingMs = Math.min(RESPONSE_TIMEOUT_MS, deadlineAt - Date.now() - 2_000)
  if (remainingMs <= 0) throw new Error('Kie face analysis time budget exhausted before chat submission')

  let response: Response
  try {
    response = await fetch(KIE_FACE_CHAT_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      redirect: 'error',
      body: JSON.stringify({
        stream: false,
        include_thoughts: false,
        reasoning_effort: 'low',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: temporaryImageUrl } },
          ],
        }],
      }),
      signal: AbortSignal.timeout(remainingMs),
    })
  } catch {
    // An ambiguous response can already have incurred provider costs. No retry.
    throw new Error('Kie face analysis response unavailable; please retry later')
  }

  if (!response.ok) {
    logger.warn('face-analysis-service', 'Kie vision chat rejected', { status: response.status })
    throw new Error('Kie face analysis request failed')
  }

  let envelope: unknown
  try { envelope = await response.json() } catch { throw new Error('Invalid Kie face analysis response') }
  const body = envelope && typeof envelope === 'object' ? envelope as Record<string, unknown> : null
  if (!body || (body.code !== undefined && body.code !== 200)) {
    throw new Error('Kie face analysis returned an unsuccessful response')
  }
  const choices = Array.isArray(body.choices) ? body.choices : []
  const first = choices[0] && typeof choices[0] === 'object' ? choices[0] as Record<string, unknown> : null
  const message = first?.message && typeof first.message === 'object'
    ? first.message as Record<string, unknown> : null
  const content = message?.content
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Kie face analysis returned no usable content')
  }
  logger.info('face-analysis-service', 'Kie vision chat completed', { model: KIE_FACE_ANALYSIS_MODEL, contentLength: content.length })
  return content
}
