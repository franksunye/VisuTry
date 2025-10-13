/**
 * Quick Gemini Performance Test
 * 
 * A simplified version for quick testing
 * 
 * Usage:
 *   npx tsx scripts/quick-test.ts
 */

import { GoogleGenerativeAI } from "@google/generative-ai"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

async function quickTest() {
  console.log('🚀 Quick Gemini Performance Test\n')

  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment')
    console.log('\nSet it with:')
    console.log('  export GEMINI_API_KEY="your-key"')
    process.exit(1)
  }

  const totalStart = Date.now()

  try {
    // Initialize
    console.log('1️⃣  Initializing Gemini API...')
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-preview-image-generation",
      generationConfig: {
        // @ts-ignore
        responseModalities: ["IMAGE", "TEXT"]
      }
    })

    // Download test images
    console.log('2️⃣  Downloading test images...')
    const downloadStart = Date.now()
    
    const [userImg, glassesImg] = await Promise.all([
      fetch(userImageUrl),
      fetch(glassesImageUrl)
    ])

    if (!userImg.ok || !glassesImg.ok) {
      throw new Error('Failed to download images')
    }

    const [userBuf, glassesBuf] = await Promise.all([
      userImg.arrayBuffer(),
      glassesImg.arrayBuffer()
    ])

    const downloadTime = Date.now() - downloadStart
    console.log(`   ✅ Downloaded in ${downloadTime}ms`)
    console.log(`   📊 Sizes: ${(userBuf.byteLength/1024).toFixed(1)}KB + ${(glassesBuf.byteLength/1024).toFixed(1)}KB`)

    // Convert to base64
    console.log('3️⃣  Converting to base64...')
    const base64Start = Date.now()
    
    const userB64 = Buffer.from(userBuf).toString('base64')
    const glassesB64 = Buffer.from(glassesBuf).toString('base64')
    
    const base64Time = Date.now() - base64Start
    console.log(`   ✅ Converted in ${base64Time}ms`)

    // Call Gemini API
    console.log('4️⃣  Calling Gemini API...')
    console.log('   ⏳ This is the KEY METRIC - please wait...\n')
    const apiStart = Date.now()

    const result = await model.generateContent([
      "Place these glasses on the person's face naturally.",
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: userB64
        }
      },
      {
        inlineData: {
          mimeType: 'image/png',
          data: glassesB64
        }
      }
    ])

    const apiTime = Date.now() - apiStart
    console.log(`   ✅ Gemini responded in ${apiTime}ms (${(apiTime/1000).toFixed(2)}s)`)

    // Extract result
    const response = result.response
    const candidates = response.candidates

    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts
      for (const part of parts) {
        if (part.inlineData) {
          const resultSize = part.inlineData.data.length
          console.log(`   📊 Result size: ${(resultSize/1024).toFixed(1)}KB`)
          break
        }
      }
    }

    const totalTime = Date.now() - totalStart

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 PERFORMANCE SUMMARY')
    console.log('='.repeat(60))
    console.log(`Download:       ${downloadTime}ms`)
    console.log(`Base64:         ${base64Time}ms`)
    console.log(`Gemini API:     ${apiTime}ms (${(apiTime/1000).toFixed(2)}s) ⭐`)
    console.log(`Total:          ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)`)
    console.log('='.repeat(60))

    // Analysis
    console.log('\n🎯 10-SECOND TARGET ANALYSIS:')
    const overhead = totalTime - apiTime
    console.log(`Current overhead (non-API): ${overhead}ms`)
    console.log(`Gemini API time: ${apiTime}ms`)
    
    // Estimate with optimizations
    const optimizedOverhead = overhead * 0.5 // 50% reduction
    const estimated = apiTime + optimizedOverhead
    console.log(`\nWith optimizations:`)
    console.log(`Estimated total: ${estimated}ms (${(estimated/1000).toFixed(2)}s)`)

    if (estimated < 10000) {
      console.log('\n✅ 10-second target is ACHIEVABLE!')
    } else if (estimated < 15000) {
      console.log('\n⚠️  10-second target is CHALLENGING')
    } else {
      console.log('\n❌ 10-second target is DIFFICULT')
    }

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

quickTest()

