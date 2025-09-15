#!/usr/bin/env node

/**
 * Integration Test Script for VisuTry
 * Tests all major functionality without external services
 */

const axios = require('axios')
const fs = require('fs')
const path = require('path')

const BASE_URL = 'http://localhost:3000'
const TEST_RESULTS = []

// Test utilities
function log(message, type = 'info') {
  const timestamp = new Date().toISOString()
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[type]
  
  console.log(`${prefix} [${timestamp}] ${message}`)
}

function addTestResult(testName, passed, details = '') {
  TEST_RESULTS.push({
    test: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  })
}

// Test functions
async function testHealthCheck() {
  try {
    log('Testing application health check...')
    const response = await axios.get(`${BASE_URL}/`)
    
    if (response.status === 200) {
      log('Health check passed', 'success')
      addTestResult('Health Check', true, 'Application is responding')
      return true
    } else {
      log(`Health check failed: ${response.status}`, 'error')
      addTestResult('Health Check', false, `Status: ${response.status}`)
      return false
    }
  } catch (error) {
    log(`Health check failed: ${error.message}`, 'error')
    addTestResult('Health Check', false, error.message)
    return false
  }
}

async function testFramesAPI() {
  try {
    log('Testing glasses frames API...')
    const response = await axios.get(`${BASE_URL}/api/frames`)
    
    if (response.status === 200 && response.data.success) {
      const frames = response.data.data
      log(`Frames API passed - Found ${frames.length} frames`, 'success')
      addTestResult('Frames API', true, `${frames.length} frames loaded`)
      return true
    } else {
      log('Frames API failed', 'error')
      addTestResult('Frames API', false, 'API returned error')
      return false
    }
  } catch (error) {
    log(`Frames API failed: ${error.message}`, 'error')
    addTestResult('Frames API', false, error.message)
    return false
  }
}

async function testUploadAPI() {
  try {
    log('Testing file upload API...')
    
    // Create a mock file for testing
    const mockImageData = Buffer.from('mock-image-data')
    const formData = new FormData()
    const blob = new Blob([mockImageData], { type: 'image/jpeg' })
    formData.append('file', blob, 'test-image.jpg')
    
    const response = await axios.post(`${BASE_URL}/api/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    if (response.status === 200 && response.data.success) {
      log('Upload API passed', 'success')
      addTestResult('Upload API', true, 'File upload successful')
      return true
    } else {
      log('Upload API failed', 'error')
      addTestResult('Upload API', false, 'Upload failed')
      return false
    }
  } catch (error) {
    log(`Upload API test skipped: ${error.message}`, 'warning')
    addTestResult('Upload API', false, `Skipped: ${error.message}`)
    return false
  }
}

async function testTryOnAPI() {
  try {
    log('Testing AI try-on API...')
    
    const tryOnData = {
      userImageUrl: 'https://via.placeholder.com/400x400/87CEEB/000000?text=Test+User',
      frameId: 'frame-1'
    }
    
    const response = await axios.post(`${BASE_URL}/api/try-on`, tryOnData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (response.status === 200) {
      log('Try-on API passed', 'success')
      addTestResult('Try-on API', true, 'AI processing initiated')
      return true
    } else {
      log('Try-on API failed', 'error')
      addTestResult('Try-on API', false, 'API returned error')
      return false
    }
  } catch (error) {
    log(`Try-on API failed: ${error.message}`, 'error')
    addTestResult('Try-on API', false, error.message)
    return false
  }
}

async function testPaymentAPI() {
  try {
    log('Testing payment API...')
    
    const paymentData = {
      priceId: 'price_mock_premium',
      userId: 'mock-user-1'
    }
    
    const response = await axios.post(`${BASE_URL}/api/payment/create-session`, paymentData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (response.status === 200 && response.data.url) {
      log('Payment API passed', 'success')
      addTestResult('Payment API', true, 'Payment session created')
      return true
    } else {
      log('Payment API failed', 'error')
      addTestResult('Payment API', false, 'Session creation failed')
      return false
    }
  } catch (error) {
    log(`Payment API failed: ${error.message}`, 'error')
    addTestResult('Payment API', false, error.message)
    return false
  }
}

// Main test runner
async function runTests() {
  log('🧪 Starting VisuTry Integration Tests...')
  log('🔧 Running in mock mode - no external services required')
  
  const tests = [
    testHealthCheck,
    testFramesAPI,
    testUploadAPI,
    testTryOnAPI,
    testPaymentAPI,
  ]
  
  let passedTests = 0
  
  for (const test of tests) {
    try {
      const result = await test()
      if (result) passedTests++
    } catch (error) {
      log(`Test failed with exception: ${error.message}`, 'error')
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  // Generate test report
  log('\n📊 Test Results Summary:')
  log(`✅ Passed: ${passedTests}/${tests.length}`)
  log(`❌ Failed: ${tests.length - passedTests}/${tests.length}`)
  
  // Save detailed results
  const reportPath = path.join(__dirname, '../test-results.json')
  fs.writeFileSync(reportPath, JSON.stringify({
    summary: {
      total: tests.length,
      passed: passedTests,
      failed: tests.length - passedTests,
      timestamp: new Date().toISOString()
    },
    results: TEST_RESULTS
  }, null, 2))
  
  log(`📄 Detailed results saved to: ${reportPath}`)
  
  if (passedTests === tests.length) {
    log('🎉 All tests passed! Your application is ready for production.', 'success')
    process.exit(0)
  } else {
    log('⚠️ Some tests failed. Please check the results above.', 'warning')
    process.exit(1)
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(error => {
    log(`Test runner failed: ${error.message}`, 'error')
    process.exit(1)
  })
}

module.exports = { runTests }
