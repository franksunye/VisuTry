// Mock Gemini AI Service for Testing
import { TryOnRequest, TryOnResult } from "@/lib/gemini"
import { isMockMode } from "./index"

export { isMockMode }

// Mock try-on results with different scenarios
const mockTryOnScenarios = [
  {
    success: true,
    imageUrl: 'https://via.placeholder.com/400x400/87CEEB/000000?text=Success+Try-On+1',
    processingTime: 2000,
  },
  {
    success: true,
    imageUrl: 'https://via.placeholder.com/400x400/98FB98/000000?text=Success+Try-On+2',
    processingTime: 3000,
  },
  {
    success: true,
    imageUrl: 'https://via.placeholder.com/400x400/DDA0DD/000000?text=Success+Try-On+3',
    processingTime: 2500,
  },
  {
    success: false,
    error: 'Mock error: Face not clearly visible in the image',
    processingTime: 1000,
  },
  {
    success: false,
    error: 'Mock error: Image quality too low for processing',
    processingTime: 1500,
  }
]

export async function mockGenerateTryOnImage({
  userImageUrl,
  glassesImageUrl,
  prompt
}: TryOnRequest): Promise<TryOnResult> {
  if (!isMockMode) {
    throw new Error("Mock service called in non-mock mode")
  }

  console.log('🧪 Mock AI Service: Processing try-on request...')
  console.log('📸 User Image:', userImageUrl)
  console.log('👓 Glasses:', glassesImageUrl)
  console.log('💭 Prompt:', prompt)

  // Simulate different scenarios based on input
  let scenario = mockTryOnScenarios[0] // Default success
  
  // Simulate different outcomes based on image URLs
  if (userImageUrl.includes('error')) {
    scenario = mockTryOnScenarios[3] // Error scenario
  } else if (userImageUrl.includes('lowquality')) {
    scenario = mockTryOnScenarios[4] // Low quality error
  } else {
    // Random success scenario
    const successScenarios = mockTryOnScenarios.filter(s => s.success)
    scenario = successScenarios[Math.floor(Math.random() * successScenarios.length)]
  }

  // Simulate processing time
  console.log(`⏳ Mock processing time: ${scenario.processingTime}ms`)
  await new Promise(resolve => setTimeout(resolve, scenario.processingTime))

  if (scenario.success) {
    console.log('✅ Mock AI Service: Try-on completed successfully')
    return {
      success: true,
      imageUrl: scenario.imageUrl,
    }
  } else {
    console.log('❌ Mock AI Service: Try-on failed')
    return {
      success: false,
      error: scenario.error,
    }
  }
}

// Mock image analysis function
export async function mockAnalyzeImage(imageUrl: string) {
  if (!isMockMode) {
    throw new Error("Mock service called in non-mock mode")
  }

  console.log('🔍 Mock AI Service: Analyzing image...')
  
  // Simulate analysis time
  await new Promise(resolve => setTimeout(resolve, 1000))

  return {
    faceDetected: true,
    faceConfidence: 0.95,
    landmarks: {
      leftEye: { x: 150, y: 120 },
      rightEye: { x: 250, y: 120 },
      nose: { x: 200, y: 160 },
      mouth: { x: 200, y: 220 },
    },
    faceBox: {
      x: 100,
      y: 80,
      width: 200,
      height: 240,
    },
    quality: 'high',
    lighting: 'good',
    angle: 'frontal',
  }
}
