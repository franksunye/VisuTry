
import dotenv from "dotenv"
import path from "path"
import fs from "fs"

// Load environment variables
const envLocalPath = path.resolve(process.cwd(), ".env.local")
const envPath = path.resolve(process.cwd(), ".env")

if (fs.existsSync(envLocalPath)) {
  console.log(`Loading environment from ${envLocalPath}`)
  dotenv.config({ path: envLocalPath })
} else if (fs.existsSync(envPath)) {
  console.log(`Loading environment from ${envPath}`)
  dotenv.config({ path: envPath })
}

const apiKey = process.env.GRSAI_API_KEY || process.env.GEMINI_API_KEY
// Use the GrsAi API base URL, removing any trailing slash
const baseUrl = (process.env.GEMINI_API_BASE_URL || "https://api.grsai.com").replace(/\/$/, "")
const modelName = "nano-banana-fast" // Hardcoded as per user docs

if (!apiKey) {
  console.error("❌ Error: API Key is not set.")
  process.exit(1)
}

// Images to test
const userImagePath = path.resolve(process.cwd(), "public/Cindy Crawford.jpg")
const itemImagePath = path.resolve(process.cwd(), "public/Ray-Ban RB5154 Clubmaster - Browline Black Frame Eyeglasses.jpg")

if (!fs.existsSync(userImagePath) || !fs.existsSync(itemImagePath)) {
  console.error("❌ Error: Test images not found.")
  process.exit(1)
}

// Read images and convert to base64 Data URI
function fileToDataUri(filePath: string): string {
    const buffer = fs.readFileSync(filePath)
    const ext = path.extname(filePath).toLowerCase().replace('.', '')
    const mimeType = ext === 'jpg' ? 'jpeg' : ext
    return `data:image/${mimeType};base64,${buffer.toString('base64')}`
}

const userImageDataUri = fileToDataUri(userImagePath)
const itemImageDataUri = fileToDataUri(itemImagePath)

console.log(`Loaded images. User image size: ${userImageDataUri.length} chars.`)

// GrsAi /v1/draw/nano-banana Payload
const prompt = "Place the glasses naturally on the person’s face in the uploaded photo."
const payload = {
  model: modelName,
  prompt: prompt,
  aspectRatio: "auto", // optional
  imageSize: "1K", // optional
  urls: [
    userImageDataUri,
    itemImageDataUri
  ],
  webHook: "-1", // Request immediate ID return for polling
  shutProgress: false
}

async function submitTask() {
  const url = `${baseUrl}/v1/draw/nano-banana`
  
  console.log(`\n🚀 Submitting Task to: ${url}`)
  
  try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        console.error(`❌ Submission Failed: ${response.status} ${response.statusText}`)
        const text = await response.text()
        console.error(text)
        return null
      }

      const data = await response.json()
      console.log("✅ Response received:")
      console.log(JSON.stringify(data, null, 2))
      
      // Check structure: { code: 0, msg: "success", data: { id: "..." } }
      if (data.code === 0 && data.data && data.data.id) {
        const taskId = data.data.id
        console.log(`🆔 Task ID received: ${taskId}`)
        return taskId
      } else {
        console.log("⚠️ Unexpected response format (No Task ID found).")
        return null
      }
  } catch (err) {
      console.error("❌ Network Error during submission:", err)
      return null
  }
}

async function pollResult(taskId: string) {
  const candidates = [
    `${baseUrl}/v1/draw/result?id=${taskId}`,
    `${baseUrl}/v1beta/draw/result?id=${taskId}`,
    `https://grsai.dakka.com.cn/v1/draw/result?id=${taskId}`, // Original CN domain
    `${baseUrl}/draw/result?id=${taskId}`
  ]
  
  console.log(`\n🔍 Polling Result for Task ID: ${taskId}`)
  console.log(`  Trying candidates: \n  - ${candidates.join('\n  - ')}`)

  // Poll loop
  for (let i = 0; i < 30; i++) { // Try for 60 seconds (30 * 2s)
    let success = false
    
    for (const url of candidates) {
        try {
            // console.log(`Trying: ${url}`)
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                }
            })

            if (response.ok) {
                success = true
                const data = await response.json()
                // console.log(`✅ Connected to ${url}`)
                
                const status = data.status
                console.log(`[${i+1}/30] Status: ${status} | Progress: ${data.progress}%`)

                if (status === 'succeeded' || status === 'SUCCESS') {
                    console.log("\n✅ Task Completed Successfully!")
                    console.log("Results:", JSON.stringify(data.results, null, 2))
                    
                    if (data.results && data.results.length > 0 && data.results[0].url) {
                        console.log(`\n🖼️ Generated Image URL: ${data.results[0].url}`)
                    }
                    return
                } else if (status === 'failed') {
                    console.error("\n❌ Task Failed.")
                    console.error("Reason:", data.failure_reason)
                    console.error("Error:", data.error)
                    return
                }
                
                // If we found a working endpoint, break the candidate loop and wait for next poll
                break 
            }
        } catch (err) {
            // console.error(`Failed to connect to ${url}`)
        }
    }

    if (!success) {
        console.log(`[${i+1}/30] ⚠️ All polling endpoints returned error (likely 404). Retrying...`)
    }

    // Wait 2 seconds before next poll
    await new Promise(r => setTimeout(r, 2000))
  }
  
  console.log("\n⏳ Polling timed out after 60 seconds.")
}

async function run() {
  const taskId = await submitTask()
  if (taskId) {
    await pollResult(taskId)
  } else {
    console.log("\n🏁 Execution finished without Task ID.")
  }
}

run()
