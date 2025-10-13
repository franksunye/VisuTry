/**
 * Gemini API Performance Testing Script
 * 
 * This script tests the actual performance of Gemini image generation API
 * with different scenarios to help determine if 10-second target is achievable.
 * 
 * Usage:
 *   npx tsx scripts/test-gemini-performance.ts
 * 
 * Requirements:
 *   - GEMINI_API_KEY environment variable
 *   - Two test images (user photo and glasses)
 */

import { GoogleGenerativeAI } from "@google/generative-ai"
import * as fs from "fs"
import * as path from "path"

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const TEST_ITERATIONS = 3 // Number of tests per scenario

// Test scenarios
const SCENARIOS = [
  {
    name: "Full Prompt (Current)",
    prompt: `You are an expert at virtual glasses try-on. I will provide you with two images:
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
- Make sure the glasses don't obscure important facial features unnaturally`
  },
  {
    name: "Simplified Prompt",
    prompt: "Place these glasses on the person's face naturally. Match lighting and perspective."
  },
  {
    name: "Minimal Prompt",
    prompt: "Put the glasses on the face."
  }
]

// Performance metrics
interface PerformanceMetrics {
  scenario: string
  iteration: number
  downloadTime: number
  base64Time: number
  apiCallTime: number
  totalTime: number
  userImageSize: number
  glassesImageSize: number
  resultImageSize: number
  success: boolean
  error?: string
}

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

function formatTime(ms: number): string {
  return `${ms}ms (${(ms/1000).toFixed(2)}s)`
}

function formatSize(bytes: number): string {
  return `${(bytes/1024).toFixed(2)}KB`
}

