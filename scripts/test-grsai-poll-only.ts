
import dotenv from "dotenv"
import path from "path"
import fs from "fs"

// Load environment variables
const envLocalPath = path.resolve(process.cwd(), ".env.local")
const envPath = path.resolve(process.cwd(), ".env")

if (fs.existsSync(envLocalPath)) {
  console.log(`Loading environment from ${envLocalPath}`)
  dotenv.config({ path: envLocalPath })
}

const apiKey = process.env.GRSAI_API_KEY || process.env.GEMINI_API_KEY
const baseUrl = (process.env.GEMINI_API_BASE_URL || "https://api.grsai.com").replace(/\/$/, "")

// The Task ID provided by the user from a successful run
const TARGET_TASK_ID = "3-59d02198-0378-4eb0-b5cd-0d7d07738e67"

async function pollResult(taskId: string) {
  const url = `${baseUrl}/v1/draw/result`
  console.log(`\n🔍 Testing Polling via POST to: ${url}`)
  console.log(`   Task ID: ${taskId}`)

  try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            id: taskId
        })
      })

      console.log(`   Response Status: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const text = await response.text()
        console.error(`   ❌ Error Body: ${text}`)
        return
      }

      const data = await response.json()
      console.log("\n✅ Response Data:")
      console.log(JSON.stringify(data, null, 2))

  } catch (err) {
      console.error("❌ Network Error:", err)
  }
}

pollResult(TARGET_TASK_ID)
