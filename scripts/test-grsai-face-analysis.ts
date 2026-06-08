import dotenv from 'dotenv'
import path from 'path'
import { buildFaceAnalysisPrompt } from '../src/lib/prompts/face-analysis-prompt'
import { analyzeFaceWithGrsAi } from '../src/lib/grsai-face-analysis'
import { parseFaceAnalysisContent, buildFullResult } from '../src/lib/face-analysis-parser'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

async function main() {
  const prompt = buildFaceAnalysisPrompt()
  const testImageUrl =
    process.env.FACE_ANALYSIS_TEST_IMAGE_URL || 'https://visutry.com/og-image.png'

  console.log('Analyzing face via GrsAi chat API (gemini-3.1-flash-lite)...')
  let imageInput = testImageUrl
  if (process.env.FACE_ANALYSIS_TEST_USE_DATA_URI === '1') {
    const res = await fetch(testImageUrl)
    const buf = Buffer.from(await res.arrayBuffer())
    const mime = res.headers.get('content-type') || 'image/jpeg'
    imageInput = `data:${mime};base64,${buf.toString('base64')}`
    console.log('Image transport: data-uri', `(${Math.round(buf.length / 1024)}KB)`)
  } else {
    console.log('Image transport: url', testImageUrl)
  }

  const content = await analyzeFaceWithGrsAi(imageInput, prompt)
  const parsed = parseFaceAnalysisContent(content)
  const full = buildFullResult(parsed)

  console.log('Parsed result:', parsed)
  console.log('Full result:', full)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
