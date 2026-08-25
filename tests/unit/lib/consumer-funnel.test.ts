import {
  getConsumerFunnelContext,
  recordConsumerFunnelEvent,
} from '@/lib/consumer-funnel'

describe('consumer funnel telemetry', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    window.fetch = jest.fn().mockResolvedValue({ ok: true } as Response)
    document.cookie = 'test-session=; Max-Age=0; path=/'
  })

  it('creates a stable anonymous browser-session context and classifies test traffic', () => {
    const first = getConsumerFunnelContext()
    const second = getConsumerFunnelContext()

    expect(first).toEqual({
      consumer_funnel_id: expect.stringMatching(/^[A-Za-z0-9_-]{16,128}$/),
      traffic_class: 'production_candidate',
    })
    expect(second).toEqual(first)

    document.cookie = 'test-session=playwright; path=/'
    expect(getConsumerFunnelContext()).toEqual({
      consumer_funnel_id: first?.consumer_funnel_id,
      traffic_class: 'test',
    })
  })

  it('sends allowlisted shopper action fields for Store/Campaign and excludes B2B marketing', () => {
    recordConsumerFunnelEvent({
      eventName: 'tryon_completed',
      surface: 'web',
      entryPoint: 'consumer',
      payload: {
        acquisition_source: 'chatgpt.com',
        referrer_host: 'chatgpt.com',
        page_path: '/en/try-on/glasses',
        success: true,
        user_id: 'must-not-be-sent',
        photo_url: 'must-not-be-sent',
      },
    })

    expect(window.fetch).toHaveBeenCalledTimes(1)
    const [, request] = (window.fetch as jest.Mock).mock.calls[0]
    const body = JSON.parse(request.body as string)
    expect(body).toEqual(expect.objectContaining({
      event_name: 'tryon_completed',
      acquisition_source: 'chatgpt.com',
      referrer_host: 'chatgpt.com',
      page_path: '/en/try-on/glasses',
      success: true,
      traffic_class: 'production_candidate',
    }))
    expect(body).not.toHaveProperty('user_id')
    expect(body).not.toHaveProperty('photo_url')

    recordConsumerFunnelEvent({
      eventName: 'tryon_completed',
      surface: 'merchant_store',
      payload: {},
    })
    expect(window.fetch).toHaveBeenCalledTimes(2)

    recordConsumerFunnelEvent({
      eventName: 'tryon_completed',
      surface: 'web',
      entryPoint: 'b2b',
      payload: {},
    })
    expect(window.fetch).toHaveBeenCalledTimes(2)
  })

  it('ignores events outside the supported Consumer action contract', () => {
    recordConsumerFunnelEvent({
      eventName: 'purchase_intent_clicked',
      surface: 'web',
      payload: {},
    })

    expect(window.fetch).not.toHaveBeenCalled()
  })
})
