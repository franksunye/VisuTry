/**
 * Realistic Gemini Performance Test
 * 
 * Simulates real-world scenario with actual image sizes:
 * - User photo: 1-3MB (typical smartphone photo)
 * - Glasses image: 100-500KB (product photo)
 * 
 * Tests multiple scenarios to understand performance impact
 */

import { GoogleGenerativeAI } from "@google/generative-ai"
import { createCanvas } from "canvas"
import * as fs from "fs"
import * as path from "path"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// Test scenarios with realistic image sizes
const SCENARIOS = [
  {
    name: "Small Images (Compressed)",
    userSize: { width: 800, height: 800 },    // ~100-200KB after JPEG compression
    glassesSize: { width: 400, height: 400 }, // ~50-100KB
    quality: 0.7
  },
  {
    name: "Medium Images (Typical)",
    userSize: { width: 1200, height: 1200 },  // ~300-500KB
    glassesSize: { width: 600, height: 600 }, // ~150-250KB
    quality: 0.8
  },
  {
    name: "Large Images (Uncompressed)",
    userSize: { width: 2000, height: 2000 },  // ~1-2MB
    glassesSize: { width: 1000, height: 1000 }, // ~500KB-1MB
    quality: 0.9
  }
]

interface TestResult {
  scenario: string
  userImageSize: number
  glassesImageSize: number
  downloadTime: number
  base64Time: number
  apiCallTime: number
  totalTime: number
  resultImageSize: number
}

function createRealisticImage(width: number, height: number, type: 'user' | 'glasses'): Buffer {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  if (type === 'user') {
    // Simulate a face photo with gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#FFE5B4')  // Peach (skin tone)
    gradient.addColorStop(0.5, '#FFDAB9') // Peach puff
    gradient.addColorStop(1, '#FFE4C4')  // Bisque
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Add some "facial features" (circles to simulate complexity)
    ctx.fillStyle = '#8B4513' // Brown for eyes
    ctx.beginPath()
    ctx.arc(width * 0.35, height * 0.4, width * 0.05, 0, Math.PI * 2)
    ctx.arc(width * 0.65, height * 0.4, width * 0.05, 0, Math.PI * 2)
    ctx.fill()

    // Add noise to simulate photo texture
    const imageData = ctx.getImageData(0, 0, width, height)
    for (let i = 0; i < imageData.data.length; i += 4) {
      const noise = Math.random() * 20 - 10
      imageData.data[i] += noise     // R
      imageData.data[i + 1] += noise // G
      imageData.data[i + 2] += noise // B
    }
    ctx.putImageData(imageData, 0, 0)

  } else {
    // Simulate glasses with transparent background
    ctx.fillStyle = 'rgba(255, 255, 255, 0)' // Transparent
    ctx.fillRect(0, 0, width, height)

    // Draw glasses frames
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = width * 0.02

    // Left lens
    ctx.beginPath()
    ctx.arc(width * 0.3, height * 0.5, width * 0.15, 0, Math.PI * 2)
    ctx.stroke()

    // Right lens
    ctx.beginPath()
    ctx.arc(width * 0.7, height * 0.5, width * 0.15, 0, Math.PI * 2)
    ctx.stroke()

    // Bridge
    ctx.beginPath()
    ctx.moveTo(width * 0.45, height * 0.5)
    ctx.lineTo(width * 0.55, height * 0.5)
    ctx.stroke()

    // Temples
    ctx.beginPath()
    ctx.moveTo(width * 0.15, height * 0.5)
    ctx.lineTo(width * 0.05, height * 0.45)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(width * 0.85, height * 0.5)
    ctx.lineTo(width * 0.95, height * 0.45)
    ctx.stroke()
  }

  return canvas.toBuffer('image/jpeg', { quality: 0.8 })
}

