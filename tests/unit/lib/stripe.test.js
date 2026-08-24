// Stripe 库函数单元测试

// 设置测试环境为 Mock 模式
process.env.MOCK_MODE = 'true'
process.env.ENABLE_MOCKS = 'true'
process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID = 'price_monthly_placeholder'
process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID = 'price_yearly_placeholder'
process.env.STRIPE_CREDITS_PACK_PRICE_ID = 'price_credits_placeholder'

const {
  createCheckoutSession,
  handleSuccessfulPayment,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  PRODUCTS,
} = require('../../../src/lib/stripe')

describe('Stripe Library Unit Tests', () => {
  let consoleLogSpy

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  describe('Product Configuration', () => {
    test('should have correct product definitions', () => {
      expect(PRODUCTS.PREMIUM_MONTHLY).toBeDefined()
      expect(PRODUCTS.PREMIUM_MONTHLY.name).toBe('Standard - Monthly')
      expect(PRODUCTS.PREMIUM_MONTHLY.price).toBe(899)
      expect(PRODUCTS.PREMIUM_MONTHLY.currency).toBe('usd')
      expect(PRODUCTS.PREMIUM_MONTHLY.interval).toBe('month')

      expect(PRODUCTS.PREMIUM_YEARLY).toBeDefined()
      expect(PRODUCTS.PREMIUM_YEARLY.name).toBe('Standard - Annual')
      expect(PRODUCTS.PREMIUM_YEARLY.price).toBe(8999)
      expect(PRODUCTS.PREMIUM_YEARLY.interval).toBe('year')

      expect(PRODUCTS.CREDITS_PACK).toBeDefined()
      expect(PRODUCTS.CREDITS_PACK.name).toBe('Credits Pack')
      expect(PRODUCTS.CREDITS_PACK.price).toBe(299)
    })

    test('should have price IDs configured', () => {
      expect(PRODUCTS.PREMIUM_MONTHLY.priceId).toBeDefined()
      expect(PRODUCTS.PREMIUM_YEARLY.priceId).toBeDefined()
      expect(PRODUCTS.CREDITS_PACK.priceId).toBeDefined()
    })
  })

  describe('createCheckoutSession', () => {
    test('should create checkout session for monthly subscription', async () => {
      const session = await createCheckoutSession({
        productType: 'PREMIUM_MONTHLY',
        userId: 'test-user-123',
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cancel',
      })

      expect(session).toBeDefined()
      expect(session.id).toBeDefined()
      expect(session.id).toMatch(/^cs_mock_/)
      expect(session.url).toBeDefined()
      expect(session.status).toBe('open')
      expect(session.metadata).toMatchObject({
        userId: 'test-user-123',
        productType: 'PREMIUM_MONTHLY',
      })
    })

    test('should preserve report unlock metadata on subscription checkout', async () => {
      const session = await createCheckoutSession({
        productType: 'PREMIUM_MONTHLY',
        userId: 'test-user-report',
        successUrl: 'http://localhost:3000/en/face-analysis?unlock=success&taskId=analysis-1',
        cancelUrl: 'http://localhost:3000/en/pricing?source=face-analysis-unlock&taskId=analysis-1',
        unlockTaskId: 'analysis-1',
      })

      expect(session.metadata).toMatchObject({
        userId: 'test-user-report',
        productType: 'PREMIUM_MONTHLY',
        unlockTaskId: 'analysis-1',
      })
    })

    test('should create checkout session for yearly subscription', async () => {
      const session = await createCheckoutSession({
        productType: 'PREMIUM_YEARLY',
        userId: 'test-user-456',
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cancel',
      })

      expect(session).toBeDefined()
      expect(session.id).toMatch(/^cs_mock_/)
      expect(session.metadata.productType).toBe('PREMIUM_YEARLY')
    })

    test('should create checkout session for credits pack', async () => {
      const session = await createCheckoutSession({
        productType: 'CREDITS_PACK',
        userId: 'test-user-789',
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cancel',
        customerEmail: 'buyer@example.com',
        checkoutLocale: 'fr',
      })

      expect(session).toBeDefined()
      expect(session.id).toMatch(/^cs_mock_/)
      expect(session.metadata.productType).toBe('CREDITS_PACK')
      expect(session.customer_email).toBe('buyer@example.com')
    })

    test('should throw error if price ID not configured', async () => {
      const originalPriceId = PRODUCTS.PREMIUM_MONTHLY.priceId
      PRODUCTS.PREMIUM_MONTHLY.priceId = undefined

      await expect(
        createCheckoutSession({
          productType: 'PREMIUM_MONTHLY',
          userId: 'test-user',
          successUrl: 'http://localhost:3000/success',
          cancelUrl: 'http://localhost:3000/cancel',
        })
      ).rejects.toThrow('Price ID not configured')

      PRODUCTS.PREMIUM_MONTHLY.priceId = originalPriceId
    })
  })

  describe('handleSuccessfulPayment', () => {
    test('should extract payment data from checkout session', async () => {
      const mockSession = {
        id: 'cs_test_123',
        client_reference_id: 'user-123',
        metadata: {
          productType: 'PREMIUM_MONTHLY',
        },
        amount_total: 999,
        currency: 'usd',
        payment_intent: 'pi_test_123',
      }

      const result = await handleSuccessfulPayment(mockSession)

      expect(result).toEqual({
        userId: 'user-123',
        productType: 'PREMIUM_MONTHLY',
        amount: 999,
        currency: 'usd',
        sessionId: 'cs_test_123',
        paymentIntentId: 'pi_test_123',
        unlockTaskId: undefined,
        attribution: undefined,
      })
    })

    test('should normalize legacy attribution keys from checkout session metadata', async () => {
      const mockSession = {
        id: 'cs_test_attr',
        client_reference_id: 'user-123',
        metadata: {
          productType: 'CREDITS_PACK',
          attribution: JSON.stringify({
            landing_page: '/en/face-shape-detector',
            growth_source: 'seo-cluster',
            medium: 'organic',
            query_cluster: 'face-shape-detector',
            product_path: 'credits_pack',
          }),
        },
        amount_total: 299,
        currency: 'usd',
        payment_intent: 'pi_test_attr',
      }

      const result = await handleSuccessfulPayment(mockSession)

      expect(result.attribution).toEqual({
        landing_page: '/en/face-shape-detector',
        acquisition_source: 'seo-cluster',
        acquisition_medium: 'organic',
        query_cluster: 'face-shape-detector',
        product_path: 'credits_pack',
      })
    })

    test('should attach Stripe billing geo without inferring language', async () => {
      const mockSession = {
        id: 'cs_test_geo',
        client_reference_id: 'user-geo',
        metadata: {
          productType: 'CREDITS_PACK',
          attribution: JSON.stringify({
            browser_language: 'ar-AE',
            landing_locale: 'en',
            pricing_locale: 'en',
            checkout_locale: 'en',
            site_locale: 'en',
          }),
        },
        customer_details: {
          address: { country: 'AE', state: 'Dubai' },
        },
        amount_total: 299,
        currency: 'usd',
        payment_intent: 'pi_test_geo',
      }

      const result = await handleSuccessfulPayment(mockSession)

      expect(result.attribution).toEqual(expect.objectContaining({
        browser_language: 'ar-AE',
        landing_locale: 'en',
        pricing_locale: 'en',
        checkout_locale: 'en',
        site_locale: 'en',
        geo_country: 'AE',
        geo_region: 'Dubai',
      }))
      expect(result.attribution).not.toHaveProperty('language')
    })

    test('should throw error if userId is missing', async () => {
      const mockSession = {
        id: 'cs_test_123',
        metadata: {
          productType: 'PREMIUM_MONTHLY',
        },
        amount_total: 999,
        currency: 'usd',
      }

      await expect(handleSuccessfulPayment(mockSession)).rejects.toThrow(
        'Missing required metadata'
      )
    })

    test('should throw error if productType is missing', async () => {
      const mockSession = {
        id: 'cs_test_123',
        client_reference_id: 'user-123',
        metadata: {},
        amount_total: 999,
        currency: 'usd',
      }

      await expect(handleSuccessfulPayment(mockSession)).rejects.toThrow(
        'Missing required metadata'
      )
    })
  })

  describe('handleSubscriptionCreated', () => {
    test('should extract subscription data', async () => {
      const now = Math.floor(Date.now() / 1000)
      const mockSubscription = {
        id: 'sub_test_123',
        metadata: {
          userId: 'user-123',
          productType: 'PREMIUM_MONTHLY',
        },
        status: 'active',
        current_period_end: now + 30 * 24 * 60 * 60,
      }

      const result = await handleSubscriptionCreated(mockSubscription)

      expect(result).toMatchObject({
        userId: 'user-123',
        productType: 'PREMIUM_MONTHLY',
        subscriptionId: 'sub_test_123',
        status: 'active',
      })
      expect(result.expiresAt).toBeInstanceOf(Date)
    })

    test('should throw error if metadata is missing', async () => {
      const mockSubscription = {
        id: 'sub_test_123',
        metadata: {},
        status: 'active',
        current_period_end: Date.now() / 1000,
      }

      await expect(handleSubscriptionCreated(mockSubscription)).rejects.toThrow(
        'Missing required metadata'
      )
    })
  })

  describe('handleSubscriptionUpdated', () => {
    test('should extract updated subscription data', async () => {
      const now = Math.floor(Date.now() / 1000)
      const mockSubscription = {
        id: 'sub_test_123',
        metadata: {
          userId: 'user-123',
        },
        status: 'active',
        current_period_end: now + 30 * 24 * 60 * 60,
      }

      const result = await handleSubscriptionUpdated(mockSubscription)

      expect(result).toMatchObject({
        userId: 'user-123',
        subscriptionId: 'sub_test_123',
        status: 'active',
      })
      expect(result.expiresAt).toBeInstanceOf(Date)
    })

    test('should throw error if userId is missing', async () => {
      const mockSubscription = {
        id: 'sub_test_123',
        metadata: {},
        status: 'active',
        current_period_end: Date.now() / 1000,
      }

      await expect(handleSubscriptionUpdated(mockSubscription)).rejects.toThrow(
        'Missing userId'
      )
    })
  })

  describe('handleSubscriptionDeleted', () => {
    test('should extract deleted subscription data', async () => {
      const mockSubscription = {
        id: 'sub_test_123',
        metadata: {
          userId: 'user-123',
        },
      }

      const result = await handleSubscriptionDeleted(mockSubscription)

      expect(result).toEqual({
        userId: 'user-123',
        subscriptionId: 'sub_test_123',
      })
    })

    test('should throw error if userId is missing', async () => {
      const mockSubscription = {
        id: 'sub_test_123',
        metadata: {},
      }

      await expect(handleSubscriptionDeleted(mockSubscription)).rejects.toThrow(
        'Missing userId'
      )
    })
  })
})
