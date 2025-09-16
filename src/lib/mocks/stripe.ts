// Mock Stripe Service for Testing
import { isMockMode } from "./index"

export { isMockMode }

export interface MockPaymentSession {
  id: string
  url: string
  status: 'open' | 'complete' | 'expired'
  amount_total: number
  currency: string
  customer_email?: string
  metadata: Record<string, string>
}

export interface MockSubscription {
  id: string
  status: 'active' | 'canceled' | 'past_due'
  current_period_start: number
  current_period_end: number
  customer: string
  items: {
    data: Array<{
      price: {
        id: string
        unit_amount: number
        currency: string
        recurring: {
          interval: 'month' | 'year'
        }
      }
    }>
  }
}

// Mock payment sessions storage
const mockSessions: Map<string, MockPaymentSession> = new Map()
const mockSubscriptions: Map<string, MockSubscription> = new Map()

export class MockStripe {
  checkout = {
    sessions: {
      async create(params: any): Promise<MockPaymentSession> {
        if (!isMockMode) {
          throw new Error("Mock Stripe called in non-mock mode")
        }

        console.log('💳 Mock Stripe: Creating checkout session...')
        console.log('📋 Parameters:', JSON.stringify(params, null, 2))

        const sessionId = `cs_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        const session: MockPaymentSession = {
          id: sessionId,
          url: `http://localhost:3000/mock/checkout/${sessionId}`,
          status: 'open',
          amount_total: params.line_items?.[0]?.price_data?.unit_amount || 999,
          currency: params.currency || 'usd',
          customer_email: params.customer_email,
          metadata: params.metadata || {},
        }

        mockSessions.set(sessionId, session)
        
        console.log('✅ Mock Stripe: Session created:', sessionId)
        return session
      },

      async retrieve(sessionId: string): Promise<MockPaymentSession> {
        if (!isMockMode) {
          throw new Error("Mock Stripe called in non-mock mode")
        }

        const session = mockSessions.get(sessionId)
        if (!session) {
          throw new Error(`Session ${sessionId} not found`)
        }

        return session
      }
    }
  }

  subscriptions = {
    async create(params: any): Promise<MockSubscription> {
      if (!isMockMode) {
        throw new Error("Mock Stripe called in non-mock mode")
      }

      console.log('📅 Mock Stripe: Creating subscription...')
      
      const subscriptionId = `sub_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = Math.floor(Date.now() / 1000)
      
      const subscription: MockSubscription = {
        id: subscriptionId,
        status: 'active',
        current_period_start: now,
        current_period_end: now + (30 * 24 * 60 * 60), // 30 days
        customer: params.customer || 'cus_mock_customer',
        items: {
          data: [{
            price: {
              id: params.items?.[0]?.price || 'price_mock_premium',
              unit_amount: 999,
              currency: 'usd',
              recurring: {
                interval: 'month'
              }
            }
          }]
        }
      }

      mockSubscriptions.set(subscriptionId, subscription)
      
      console.log('✅ Mock Stripe: Subscription created:', subscriptionId)
      return subscription
    },

    async retrieve(subscriptionId: string): Promise<MockSubscription> {
      if (!isMockMode) {
        throw new Error("Mock Stripe called in non-mock mode")
      }

      const subscription = mockSubscriptions.get(subscriptionId)
      if (!subscription) {
        throw new Error(`Subscription ${subscriptionId} not found`)
      }

      return subscription
    },

    async update(subscriptionId: string, params: any): Promise<MockSubscription> {
      if (!isMockMode) {
        throw new Error("Mock Stripe called in non-mock mode")
      }

      const subscription = mockSubscriptions.get(subscriptionId)
      if (!subscription) {
        throw new Error(`Subscription ${subscriptionId} not found`)
      }

      // Update subscription properties
      Object.assign(subscription, params)
      mockSubscriptions.set(subscriptionId, subscription)
      
      console.log('📝 Mock Stripe: Subscription updated:', subscriptionId)
      return subscription
    }
  }

  webhooks = {
    constructEvent(payload: string | Buffer, signature: string, secret: string) {
      if (!isMockMode) {
        throw new Error("Mock Stripe called in non-mock mode")
      }

      console.log('🔗 Mock Stripe: Webhook event received')
      
      // Return a mock webhook event
      return {
        id: `evt_mock_${Date.now()}`,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_mock_session',
            status: 'complete',
            customer_email: 'test@example.com',
            metadata: {
              userId: 'mock-user-1'
            }
          }
        }
      }
    }
  }
}

export const mockStripe = new MockStripe()

// Convenience function for API compatibility
export async function mockCreateCheckoutSession(params: {
  productType: string
  userId: string
  successUrl: string
  cancelUrl: string
}): Promise<MockPaymentSession> {
  return mockStripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{
      price: `price_mock_${params.productType.toLowerCase()}`,
      quantity: 1
    }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      userId: params.userId,
      productType: params.productType
    }
  })
}
