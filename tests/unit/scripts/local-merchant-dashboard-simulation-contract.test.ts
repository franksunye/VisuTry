import {
  assertLocalDashboardSimulationEnvironment,
  buildLocalDashboardSimulationSchedule,
  localDashboardShowcaseDailyVisitors,
  LOCAL_DASHBOARD_SIMULATION_CONTEXTS,
  LOCAL_DASHBOARD_SIMULATION_FRAME_SKUS,
  parseLocalDashboardSimulationPreset,
} from '../../../scripts/lib/local-merchant-dashboard-simulation-contract'

const validEnvironment = {
  APP_ENV: 'local',
  NODE_ENV: 'test',
  ENABLE_MOCKS: 'true',
  TEST_MODE: 'true',
  DATABASE_URL: 'postgresql://local@127.0.0.1:55432/visutry_local',
  DATABASE_URL_UNPOOLED: 'postgresql://local@127.0.0.1:55432/visutry_local',
  VISUTRY_DATABASE_IDENTITY: 'local:127.0.0.1:55432/visutry_local',
  NEXTAUTH_URL: 'http://127.0.0.1:3001',
  NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3001',
  STRIPE_MERCHANT_BILLING_MODE: 'test',
  STRIPE_SECRET_KEY: 'sk_test_local_only',
}

