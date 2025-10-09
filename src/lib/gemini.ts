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

    // Fetch user image
    const userImageResponse = await fetch(userImageUrl)
    if (!userImageResponse.ok) {
      throw new Error("Failed to fetch user image")
    }
    const userImageBuffer = await userImageResponse.arrayBuffer()
    const userImageBase64 = Buffer.from(userImageBuffer).toString('base64')
    const userImageMimeType = userImageResponse.headers.get('content-type') || 'image/jpeg'

    // Fetch glasses image
    const glassesImageResponse = await fetch(glassesImageUrl)
    if (!glassesImageResponse.ok) {
      throw new Error("Failed to fetch glasses image")
    }
    const glassesImageBuffer = await glassesImageResponse.arrayBuffer()
    const glassesImageBase64 = Buffer.from(glassesImageBuffer).toString('base64')
    const glassesImageMimeType = glassesImageResponse.headers.get('content-type') || 'image/png'

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

    console.log("✅ Gemini API response received")

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

    // Check if it's a quota error
    if (error instanceof Error && error.message.includes('quota')) {
      return {
        success: false,
        error: "Gemini 2.5 Flash Image quota exhausted. Please try again later or upgrade to a paid plan."
      }
    }

    // Check if it's a 429 error (rate limit)
    if (error instanceof Error && error.message.includes('429')) {
      return {
        success: false,
        error: "Too many requests, please try again later (recommended wait: 20-30 seconds)."
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
