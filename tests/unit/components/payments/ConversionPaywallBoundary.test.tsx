import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ConversionPaywallBoundary } from '@/components/payments/ConversionPaywallBoundary'
import { QUOTA_CONFIG } from '@/config/pricing'

const trackCustomEvent = jest.fn()
const trackPaywallViewed = jest.fn()
const trackCreditsPurchaseClick = jest.fn()
const trackPaywallCheckoutStarted = jest.fn()
const trackPaywallCheckoutReturnVerified = jest.fn()
const updateSession = jest.fn()
let mockSessionData: any
let mockLocale = 'en'

jest.mock('next/navigation', () => ({
  useParams: () => ({ locale: mockLocale }),
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
    trackPaywallViewed: (...args: unknown[]) => trackPaywallViewed(...args),
    trackCreditsPurchaseClick: (...args: unknown[]) => trackCreditsPurchaseClick(...args),
    trackPaywallCheckoutStarted: (...args: unknown[]) => trackPaywallCheckoutStarted(...args),
    trackPaywallCheckoutReturnVerified: (...args: unknown[]) => trackPaywallCheckoutReturnVerified(...args),
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
    mockLocale = 'en'
    trackCustomEvent.mockClear()
    trackPaywallViewed.mockClear()
    trackCreditsPurchaseClick.mockClear()
    trackPaywallCheckoutStarted.mockClear()
    trackPaywallCheckoutReturnVerified.mockClear()
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
    expect(screen.getAllByText('$2.99').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('One-time purchase')).toBeInTheDocument()
    expect(screen.getByText('No subscription')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue for $2.99' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View subscription plans/ })).toHaveAttribute('href', '/en/pricing')

    expect(trackPaywallViewed).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'try_on',
        product_type: 'CREDITS_PACK',
        credits_count: QUOTA_CONFIG.CREDITS_PACK,
        required_credits: 1,
        credits_needed: 1,
        price: 2.99,
      }),
    )
  })

  it('shows the live credit shortfall for a 4-credit comparison', () => {
    mockSessionData = {
      user: {
        remainingTrials: 2,
        creditsPurchased: 2,
        creditsUsed: 0,
      },
    }

    render(
      <ConversionPaywallBoundary source="frame_compare">
        <a href="/en/pricing">Get credits for the full 4-frame comparison</a>
      </ConversionPaywallBoundary>,
    )

    fireEvent.click(screen.getByRole('link', { name: /Get credits for the full 4-frame comparison/ }))

    expect(screen.getByTestId('conversion-credit-shortfall')).toHaveTextContent(
      'You’re 2 credits short. This step needs 4; you have 2.',
    )
    expect(trackPaywallViewed).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'frame_compare',
        available_credits: 2,
        required_credits: 4,
        credits_needed: 2,
      }),
    )
  })

  it('uses an explicit required-credit hint when a task needs fewer than four credits', () => {
    mockSessionData = {
      user: {
        remainingTrials: 1,
        creditsPurchased: 1,
        creditsUsed: 0,
      },
    }

    render(
      <ConversionPaywallBoundary source="face_analysis">
        <a
          href="/en/pricing?source=face-analysis-top-picks"
          data-required-credits="3"
        >
          Complete my top picks
        </a>
      </ConversionPaywallBoundary>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Complete my top picks' }))

    expect(screen.getByTestId('conversion-credit-shortfall')).toHaveTextContent(
      'You’re 2 credits short. This step needs 3; you have 1.',
    )
  })

  it('uses decision-expansion copy for Frame Compare', () => {
    render(
      <ConversionPaywallBoundary source="frame_compare">
        <a href="/en/pricing">Get credits</a>
      </ConversionPaywallBoundary>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Get credits' }))

    expect(screen.getByRole('heading', { name: 'Finish your comparison — and keep exploring' })).toBeInTheDocument()
    expect(screen.getByText('Try more frames from the collection')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue for $2.99' })).toBeInTheDocument()
  })

  it('routes Style Explorer credit exhaustion into the compact paywall', () => {
    window.history.replaceState({}, '', '/en/style-explorer?source=face-analysis&taskId=task-style')

    render(
      <ConversionPaywallBoundary source="style_explorer">
        <a href="/en/pricing">Get credits</a>
      </ConversionPaywallBoundary>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Get credits' }))

    expect(screen.getByRole('heading', { name: 'Explore 4 new looks — and keep discovering your style' })).toBeInTheDocument()
    expect(screen.getByText('Explore optical frames and sunglasses')).toBeInTheDocument()
  })

  it('routes Face Analysis Top Picks into the Top Picks purchase context', () => {
    window.history.replaceState({}, '', '/en/face-analysis?taskId=task-top-picks')

    render(
      <ConversionPaywallBoundary source="face_analysis">
        <a href="/en/pricing?source=face-analysis-top-picks">Continue with my top picks</a>
      </ConversionPaywallBoundary>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Continue with my top picks' }))

    expect(screen.getByRole('heading', { name: 'Try your recommended frames — and keep exploring' })).toBeInTheDocument()
    expect(screen.getByText('Try your 4 recommended frames')).toBeInTheDocument()
  })

  it('keeps generic Face Analysis pricing links on the full Pricing page', () => {
    render(
      <ConversionPaywallBoundary source="face_analysis">
        <a href="/en/pricing">Pricing</a>
      </ConversionPaywallBoundary>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Pricing' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('uses a dynamic viewport and a safe-area-aware fixed mobile action bar', () => {
    render(
      <ConversionPaywallBoundary source="try_on">
        <a href="/en/pricing">View Plans</a>
      </ConversionPaywallBoundary>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'View Plans' }))

    expect(screen.getByTestId('conversion-paywall-overlay')).toHaveClass('h-[100dvh]', 'min-h-[100dvh]')
    const actionBar = screen.getByTestId('conversion-paywall-action-bar')
    expect(actionBar).toHaveClass('fixed', 'bottom-0', 'sm:static')
    expect(actionBar).toHaveStyle({ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' })
  })

  it('treats the browser back gesture as close-paywall before leaving the task', async () => {
    render(
      <ConversionPaywallBoundary source="try_on">
        <a href="/en/pricing">View Plans</a>
      </ConversionPaywallBoundary>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'View Plans' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(window.history.state).toEqual(expect.objectContaining({ __visutryConversionPaywall: true }))

    fireEvent.popState(window)

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('localizes new contexts and switches the dialog to RTL for Arabic', () => {
    mockLocale = 'ar'
    window.history.replaceState({}, '', '/ar/style-explorer')

    render(
      <ConversionPaywallBoundary source="style_explorer">
        <a href="/ar/pricing">Get credits</a>
      </ConversionPaywallBoundary>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Get credits' }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('dir', 'rtl')
    expect(screen.getByRole('heading', { name: 'استكشف 4 إطلالات جديدة — وواصل اكتشاف أسلوبك' })).toBeInTheDocument()
    expect(screen.getByText('أنشئ 4 إطلالات Style جديدة')).toBeInTheDocument()
  })

  it('passes the Face Analysis task into Checkout when unlocking the report', async () => {
    window.history.replaceState({}, '', '/en/face-analysis?taskId=task-unlock')
    const fetchMock = global.fetch as jest.Mock
    fetchMock.mockResolvedValue(response(false, { success: false, error: 'test checkout failure' }, 500))

    render(
      <ConversionPaywallBoundary source="face_analysis">
        <a href="/en/pricing?source=face-analysis-unlock&taskId=task-unlock">Unlock report</a>
      </ConversionPaywallBoundary>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Unlock report' }))
    expect(screen.getByRole('heading', { name: 'Unlock your full eyewear report' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Unlock for $2.99' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [, init] = fetchMock.mock.calls[0]
    const body = JSON.parse((init as RequestInit).body as string)

    expect(body.unlockTaskId).toBe('task-unlock')
    expect(body.successUrl).toContain('taskId=task-unlock')
    expect(body.successUrl).toContain('conversion=face_analysis_unlock')
    expect(body.successUrl).toContain('conversion_task_id=task-unlock')
    expect(body.successUrl).toContain('session_id={CHECKOUT_SESSION_ID}')
    expect(await screen.findByText('test checkout failure')).toBeInTheDocument()
  })

  it('does not intercept unrelated links', () => {
    render(
      <ConversionPaywallBoundary source="try_on">
        <a href="/en/dashboard">Dashboard</a>
      </ConversionPaywallBoundary>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Dashboard' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trackPaywallViewed).not.toHaveBeenCalled()
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
    fireEvent.popState(window)

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
    expect(trackPaywallCheckoutReturnVerified).not.toHaveBeenCalled()

    resolveVerification(response(true, {
      success: true,
      status: 'completed',
      data: {
        transactionId: 'cs_test_verified',
        productType: 'CREDITS_PACK',
      },
    }))

    await waitFor(() => {
      expect(trackPaywallCheckoutReturnVerified).toHaveBeenCalledWith(
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