async function testGeminiPerformance(
  userImageUrl: string,
  glassesImageUrl: string,
  scenario: typeof SCENARIOS[0],
  iteration: number
): Promise<PerformanceMetrics> {
  const totalStartTime = Date.now()
  
  log(`\n${'='.repeat(80)}`, colors.cyan)
  log(`Testing: ${scenario.name} (Iteration ${iteration + 1})`, colors.bright)
  log('='.repeat(80), colors.cyan)

  try {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not found in environment variables")
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-preview-image-generation",
      generationConfig: {
        // @ts-ignore
        responseModalities: ["IMAGE", "TEXT"]
      }
    })

    // 1. Download images
    log('\n📥 Downloading images...', colors.blue)
    const downloadStartTime = Date.now()
    
    const [userImageResponse, glassesImageResponse] = await Promise.all([
      fetch(userImageUrl),
      fetch(glassesImageUrl)
    ])

    if (!userImageResponse.ok || !glassesImageResponse.ok) {
      throw new Error("Failed to download images")
    }

    const [userImageBuffer, glassesImageBuffer] = await Promise.all([
      userImageResponse.arrayBuffer(),
      glassesImageResponse.arrayBuffer()
    ])

    const downloadTime = Date.now() - downloadStartTime
    log(`✅ Download completed: ${formatTime(downloadTime)}`, colors.green)
    log(`   User image: ${formatSize(userImageBuffer.byteLength)}`)
    log(`   Glasses image: ${formatSize(glassesImageBuffer.byteLength)}`)

    // 2. Convert to base64
    log('\n🔄 Converting to base64...', colors.blue)
    const base64StartTime = Date.now()
    
    const userImageBase64 = Buffer.from(userImageBuffer).toString('base64')
    const glassesImageBase64 = Buffer.from(glassesImageBuffer).toString('base64')
    const userImageMimeType = userImageResponse.headers.get('content-type') || 'image/jpeg'
    const glassesImageMimeType = glassesImageResponse.headers.get('content-type') || 'image/png'

    const base64Time = Date.now() - base64StartTime
    log(`✅ Base64 conversion completed: ${formatTime(base64Time)}`, colors.green)
    log(`   User image base64: ${formatSize(userImageBase64.length)}`)
    log(`   Glasses image base64: ${formatSize(glassesImageBase64.length)}`)

    // 3. Call Gemini API
    log('\n🚀 Calling Gemini API...', colors.magenta)
    log(`   Prompt length: ${scenario.prompt.length} characters`)
    const apiStartTime = Date.now()

    const result = await model.generateContent([
      scenario.prompt,
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

    const apiCallTime = Date.now() - apiStartTime
    log(`✅ Gemini API responded: ${formatTime(apiCallTime)}`, colors.green)

    // 4. Extract result
    const response = result.response
    const candidates = response.candidates

    if (!candidates || candidates.length === 0) {
      throw new Error("No candidates returned from Gemini API")
    }

    const parts = candidates[0].content.parts
    let resultImageSize = 0

    for (const part of parts) {
      if (part.inlineData) {
        resultImageSize = part.inlineData.data.length
        log(`   Result image size: ${formatSize(resultImageSize)}`)
        break
      }
    }

    if (resultImageSize === 0) {
      throw new Error("No image found in response")
    }

    const totalTime = Date.now() - totalStartTime
    
    log(`\n${'='.repeat(80)}`, colors.cyan)
    log(`⏱️  TOTAL TIME: ${formatTime(totalTime)}`, colors.bright + colors.yellow)
    log('='.repeat(80), colors.cyan)

    return {
      scenario: scenario.name,
      iteration,
      downloadTime,
      base64Time,
      apiCallTime,
      totalTime,
      userImageSize: userImageBuffer.byteLength,
      glassesImageSize: glassesImageBuffer.byteLength,
      resultImageSize,
      success: true
    }

  } catch (error) {
    const totalTime = Date.now() - totalStartTime
    log(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, colors.red)
    
    return {
      scenario: scenario.name,
      iteration,
      downloadTime: 0,
      base64Time: 0,
      apiCallTime: 0,
      totalTime,
      userImageSize: 0,
      glassesImageSize: 0,
      resultImageSize: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

function generateReport(results: PerformanceMetrics[]) {
  log('\n\n' + '='.repeat(80), colors.cyan)
  log('📊 PERFORMANCE TEST REPORT', colors.bright + colors.cyan)
  log('='.repeat(80), colors.cyan)

  // Group by scenario
  const byScenario = results.reduce((acc, result) => {
    if (!acc[result.scenario]) {
      acc[result.scenario] = []
    }
    acc[result.scenario].push(result)
    return acc
  }, {} as Record<string, PerformanceMetrics[]>)

  // Calculate statistics for each scenario
  Object.entries(byScenario).forEach(([scenarioName, scenarioResults]) => {
    log(`\n📋 Scenario: ${scenarioName}`, colors.bright)
    log('-'.repeat(80))

    const successResults = scenarioResults.filter(r => r.success)
    
    if (successResults.length === 0) {
      log('❌ All tests failed', colors.red)
      return
    }

    const avgDownload = successResults.reduce((sum, r) => sum + r.downloadTime, 0) / successResults.length
    const avgBase64 = successResults.reduce((sum, r) => sum + r.base64Time, 0) / successResults.length
    const avgApiCall = successResults.reduce((sum, r) => sum + r.apiCallTime, 0) / successResults.length
    const avgTotal = successResults.reduce((sum, r) => sum + r.totalTime, 0) / successResults.length

    const minApiCall = Math.min(...successResults.map(r => r.apiCallTime))
    const maxApiCall = Math.max(...successResults.map(r => r.apiCallTime))

    log(`Success rate: ${successResults.length}/${scenarioResults.length}`, colors.green)
    log(`\nAverage times:`)
    log(`  Download:        ${formatTime(avgDownload)}`)
    log(`  Base64 convert:  ${formatTime(avgBase64)}`)
    log(`  Gemini API:      ${formatTime(avgApiCall)} ⭐ KEY METRIC`, colors.yellow)
    log(`  Total:           ${formatTime(avgTotal)}`, colors.bright)
    
    log(`\nGemini API range:`)
    log(`  Fastest:         ${formatTime(minApiCall)}`, colors.green)
    log(`  Slowest:         ${formatTime(maxApiCall)}`, colors.red)
  })

  // Overall summary
  log('\n' + '='.repeat(80), colors.cyan)
  log('🎯 10-SECOND TARGET ANALYSIS', colors.bright + colors.cyan)
  log('='.repeat(80), colors.cyan)

  const allSuccess = results.filter(r => r.success)
  if (allSuccess.length > 0) {
    const avgApiCall = allSuccess.reduce((sum, r) => sum + r.apiCallTime, 0) / allSuccess.length
    const avgTotal = allSuccess.reduce((sum, r) => sum + r.totalTime, 0) / allSuccess.length

    log(`\nCurrent performance:`)
    log(`  Average Gemini API time: ${formatTime(avgApiCall)}`)
    log(`  Average total time:      ${formatTime(avgTotal)}`)

    const overhead = avgTotal - avgApiCall
    log(`  Other overhead:          ${formatTime(overhead)}`)

    log(`\nWith optimizations (estimated):`)
    const optimizedOverhead = overhead * 0.5 // Assume 50% reduction in overhead
    const estimatedTotal = avgApiCall + optimizedOverhead
    log(`  Estimated total time:    ${formatTime(estimatedTotal)}`)

    if (estimatedTotal < 10000) {
      log(`\n✅ 10-second target is ACHIEVABLE!`, colors.green + colors.bright)
    } else if (estimatedTotal < 15000) {
      log(`\n⚠️  10-second target is CHALLENGING but possible`, colors.yellow + colors.bright)
    } else {
      log(`\n❌ 10-second target is DIFFICULT to achieve`, colors.red + colors.bright)
      log(`   Consider alternative models or approaches`)
    }
  }

  log('\n' + '='.repeat(80), colors.cyan)
}

// Main execution
async function main() {
  log('🧪 Gemini API Performance Testing Script', colors.bright + colors.cyan)
  log('='.repeat(80), colors.cyan)

  // Check for API key
  if (!GEMINI_API_KEY) {
    log('\n❌ Error: GEMINI_API_KEY environment variable not set', colors.red)
    log('\nPlease set it in your .env.local file or export it:', colors.yellow)
    log('  export GEMINI_API_KEY="your-api-key-here"')
    process.exit(1)
  }

  // Use placeholder images for testing
  const userImageUrl = 'https://via.placeholder.com/800x800/87CEEB/000000?text=User+Photo'
  const glassesImageUrl = 'https://via.placeholder.com/400x400/DDA0DD/000000?text=Glasses'

  log('\n📝 Test Configuration:')
  log(`  Scenarios: ${SCENARIOS.length}`)
  log(`  Iterations per scenario: ${TEST_ITERATIONS}`)
  log(`  Total tests: ${SCENARIOS.length * TEST_ITERATIONS}`)
  log(`  User image: ${userImageUrl}`)
  log(`  Glasses image: ${glassesImageUrl}`)

  const allResults: PerformanceMetrics[] = []

  // Run tests
  for (const scenario of SCENARIOS) {
    for (let i = 0; i < TEST_ITERATIONS; i++) {
      const result = await testGeminiPerformance(userImageUrl, glassesImageUrl, scenario, i)
      allResults.push(result)
      
      // Wait a bit between tests to avoid rate limiting
      if (i < TEST_ITERATIONS - 1) {
        log('\n⏳ Waiting 5 seconds before next test...', colors.yellow)
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
  }

  // Generate report
  generateReport(allResults)

  log('\n✅ Testing completed!', colors.green + colors.bright)
}

// Run the script
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, colors.red)
  process.exit(1)
})

