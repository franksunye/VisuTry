// Manual Stripe API Test Script
// Run this with: node tests/manual/stripe-api-test.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test configuration
const tests = {
  passed: 0,
  failed: 0,
  total: 0
};

// Helper function to log test results
function logTest(name, passed, details = '') {
  tests.total++;
  if (passed) {
    tests.passed++;
    console.log(`✅ PASS: ${name}`);
    if (details) console.log(`   ${details}`);
  } else {
    tests.failed++;
    console.log(`❌ FAIL: ${name}`);
    if (details) console.log(`   ${details}`);
  }
}

// Helper function to create mock session cookie
function getMockSessionCookie() {
  // In mock mode, we can use a simple session cookie
  return 'next-auth.session-token=mock-session-token';
}

async function testStripeAPI() {
  console.log('\n🧪 Starting Stripe API Manual Tests\n');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Check if server is running
    console.log('\n📡 Test 1: Server Health Check');
    try {
      const response = await axios.get(`${BASE_URL}`);
      logTest('Server is running', response.status === 200);
    } catch (error) {
      logTest('Server is running', false, `Error: ${error.message}`);
      console.log('\n⚠️  Please start the development server first:');
      console.log('   npm run dev\n');
      return;
    }

    // Test 2: Create checkout session for monthly subscription (without auth)
    console.log('\n💳 Test 2: Create Monthly Subscription Session (No Auth)');
    try {
      const response = await axios.post(
        `${BASE_URL}/api/payment/create-session`,
        {
          productType: 'PREMIUM_MONTHLY',
          successUrl: `${BASE_URL}/success`,
          cancelUrl: `${BASE_URL}/cancel`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      logTest('Should reject without authentication', false, 'Request should have been rejected');
    } catch (error) {
      const isUnauthorized = error.response && error.response.status === 401;
      logTest('Should reject without authentication', isUnauthorized, 
        isUnauthorized ? 'Correctly rejected with 401' : `Got status: ${error.response?.status}`);
    }

    // Test 3: Create checkout session with mock auth
    console.log('\n💳 Test 3: Create Monthly Subscription Session (With Mock Auth)');
    try {
      const response = await axios.post(
        `${BASE_URL}/api/payment/create-session`,
        {
          productType: 'PREMIUM_MONTHLY',
          successUrl: `${BASE_URL}/success`,
          cancelUrl: `${BASE_URL}/cancel`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Cookie': getMockSessionCookie(),
          },
        }
      );
      
      const hasSessionId = response.data.success && response.data.data?.sessionId;
      const hasUrl = response.data.data?.url;
      
      logTest('Create monthly subscription session', hasSessionId && hasUrl,
        hasSessionId ? `Session ID: ${response.data.data.sessionId}` : 'Missing session ID or URL');
        
      if (hasSessionId) {
        console.log(`   Session URL: ${response.data.data.url}`);
      }
    } catch (error) {
      logTest('Create monthly subscription session', false, 
        `Error: ${error.response?.data?.error || error.message}`);
    }

    // Test 4: Create checkout session for yearly subscription
    console.log('\n💳 Test 4: Create Yearly Subscription Session');
    try {
      const response = await axios.post(
        `${BASE_URL}/api/payment/create-session`,
        {
          productType: 'PREMIUM_YEARLY',
          successUrl: `${BASE_URL}/success`,
          cancelUrl: `${BASE_URL}/cancel`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Cookie': getMockSessionCookie(),
          },
        }
      );
      
      const hasSessionId = response.data.success && response.data.data?.sessionId;
      logTest('Create yearly subscription session', hasSessionId,
        hasSessionId ? `Session ID: ${response.data.data.sessionId}` : 'Missing session ID');
    } catch (error) {
      logTest('Create yearly subscription session', false, 
        `Error: ${error.response?.data?.error || error.message}`);
    }

    // Test 5: Create checkout session for credits pack
    console.log('\n💳 Test 5: Create Credits Pack Session');
    try {
      const response = await axios.post(
        `${BASE_URL}/api/payment/create-session`,
        {
          productType: 'CREDITS_PACK',
          successUrl: `${BASE_URL}/success`,
          cancelUrl: `${BASE_URL}/cancel`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Cookie': getMockSessionCookie(),
          },
        }
      );
      
      const hasSessionId = response.data.success && response.data.data?.sessionId;
      logTest('Create credits pack session', hasSessionId,
        hasSessionId ? `Session ID: ${response.data.data.sessionId}` : 'Missing session ID');
    } catch (error) {
      logTest('Create credits pack session', false, 
        `Error: ${error.response?.data?.error || error.message}`);
    }

    // Test 6: Invalid product type
    console.log('\n💳 Test 6: Invalid Product Type');
    try {
      const response = await axios.post(
        `${BASE_URL}/api/payment/create-session`,
        {
          productType: 'INVALID_PRODUCT',
          successUrl: `${BASE_URL}/success`,
          cancelUrl: `${BASE_URL}/cancel`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Cookie': getMockSessionCookie(),
          },
        }
      );
      logTest('Should reject invalid product type', false, 'Request should have been rejected');
    } catch (error) {
      const isBadRequest = error.response && error.response.status === 400;
      logTest('Should reject invalid product type', isBadRequest,
        isBadRequest ? 'Correctly rejected with 400' : `Got status: ${error.response?.status}`);
    }

    // Test 7: Missing required fields
    console.log('\n💳 Test 7: Missing Required Fields');
    try {
      const response = await axios.post(
        `${BASE_URL}/api/payment/create-session`,
        {
          // Missing productType
          successUrl: `${BASE_URL}/success`,
          cancelUrl: `${BASE_URL}/cancel`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Cookie': getMockSessionCookie(),
          },
        }
      );
      logTest('Should reject missing product type', false, 'Request should have been rejected');
    } catch (error) {
      const isBadRequest = error.response && error.response.status === 400;
      logTest('Should reject missing product type', isBadRequest,
        isBadRequest ? 'Correctly rejected with 400' : `Got status: ${error.response?.status}`);
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:');
  console.log(`   Total Tests: ${tests.total}`);
  console.log(`   ✅ Passed: ${tests.passed}`);
  console.log(`   ❌ Failed: ${tests.failed}`);
  console.log(`   Success Rate: ${((tests.passed / tests.total) * 100).toFixed(1)}%\n`);

  if (tests.failed === 0) {
    console.log('🎉 All tests passed!\n');
  } else {
    console.log('⚠️  Some tests failed. Please review the results above.\n');
  }
}

// Run tests
testStripeAPI().catch(console.error);

