// ⚠️ 此文件已被迁移到legacy目录
// 说明: 完整的认证API测试（已被新的集成测试替代）
// 迁移时间: 2025-09-16T05:26:45.571Z
// 新的测试请使用 tests/ 目录下的现代化测试框架

// Complete Authenticated APIs Test Script
const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')

const BASE_URL = 'http://localhost:3000'

class AuthenticatedTester {
  constructor() {
    this.cookies = ''
    this.csrfToken = ''
    this.sessionData = null
  }

  // Step 1: Get CSRF token
  async getCsrfToken() {
    console.log('📋 Getting CSRF token...')
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/csrf`)
      this.csrfToken = response.data.csrfToken
      
      // Store cookies from CSRF request
      if (response.headers['set-cookie']) {
        this.cookies = response.headers['set-cookie'].join('; ')
      }
      
      console.log('✅ CSRF token obtained:', this.csrfToken.substring(0, 20) + '...')
      return true
    } catch (error) {
      console.error('❌ Failed to get CSRF token:', error.message)
      return false
    }
  }

  // Step 2: Perform Mock login
  async performMockLogin(userType = 'free') {
    console.log(`📋 Performing Mock login as ${userType} user...`)
    try {
      // Prepare login data
      const loginData = new URLSearchParams({
        email: userType === 'premium' ? 'premium@example.com' : 'test@example.com',
        type: userType,
        csrfToken: this.csrfToken,
        callbackUrl: `${BASE_URL}/`,
        json: 'true'
      })

      const response = await axios.post(
        `${BASE_URL}/api/auth/callback/mock-credentials`,
        loginData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': this.cookies
          },
          maxRedirects: 0,
          validateStatus: function (status) {
            return status >= 200 && status < 400;
          }
        }
      )

      // Update cookies with login response
      if (response.headers['set-cookie']) {
        const newCookies = response.headers['set-cookie'].join('; ')
        this.cookies = this.cookies ? `${this.cookies}; ${newCookies}` : newCookies
      }

      console.log('✅ Mock login completed, status:', response.status)
      return true
    } catch (error) {
      console.error('❌ Mock login failed:', error.message)
      return false
    }
  }

  // Step 3: Verify session
  async verifySession() {
    console.log('📋 Verifying session...')
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/session`, {
        headers: {
          'Cookie': this.cookies
        }
      })

      this.sessionData = response.data
      console.log('✅ Session verified:', JSON.stringify(this.sessionData, null, 2))
      
      return Object.keys(this.sessionData).length > 0
    } catch (error) {
      console.error('❌ Session verification failed:', error.message)
      return false
    }
  }

  // Test authenticated APIs
  async testUploadAPI() {
    console.log('📋 Testing Upload API with authentication...')
    try {
      // Create a simple test file
      const testContent = 'This is a test image file content'
      const form = new FormData()
      form.append('file', Buffer.from(testContent), {
        filename: 'test-image.jpg',
        contentType: 'image/jpeg'
      })

      const response = await axios.post(`${BASE_URL}/api/upload`, form, {
        headers: {
          ...form.getHeaders(),
          'Cookie': this.cookies
        }
      })

      console.log('✅ Upload API test passed:', response.status)
      console.log('📋 Upload response:', JSON.stringify(response.data, null, 2))
      return true
    } catch (error) {
      console.log('❌ Upload API test failed:', error.response?.status, error.response?.data || error.message)
      return false
    }
  }

  async testTryOnAPI() {
    console.log('📋 Testing Try-On API with authentication...')
    try {
      const tryOnData = new FormData()
      tryOnData.append('userImage', Buffer.from('fake image data'), {
        filename: 'user.jpg',
        contentType: 'image/jpeg'
      })
      tryOnData.append('frameId', 'frame-1')

      const response = await axios.post(`${BASE_URL}/api/try-on`, tryOnData, {
        headers: {
          ...tryOnData.getHeaders(),
          'Cookie': this.cookies
        }
      })

      console.log('✅ Try-On API test passed:', response.status)
      console.log('📋 Try-On response:', JSON.stringify(response.data, null, 2))
      return true
    } catch (error) {
      console.log('❌ Try-On API test failed:', error.response?.status, error.response?.data || error.message)
      return false
    }
  }

  async testPaymentAPI() {
    console.log('📋 Testing Payment API with authentication...')
    try {
      const paymentData = {
        priceId: 'price_mock_premium'
      }

      const response = await axios.post(`${BASE_URL}/api/payment/create-session`, paymentData, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': this.cookies
        }
      })

      console.log('✅ Payment API test passed:', response.status)
      console.log('📋 Payment response:', JSON.stringify(response.data, null, 2))
      return true
    } catch (error) {
      console.log('❌ Payment API test failed:', error.response?.status, error.response?.data || error.message)
      return false
    }
  }

  async testTryOnHistoryAPI() {
    console.log('📋 Testing Try-On History API with authentication...')
    try {
      const response = await axios.get(`${BASE_URL}/api/try-on/history`, {
        headers: {
          'Cookie': this.cookies
        }
      })

      console.log('✅ Try-On History API test passed:', response.status)
      console.log('📋 History response:', JSON.stringify(response.data, null, 2))
      return true
    } catch (error) {
      console.log('❌ Try-On History API test failed:', error.response?.status, error.response?.data || error.message)
      return false
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🧪 Starting Complete Authenticated API Tests...\n')

    // Step 1: Setup authentication
    if (!await this.getCsrfToken()) return false
    if (!await this.performMockLogin('free')) return false
    if (!await this.verifySession()) {
      console.log('⚠️ Session verification failed, but continuing with tests...')
    }

    console.log('\n🔐 Testing Authenticated APIs...\n')

    // Step 2: Test all authenticated APIs
    const tests = [
      { name: 'Upload API', test: () => this.testUploadAPI() },
      { name: 'Try-On API', test: () => this.testTryOnAPI() },
      { name: 'Payment API', test: () => this.testPaymentAPI() },
      { name: 'Try-On History API', test: () => this.testTryOnHistoryAPI() }
    ]

    let passedTests = 0
    for (const { name, test } of tests) {
      console.log(`\n--- Testing ${name} ---`)
      if (await test()) {
        passedTests++
      }
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait between tests
    }

    console.log('\n📊 Test Results Summary:')
    console.log(`✅ Passed: ${passedTests}/${tests.length}`)
    console.log(`❌ Failed: ${tests.length - passedTests}/${tests.length}`)

    return passedTests === tests.length
  }
}

// Run the tests
async function main() {
  const tester = new AuthenticatedTester()
  const success = await tester.runAllTests()
  
  if (success) {
    console.log('\n🎉 All authenticated API tests passed!')
  } else {
    console.log('\n⚠️ Some authenticated API tests failed!')
  }
  
  process.exit(success ? 0 : 1)
}

main().catch(console.error)
