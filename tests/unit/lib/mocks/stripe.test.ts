/** @jest-environment node */

process.env.ENABLE_MOCKS = 'true'

import { mockCreateCheckoutSession } from '@/lib/mocks/stripe'

describe('mockCreateCheckoutSession', () => {
  it('preserves the Face Analysis unlock task in Checkout metadata', async () => {
    const session = await mockCreateCheckoutSession({
      productType: 'CREDITS_PACK',
      userId: 'user-1',
      successUrl: 'http://localhost:3000/en/face-analysis?payment=success',
      cancelUrl: 'http://localhost:3000/en/face-analysis?payment=cancelled',
      unlockTaskId: 'analysis-1',
    })

    expect(session.metadata).toEqual(expect.objectContaining({
      userId: 'user-1',
      productType: 'CREDITS_PACK',
      unlockTaskId: 'analysis-1',
    }))
  })
})
