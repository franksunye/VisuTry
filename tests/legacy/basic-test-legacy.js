// ⚠️ 此文件已被迁移到legacy目录
// 说明: 基础应用启动测试（已被新的测试套件替代）
// 迁移时间: 2025-09-16T05:26:45.582Z
// 新的测试请使用 tests/ 目录下的现代化测试框架

// Basic test to check if the application can start
const { spawn } = require('child_process')
const axios = require('axios')

console.log('🧪 Starting basic application test...')

// Start the dev server
const server = spawn('npm', ['run', 'dev'], {
  stdio: 'pipe',
  shell: true,
  cwd: process.cwd()
})

let serverOutput = ''
let serverStarted = false
let testPort = 3000

server.stdout.on('data', (data) => {
  const output = data.toString()
  serverOutput += output
  console.log('📋 Server output:', output.trim())
  
  // Check if server started successfully
  if (output.includes('Ready in') || output.includes('Local:')) {
    serverStarted = true
    
    // Extract port number if different
    const portMatch = output.match(/localhost:(\d+)/)
    if (portMatch) {
      testPort = parseInt(portMatch[1])
    }
    
    console.log(`✅ Server started on port ${testPort}`)
    
    // Wait a bit then test
    setTimeout(testApplication, 3000)
  }
})

server.stderr.on('data', (data) => {
  const error = data.toString()
  console.log('❌ Server error:', error.trim())
})

async function testApplication() {
  try {
    console.log(`🔍 Testing application at http://localhost:${testPort}...`)
    
    const response = await axios.get(`http://localhost:${testPort}`, {
      timeout: 10000
    })
    
    if (response.status === 200) {
      console.log('✅ Application is responding!')
      console.log('📄 Response length:', response.data.length)
      console.log('🎉 Basic test PASSED!')
    } else {
      console.log('❌ Application returned status:', response.status)
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  } finally {
    // Kill the server
    server.kill()
    process.exit(0)
  }
}

// Timeout after 60 seconds
setTimeout(() => {
  if (!serverStarted) {
    console.log('❌ Server failed to start within 60 seconds')
    console.log('📋 Server output so far:')
    console.log(serverOutput)
    server.kill()
    process.exit(1)
  }
}, 60000)
