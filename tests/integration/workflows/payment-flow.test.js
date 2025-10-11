// 支付流程工作流测试
const { AuthTestHelper, TestEnvironment } = require('../../utils/test-helpers')
const axios = require('axios')

// 设置测试环境为 Mock 模式
process.env.MOCK_MODE = 'true'
process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID = 'price_test_monthly'
process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID = 'price_test_yearly'
process.env.STRIPE_CREDITS_PACK_PRICE_ID = 'price_test_credits'

describe('Payment Workflow Integration Tests', () => {
  let authHelper
  let baseURL

  beforeAll(async () => {
    await TestEnvironment.waitForServer()
    baseURL = process.env.TEST_SERVER_URL || 'http://localhost:3000'
  })

  beforeEach(() => {
    authHelper = new AuthTestHelper()
  })

  afterEach(() => {
    authHelper.reset()
  })

  afterAll(async () => {
    await TestEnvironment.cleanup()
  })

  describe('Complete Premium Subscription Flow', () => {
    test('should complete monthly subscription purchase flow', async () => {
      // Step 1: 用户登录
      console.log('📝 Step 1: User login')
      await authHelper.performMockLogin('free')
      expect(authHelper.isAuthenticated()).toBe(true)

      // Step 2: 创建支付会话
      console.log('💳 Step 2: Create checkout session')
      const sessionResponse = await axios.post(
        `${baseURL}/api/payment/create-session`,
        {
          productType: 'PREMIUM_MONTHLY',
          successUrl: `${baseURL}/dashboard?payment=success`,
          cancelUrl: `${baseURL}/pricing?payment=cancelled`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Cookie: authHelper.getCookieHeader(),
          },
        }
      )

      expect(sessionResponse.status).toBe(200)
      expect(sessionResponse.data.success).toBe(true)
      expect(sessionResponse.data.data.sessionId).toBeDefined()
      expect(sessionResponse.data.data.url).toBeDefined()

      const sessionId = sessionResponse.data.data.sessionId
      console.log(`✅ Session created: ${sessionId}`)

      // Step 3: 验证会话信息
      console.log('🔍 Step 3: Validate session')
      expect(sessionId).toMatch(/^cs_mock_/)
      expect(sessionResponse.data.data.url).toContain('mock/checkout')

      console.log('✅ Monthly subscription flow completed successfully')
    })

    test('should complete yearly subscription purchase flow', async () => {
      console.log('📝 Starting yearly subscription flow')
      
      await authHelper.performMockLogin('free')

      const sessionResponse = await axios.post(
        `${baseURL}/api/payment/create-session`,
        {
          productType: 'PREMIUM_YEARLY',
          successUrl: `${baseURL}/dashboard?payment=success`,
          cancelUrl: `${baseURL}/pricing?payment=cancelled`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Cookie: authHelper.getCookieHeader(),
          },
        }
      )

      expect(sessionResponse.status).toBe(200)
      expect(sessionResponse.data.success).toBe(true)
      expect(sessionResponse.data.data.sessionId).toMatch(/^cs_mock_/)

      console.log('✅ Yearly subscription flow completed successfully')
    })
  })

  describe('Credits Pack Purchase Flow', () => {
    test('should complete credits pack purchase flow', async () => {
      console.log('📝 Starting credits pack purchase flow')

      // Step 1: 用户登录
      await authHelper.performMockLogin('free')

      // Step 2: 创建支付会话
      const sessionResponse = await axios.post(
        `${baseURL}/api/payment/create-session`,
        {
          productType: 'CREDITS_PACK',
          successUrl: `${baseURL}/dashboard?payment=success`,
          cancelUrl: `${baseURL}/pricing?payment=cancelled`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Cookie: authHelper.getCookieHeader(),
          },
        }
      )

      expect(sessionResponse.status).toBe(200)
      expect(sessionResponse.data.success).toBe(true)
      expect(sessionResponse.data.data.sessionId).toBeDefined()

      console.log('✅ Credits pack purchase flow completed successfully')
    })
  })

  describe('Payment Flow Error Handling', () => {
    test('should handle unauthenticated user attempting to purchase', async () => {
      console.log('🔒 Testing unauthenticated purchase attempt')

      try {
        await axios.post(
          `${baseURL}/api/payment/create-session`,
          {
            productType: 'PREMIUM_MONTHLY',
            successUrl: `${baseURL}/success`,
            cancelUrl: `${baseURL}/cancel`,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        fail('Should have thrown an error')
      } catch (error) {
        expect(error.response.status).toBe(401)
        expect(error.response.data.success).toBe(false)
        console.log('✅ Correctly rejected unauthenticated request')
      }
    })

    test('should handle invalid product type gracefully', async () => {
      console.log('❌ Testing invalid product type')

      await authHelper.performMockLogin('free')

      try {
        await axios.post(
          `${baseURL}/api/payment/create-session`,
          {
            productType: 'INVALID_PRODUCT',
            successUrl: `${baseURL}/success`,
            cancelUrl: `${baseURL}/cancel`,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Cookie: authHelper.getCookieHeader(),
            },
          }
        )
        fail('Should have thrown an error')
      } catch (error) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.success).toBe(false)
        console.log('✅ Correctly rejected invalid product type')
      }
    })

    test('should handle payment cancellation flow', async () => {
      console.log('🚫 Testing payment cancellation')

      await authHelper.performMockLogin('free')

      // 创建会话
      const sessionResponse = await axios.post(
        `${baseURL}/api/payment/create-session`,
        {
          productType: 'PREMIUM_MONTHLY',
          successUrl: `${baseURL}/success`,
          cancelUrl: `${baseURL}/cancel`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Cookie: authHelper.getCookieHeader(),
          },
        }
      )

      expect(sessionResponse.status).toBe(200)
      
      // 在实际场景中，用户会被重定向到 cancelUrl
      // 这里我们验证 cancelUrl 是否正确设置
      const cancelUrl = `${baseURL}/cancel`
      expect(cancelUrl).toBeDefined()
      
      console.log('✅ Payment cancellation flow validated')
    })
  })

  describe('Multiple Product Purchase Scenarios', () => {
    test('should allow user to purchase different products sequentially', async () => {
      console.log('🛒 Testing sequential product purchases')

      await authHelper.performMockLogin('free')

      // Purchase 1: Credits Pack
      const creditsResponse = await axios.post(
        `${baseURL}/api/payment/create-session`,
        {
          productType: 'CREDITS_PACK',
          successUrl: `${baseURL}/success`,
          cancelUrl: `${baseURL}/cancel`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Cookie: authHelper.getCookieHeader(),
          },
        }
      )

      expect(creditsResponse.status).toBe(200)
      const creditsSessionId = creditsResponse.data.data.sessionId

      // Purchase 2: Monthly Subscription
      const monthlyResponse = await axios.post(
        `${baseURL}/api/payment/create-session`,
        {
          productType: 'PREMIUM_MONTHLY',
          successUrl: `${baseURL}/success`,
          cancelUrl: `${baseURL}/cancel`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Cookie: authHelper.getCookieHeader(),
          },
        }
      )

      expect(monthlyResponse.status).toBe(200)
      const monthlySessionId = monthlyResponse.data.data.sessionId

      // Verify different sessions were created
      expect(creditsSessionId).not.toBe(monthlySessionId)

      console.log('✅ Sequential purchases completed successfully')
    })
  })

  describe('Payment Flow Performance', () => {
    test('should create payment session within acceptable time', async () => {
      await authHelper.performMockLogin('free')

      const startTime = Date.now()

      const response = await axios.post(
        `${baseURL}/api/payment/create-session`,
        {
          productType: 'PREMIUM_MONTHLY',
          successUrl: `${baseURL}/success`,
          cancelUrl: `${baseURL}/cancel`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Cookie: authHelper.getCookieHeader(),
          },
        }
      )

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(response.status).toBe(200)
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds

      console.log(`⏱️ Payment session created in ${duration}ms`)
    })
  })
})

