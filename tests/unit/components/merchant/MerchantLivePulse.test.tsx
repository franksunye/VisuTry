import { act, cleanup, render, screen } from '@testing-library/react'
import { MerchantLivePulse } from '@/components/merchant/MerchantLivePulse'
import type { MerchantLivePulse as Pulse } from '@/modules/merchant/domain/merchant-live-pulse'

const baseTime = Date.parse('2026-09-23T12:00:00.000Z')

function pulse(overrides: Partial<Pulse> = {}): Pulse {
  return {
    generatedAt: new Date(Date.now()).toISOString(),
    activeWindowMinutes: 5,
    activityWindowMinutes: 15,
    activeShoppers: 0,
    recentWindow: { visitors: 0, tryOnCompletions: 0, productClicks: 0 },
    recentActivity: [],
    ...overrides,
  }
}

function result(data: Pulse) {
  return { ok: true, json: async () => ({ success: true, data }) }
}

async function flushFetch() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('MerchantLivePulse polling and activity moment', () => {
  let visibility = 'visible'
  let fetchMock: jest.Mock
  let originalFetch: typeof global.fetch | undefined

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(baseTime)
    visibility = 'visible'
    originalFetch = global.fetch
    fetchMock = jest.fn()
    Object.defineProperty(global, 'fetch', { configurable: true, writable: true, value: fetchMock })
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility })
  })

  afterEach(() => {
    cleanup()
    if (originalFetch) Object.defineProperty(global, 'fetch', { configurable: true, writable: true, value: originalFetch })
    else delete (global as { fetch?: typeof fetch }).fetch
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('loads a quiet baseline without a moment and stops polling while hidden, then refreshes on return', async () => {
    fetchMock.mockResolvedValue(result(pulse()) as never)
    const { unmount } = render(<MerchantLivePulse merchantId="merchant-a" />)
    await flushFetch()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(screen.getByText('No live shopper activity right now')).toBeInTheDocument()
    expect(screen.queryByText('just now')).not.toBeInTheDocument()

    visibility = 'hidden'
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    await act(async () => { await jest.advanceTimersByTimeAsync(35_000) })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    visibility = 'visible'
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    await flushFetch()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    unmount()
  })

  it('announces one post-baseline meaningful event and deduplicates its stable id', async () => {
    const baseline = pulse()
    const arrived = pulse({
      generatedAt: new Date(baseTime + 10_000).toISOString(),
      recentActivity: [{
        id: 'event-new',
        kind: 'TRY_ON_COMPLETED',
        occurredAt: new Date(baseTime + 5_000).toISOString(),
        experience: { id: 'experience-a', type: 'STORE', name: 'Main Store' },
        frame: { id: 'frame-a', name: 'Round Classic' },
      }],
      recentWindow: { visitors: 1, tryOnCompletions: 1, productClicks: 0 },
    })
    fetchMock
      .mockResolvedValueOnce(result(baseline) as never)
      .mockResolvedValue(result(arrived) as never)

    const { unmount } = render(<MerchantLivePulse merchantId="merchant-a" />)
    await flushFetch()
    expect(screen.queryByText('Try-On completed · Round Classic')).not.toBeInTheDocument()

    await act(async () => { await jest.advanceTimersByTimeAsync(10_000) })
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Try-On completed · Round Classic')
    expect(screen.getByText('just now')).toBeInTheDocument()
    expect(screen.getByLabelText(/Live data status: Live/)).toBeInTheDocument()
    expect(document.querySelector('[aria-live="polite"]')).toBeInTheDocument()

    await act(async () => { await jest.advanceTimersByTimeAsync(10_000) })
    expect(document.querySelector('[aria-live="polite"]')).not.toBeInTheDocument()
    expect(screen.getByText('Try-On completed')).toBeInTheDocument()
    unmount()
  })

  it('keeps the paused failure state instead of letting the previous stale timer overwrite it', async () => {
    fetchMock
      .mockResolvedValueOnce(result(pulse()) as never)
      .mockRejectedValueOnce(new Error('network unavailable'))
    render(<MerchantLivePulse merchantId="merchant-a" />)
    await flushFetch()

    await act(async () => { await jest.advanceTimersByTimeAsync(10_000) })
    expect(screen.getByLabelText('Live data status: Live data paused')).toBeInTheDocument()

    visibility = 'hidden'
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    await act(async () => { await jest.advanceTimersByTimeAsync(40_000) })
    expect(screen.getByLabelText('Live data status: Live data paused')).toBeInTheDocument()
  })
})