async function testScenario(scenario: typeof SCENARIOS[0]): Promise<TestResult> {
  console.log('\n' + '='.repeat(80))
  console.log(`📋 Testing: ${scenario.name}`)
  console.log('='.repeat(80))

  const totalStart = Date.now()

  try {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not found")
    }

    // 1. Generate realistic test images
    console.log('\n1️⃣  Generating realistic test images...')
    const genStart = Date.now()
    
    const userImageBuffer = createRealisticImage(
      scenario.userSize.width,
      scenario.userSize.height,
      'user'
    )
    const glassesImageBuffer = createRealisticImage(
      scenario.glassesSize.width,
      scenario.glassesSize.height,
      'glasses'
    )

    const genTime = Date.now() - genStart
    console.log(`   ✅ Generated in ${genTime}ms`)
    console.log(`   📊 User image: ${(userImageBuffer.length / 1024).toFixed(1)}KB (${scenario.userSize.width}x${scenario.userSize.height})`)
    console.log(`   📊 Glasses image: ${(glassesImageBuffer.length / 1024).toFixed(1)}KB (${scenario.glassesSize.width}x${scenario.glassesSize.height})`)

    // 2. Convert to base64 (simulating what happens in the real app)
    console.log('\n2️⃣  Converting to base64...')
    const base64Start = Date.now()
    
    const userImageBase64 = userImageBuffer.toString('base64')
    const glassesImageBase64 = glassesImageBuffer.toString('base64')
    
    const base64Time = Date.now() - base64Start
    console.log(`   ✅ Converted in ${base64Time}ms`)
    console.log(`   📊 Base64 sizes: ${(userImageBase64.length / 1024).toFixed(1)}KB + ${(glassesImageBase64.length / 1024).toFixed(1)}KB`)

    // 3. Call Gemini API
    console.log('\n3️⃣  Calling Gemini API...')
    console.log('   ⏳ This is the KEY METRIC - please wait...\n')
    
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-preview-image-generation",
      generationConfig: {
        // @ts-ignore
        responseModalities: ["IMAGE", "TEXT"]
      }
    })

    const apiStart = Date.now()

    const result = await model.generateContent([
      "Place these glasses on the person's face naturally. Match lighting and perspective.",
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: userImageBase64
        }
      },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: glassesImageBase64
        }
      }
    ])

    const apiTime = Date.now() - apiStart
    console.log(`   ✅ Gemini API responded in ${apiTime}ms (${(apiTime / 1000).toFixed(2)}s)`)

    // 4. Extract result
    const response = result.response
    const candidates = response.candidates

    let resultImageSize = 0
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts
      for (const part of parts) {
        if (part.inlineData) {
          resultImageSize = part.inlineData.data.length
          console.log(`   📊 Result image size: ${(resultImageSize / 1024).toFixed(1)}KB`)
          break
        }
      }
    }

    const totalTime = Date.now() - totalStart

    // Summary
    console.log('\n' + '='.repeat(80))
    console.log('⏱️  TIMING BREAKDOWN')
    console.log('='.repeat(80))
    console.log(`Image generation:  ${genTime}ms`)
    console.log(`Base64 conversion: ${base64Time}ms`)
    console.log(`Gemini API call:   ${apiTime}ms (${(apiTime / 1000).toFixed(2)}s) ⭐`)
    console.log(`Total time:        ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`)
    console.log('='.repeat(80))

    return {
      scenario: scenario.name,
      userImageSize: userImageBuffer.length,
      glassesImageSize: glassesImageBuffer.length,
      downloadTime: 0, // Not applicable in this test
      base64Time,
      apiCallTime: apiTime,
      totalTime,
      resultImageSize
    }

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error)
    throw error
  }
}

