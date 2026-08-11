import { FACE_ANALYSIS_MODEL } from '@/config/face-analysis'
import { logger } from '@/lib/logger'

const CHAT_API_TIMEOUT_MS = 45_000
const CHAT_API_TOTAL_BUDGET_MS = 55_000
const MAX_CHAT_API_ATTEMPTS = 2
const CHAT_API_RETRY_DELAY_MS = 1_500
const MAX_INLINE_IMAGE_BYTES = 800 * 1024

function getGrsAiConfig() {
  const apiKey = process.env.GRSAI_API_KEY || process.env.GEMINI_API_KEY
  const baseUrl = (
    process.env.GRSAI_BASE_URL ||
    process.env.GEMINI_API_BASE_URL ||
    'https://grsaiapi.com'
  ).replace(/\/$/, '')
  return { apiKey, baseUrl }
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  error?: { message?: string }
}

function estimateInlineImageBytes(imageInput: string): number | null {
  const match = imageInput.match(/^data:([^;]+);base64,(.+)$/i)
  if (!match) return null
  return Math.ceil((match[2].length * 3) / 4)
}

function isRetryableRixApiError(status: number, errorText: string): boolean {
  if (status !== 400) return false

  try {
    const response = JSON.parse(errorText) as {
      error?: { type?: string }
    }
    return response.error?.type === 'rix_api_error'
  } catch {
    return false
  }
}

/**
 * Analyze face via GrsAi Chat API (gemini-3.1-flash-lite, vision + text).
 * Pass a data URI (preferred) — same pattern as try-on GrsAi `urls`.
 * Independent from src/lib/grsai.ts (try-on image generation).
 */
export async function analyzeFaceWithGrsAi(
  imageInput: string,
  prompt: string
): Promise<string> {
  const { apiKey, baseUrl } = getGrsAiConfig()
  if (!apiKey) {
    throw new Error('GRSAI_API_KEY is not configured')
  }

  const url = `${baseUrl}/v1/chat/completions`

  const payload = {
    model: FACE_ANALYSIS_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageInput } },
        ],
      },
    ],
  }

  const inlineBytes = estimateInlineImageBytes(imageInput)
  const usesDataUri = imageInput.startsWith('data:')
  if (inlineBytes && inlineBytes > MAX_INLINE_IMAGE_BYTES) {
    throw new Error(
      `Image too large for analysis (${Math.round(inlineBytes / 1024)}KB). Please upload a smaller photo.`
    )
  }

  logger.info('grsai-face', `Analyzing face via chat API`, {
    model: FACE_ANALYSIS_MODEL,
    baseUrl,
    imageTransport: usesDataUri ? 'data-uri' : 'url',
    inlineImageKb: inlineBytes ? Math.round(inlineBytes / 1024) : undefined,
  })

  let response: Response | undefined
  const deadline = Date.now() + CHAT_API_TOTAL_BUDGET_MS

  for (let attempt = 1; attempt <= MAX_CHAT_API_ATTEMPTS; attempt++) {
    const remainingBudgetMs = deadline - Date.now()
    if (remainingBudgetMs <= 0) {
      throw new Error('Face analysis timed out. Please try again with a clearer front-facing photo.')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      Math.min(CHAT_API_TIMEOUT_MS, remainingBudgetMs),
    )
    let attemptResponse: Response

    try {
      attemptResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
    } catch (error) {
      const isTimeout = error instanceof Error && error.name === 'AbortError'
      logger.warn('grsai-face', `Chat API network error (attempt ${attempt})`, undefined, {
        attempt,
        isTimeout,
        imageTransport: usesDataUri ? 'data-uri' : 'url',
      })

      // A timeout has an ambiguous outcome: GrsAi may have accepted and
      // processed the request even though our connection did not return.
      // Do not submit the same image again automatically.
      throw isTimeout
        ? new Error('Face analysis timed out. Please try again with a clearer front-facing photo.')
        : error
    } finally {
      clearTimeout(timeoutId)
    }

    if (attemptResponse.ok) {
      response = attemptResponse
      if (attempt > 1) {
        logger.info('grsai-face', 'Chat API recovered after retry', {
          attempt,
          status: attemptResponse.status,
        })
      }
      break
    }

    const errorText = await attemptResponse.text()
    const shouldRetry = isRetryableRixApiError(attemptResponse.status, errorText)

    if (
      shouldRetry &&
      attempt < MAX_CHAT_API_ATTEMPTS &&
      Date.now() + CHAT_API_RETRY_DELAY_MS < deadline
    ) {
      logger.warn('grsai-face', `Chat API transient provider error (attempt ${attempt})`, {
        attempt,
        status: attemptResponse.status,
        errorType: 'rix_api_error',
      })
      await new Promise((resolve) => setTimeout(resolve, CHAT_API_RETRY_DELAY_MS))
      continue
    }

    logger.error('grsai-face', `Chat API failed: ${attemptResponse.status}`, undefined, {
      attempt,
      error: errorText.slice(0, 500),
    })
    throw new Error(
      `GrsAi face analysis failed: ${attemptResponse.statusText} — ${errorText.slice(0, 200)}`
    )
  }

  if (!response) {
    throw new Error('GrsAi request failed')
  }

  const data = (await response.json()) as ChatCompletionResponse
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    logger.error('grsai-face', 'Chat API returned empty content', undefined, { data })
    throw new Error(data.error?.message || 'Empty response from GrsAi')
  }

  logger.info('grsai-face', 'Face analysis completed', {
    contentLength: content.length,
  })

  return content
}
