import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { StoreTryOnComparePanel } from '@/components/store/StoreTryOnComparePanel'
import type { StoreExperiencePolicy } from '@/modules/store/domain/experience-policy'

jest.mock('next-intl', () => {
  const t = (key: string, values?: Record<string, unknown>) => {
    const copy: Record<string, string> = {
      'tryOn.title': 'Virtual try-on',
      'tryOn.subtitle': 'See your selected frames',
      'tryOn.editLabel': 'Try them on',
      'tryOn.startOne': 'Try On This Frame',
      'tryOn.starting': 'Starting try-on…',
      'tryOn.queued': 'Queued…',
      'tryOn.processing': 'Generating…',
      'tryOn.failed': 'Try-on failed',
      'tryOn.timedOut': 'Try-On is taking longer than expected',
      'tryOn.checkAgain': 'Check again',
      'tryOn.tryAgain': 'Try again',
      'tryOn.retry': 'Retry',
      'tryOn.storeBrand': 'Store collection',
      'tryOn.viewProduct': 'View product',
      'tryOn.openCompare': 'Compare',
      'tryOn.compareTitle': 'Side-by-side compare',
      'tryOn.compareHint': 'Same shopper photo',
      'errors.tryOn': 'Try-on could not start. Please try again.',
      'errors.intent': 'Could not save that action.',
      'errors.sessionRestart': 'Your session expired. Please start again.',
      'errors.capabilityUnavailable': 'This store is temporarily unavailable.',
      'intent.favorite': 'Favorite',
      'intent.favorited': 'Favorited',
      'intent.inquire': 'Ask store',
    }
    if (key === 'tryOn.start') return `Try on ${values?.count} frames`
    return copy[key] || key
  }
  t.has = () => true
  return { useTranslations: () => t }
})

const policy: StoreExperiencePolicy = {
  tryOnEnabled: true,
  compareEnabled: true,
  maxCompareFrames: 2,
  inquiryEnabled: false,
}

const frame = {
  id: 'frame-a',
  name: 'Bali Aviator',
  imageUrl: 'https://cdn.example/frame-a.webp',
  productUrl: null,
  price: 12000,
  currency: 'usd',
  shape: 'aviator',
  productBrand: 'Ello',
}

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    json: async () => body,
  } as Response
}

function tryOnSubmitCalls(): unknown[][] {
  return (global.fetch as jest.Mock).mock.calls.filter((call: unknown[]) =>
    String(call[0]).includes('/api/store/sessions/try-on') &&
    !String(call[0]).includes('/poll'),
  )
}

function pollCalls(): unknown[][] {
  return (global.fetch as jest.Mock).mock.calls.filter((call: unknown[]) =>
    String(call[0]).includes('/api/store/sessions/try-on/poll'),
  )
}

function renderPanel(overrides?: {
  initialTasks?: { merchantFrameId: string; taskId: string }[]
  onTryOnTasksChange?: (tasks: { merchantFrameId: string; taskId: string }[]) => void
}) {
  return render(
    <StoreTryOnComparePanel
      merchantSlug="ello-sunglasses"
      experienceType="CAMPAIGN"
      experienceSlug="petite-fit"
      locale="en"
      merchantSessionId="session-1"
      selectedFrames={[frame]}
      accent="#1F4B5A"
      onError={jest.fn()}
      experiencePolicy={policy}
      initialBatchId="batch-1"
      initialTasks={overrides?.initialTasks ?? [{ merchantFrameId: 'frame-a', taskId: 'task-a' }]}
      onTryOnTasksChange={overrides?.onTryOnTasksChange}
    />,
  )
}

