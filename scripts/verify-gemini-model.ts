/**
 * Gemini Model Verification Script
 * 
 * This script tests if a given API key can access specific Gemini models,
 * particularly the gemini-2.5-flash-image model for image generation.
 */

import { GoogleGenerativeAI } from "@google/generative-ai"

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

async function verifyModel(apiKey: string, modelName: string): Promise<boolean> {
  try {
    log(`\n🔍 Testing model: ${modelName}`, colors.cyan)
    
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        // @ts-ignore
        // Only output image without text to save tokens
        responseModalities: ["Image"]
      }
    })
    
    // Try a simple text generation first
    log('   📝 Attempting text generation...', colors.blue)
    const result = await model.generateContent("Hello, this is a test.")
    const response = result.response
    const text = response.text()
    
    log(`   ✅ Text generation successful!`, colors.green)
    log(`   Response: ${text.substring(0, 100)}...`, colors.reset)
    
    return true
    
  } catch (error: any) {
    log(`   ❌ Failed to access model`, colors.red)
    
    if (error.message) {
      log(`   Error: ${error.message}`, colors.red)
    }
    
    // Check for specific error types
    if (error.message?.includes('404')) {
      log(`   💡 Model not found or not available for this API key`, colors.yellow)
    } else if (error.message?.includes('403') || error.message?.includes('401')) {
      log(`   💡 Authentication error - API key may be invalid or lacks permission`, colors.yellow)
    } else if (error.message?.includes('429')) {
      log(`   💡 Rate limit exceeded`, colors.yellow)
    } else if (error.message?.includes('quota')) {
      log(`   💡 Quota exceeded`, colors.yellow)
    }
    
    return false
  }
}

async function verifyImageGeneration(apiKey: string, modelName: string): Promise<boolean> {
  try {
    log(`\n🎨 Testing image generation with: ${modelName}`, colors.cyan)
    
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        // @ts-ignore
        // Only output image without text to save tokens
        responseModalities: ["Image"]
      }
    })
    
    // Try to generate a simple image
    log('   🖼️ Attempting to generate a test image...', colors.blue)
    log('   Prompt: "A simple red circle on white background"', colors.reset)
    
    const startTime = Date.now()
    const result = await model.generateContent("A simple red circle on white background")
    const duration = Date.now() - startTime
    
    const response = result.response
    const candidates = response.candidates
    
    if (!candidates || candidates.length === 0) {
      log(`   ❌ No candidates returned`, colors.red)
      return false
    }
    
    const parts = candidates[0].content.parts
    log(`   📊 Response parts: ${parts.length}`, colors.reset)
    
    // Check for image in response
    let hasImage = false
    let hasText = false
    
    for (const part of parts) {
      if (part.inlineData) {
        hasImage = true
        const imageSize = part.inlineData.data.length
        log(`   ✅ Image generated! Size: ${(imageSize/1024).toFixed(2)}KB`, colors.green)
        log(`   MIME type: ${part.inlineData.mimeType}`, colors.reset)
      }
      if (part.text) {
        hasText = true
        log(`   📝 Text response: ${part.text.substring(0, 100)}...`, colors.reset)
      }
    }
    
    log(`   ⏱️ Generation time: ${duration}ms (${(duration/1000).toFixed(2)}s)`, colors.reset)
    
    if (hasImage) {
      log(`   ✅ Image generation SUCCESSFUL!`, colors.green)
      return true
    } else {
      log(`   ❌ No image in response (only text)`, colors.red)
      return false
    }
    
  } catch (error: any) {
    log(`   ❌ Image generation failed`, colors.red)
    
    if (error.message) {
      log(`   Error: ${error.message}`, colors.red)
    }
    
    // Detailed error analysis
    if (error.message?.includes('404')) {
      log(`   💡 Model does not support image generation or not found`, colors.yellow)
    } else if (error.message?.includes('INVALID_ARGUMENT')) {
      log(`   💡 Invalid argument - model may not support responseModalities`, colors.yellow)
    }
    
    return false
  }
}

async function main() {
  log('\n' + '='.repeat(70), colors.bright)
  log('🔬 Gemini Model Verification Tool', colors.bright)
  log('='.repeat(70) + '\n', colors.bright)
  
  // API Key to test
  const API_KEY = 'AIzaSyC372C7u9sXj4pFkBYEP9X2fJPrOlPrKWk'
  
  log('🔑 API Key:', colors.cyan)
  log(`   ${API_KEY.substring(0, 20)}...${API_KEY.substring(API_KEY.length - 4)}`, colors.reset)
  
  // Models to test
  const modelsToTest = [
    'gemini-2.5-flash-image',
    'gemini-2.0-flash-preview-image-generation',
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ]
  
  log('\n📋 Models to test:', colors.cyan)
  modelsToTest.forEach(model => log(`   - ${model}`, colors.reset))
  
  // Test each model
  const results: { model: string, textGen: boolean, imageGen: boolean }[] = []
  
  for (const modelName of modelsToTest) {
    log('\n' + '-'.repeat(70), colors.reset)
    
    // Test basic access
    const canAccess = await verifyModel(API_KEY, modelName)
    
    // Test image generation (only if basic access works)
    let canGenerateImage = false
    if (canAccess && modelName.includes('image')) {
      canGenerateImage = await verifyImageGeneration(API_KEY, modelName)
    }
    
    results.push({
      model: modelName,
      textGen: canAccess,
      imageGen: canGenerateImage
    })
    
    // Wait a bit between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  // Summary
  log('\n' + '='.repeat(70), colors.bright)
  log('📊 VERIFICATION SUMMARY', colors.bright)
  log('='.repeat(70) + '\n', colors.bright)
  
  log('Model Name'.padEnd(50) + 'Text Gen'.padEnd(12) + 'Image Gen', colors.cyan)
  log('-'.repeat(70), colors.reset)
  
  for (const result of results) {
    const textStatus = result.textGen ? '✅ Yes' : '❌ No'
    const imageStatus = result.imageGen ? '✅ Yes' : result.textGen ? '⚠️ N/A' : '❌ No'
    
    const textColor = result.textGen ? colors.green : colors.red
    const imageColor = result.imageGen ? colors.green : colors.yellow
    
    log(
      result.model.padEnd(50) + 
      `${textColor}${textStatus}${colors.reset}`.padEnd(20) + 
      `${imageColor}${imageStatus}${colors.reset}`
    )
  }
  
  // Recommendations
  log('\n' + '='.repeat(70), colors.bright)
  log('💡 RECOMMENDATIONS', colors.bright)
  log('='.repeat(70) + '\n', colors.bright)
  
  const target = results.find(r => r.model === 'gemini-2.5-flash-image')
  const fallback = results.find(r => r.model === 'gemini-2.0-flash-preview-image-generation')
  
  if (target?.imageGen) {
    log('✅ RECOMMENDED: Use gemini-2.5-flash-image', colors.green)
    log('   This model is accessible and supports image generation.', colors.reset)
  } else if (fallback?.imageGen) {
    log('⚠️ FALLBACK: Use gemini-2.0-flash-preview-image-generation', colors.yellow)
    log('   gemini-2.5-flash-image is not accessible, but the fallback works.', colors.reset)
  } else {
    log('❌ WARNING: No image generation models are accessible', colors.red)
    log('   Please check your API key permissions or quota.', colors.reset)
  }
  
  log('\n' + '='.repeat(70) + '\n', colors.bright)
}

// Run the verification
main().catch(error => {
  log('\n❌ Fatal error:', colors.red)
  console.error(error)
  process.exit(1)
})

