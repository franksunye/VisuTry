import { logger } from "@/lib/logger"

const GRSAI_API_KEY = process.env.GRSAI_API_KEY || process.env.GEMINI_API_KEY
const GRSAI_BASE_URL = (process.env.GRSAI_BASE_URL || process.env.GEMINI_API_BASE_URL || "https://grsai.dakka.com.cn").replace(/\/$/, "")
const MODEL_NAME = "nano-banana-fast"

interface GrsAiSubmitResponse {
  code: number
  msg: string
  data?: {
    id: string
  }
}

interface GrsAiPollResponse {
  code: number
  msg: string
  data?: {
    status: number | string // 1 or "succeeded"
    progress?: number
    imageUrl?: string // Sometimes result is in imageUrl
    images?: string[] // Sometimes in images array
    result?: string // Or generic result field
    results?: Array<{ // New structure support
      url: string
      content: string
    }>
    failure_reason?: string
    error?: string
  }
  status?: string // Top level status sometimes
}

export interface GrsAiResult {
  status: 'processing' | 'succeeded' | 'failed'
  progress: number
  imageUrl?: string
  metadata?: any // Add metadata field for text result
  error?: string
}

/**
 * Submit an async task to GrsAi
 */
export async function submitAsyncTask(
  userImageDataUri: string,
  itemImageDataUri: string,
  prompt: string
): Promise<string> {
  const url = `${GRSAI_BASE_URL}/v1/draw/nano-banana`
  
  const payload = {
    model: MODEL_NAME,
    prompt: prompt,
    aspectRatio: "auto",
    imageSize: "1K",
    urls: [
      userImageDataUri,
      itemImageDataUri
    ],
    webHook: "-1", // Request immediate ID return for polling
    shutProgress: false
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GRSAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('grsai', `Submission failed: ${response.status} ${response.statusText}`, undefined, { error: errorText })
      throw new Error(`GrsAi Submission failed: ${response.statusText}`)
    }

    const data = await response.json() as GrsAiSubmitResponse

    if (data.code === 0 && data.data?.id) {
      return data.data.id
    } else {
      logger.error('grsai', 'Unexpected response format', undefined, data)
      throw new Error("No Task ID received from GrsAi")
    }
  } catch (error) {
    logger.error('grsai', 'Network error during submission', error as Error)
    throw error
  }
}

/**
 * Poll task result from GrsAi
 */
export async function pollTaskResult(taskId: string): Promise<GrsAiResult> {
  const url = `${GRSAI_BASE_URL}/v1/draw/result`
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GRSAI_API_KEY}`
      },
      body: JSON.stringify({ id: taskId })
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('grsai', `Polling failed: ${response.status}`, undefined, { taskId, error: errorText })
      // If 404, maybe task not found or expired, treat as failed
      return { status: 'failed', progress: 0, error: `Polling failed: ${response.status}` }
    }

    const data = await response.json()
    
    // Normalize response data
    // Based on test script logs: 
    // Status: 1 or 'succeeded' -> Success
    // Status: 0 or 'processing' -> Processing
    // Status: -1 or 'failed' -> Failed
    
    // Look for status in data.data.status or data.status
    const rawStatus = data.data?.status ?? data.status
    const progress = data.data?.progress ?? 0
    
    // Determine standardized status
    let status: 'processing' | 'succeeded' | 'failed' = 'processing'
    
    if (rawStatus === 1 || rawStatus === 'succeeded' || rawStatus === 'SUCCESS') {
      status = 'succeeded'
    } else if (rawStatus === -1 || rawStatus === 'failed' || rawStatus === 'FAILED') {
      status = 'failed'
    }

    // Extract image URL if succeeded
    let imageUrl: string | undefined
    let metadata: any | undefined

    if (status === 'succeeded') {
      // 1. Check new structure (results array)
      if (data.data?.results && Array.isArray(data.data.results) && data.data.results.length > 0) {
        const firstResult = data.data.results[0]
        if (firstResult.url) {
          // Clean up URL (remove backticks and surrounding spaces if any)
          imageUrl = firstResult.url.replace(/[`]/g, '').trim()
        }
        if (firstResult.content) {
          metadata = { description: firstResult.content }
        }
      }

      // 2. Check common fields for image URL (fallback)
      if (!imageUrl) {
        if (data.data?.imageUrl) {
          imageUrl = data.data.imageUrl
        } else if (data.data?.images && Array.isArray(data.data.images) && data.data.images.length > 0) {
          imageUrl = data.data.images[0]
        }
        
        // If imageUrl is still not found, check result
        // But if imageUrl IS found, result might be the text description
        if (data.data?.result) {
          if (!imageUrl) {
            // If no image found yet, assume result is the image URL
            imageUrl = data.data.result
          } else {
            // If image already found, result is likely the text description
            // Only set if metadata wasn't already set by 'results' structure
            if (!metadata) {
              metadata = { description: data.data.result }
            }
          }
        }
      }
    }

    return {
      status,
      progress,
      imageUrl,
      metadata,
      error: status === 'failed' ? (data.data?.failure_reason || data.data?.error || data.msg || "Unknown error") : undefined
    }

  } catch (error) {
    logger.error('grsai', 'Polling network error', error as Error)
    return { status: 'failed', progress: 0, error: "Network error" }
  }
}