describe('StoreTryOnComparePanel retry and rehydration', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('does not POST /try-on when Check again follows a poll timeout', async () => {
    jest.useFakeTimers()
    ;(global.fetch as jest.Mock).mockResolvedValue(jsonResponse(200, {
      success: true,
      data: { status: 'processing' },
    }))

    renderPanel()
    await act(async () => {
      jest.advanceTimersByTime(1)
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(pollCalls().length).toBeGreaterThan(0)

    await act(async () => {
      await jest.advanceTimersByTimeAsync(120_000)
    })

    expect(screen.getByTestId('store-tryon-check-again')).toBeInTheDocument()
    expect(tryOnSubmitCalls()).toHaveLength(0)

    fireEvent.click(screen.getByTestId('store-tryon-check-again'))
    await act(async () => {
      jest.advanceTimersByTime(1)
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(tryOnSubmitCalls()).toHaveLength(0)
    expect(pollCalls().length).toBeGreaterThan(0)
  })

  it('does not POST /try-on when Check again follows a network polling failure', async () => {
    jest.useFakeTimers()
    ;(global.fetch as jest.Mock).mockRejectedValue(new TypeError('Failed to fetch'))

    renderPanel()
    await act(async () => {
      jest.advanceTimersByTime(1)
      await Promise.resolve()
      await Promise.resolve()
    })
    await act(async () => {
      await jest.advanceTimersByTimeAsync(30_000)
    })

    expect(screen.getByTestId('store-tryon-check-again')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('store-tryon-check-again'))
    expect(tryOnSubmitCalls()).toHaveLength(0)
  })

  it('does not POST /try-on when Check again follows repeated poll 5xx', async () => {
    jest.useFakeTimers()
    ;(global.fetch as jest.Mock).mockResolvedValue(jsonResponse(503, {
      success: false,
      code: 'INTERNAL_ERROR',
      error: 'unavailable',
    }))

    renderPanel()
    await act(async () => {
      jest.advanceTimersByTime(1)
      await Promise.resolve()
      await Promise.resolve()
    })
    await act(async () => {
      await jest.advanceTimersByTimeAsync(120_000)
    })

    expect(screen.getByTestId('store-tryon-check-again')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('store-tryon-check-again'))
    expect(tryOnSubmitCalls()).toHaveLength(0)
  })

  it('may submit a new generation after the server confirms FAILED', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (String(url).includes('/poll')) {
        return jsonResponse(200, {
          success: true,
          data: { status: 'failed', errorMessage: 'provider failed' },
        })
      }
      return jsonResponse(200, {
        success: true,
        data: { taskId: 'task-b', status: 'processing', frame },
      })
    })

    renderPanel()
    expect(await screen.findByTestId('store-tryon-try-again')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('store-tryon-try-again'))

    await waitFor(() => {
      expect(tryOnSubmitCalls()).toHaveLength(1)
    })
  })

  it('does not create two submissions from a duplicate Try again click', async () => {
    let resolveSubmit: ((value: Response) => void) | undefined
    ;(global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (String(url).includes('/poll')) {
        return jsonResponse(200, {
          success: true,
          data: { status: 'failed', errorMessage: 'provider failed' },
        })
      }
      return new Promise<Response>((resolve) => {
        resolveSubmit = resolve
      })
    })

    renderPanel()
    expect(await screen.findByTestId('store-tryon-try-again')).toBeInTheDocument()

    await act(async () => {
      const button = screen.getByTestId('store-tryon-try-again')
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    await waitFor(() => {
      expect(tryOnSubmitCalls()).toHaveLength(1)
    })

    await act(async () => {
      resolveSubmit?.(jsonResponse(200, {
        success: true,
        data: { taskId: 'task-b', status: 'processing', frame },
      }))
    })
  })

  it('shows a session restart error instead of entitlement copy for SESSION_EXPIRED', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(jsonResponse(401, {
      success: false,
      code: 'SESSION_EXPIRED',
      error: 'Your session has expired. Please start again.',
    }))

    renderPanel()
    expect(await screen.findByTestId('store-tryon-session-restart')).toBeInTheDocument()
    expect(screen.queryByTestId('merchant-entitlement-continuation')).not.toBeInTheDocument()
    expect(screen.queryByText(/sponsored Try-On is used/i)).not.toBeInTheDocument()
  })

  it('rehydrates a completed result from persisted task IDs without posting a new generation', async () => {
    const onTryOnTasksChange = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValue(jsonResponse(200, {
      success: true,
      data: {
        status: 'completed',
        resultImageUrl: 'https://cdn.example/result-a.webp',
        frame,
      },
    }))

    renderPanel({
      initialTasks: [{ merchantFrameId: 'frame-a', taskId: 'task-a' }],
      onTryOnTasksChange,
    })

    expect(await screen.findByTestId('store-tryon-result-task-a')).toHaveAttribute(
      'src',
      'https://cdn.example/result-a.webp',
    )
    expect(tryOnSubmitCalls()).toHaveLength(0)
    expect(pollCalls().length).toBeGreaterThan(0)
    expect(onTryOnTasksChange).toHaveBeenCalledWith([
      { merchantFrameId: 'frame-a', taskId: 'task-a' },
    ])
  })
})
