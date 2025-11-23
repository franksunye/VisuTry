import { GoogleGenerativeAI } from "@google/generative-ai"
import { mockGenerateTryOnImage, isMockMode } from "./mocks/gemini"
import { logger } from "./logger"

// Configure proxy for Gemini API in local development
if (typeof window === 'undefined') {
  const isLocalDev = process.env.NODE_ENV === 'development' && !process.env.VERCEL
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY

  if (isLocalDev && proxyUrl) {
    try {
      const { ProxyAgent } = require('undici')
      const { setGlobalDispatcher } = require('undici')

      // Configure proxy with longer timeout for Gemini API
      const dispatcher = new ProxyAgent({
        uri: proxyUrl,
        connect: {
          timeout: 60000, // 60 seconds connection timeout
        },
        headersTimeout: 120000, // 120 seconds headers timeout
        bodyTimeout: 120000, // 120 seconds body timeout
      })
      setGlobalDispatcher(dispatcher)

      console.log('🔌 Proxy configured for Gemini API')
      logger.info('general', 'Proxy configured for Gemini API', { proxyUrl, connectionTimeout: '60s', headersBodyTimeout: '120s' })
      console.log('  - Proxy URL:', proxyUrl)
      console.log('  - Connection timeout: 60s')
      console.log('  - Headers/Body timeout: 120s')
      console.log('  - Target: generativelanguage.googleapis.com')
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('❌ Failed to configure proxy for Gemini API:', error)
      logger.error('general', 'Failed to configure proxy for Gemini API', err)
      console.error('   Gemini API may fail in China without proxy')
    }
  }
}

// Only require API key in production mode
if (!process.env.GEMINI_API_KEY && !isMockMode && !process.env.SKIP_ENV_VALIDATION) {
  throw new Error("GEMINI_API_KEY environment variable is required")
}

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null

export interface TryOnRequest {
  userImageUrl: string
  itemImageUrl?: string // New generic field name
  glassesImageUrl?: string // Legacy field name for backward compatibility
  prompt?: string
}

export interface TryOnResult {
  success: boolean
  imageUrl?: string
  error?: string
}

