// E2E测试：支付升级流程
const { TestEnvironment } = require('../../utils/test-helpers')
const axios = require('axios')

describe('Payment and Upgrade E2E Tests', () => {
  let baseURL
  let authCookies

  beforeAll(async () => {
    await TestEnvironment.waitForServer()
    baseURL = 'http://localhost:3000'
    
    // 登录免费用户
    const csrfResponse = await axios.get(`${baseURL}/api/auth/csrf`)
    const loginResponse = await axios.post(`${baseURL}/api/auth/signin/mock`, {
      userType: 'free',
      csrfToken: csrfResponse.data.csrfToken
    })
    authCookies = loginResponse.headers['set-cookie']?.join('; ') || ''
  }, 60000)

  afterAll(async () => {
    await TestEnvironment.cleanup()
  })

  describe('Pricing Information', () => {
    test('should display pricing plans', async () => {
      const pricingResponse = await axios.get(`${baseURL}/api/pricing`)
      expect(pricingResponse.status).toBe(200)
      expect(pricingResponse.data.plans).toBeDefined()
      expect(pricingResponse.data.plans.length).toBeGreaterThan(0)
      
      // 验证计划包含必要信息
      const plan = pricingResponse.data.plans[0]
      expect(plan.id).toBeDefined()
      expect(plan.name).toBeDefined()
      expect(plan.price).toBeDefined()
      expect(plan.features).toBeDefined()
    }, 30000)

    test('should show current user subscription status', async () => {
      const subscriptionResponse = await axios.get(`${baseURL}/api/subscription`, {
        headers: { 'Cookie': authCookies }
      })
      expect(subscriptionResponse.status).toBe(200)
      expect(subscriptionResponse.data.plan).toBe('free')
      expect(subscriptionResponse.data.usage).toBeDefined()
      expect(subscriptionResponse.data.limits).toBeDefined()
    }, 30000)
  })

  describe('Payment Flow', () => {
    test('should create payment intent for premium upgrade', async () => {
      const paymentResponse = await axios.post(`${baseURL}/api/payment/create-intent`, {
        planId: 'premium',
        priceId: 'price_premium_monthly'
      }, {
        headers: { 'Cookie': authCookies }
      })
      
      expect(paymentResponse.status).toBe(200)
      expect(paymentResponse.data.clientSecret).toBeDefined()
      expect(paymentResponse.data.paymentIntentId).toBeDefined()
    }, 30000)

    test('should handle payment confirmation', async () => {
      // 创建支付意图
      const paymentResponse = await axios.post(`${baseURL}/api/payment/create-intent`, {
        planId: 'premium',
        priceId: 'price_premium_monthly'
      }, {
        headers: { 'Cookie': authCookies }
      })

      // 模拟支付确认
      const confirmResponse = await axios.post(`${baseURL}/api/payment/confirm`, {
        paymentIntentId: paymentResponse.data.paymentIntentId,
        paymentMethodId: 'pm_card_visa' // 测试支付方式
      }, {
        headers: { 'Cookie': authCookies }
      })

      expect(confirmResponse.status).toBe(200)
      expect(confirmResponse.data.success).toBe(true)
    }, 30000)

    test('should update user subscription after successful payment', async () => {
      // 模拟成功支付后的webhook
      const webhookResponse = await axios.post(`${baseURL}/api/webhooks/stripe`, {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            metadata: {
              userId: 'test-user-id',
              planId: 'premium'
            }
          }
        }
      }, {
        headers: {
          'stripe-signature': 'test-signature'
        }
      })

      expect(webhookResponse.status).toBe(200)
    }, 30000)
  })

  describe('Premium Features Access', () => {
    test('should allow unlimited try-ons for premium users', async () => {
      // 登录premium用户
      const csrfResponse = await axios.get(`${baseURL}/api/auth/csrf`)
      const loginResponse = await axios.post(`${baseURL}/api/auth/signin/mock`, {
        userType: 'premium',
        csrfToken: csrfResponse.data.csrfToken
      })
      const premiumCookies = loginResponse.headers['set-cookie']?.join('; ') || ''

      // 验证premium用户限制
      const subscriptionResponse = await axios.get(`${baseURL}/api/subscription`, {
        headers: { 'Cookie': premiumCookies }
      })
      
      expect(subscriptionResponse.data.plan).toBe('premium')
      expect(subscriptionResponse.data.limits.tryOns).toBe(-1) // 无限制
    }, 30000)

    test('should provide access to premium frames', async () => {
      // 登录premium用户
      const csrfResponse = await axios.get(`${baseURL}/api/auth/csrf`)
      const loginResponse = await axios.post(`${baseURL}/api/auth/signin/mock`, {
        userType: 'premium',
        csrfToken: csrfResponse.data.csrfToken
      })
      const premiumCookies = loginResponse.headers['set-cookie']?.join('; ') || ''

      // 获取框架列表
      const framesResponse = await axios.get(`${baseURL}/api/frames`, {
        headers: { 'Cookie': premiumCookies }
      })
      
      expect(framesResponse.status).toBe(200)
      
      // 验证包含premium框架
      const premiumFrames = framesResponse.data.frames.filter(frame => frame.isPremium)
      expect(premiumFrames.length).toBeGreaterThan(0)
    }, 30000)
  })

  describe('Error Handling', () => {
    test('should handle invalid payment methods', async () => {
      try {
        await axios.post(`${baseURL}/api/payment/create-intent`, {
          planId: 'premium',
          priceId: 'invalid_price_id'
        }, {
          headers: { 'Cookie': authCookies }
        })
      } catch (error) {
        expect(error.response.status).toBe(400)
      }
    }, 30000)

    test('should handle payment failures', async () => {
      const paymentResponse = await axios.post(`${baseURL}/api/payment/create-intent`, {
        planId: 'premium',
        priceId: 'price_premium_monthly'
      }, {
        headers: { 'Cookie': authCookies }
      })

      // 模拟支付失败
      try {
        await axios.post(`${baseURL}/api/payment/confirm`, {
          paymentIntentId: paymentResponse.data.paymentIntentId,
          paymentMethodId: 'pm_card_chargeDeclined'
        }, {
          headers: { 'Cookie': authCookies }
        })
      } catch (error) {
        expect(error.response.status).toBe(402)
        expect(error.response.data.error).toContain('declined')
      }
    }, 30000)

    test('should require authentication for payment operations', async () => {
      try {
        await axios.post(`${baseURL}/api/payment/create-intent`, {
          planId: 'premium',
          priceId: 'price_premium_monthly'
        })
      } catch (error) {
        expect(error.response.status).toBe(401)
      }
    }, 30000)
  })

  describe('Subscription Management', () => {
    test('should allow subscription cancellation', async () => {
      // 登录premium用户
      const csrfResponse = await axios.get(`${baseURL}/api/auth/csrf`)
      const loginResponse = await axios.post(`${baseURL}/api/auth/signin/mock`, {
        userType: 'premium',
        csrfToken: csrfResponse.data.csrfToken
      })
      const premiumCookies = loginResponse.headers['set-cookie']?.join('; ') || ''

      // 取消订阅
      const cancelResponse = await axios.post(`${baseURL}/api/subscription/cancel`, {}, {
        headers: { 'Cookie': premiumCookies }
      })
      
      expect(cancelResponse.status).toBe(200)
      expect(cancelResponse.data.success).toBe(true)
    }, 30000)

    test('should show billing history', async () => {
      // 登录premium用户
      const csrfResponse = await axios.get(`${baseURL}/api/auth/csrf`)
      const loginResponse = await axios.post(`${baseURL}/api/auth/signin/mock`, {
        userType: 'premium',
        csrfToken: csrfResponse.data.csrfToken
      })
      const premiumCookies = loginResponse.headers['set-cookie']?.join('; ') || ''

      // 获取账单历史
      const billingResponse = await axios.get(`${baseURL}/api/billing/history`, {
        headers: { 'Cookie': premiumCookies }
      })
      
      expect(billingResponse.status).toBe(200)
      expect(billingResponse.data.invoices).toBeDefined()
    }, 30000)
  })
})