describe('Local Merchant dashboard simulation safety contract', () => {
  it('accepts the explicit mock-auth Local database and returns its exact identity', () => {
    expect(assertLocalDashboardSimulationEnvironment(validEnvironment)).toBe('local:127.0.0.1:55432/visutry_local')
  })

  it.each([
    ['Preview environment', { ...validEnvironment, APP_ENV: 'preview' }],
    ['Vercel Preview', { ...validEnvironment, VERCEL_ENV: 'preview' }],
    ['Vercel runtime', { ...validEnvironment, VERCEL: '1' }],
    ['production Node mode', { ...validEnvironment, NODE_ENV: 'production' }],
    ['remote database', { ...validEnvironment, DATABASE_URL: 'postgresql://remote.example/visutry_local' }],
    ['remote unpooled database', { ...validEnvironment, DATABASE_URL_UNPOOLED: 'postgresql://remote.example/visutry_local' }],
    ['wrong Local database', { ...validEnvironment, DATABASE_URL: 'postgresql://local@127.0.0.1:5432/other' }],
    ['different database targets', { ...validEnvironment, DATABASE_URL_UNPOOLED: 'postgresql://local@127.0.0.1:55433/visutry_local' }],
    ['wrong exact identity marker', { ...validEnvironment, VISUTRY_DATABASE_IDENTITY: 'local:127.0.0.1:5433/visutry_local' }],
    ['remote auth URL', { ...validEnvironment, NEXTAUTH_URL: 'https://www.visutry.com' }],
    ['remote public site URL', { ...validEnvironment, NEXT_PUBLIC_SITE_URL: 'https://visutry-pre.vercel.app' }],
    ['mock authentication disabled', { ...validEnvironment, ENABLE_MOCKS: 'false' }],
    ['test mode disabled', { ...validEnvironment, TEST_MODE: undefined }],
    ['live Stripe mode', { ...validEnvironment, STRIPE_MERCHANT_BILLING_MODE: 'live' }],
    ['live Stripe secret', { ...validEnvironment, STRIPE_SECRET_KEY: 'sk_live_never' }],
    ['live publishable key', { ...validEnvironment, STRIPE_PUBLISHABLE_KEY: 'pk_live_never' }],
  ])('rejects %s', (_description, env) => {
    expect(() => assertLocalDashboardSimulationEnvironment(env)).toThrow()
  })

  it('builds the same bounded behavioral schedule for the same Local reference time', () => {
    const now = new Date('2026-09-30T12:00:00.000Z')
    expect(buildLocalDashboardSimulationSchedule(now)).toEqual(buildLocalDashboardSimulationSchedule(now))
    const schedule = buildLocalDashboardSimulationSchedule(now)
    const current30 = schedule.filter((row) => row.dayOffset <= 30)
    const previous30 = schedule.filter((row) => row.dayOffset > 30 && row.dayOffset <= 60)
    for (const context of LOCAL_DASHBOARD_SIMULATION_CONTEXTS) {
      expect(current30.filter((row) => row.experienceSlug === context.slug).length).toBeGreaterThanOrEqual(2)
      expect(previous30.filter((row) => row.experienceSlug === context.slug).length).toBeGreaterThanOrEqual(2)
    }
    expect(schedule.filter((row) => row.dayOffset <= 7)).toHaveLength(1)
    expect(schedule.filter((row) => row.dayOffset > 7 && row.dayOffset <= 14)).toHaveLength(1)
    expect(new Set(schedule.map((row) => row.source))).toEqual(new Set(['direct', 'google', 'instagram', 'in-store-qr']))
  })

  it('parses explicit presets and defaults the review seed to showcase', () => {
    expect(parseLocalDashboardSimulationPreset([])).toBe('showcase')
    expect(parseLocalDashboardSimulationPreset(['--preset', 'showcase'])).toBe('showcase')
    expect(parseLocalDashboardSimulationPreset(['--preset=low-volume'])).toBe('low-volume')
    expect(parseLocalDashboardSimulationPreset(['--', '--preset', 'empty'])).toBe('empty')
    expect(() => parseLocalDashboardSimulationPreset(['--preset', 'production'])).toThrow('showcase, low-volume, empty')
    expect(() => parseLocalDashboardSimulationPreset(['--preset', 'showcase', '--preset', 'empty'])).toThrow()
  })

  it('creates a repeatable showcase cohort with complete windows, plausible cadence, and varied canonical signals', () => {
    const now = new Date('2026-10-01T12:00:00.000Z')
    const rows = buildLocalDashboardSimulationSchedule(now, 'showcase')
    expect(rows).toEqual(buildLocalDashboardSimulationSchedule(now, 'showcase'))

    const current = rows.filter((row) => row.dayOffset < 30)
    const previous = rows.filter((row) => row.dayOffset >= 30 && row.dayOffset < 60)
    expect(current.length).toBeGreaterThanOrEqual(220)
    expect(current.length).toBeLessThanOrEqual(360)
    expect(previous.length).toBeGreaterThan(0)
    const movement = Math.abs(current.length - previous.length) / current.length
    expect(movement).toBeGreaterThanOrEqual(0.05)
    expect(movement).toBeLessThanOrEqual(0.2)
    expect(new Set(current.map((row) => row.dayOffset)).size).toBe(30)
    expect(new Set(previous.map((row) => row.dayOffset)).size).toBe(30)

    const dailyCounts = Array.from({ length: 30 }, (_, index) => ({
      dayOffset: index,
      count: rows.filter((row) => row.dayOffset === index).length,
      visitors: localDashboardShowcaseDailyVisitors(now, index),
      date: new Date(Date.UTC(2026, 9, 1) - index * 86_400_000),
    }))
    expect(dailyCounts.every((day) => day.count === day.visitors)).toBe(true)
    const weekendAverage = dailyCounts.filter((day) => [0, 6].includes(day.date.getUTCDay())).reduce((sum, day) => sum + day.count, 0)
      / dailyCounts.filter((day) => [0, 6].includes(day.date.getUTCDay())).length
    const weekdayAverage = dailyCounts.filter((day) => ![0, 6].includes(day.date.getUTCDay())).reduce((sum, day) => sum + day.count, 0)
      / dailyCounts.filter((day) => ![0, 6].includes(day.date.getUTCDay())).length
    expect(weekendAverage).toBeGreaterThan(weekdayAverage)

    const engagedSessions = current.filter((row) => row.eventTypes.some((type) => [
      'merchant_frame_selected', 'merchant_tryon_started', 'merchant_compare_started',
    ].includes(type)) || row.intentTypes.length > 0).length
    const isHighIntent = (row: typeof rows[number]) => {
      const score = row.eventTypes.filter((type) => type === 'merchant_tryon_completed').length * 3
        + row.intentTypes.filter((type) => type === 'FAVORITE').length * 3
        + row.eventTypes.filter((type) => type === 'merchant_compare_started').length * 2
        + (row.eventTypes.includes('merchant_frame_selected') && row.intentTypes.some((type) => type === 'PRODUCT_CLICK' || type === 'INQUIRY') ? 1 : 0)
      return score >= 4
    }
    const highIntentSessions = current.filter(isHighIntent).length
    expect(engagedSessions / current.length).toBeGreaterThanOrEqual(0.5)
    expect(engagedSessions / current.length).toBeLessThanOrEqual(0.7)
    expect(highIntentSessions).toBeGreaterThan(0)
    expect(highIntentSessions).toBeLessThan(engagedSessions)
    const dailyEngagementRates = Array.from({ length: 30 }, (_, dayOffset) => {
      const day = current.filter((row) => row.dayOffset === dayOffset)
      return day.filter((row) => row.eventTypes.includes('merchant_frame_selected') || row.intentTypes.length > 0).length / day.length
    })
    const dailyHighIntentCounts = Array.from({ length: 30 }, (_, dayOffset) => current.filter((row) => row.dayOffset === dayOffset && isHighIntent(row)).length)
    expect(dailyEngagementRates.every((rate) => rate >= 0.5 && rate <= 0.7)).toBe(true)
    expect(Math.min(...dailyHighIntentCounts)).toBeGreaterThanOrEqual(1)
    expect(Math.max(...dailyHighIntentCounts)).toBeLessThanOrEqual(3)
    expect(Math.max(...dailyHighIntentCounts) - Math.min(...dailyHighIntentCounts)).toBeLessThanOrEqual(2)
    expect(current.some((row) => row.eventTypes.includes('merchant_recommendation_completed'))).toBe(true)
    expect(current.some((row) => row.eventTypes.includes('merchant_tryon_started'))).toBe(true)
    expect(current.some((row) => row.eventTypes.includes('merchant_tryon_completed'))).toBe(true)
    expect(current.some((row) => row.eventTypes.includes('merchant_compare_started'))).toBe(true)
    expect(new Set(current.flatMap((row) => row.intentTypes))).toEqual(new Set(['FAVORITE', 'PRODUCT_CLICK', 'INQUIRY']))

    const recent = rows.filter((row) => row.recentOffsetMinutes !== null)
    expect(recent).toHaveLength(4)
    expect(recent.every((row) => row.dayOffset === 0 && row.recentOffsetMinutes! < 15)).toBe(true)
    expect(new Set(rows.map((row) => row.frameSku))).toEqual(new Set(LOCAL_DASHBOARD_SIMULATION_FRAME_SKUS.showcase))
    expect(new Set(rows.map((row) => row.source))).toEqual(new Set(['direct', 'google', 'instagram', 'partner-referral']))
    expect(new Set(rows.map((row) => row.experienceSlug))).toEqual(new Set(LOCAL_DASHBOARD_SIMULATION_CONTEXTS.map((context) => context.slug)))
    const frameRate = (frameSku: string, predicate: (row: typeof rows[number]) => boolean) => {
      const frameRows = current.filter((row) => row.frameSku === frameSku)
      return frameRows.filter(predicate).length / frameRows.length
    }
    const otherFrameRate = (frameSku: string, predicate: (row: typeof rows[number]) => boolean) => {
      const otherRows = current.filter((row) => row.frameSku !== frameSku)
      return otherRows.filter(predicate).length / otherRows.length
    }
    expect(frameRate('SIM-OPT-001', (row) => row.intentTypes.includes('FAVORITE')))
      .toBeGreaterThan(otherFrameRate('SIM-OPT-001', (row) => row.intentTypes.includes('FAVORITE')))
    expect(frameRate('SIM-OPT-002', (row) => row.eventTypes.includes('merchant_tryon_completed')))
      .toBeGreaterThan(otherFrameRate('SIM-OPT-002', (row) => row.eventTypes.includes('merchant_tryon_completed')))
    expect(frameRate('SIM-OPT-003', (row) => row.eventTypes.includes('merchant_compare_started')))
      .toBeGreaterThan(otherFrameRate('SIM-OPT-003', (row) => row.eventTypes.includes('merchant_compare_started')))
    expect(frameRate('SIM-OPT-004', (row) => row.intentTypes.includes('PRODUCT_CLICK') || row.intentTypes.includes('INQUIRY')))
      .toBeGreaterThan(otherFrameRate('SIM-OPT-004', (row) => row.intentTypes.includes('PRODUCT_CLICK') || row.intentTypes.includes('INQUIRY')))
    expect(current.filter((row) => row.experienceSlug === 'store').length).toBeGreaterThan(
      Math.max(...LOCAL_DASHBOARD_SIMULATION_CONTEXTS.slice(1).map((context) => current.filter((row) => row.experienceSlug === context.slug).length)),
    )
  })

  it('keeps low-volume and empty presets distinct', () => {
    const now = new Date('2026-10-01T12:00:00.000Z')
    const lowVolume = buildLocalDashboardSimulationSchedule(now, 'low-volume')
    expect(lowVolume).toHaveLength(34)
    expect(lowVolume.filter((row) => row.dayOffset <= 7)).toHaveLength(1)
    expect(buildLocalDashboardSimulationSchedule(now, 'empty')).toEqual([])
    expect(LOCAL_DASHBOARD_SIMULATION_FRAME_SKUS['low-volume']).toHaveLength(3)
  })
})
