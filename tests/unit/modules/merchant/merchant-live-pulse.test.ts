import {
  buildMerchantLivePulse,
  countDistinctMerchantSessionIds,
  hasMerchantLivePulseChange,
  merchantLivePulseRefreshDelay,
  merchantLivePulseWindows,
  newlyArrivedMerchantLiveActivity,
} from '@/modules/merchant/domain/merchant-live-pulse'

const now = new Date('2026-09-23T12:00:00.000Z')

function event(id: string, type: string, createdAt: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    type,
    createdAt,
    experienceId: 'experience-a',
    experienceType: 'STORE',
    experienceName: 'Main Store',
    frameId: 'frame-a',
    frameName: 'Round Classic',
    ...overrides,
  }
}

describe('Merchant Live Pulse domain', () => {
  it('defines exact active and recent windows', () => {
    expect(merchantLivePulseWindows(now)).toEqual({
      activeSince: new Date('2026-09-23T11:55:00.000Z'),
      activitySince: new Date('2026-09-23T11:45:00.000Z'),
    })
  })

  it('counts the union of heartbeat and recent activity sessions without exposing session ids', () => {
    expect(countDistinctMerchantSessionIds(
      ['heartbeat-session', 'shared-session'],
      ['shared-session', 'tryon-session'],
      ['compare-session', null],
    )).toBe(4)
  })

  it('maps canonical event kinds, merges newest-first, and caps the feed at five', () => {
    const pulse = buildMerchantLivePulse({
      now,
      activeShoppers: 2,
      visitors: 12,
      tryOnCompletions: 5,
      productClicks: 3,
      events: [
        event('e1', 'merchant_tryon_completed', '2026-09-23T11:59:00.000Z'),
        event('e2', 'merchant_compare_started', '2026-09-23T11:58:00.000Z'),
        event('e3', 'merchant_recommendation_completed', '2026-09-23T11:57:00.000Z'),
        event('unsupported', 'merchant_tryon_failed', '2026-09-23T11:56:00.000Z'),
      ],
      intents: [
        event('i1', 'PRODUCT_CLICK', '2026-09-23T11:58:30.000Z'),
        event('i2', 'PRODUCT_CLICK', '2026-09-23T11:56:30.000Z'),
        event('i3', 'INQUIRY', '2026-09-23T11:59:30.000Z'),
      ],
    })

    expect(pulse).toMatchObject({
      activeWindowMinutes: 5,
      activityWindowMinutes: 15,
      activeShoppers: 2,
      recentWindow: { visitors: 12, tryOnCompletions: 5, productClicks: 3 },
    })
    expect(pulse.recentActivity.map(({ id, kind }) => [id, kind])).toEqual([
      ['e1', 'TRY_ON_COMPLETED'],
      ['i1', 'PRODUCT_CLICK'],
      ['e2', 'COMPARE_STARTED'],
      ['e3', 'RECOMMENDATION_COMPLETED'],
      ['i2', 'PRODUCT_CLICK'],
    ])
    expect(JSON.stringify(pulse)).not.toMatch(/email|session|token|metadata|photo|ip/i)
  })

  it('signals only genuinely new activity after the previous baseline', () => {
    const previous = buildMerchantLivePulse({ now, activeShoppers: 0, visitors: 1, tryOnCompletions: 0, productClicks: 0, events: [], intents: [] })
    const next = buildMerchantLivePulse({
      now: new Date(now.getTime() + 10_000),
      activeShoppers: 0,
      visitors: 1,
      tryOnCompletions: 1,
      productClicks: 0,
      events: [event('new', 'merchant_tryon_completed', '2026-09-23T12:00:05.000Z')],
      intents: [],
    })
    expect(newlyArrivedMerchantLiveActivity(previous, next, new Set())).toMatchObject({ id: 'new', kind: 'TRY_ON_COMPLETED' })
    expect(newlyArrivedMerchantLiveActivity(previous, next, new Set(['new']))).toBeNull()

    const priorEvent = buildMerchantLivePulse({
      now,
      activeShoppers: 0,
      visitors: 1,
      tryOnCompletions: 1,
      productClicks: 0,
      events: [event('old', 'merchant_tryon_completed', '2026-09-23T11:59:00.000Z')],
      intents: [],
    })
    expect(newlyArrivedMerchantLiveActivity(priorEvent, priorEvent, new Set())).toBeNull()
  })

  it('detects current changes but does not treat unchanged snapshots as activity', () => {
    const pulse = buildMerchantLivePulse({ now, activeShoppers: 1, visitors: 2, tryOnCompletions: 1, productClicks: 0, events: [], intents: [] })
    const same = { ...pulse, generatedAt: new Date(now.getTime() + 10_000).toISOString() }
    expect(hasMerchantLivePulseChange(pulse, same)).toBe(false)
    expect(hasMerchantLivePulseChange(pulse, { ...same, activeShoppers: 2 })).toBe(true)
  })

  it('uses 10-second refresh while active, backs off to 30 seconds, and bounds retries', () => {
    expect(merchantLivePulseRefreshDelay({ now: 59_999, lastMeaningfulChangeAt: 0, consecutiveFailures: 0 })).toBe(10_000)
    expect(merchantLivePulseRefreshDelay({ now: 60_000, lastMeaningfulChangeAt: 0, consecutiveFailures: 0 })).toBe(30_000)
    expect(merchantLivePulseRefreshDelay({ now: 90_000, lastMeaningfulChangeAt: 0, consecutiveFailures: 1 })).toBe(10_000)
    expect(merchantLivePulseRefreshDelay({ now: 90_000, lastMeaningfulChangeAt: 0, consecutiveFailures: 3 })).toBe(30_000)
    expect(merchantLivePulseRefreshDelay({ now: 90_000, lastMeaningfulChangeAt: 0, consecutiveFailures: 20 })).toBe(30_000)
  })
})