export async function generateTryOnImage({
  userImageUrl,
  itemImageUrl,
  glassesImageUrl, // Legacy parameter for backward compatibility
  // Original prompt: "Place these glasses naturally on the person's face. Ensure the glasses fit properly, match the lighting and perspective, and look realistic."
  prompt = "Place the glasses naturally on the person’s face in the uploaded photo — use that face photo exactly as is, without cropping or altering its size, proportions, or composition; if the head is slightly tilted, the glasses frame should tilt accordingly and align exactly with the roll/tilt angle of the head, sitting properly on the nose bridge and temples. Ensure the glasses fit properly, match the lighting and perspective, look realistic, and avoid any distortion or skewing of the frame."
}: TryOnRequest): Promise<TryOnResult> {
  // Support both new and legacy field names
  const actualItemImageUrl = itemImageUrl || glassesImageUrl

  if (!actualItemImageUrl) {
    throw new Error("Item image URL is required")
  }

  // Use mock service in test mode
  if (isMockMode) {
    return mockGenerateTryOnImage({ userImageUrl, glassesImageUrl: actualItemImageUrl, prompt })
  }

  if (!genAI) {
    throw new Error("Gemini API not initialized")
  }

  try {
    const totalStartTime = Date.now()
    console.log("🎨 Starting Gemini 2.0 Flash Image Generation virtual try-on...")
    logger.info('api', 'Starting Gemini virtual try-on', { userImageUrl, itemImageUrl: actualItemImageUrl })

    // Use Gemini 2.5 Flash Image
    // This model supports image generation and is accessible with the current API key
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image",
      generationConfig: {
        // @ts-ignore - responseModalities is not in the type definition yet
        // Only output image without text to save tokens and reduce redundant information
        // Reference: https://ai.google.dev/gemini-api/docs/image-generation#output-type
        responseModalities: ["Image"]
      }
    })

    // Fetch images in parallel for better performance
    // Add timeout to prevent hanging
    const downloadStartTime = Date.now()
    console.log(`📥 Downloading images from Blob Storage...`)
    logger.debug('api', 'Downloading images from Blob Storage', { userImageUrl, itemImageUrl: actualItemImageUrl })
    console.log(`   User image: ${userImageUrl}`)
    console.log(`   Item image: ${actualItemImageUrl}`)

    const fetchWithRetry = async (url: string, maxRetries: number = 3, timeoutMs: number = 30000) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`   Attempt ${attempt}/${maxRetries} for ${url.substring(0, 80)}...`)
          logger.debug('api', `Fetch attempt ${attempt}/${maxRetries}`, { url: url.substring(0, 80) })

          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), timeoutMs)

          const response = await fetch(url, {
            signal: controller.signal,
            // Add headers to help with connection
            headers: {
              'User-Agent': 'VisuTry/1.0'
            }
          })

          clearTimeout(timeout)

          if (response.ok) {
            console.log(`   ✅ Success on attempt ${attempt}`)
            logger.debug('api', `Fetch success on attempt ${attempt}`)
            return response
          }

          console.warn(`   ⚠️ HTTP ${response.status} on attempt ${attempt}`)
          logger.warn('api', `HTTP error on fetch attempt`, { attempt, status: response.status })

          if (attempt < maxRetries) {
            const delay = attempt * 1000 // 1s, 2s, 3s
            console.log(`   ⏳ Waiting ${delay}ms before retry...`)
            await new Promise(resolve => setTimeout(resolve, delay))
          }

        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          console.error(`   ❌ Error on attempt ${attempt}:`, error instanceof Error ? error.message : error)
          logger.error('api', `Fetch error on attempt ${attempt}`, err)

          if (attempt < maxRetries) {
            const delay = attempt * 1000
            console.log(`   ⏳ Waiting ${delay}ms before retry...`)
            await new Promise(resolve => setTimeout(resolve, delay))
          } else {
            throw error
          }
        }
      }

      throw new Error(`Failed to fetch after ${maxRetries} attempts: ${url}`)
    }

    const [userImageResponse, itemImageResponse] = await Promise.all([
      fetchWithRetry(userImageUrl, 3, 30000),
      fetchWithRetry(actualItemImageUrl, 3, 30000)
    ])

    if (!userImageResponse.ok) {
      throw new Error(`Failed to fetch user image: ${userImageResponse.status} ${userImageResponse.statusText}`)
    }
    if (!itemImageResponse.ok) {
      throw new Error(`Failed to fetch item image: ${itemImageResponse.status} ${itemImageResponse.statusText}`)
    }

    const [userImageBuffer, itemImageBuffer] = await Promise.all([
      userImageResponse.arrayBuffer(),
      itemImageResponse.arrayBuffer()
    ])

    const downloadTime = Date.now() - downloadStartTime
    console.log(`⏱️ Image download time: ${downloadTime}ms (${(downloadTime/1000).toFixed(2)}s)`)
    logger.info('api', 'Image download completed', { downloadTime })

    // Convert to base64
    const base64StartTime = Date.now()
    const userImageBase64 = Buffer.from(userImageBuffer).toString('base64')
    const itemImageBase64 = Buffer.from(itemImageBuffer).toString('base64')
    const userImageMimeType = userImageResponse.headers.get('content-type') || 'image/jpeg'
    const itemImageMimeType = itemImageResponse.headers.get('content-type') || 'image/png'

    const base64Time = Date.now() - base64StartTime
    console.log(`⏱️ Base64 conversion time: ${base64Time}ms`)
    logger.debug('api', 'Base64 conversion completed', { base64Time })
    console.log(`📊 Image sizes: user=${(userImageBase64.length/1024).toFixed(2)}KB, item=${(itemImageBase64.length/1024).toFixed(2)}KB`)

    console.log("📸 Images loaded, generating virtual try-on...")
    logger.info('api', 'Images loaded, calling Gemini API')

    // Create the prompt for multi-image fusion
    // The prompt parameter contains type-specific detailed instructions from config
    const tryOnPrompt = `You are an expert AI image generation specialist for virtual try-on technology.

INPUT:
- Image 1: A person's photograph (user photo)
- Image 2: An item to try on (product image)

TASK:
Generate a single photorealistic composite image showing the person wearing/using the item.

DETAILED INSTRUCTIONS:
${prompt}

TECHNICAL REQUIREMENTS:
- Output resolution: Match the user photo's resolution
- Image quality: Photorealistic, high-fidelity
- Composition: Keep the original photo's framing and composition
- Color accuracy: Maintain accurate colors for both person and item
- Edge blending: Seamless transitions with no visible artifacts
- Depth consistency: Proper occlusion and layering
- Shadow realism: Natural shadows that match the lighting environment

OUTPUT FORMAT:
Return a single composite image that looks like a professional photograph taken in one shot.`

    // Generate the try-on image using multi-image fusion
    const apiStartTime = Date.now()
    console.log("🚀 Calling Gemini API...")
    logger.info('api', 'Calling Gemini API for image generation')

    const result = await model.generateContent([
      tryOnPrompt,
      {
        inlineData: {
          mimeType: userImageMimeType,
          data: userImageBase64
        }
      },
      {
        inlineData: {
          mimeType: itemImageMimeType,
          data: itemImageBase64
        }
      }
    ])

    const apiTime = Date.now() - apiStartTime
    console.log(`✅ Gemini API response received`)
    logger.info('api', 'Gemini API response received', { apiTime })
    console.log(`⏱️ Gemini API call time: ${apiTime}ms (${(apiTime/1000).toFixed(2)}s) ⭐ KEY METRIC`)

    // Extract the generated image from the response
    const response = result.response
    const candidates = response.candidates

    if (!candidates || candidates.length === 0) {
      throw new Error("No candidates returned from Gemini API")
    }

    const parts = candidates[0].content.parts
    console.log(`📊 Response parts count: ${parts.length}`)

    // Log all parts to understand what Gemini returned
    parts.forEach((part, index) => {
      if (part.text) {
        console.log(`📝 Part ${index}: Text response - "${part.text.substring(0, 100)}..."`)
      }
      if (part.inlineData) {
        console.log(`🖼️ Part ${index}: Image data (${(part.inlineData.data.length/1024).toFixed(2)}KB, ${part.inlineData.mimeType})`)
      }
    })

    // Look for inline_data (generated image)
    for (const part of parts) {
      if (part.inlineData) {
        console.log("🖼️ Generated image found in response")
        logger.info('api', 'Generated image found in Gemini response')

        // Convert the base64 image data to a data URL
        const imageData = part.inlineData.data
        const mimeType = part.inlineData.mimeType || 'image/png'
        const dataUrl = `data:${mimeType};base64,${imageData}`

        const totalTime = Date.now() - totalStartTime
        console.log(`⏱️ Total generation time: ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)`)
        logger.info('api', 'Try-on generation completed', { totalTime, apiTime, imageSize: (imageData.length/1024).toFixed(2) })
        console.log(`📊 Result image size: ${(imageData.length/1024).toFixed(2)}KB`)

        return {
          success: true,
          imageUrl: dataUrl,
          error: undefined
        }
      }
    }

    // If no image was generated, check for text response
    const textResponse = response.text()
    console.warn("⚠️ No image generated, text response:", textResponse)
    logger.warn('api', 'No image generated from Gemini, received text response instead', { textResponse: textResponse.substring(0, 200) })

    throw new Error("Gemini did not generate an image. Response: " + textResponse)

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error("❌ Gemini API error:", error)
    logger.error('api', 'Gemini API error', err)

    // Log detailed error information
    if (error instanceof Error) {
      console.error("   Error name:", error.name)
      console.error("   Error message:", error.message)
      console.error("   Error stack:", error.stack)
    }

    // Check for specific error types
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Network/fetch errors
    if (errorMessage.includes('fetch failed') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ETIMEDOUT')) {
      console.error("🌐 Network error detected - possible causes:")
      console.error("   1. Vercel serverless function network restrictions")
      console.error("   2. Google API endpoint unreachable")
      console.error("   3. Timeout (check if GEMINI_API_KEY is set)")
      console.error("   4. Regional restrictions")
      logger.error('api', 'Gemini network error detected', err, { errorType: 'network' })

      return {
        success: false,
        error: "Network error: Unable to connect to Gemini API. Please check your internet connection and try again."
      }
    }

    // Check if it's a quota error
    if (errorMessage.includes('quota')) {
      return {
        success: false,
        error: "Gemini API quota exhausted. Please try again later or upgrade to a paid plan."
      }
    }

    // Check if it's a 429 error (rate limit)
    if (errorMessage.includes('429')) {
      return {
        success: false,
        error: "Too many requests. Please wait 20-30 seconds and try again."
      }
    }

    // Check if it's an authentication error
    if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('403')) {
      console.error("🔑 Authentication error - GEMINI_API_KEY may be invalid or missing")
      logger.error('api', 'Gemini authentication error - invalid or missing API key', error instanceof Error ? error : new Error(String(error)))
      return {
        success: false,
        error: "Authentication error: Invalid or missing API key."
      }
    }

    logger.error('api', 'Gemini API error', error instanceof Error ? error : new Error(String(error)))
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred during AI processing"
    }
  }
}

export async function validateGeminiConnection(): Promise<boolean> {
  if (isMockMode) {
    return true // Always return true in mock mode
  }

  if (!genAI) {
    return false
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
    const result = await model.generateContent("Hello, this is a test.")
    const response = result.response
    return response.text().length > 0
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error("Gemini connection validation failed:", error)
    logger.error('api', 'Gemini connection validation failed', err)
    return false
  }
}
