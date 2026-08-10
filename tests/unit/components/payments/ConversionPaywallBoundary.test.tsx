import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ConversionPaywallBoundary } from '@/components/payments/ConversionPaywallBoundary'
import { QUOTA_CONFIG } from '@/config/pricing'

const trackCustomEvent = jest.fn()
const updateSession = jest.fn()
let mockSessionData: any

jest.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
}))

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: mockSessionData,
    update: updateSession,
  }),
}))

jest.mock('@/lib/analytics', () => ({
  analytics: {
    trackCustomEvent: (...args: unknown[]) => trackCustomEvent(...args),
  },
  getAcquisitionContext: () => ({
    landing_page: '/en/try-on/glasses',
    page_path: '/en/try-on/glasses',
    landing_locale: 'en',
  }),
}))

function response(ok: boolean, payload: unknown, status = ok ? 200 : 500) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(payload),
  } as any
}

describe('ConversionPaywallBoundary', () => {
  const originalFetch = global.fetch
  const originalIndexedDb = window.indexedDB

  beforeEach(() => {
    trackCustomEvent.mockClear()
    updateSession.mockReset()
    mockSessionData = {
      user: {
        remainingTrials: 0,
        creditsPurchased: 0,
        creditsUsed: 0,
      },
    }
    window.sessionStorage.clear()
    window.history.replaceState({}, '', '/en/try-on/glasses')
    global.fetch = jest.fn() as any
  })

  afterEach(() => {
    global.fetch = originalFetch
    Object.defineProperty(window, 'indexedDB', {
      configurable: true,
      value: originalIndexedDb,
    })
  })

  it('intercepts a pricing CTA and presents the one-time credits pack first', () => {
    render(
      <ConversionPaywallBoundary source="try_on">
        <a href="/en/pricing">View Plans</a>
      </ConversionPaywallBoundary>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'View Plans' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Keep trying' })).toBeInTheDocument()
    expect(screen.getByText(`${QUOTA_CONFIG.CREDITS_PACK} Decision Credits`)).toBeInTheDocument()
    expect(screen.getByText('$2.99')).toBeInTheDocument()
    expect(screen.getByText('One-time purchase')).toBeInTheDocument()
    expect(screen.getByText('No subscription')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue for $2.99' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View subscription plans/ })).toHaveAttribute('href', '/en/pricing')

    expect(trackCustomEvent).toHaveBeenCalledWith(
      'paywall_view',
      expect.objectContaining({
        source: 'try_on',
        product_type: 'CREDITS_PACK',
        credits_count: QUOTA_CONFIG.CREDITS_PACK,
        price: 2.99,
      }),
    )
  })

  it('uses comparison-specific copy for Frame Compare', () => {
    render(
      <ConversionPaywallBoundary source="frame_compare">
        <a href="/en/pricing">Get credits</a>
      </ConversionPaywallBoundary>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Get credits' }))

    expect(screen.getByRole('heading', { name: 'Keep comparing your options' })).toBeInTheDocument()
    expect(screen.getByText('Compare more frames')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue for $2.99' })).toBeInTheDocument()
  })

  it('does not intercept unrelated links', () => {
    render(
      <ConversionPaywallBoundary source="try_on">
        <a href="/en/dashboard">Dashboard</a>
      </ConversionPaywallBoundary>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Dashboard' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trackCustomEvent).not.toHaveBeenCalledWith('paywall_view', expect.anything())
  })

  it('starts the Checkout API request even when IndexedDB never responds', async () => {
    Object.defineProperty(window, 'indexedDB', {
      configurable: true,
      value: {
        open: jest.fn(() => ({})),
      },
    })

    const fetchMock = global.fetch as jest.Mock
    fetchMock.mockResolvedValue(response(false, { success: false, error: 'test checkout failure' }, 500))

    render(
      <ConversionPaywallBoundary source="try_on">
        <a href="/en/pricing">View Plans</a>
      </ConversionPaywallBoundary>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'View Plans' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue for $2.99' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/payment/create-session',
        expect.objectContaining({ method: 'POST' }),
      )
    })

    expect(await screen.findByText('test checkout failure')).toBeInTheDocument()
  })

  it('lets the customer cancel a Checkout request that is still pending', async () => {
    const fetchMock = global.fetch as jest.Mock
    fetchMock.mockImplementation((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    }))

    render(
      <ConversionPaywallBoundary source="try_on">
        <a href="/en/pricing">View Plans</a>
      </ConversionPaywallBoundary>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'View Plans' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue for $2.99' }))

    const closeButton = screen.getByRole('dialog').querySelector('button[aria-label="Close"]')
    expect(closeButton).not.toBeDisabled()
    fireEvent.click(closeButton!)

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect((fetchMock.mock.calls[0][1] as RequestInit).signal?.aborted).toBe(true)
  })

  it('uses a unique persisted-context key for every Checkout attempt', async () => {
    const fetchMock = global.fetch as jest.Mock
    fetchMock.mockResolvedValue(response(false, { success: false, error: 'retryable' }, 500))

    render(
      <ConversionPaywallBoundary source="try_on">
        <a href="/en/pricing">View Plans</a>
      </ConversionPaywallBoundary>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'View Plans' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue for $2.99' }))
    await screen.findByText('retryable')
    fireEvent.click(screen.getByRole('button', { name: 'Continue for $2.99' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    const attempts = fetchMock.mock.calls.map(([, init]) => {
      const body = JSON.parse((init as RequestInit).body as string)
      return new URL(body.cancelUrl).searchParams.get('conversion_attempt')
    })
    expect(attempts[0]).toBeTruthy()
    expect(attempts[1]).toBeTruthy()
    expect(attempts[0]).not.toBe(attempts[1])
  })

  it('does not report Checkout completed until the server verifies the Payment row', async () => {
    window.sessionStorage.setItem(
      'visutry_conversion_context_try_on',
      JSON.stringify({
        source: 'try_on',
        pathname: '/en/try-on/glasses',
        createdAt: Date.now(),
        creditsBalanceBefore: 0,
        selectedFrameIds: [],
      }),
    )
    window.history.replaceState(
      {},
      '',
      '/en/try-on/glasses?payment=success&conversion=try_on&session_id=cs_test_verified',
    )

    let resolveVerification: (value: any) => void = () => undefined
    const verificationPromise = new Promise((resolve) => {
      resolveVerification = resolve
    })
    const fetchMock = global.fetch as jest.Mock
    fetchMock.mockReturnValueOnce(verificationPromise)
    updateSession.mockResolvedValue({
      user: {
        remainingTrials: 30,
        creditsPurchased: 30,
        creditsUsed: 0,
      },
    })

    render(
      <ConversionPaywallBoundary source="try_on">
        <div>Try-on workflow</div>
      </ConversionPaywallBoundary>,
    )

    expect(await screen.findByText('Confirming payment')).toBeInTheDocument()
    expect(trackCustomEvent).not.toHaveBeenCalledWith('checkout_completed', expect.anything())

    resolveVerification(response(true, {
      success: true,
      status: 'completed',
      data: {
        transactionId: 'cs_test_verified',
        productType: 'CREDITS_PACK',
      },
    }))

    await waitFor(() => {
      expect(trackCustomEvent).toHaveBeenCalledWith(
        'checkout_completed',
        expect.objectContaining({
          checkout_session_id: 'cs_test_verified',
          product_type: 'CREDITS_PACK',
        }),
      )
    })
    expect(await screen.findByText('Credits added')).toBeInTheDocument()
  })

  it('never auto-starts Frame Compare after payment verification', async () => {
    window.sessionStorage.setItem(
      'visutry_conversion_context_frame_compare',
      JSON.stringify({
        source: 'frame_compare',
        pathname: '/en/try-on/glasses/compare',
        createdAt: Date.now(),
        creditsBalanceBefore: 0,
        selectedFrameIds: [],
      }),
    )
    window.history.replaceState(
      {},
      '',
      '/en/try-on/glasses/compare?payment=success&conversion=frame_compare&session_id=cs_test_compare',
    )

    const fetchMock = global.fetch as jest.Mock
    fetchMock.mockResolvedValue(response(true, {
      success: true,
      status: 'completed',
      data: {
        transactionId: 'cs_test_compare',
        productType: 'CREDITS_PACK',
      },
    }))
    updateSession.mockResolvedValue({
      user: {
        remainingTrials: 30,
        creditsPurchased: 30,
        creditsUsed: 0,
      },
    })
    const generate = jest.fn()

    render(
      <ConversionPaywallBoundary source="frame_compare">
        <button type="button" onClick={generate}>Try 4 Frames</button>
      </ConversionPaywallBoundary>,
    )

    expect(await screen.findByText('Credits added')).toBeInTheDocument()
    expect(generate).not.toHaveBeenCalled()
  })
})
