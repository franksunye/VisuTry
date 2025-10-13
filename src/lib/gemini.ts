import { GoogleGenerativeAI } from "@google/generative-ai"
import { mockGenerateTryOnImage, isMockMode } from "./mocks/gemini"

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
      console.log('  - Proxy URL:', proxyUrl)
      console.log('  - Connection timeout: 60s')
      console.log('  - Headers/Body timeout: 120s')
      console.log('  - Target: generativelanguage.googleapis.com')
    } catch (error) {
      console.error('❌ Failed to configure proxy for Gemini API:', error)
      console.error('   Gemini API may fail in China without proxy')
    }
  }
}

// Only require API key in production mode
if (!process.env.GEMINI_API_KEY && !isMockMode) {
  throw new Error("GEMINI_API_KEY environment variable is required")
}

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null

export interface TryOnRequest {
  userImageUrl: string
  glassesImageUrl: string
  prompt?: string
}

export interface TryOnResult {
  success: boolean
  imageUrl?: string
  error?: string
}

export async function generateTryOnImage({
  userImageUrl,
  glassesImageUrl,
  prompt = "Place these glasses naturally on the person's face. Ensure the glasses fit properly, match the lighting and perspective, and look realistic."
}: TryOnRequest): Promise<TryOnResult> {
  // Use mock service in test mode
  if (isMockMode) {
    return mockGenerateTryOnImage({ userImageUrl, glassesImageUrl, prompt })
  }

  if (!genAI) {
    throw new Error("Gemini API not initialized")
  }

  try {
    const totalStartTime = Date.now()
    console.log("🎨 Starting Gemini 2.0 Flash Image Generation virtual try-on...")

    // Use Gemini 2.0 Flash Preview Image Generation
    // This model has FREE TIER quota and supports image generation
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-preview-image-generation",
      generationConfig: {
        // @ts-ignore - responseModalities is not in the type definition yet
        responseModalities: ["IMAGE", "TEXT"]
      }
    })

    // Fetch images in parallel for better performance
    // Add timeout to prevent hanging
    const downloadStartTime = Date.now()
    console.log(`📥 Downloading images from Blob Storage...`)
    console.log(`   User image: ${userImageUrl}`)
    console.log(`   Glasses image: ${glassesImageUrl}`)

    const fetchWithTimeout = async (url: string, timeoutMs: number = 30000) => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), timeoutMs)

      try {
        const response = await fetch(url, { signal: controller.signal })
        clearTimeout(timeout)
        return response
      } catch (error) {
        clearTimeout(timeout)
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`Fetch timeout after ${timeoutMs}ms for ${url}`)
        }
        throw error
      }
    }

    const [userImageResponse, glassesImageResponse] = await Promise.all([
      fetchWithTimeout(userImageUrl, 30000),
      fetchWithTimeout(glassesImageUrl, 30000)
    ])

    if (!userImageResponse.ok) {
      throw new Error(`Failed to fetch user image: ${userImageResponse.status} ${userImageResponse.statusText}`)
    }
    if (!glassesImageResponse.ok) {
      throw new Error(`Failed to fetch glasses image: ${glassesImageResponse.status} ${glassesImageResponse.statusText}`)
    }

    const [userImageBuffer, glassesImageBuffer] = await Promise.all([
      userImageResponse.arrayBuffer(),
      glassesImageResponse.arrayBuffer()
    ])

    const downloadTime = Date.now() - downloadStartTime
    console.log(`⏱️ Image download time: ${downloadTime}ms (${(downloadTime/1000).toFixed(2)}s)`)

    // Convert to base64
    const base64StartTime = Date.now()
    const userImageBase64 = Buffer.from(userImageBuffer).toString('base64')
    const glassesImageBase64 = Buffer.from(glassesImageBuffer).toString('base64')
    const userImageMimeType = userImageResponse.headers.get('content-type') || 'image/jpeg'
    const glassesImageMimeType = glassesImageResponse.headers.get('content-type') || 'image/png'

    const base64Time = Date.now() - base64StartTime
    console.log(`⏱️ Base64 conversion time: ${base64Time}ms`)
    console.log(`📊 Image sizes: user=${(userImageBase64.length/1024).toFixed(2)}KB, glasses=${(glassesImageBase64.length/1024).toFixed(2)}KB`)

    console.log("📸 Images loaded, generating virtual try-on...")

    // Create the prompt for multi-image fusion
    const tryOnPrompt = `
You are an expert at virtual glasses try-on. I will provide you with two images:
1. A person's face photo
2. A pair of glasses

Please create a photorealistic image where the glasses are naturally placed on the person's face.

Requirements:
- Position the glasses correctly on the nose bridge and ears
- Match the perspective and angle of the face
- Adjust the size of the glasses to fit the face proportionally
- Match the lighting conditions of the original photo
- Ensure the glasses look natural and realistic
- Preserve the person's facial features and expression
- Make sure the glasses don't obscure important facial features unnaturally

${prompt}
`

    // Generate the try-on image using multi-image fusion
    const apiStartTime = Date.now()
    console.log("🚀 Calling Gemini API...")

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
          mimeType: glassesImageMimeType,
          data: glassesImageBase64
        }
      }
    ])

    const apiTime = Date.now() - apiStartTime
    console.log(`✅ Gemini API response received`)
    console.log(`⏱️ Gemini API call time: ${apiTime}ms (${(apiTime/1000).toFixed(2)}s) ⭐ KEY METRIC`)

    // Extract the generated image from the response
    const response = result.response
    const candidates = response.candidates

    if (!candidates || candidates.length === 0) {
      throw new Error("No candidates returned from Gemini API")
    }

    const parts = candidates[0].content.parts

    // Look for inline_data (generated image)
    for (const part of parts) {
      if (part.inlineData) {
        console.log("🖼️ Generated image found in response")

        // Convert the base64 image data to a data URL
        const imageData = part.inlineData.data
        const mimeType = part.inlineData.mimeType || 'image/png'
        const dataUrl = `data:${mimeType};base64,${imageData}`

        const totalTime = Date.now() - totalStartTime
        console.log(`⏱️ Total generation time: ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)`)
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

    throw new Error("Gemini did not generate an image. Response: " + textResponse)

  } catch (error) {
    console.error("❌ Gemini API error:", error)

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
      return {
        success: false,
        error: "Authentication error: Invalid or missing API key."
      }
    }

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
    const response = await result.response
    return response.text().length > 0
  } catch (error) {
    console.error("Gemini connection validation failed:", error)
    return false
  }
}
