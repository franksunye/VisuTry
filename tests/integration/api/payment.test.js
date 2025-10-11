// 支付 API 集成测试
const { AuthTestHelper, TestEnvironment } = require('../../utils/test-helpers')
const axios = require('axios')

// 设置测试环境为 Mock 模式
process.env.MOCK_MODE = 'true'
process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID = 'price_test_monthly'
process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID = 'price_test_yearly'
process.env.STRIPE_CREDITS_PACK_PRICE_ID = 'price_test_credits'

describe('Payment API Integration Tests', () => {
  let authHelper
  let baseURL

  beforeAll(async () => {
    // 等待服务器就绪
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

  describe('POST /api/payment/create-session', () => {
    test('should create checkout session for premium monthly subscription', async () => {
      // 登录为免费用户
      await authHelper.performMockLogin('free')

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

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data).toBeDefined()
      expect(response.data.data.sessionId).toBeDefined()
      expect(response.data.data.sessionId).toMatch(/^cs_mock_/)
      expect(response.data.data.url).toBeDefined()
    })

    test('should create checkout session for premium yearly subscription', async () => {
      await authHelper.performMockLogin('free')

      const response = await axios.post(
        `${baseURL}/api/payment/create-session`,
        {
          productType: 'PREMIUM_YEARLY',
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

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.sessionId).toMatch(/^cs_mock_/)
    })

    test('should create checkout session for credits pack', async () => {
      await authHelper.performMockLogin('free')

      const response = await axios.post(
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

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.sessionId).toMatch(/^cs_mock_/)
    })

    test('should reject request without authentication', async () => {
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
        expect(error.response.data.error).toContain('未授权')
      }
    })

    test('should reject invalid product type', async () => {
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
      }
    })

    test('should handle missing required fields', async () => {
      await authHelper.performMockLogin('free')

      try {
        await axios.post(
          `${baseURL}/api/payment/create-session`,
          {
            // Missing productType
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
      }
    })

    test('should work in mock mode without URLs', async () => {
      await authHelper.performMockLogin('free')

      const response = await axios.post(
        `${baseURL}/api/payment/create-session`,
        {
          productType: 'PREMIUM_MONTHLY',
          // No successUrl or cancelUrl in mock mode
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Cookie: authHelper.getCookieHeader(),
          },
        }
      )

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.sessionId).toBeDefined()
    })
  })

  describe('Payment Session Validation', () => {
    test('should create valid session with all required metadata', async () => {
      await authHelper.performMockLogin('free')

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

      expect(response.data.data.sessionId).toBeDefined()
      expect(response.data.data.url).toContain('mock/checkout')
    })

    test('should handle concurrent session creation requests', async () => {
      await authHelper.performMockLogin('free')

      const requests = [
        axios.post(
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
        ),
        axios.post(
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
        ),
      ]

      const responses = await Promise.all(requests)

      responses.forEach((response) => {
        expect(response.status).toBe(200)
        expect(response.data.success).toBe(true)
        expect(response.data.data.sessionId).toBeDefined()
      })

      // Session IDs should be unique
      const sessionIds = responses.map((r) => r.data.data.sessionId)
      expect(new Set(sessionIds).size).toBe(sessionIds.length)
    })
  })
})