function generateReport(results: TestResult[]) {
  console.log('\n\n' + '='.repeat(80))
  console.log('📊 REALISTIC PERFORMANCE TEST REPORT')
  console.log('='.repeat(80))

  console.log('\n📋 Test Results Summary:\n')

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.scenario}`)
    console.log(`   Input sizes: ${(result.userImageSize / 1024).toFixed(1)}KB + ${(result.glassesImageSize / 1024).toFixed(1)}KB`)
    console.log(`   Gemini API: ${result.apiCallTime}ms (${(result.apiCallTime / 1000).toFixed(2)}s) ⭐`)
    console.log(`   Total time: ${result.totalTime}ms (${(result.totalTime / 1000).toFixed(2)}s)`)
    console.log(`   Result size: ${(result.resultImageSize / 1024).toFixed(1)}KB`)
    console.log('')
  })

  // Analysis
  console.log('='.repeat(80))
  console.log('🎯 PERFORMANCE ANALYSIS')
  console.log('='.repeat(80))

  const avgApiTime = results.reduce((sum, r) => sum + r.apiCallTime, 0) / results.length
  const minApiTime = Math.min(...results.map(r => r.apiCallTime))
  const maxApiTime = Math.max(...results.map(r => r.apiCallTime))

  console.log(`\nGemini API Performance:`)
  console.log(`  Average: ${avgApiTime.toFixed(0)}ms (${(avgApiTime / 1000).toFixed(2)}s)`)
  console.log(`  Fastest: ${minApiTime}ms (${(minApiTime / 1000).toFixed(2)}s)`)
  console.log(`  Slowest: ${maxApiTime}ms (${(maxApiTime / 1000).toFixed(2)}s)`)

  // Impact of image size
  console.log(`\n📊 Image Size Impact:`)
  results.forEach(result => {
    const totalInputSize = result.userImageSize + result.glassesImageSize
    const timePerKB = result.apiCallTime / (totalInputSize / 1024)
    console.log(`  ${result.scenario}: ${timePerKB.toFixed(0)}ms per KB`)
  })

  // Real-world estimation
  console.log('\n' + '='.repeat(80))
  console.log('🌍 REAL-WORLD SCENARIO ESTIMATION')
  console.log('='.repeat(80))

  const mediumResult = results[1] // Use medium scenario as baseline
  
  console.log(`\nBased on "${mediumResult.scenario}" scenario:`)
  console.log(`\nComplete flow breakdown:`)
  console.log(`  1. Frontend upload:        1500ms  (user uploads to backend)`)
  console.log(`  2. Backend upload to Blob: 1500ms  (save to Vercel Blob)`)
  console.log(`  3. Download from Blob:     500ms   (parallel download)`)
  console.log(`  4. Base64 conversion:      ${mediumResult.base64Time}ms`)
  console.log(`  5. Gemini API call:        ${mediumResult.apiCallTime}ms  ⭐ KEY`)
  console.log(`  6. Upload result to Blob:  1000ms  (save generated image)`)
  console.log(`  7. Update database:        100ms`)
  console.log(`  8. Frontend polling:       500ms   (1s interval)`)
  console.log(`  ` + '-'.repeat(40))
  
  const estimatedTotal = 1500 + 1500 + 500 + mediumResult.base64Time + mediumResult.apiCallTime + 1000 + 100 + 500
  console.log(`  TOTAL ESTIMATED:           ${estimatedTotal}ms (${(estimatedTotal / 1000).toFixed(2)}s)`)

  console.log('\n🎯 10-SECOND TARGET:')
  if (estimatedTotal < 10000) {
    console.log(`  ✅ ACHIEVABLE! (${((10000 - estimatedTotal) / 1000).toFixed(2)}s margin)`)
  } else if (estimatedTotal < 12000) {
    console.log(`  ⚠️  CHALLENGING (${((estimatedTotal - 10000) / 1000).toFixed(2)}s over target)`)
  } else {
    console.log(`  ❌ DIFFICULT (${((estimatedTotal - 10000) / 1000).toFixed(2)}s over target)`)
  }

  console.log('\n💡 RECOMMENDATIONS:')
  if (maxApiTime > 8000) {
    console.log('  ⚠️  Large images significantly slow down Gemini API')
    console.log('  🔧 STRONGLY recommend image compression:')
    console.log('     - Resize to max 1200x1200')
    console.log('     - Quality 80-85%')
    console.log('     - Expected savings: 2-4 seconds')
  } else if (avgApiTime > 5000) {
    console.log('  ✅ Performance is good')
    console.log('  🔧 Optional: Compress images to improve further')
  } else {
    console.log('  ✅ Excellent performance!')
    console.log('  🎉 No urgent optimizations needed')
  }

  console.log('\n' + '='.repeat(80))
}

async function main() {
  console.log('🧪 Realistic Gemini Performance Test')
  console.log('Testing with actual image sizes from real-world usage\n')

  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found')
    console.log('\nSet it with:')
    console.log('  export GEMINI_API_KEY="your-key"')
    process.exit(1)
  }

  const results: TestResult[] = []

  for (const scenario of SCENARIOS) {
    try {
      const result = await testScenario(scenario)
      results.push(result)
      
      // Wait between tests
      if (scenario !== SCENARIOS[SCENARIOS.length - 1]) {
        console.log('\n⏳ Waiting 5 seconds before next test...')
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    } catch (error) {
      console.error(`Failed to test scenario: ${scenario.name}`)
    }
  }

  if (results.length > 0) {
    generateReport(results)
  }

  console.log('\n✅ Testing completed!')
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message)
  process.exit(1)
})

