import { isLoopbackDatabaseUrl } from '../../src/lib/app-environment'
import {
  LOCAL_DASHBOARD_SIMULATION_MARKER,
  LOCAL_DASHBOARD_SIMULATION_MERCHANT_SLUG,
} from '../../src/modules/merchant/domain/local-dashboard-simulation'

export { LOCAL_DASHBOARD_SIMULATION_MARKER }
export const LOCAL_DASHBOARD_SIMULATION_MERCHANT = {
  slug: LOCAL_DASHBOARD_SIMULATION_MERCHANT_SLUG,
  name: 'Local Commerce Intelligence Lab',
  ownerUserId: 'mock-user-1',
} as const

export const LOCAL_DASHBOARD_SIMULATION_PRESETS = ['showcase', 'low-volume', 'empty'] as const
export type LocalDashboardSimulationPreset = typeof LOCAL_DASHBOARD_SIMULATION_PRESETS[number]

export function parseLocalDashboardSimulationPreset(args: readonly string[]): LocalDashboardSimulationPreset {
  const values = args.filter((arg) => arg !== '--')
  if (values.length === 0) return 'showcase'
  let presetValue: string | undefined
  if (values.length === 1 && values[0].startsWith('--preset=')) {
    presetValue = values[0].slice('--preset='.length)
  } else if (values.length === 2 && values[0] === '--preset') {
    presetValue = values[1]
  }
  if (!LOCAL_DASHBOARD_SIMULATION_PRESETS.some((preset) => preset === presetValue)) {
    throw new Error(`Expected one --preset value: ${LOCAL_DASHBOARD_SIMULATION_PRESETS.join(', ')}.`)
  }
  return presetValue as LocalDashboardSimulationPreset
}

export const LOCAL_DASHBOARD_SIMULATION_FRAME_SKUS: Record<LocalDashboardSimulationPreset, readonly string[]> = {
  showcase: ['SIM-OPT-001', 'SIM-OPT-002', 'SIM-OPT-003', 'SIM-OPT-004', 'SIM-OPT-005', 'SIM-OPT-006', 'SIM-OPT-007', 'SIM-OPT-008'],
  'low-volume': ['SIM-OPT-001', 'SIM-OPT-002', 'SIM-OPT-003'],
  empty: ['SIM-OPT-001', 'SIM-OPT-002', 'SIM-OPT-003', 'SIM-OPT-004', 'SIM-OPT-005', 'SIM-OPT-006', 'SIM-OPT-007', 'SIM-OPT-008'],
}

export const LOCAL_DASHBOARD_SIMULATION_CONTEXTS = [
  { slug: 'store', type: 'STORE', name: 'Flagship Store', label: 'Store' },
  { slug: 'campaign-spring-optics', type: 'CAMPAIGN', name: 'Spring eyewear edit', label: 'Campaign · Spring' },
  { slug: 'campaign-fit-check', type: 'CAMPAIGN', name: 'Fit discovery', label: 'Campaign · Fit' },
  { slug: 'campaign-qr-discovery', type: 'CAMPAIGN', name: 'In-store discovery', label: 'Campaign · In-store' },
] as const

const CURRENT_30_DAY_OFFSETS = [
  [16, 20, 24, 28],
  [17, 21, 25, 29],
  [18, 22, 26, 27],
  [19, 23, 24, 28],
] as const
const PREVIOUS_30_DAY_OFFSETS = [
  [36, 40, 44, 48],
  [37, 41, 45, 49],
  [38, 42, 46, 50],
  [39, 43, 47, 51],
] as const
const SOURCES = [
  { source: 'direct', medium: null, referrer: null },
  { source: 'google', medium: 'organic', referrer: 'https://www.google.com/' },
  { source: 'instagram', medium: 'social', referrer: 'https://www.instagram.com/' },
  { source: 'in-store-qr', medium: 'referral', referrer: 'https://local.visutry.test/qr' },
] as const

export type LocalDashboardSimulationRow = {
  sequence: number
  experienceSlug: (typeof LOCAL_DASHBOARD_SIMULATION_CONTEXTS)[number]['slug']
  dayOffset: number
  recentOffsetMinutes: number | null
  frameSku: string
  source: string
  medium: string | null
  referrer: string | null
  eventTypes: string[]
  intentTypes: Array<'FAVORITE' | 'PRODUCT_CLICK' | 'INQUIRY'>
}

const BEHAVIOR_PATTERNS = [
  {
    eventTypes: ['merchant_page_viewed', 'merchant_recommendation_completed', 'merchant_frame_selected', 'merchant_tryon_started', 'merchant_tryon_completed'],
    intentTypes: ['FAVORITE'] as const,
  },
  {
    eventTypes: ['merchant_page_viewed', 'merchant_recommendation_completed', 'merchant_frame_selected', 'merchant_compare_started'],
    intentTypes: ['PRODUCT_CLICK'] as const,
  },
  {
    eventTypes: ['merchant_page_viewed', 'merchant_recommendation_completed', 'merchant_frame_selected', 'merchant_tryon_started'],
    intentTypes: ['INQUIRY'] as const,
  },
  {
    eventTypes: ['merchant_page_viewed', 'merchant_recommendation_completed'],
    intentTypes: [] as const,
  },
  {
    eventTypes: ['merchant_page_viewed', 'merchant_recommendation_completed', 'merchant_frame_selected', 'merchant_tryon_completed'],
    intentTypes: ['PRODUCT_CLICK'] as const,
  },
] as const

const LOW_VOLUME_SOURCES = [
  { source: 'direct', medium: null, referrer: null },
  { source: 'google', medium: 'organic', referrer: 'https://www.google.com/' },
  { source: 'instagram', medium: 'social', referrer: 'https://www.instagram.com/' },
  { source: 'in-store-qr', medium: 'referral', referrer: 'https://local.visutry.test/qr' },
] as const

function lowVolumeRow(sequence: number, contextIndex: number, dayOffset: number): LocalDashboardSimulationRow {
  const behavior = BEHAVIOR_PATTERNS[(sequence + contextIndex) % BEHAVIOR_PATTERNS.length]
  const source = LOW_VOLUME_SOURCES[(sequence + contextIndex) % LOW_VOLUME_SOURCES.length]
  return {
    sequence,
    experienceSlug: LOCAL_DASHBOARD_SIMULATION_CONTEXTS[contextIndex].slug,
    dayOffset,
    recentOffsetMinutes: null,
    frameSku: LOCAL_DASHBOARD_SIMULATION_FRAME_SKUS['low-volume'][sequence % 3],
    ...source,
    eventTypes: [...behavior.eventTypes],
    intentTypes: [...behavior.intentTypes],
  }
}

function deterministicUnit(sequence: number, salt: number): number {
  return ((Math.imul(sequence + 1, 73) + Math.imul(salt + 17, 151) + sequence * salt * 19) >>> 0) % 997 / 997
}

function quotaIncludes(index: number, count: number, total: number): boolean {
  return Math.floor(((index + 1) * count) / total) > Math.floor((index * count) / total)
}

function showcaseDailyEngagedTarget(now: Date, dayOffset: number, visitors: number): number {
  const date = dateForOffset(now, dayOffset)
  const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6
  const cycle = Math.sin((dayOffset + 3) * (2 * Math.PI / 16)) * 0.025
  const lift = campaignLift(dayOffset) * 0.004
  const target = Math.round(visitors * (0.6 + (weekend ? 0.012 : 0) + cycle + lift))
  return Math.max(Math.ceil(visitors * 0.5), Math.min(Math.floor(visitors * 0.7), target))
}

function showcaseDailyHighIntentTarget(dayOffset: number, visitors: number): number {
  const cycle = (Math.sin((dayOffset + 1) * (2 * Math.PI / 15)) + 1) / 2
  const rate = 0.115 + cycle * 0.025 + campaignLift(dayOffset) * 0.004
  return Math.max(1, Math.min(3, Math.round(visitors * rate)))
}

function currentOffset(dayOffset: number): number {
  return dayOffset >= 30 ? dayOffset - 30 : dayOffset
}

function campaignLift(dayOffset: number): number {
  const offset = currentOffset(dayOffset)
  if (offset >= 7 && offset <= 9) return 3
  if (offset >= 16 && offset <= 18) return 2
  if (offset >= 24 && offset <= 25) return 3
  return 0
}

function dateForOffset(now: Date, dayOffset: number): Date {
  const utcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return new Date(utcMidnight - dayOffset * 86_400_000)
}

export function localDashboardShowcaseDailyVisitors(now: Date, dayOffset: number): number {
  const date = dateForOffset(now, dayOffset)
  const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6
  const base = weekend ? 10 : 8
  const variation = [-1, 0, 1][(date.getUTCDate() + date.getUTCDay()) % 3]
  const lift = campaignLift(dayOffset)
  if (dayOffset < 30) return base + variation + lift
  return Math.max(4, Math.round((base + variation) * 0.9) + Math.round(lift * 0.85))
}

function experienceForShowcaseSession(sequence: number, dayOffset: number): number {
  const weights = [0.46, 0.18, 0.22, 0.14]
  const offset = currentOffset(dayOffset)
  if (offset >= 7 && offset <= 9) weights[1] += 0.1
  if (offset >= 16 && offset <= 18) weights[3] += 0.09
  if (offset >= 24 && offset <= 25) weights[2] += 0.08
  const value = deterministicUnit(sequence, dayOffset + 23) * weights.reduce((sum, weight) => sum + weight, 0)
  let boundary = 0
  for (let index = 0; index < weights.length; index += 1) {
    boundary += weights[index]
    if (value < boundary) return index
  }
  return 0
}

function sourceForShowcaseSession(sequence: number, dayOffset: number) {
  const value = deterministicUnit(sequence, dayOffset + 41)
  if (value < 0.36) return { source: 'direct', medium: null, referrer: null }
  if (value < 0.69) return { source: 'google', medium: 'organic', referrer: 'https://www.google.com/' }
  if (value < 0.89) return { source: 'instagram', medium: 'social', referrer: 'https://www.instagram.com/' }
  return { source: 'partner-referral', medium: 'referral', referrer: 'https://local.visutry.test/partner' }
}

function frameForShowcaseSession(sequence: number, dayOffset: number): string {
  const frameSkus = LOCAL_DASHBOARD_SIMULATION_FRAME_SKUS.showcase
  const value = deterministicUnit(sequence, dayOffset + 67)
  const thresholds = [0.16, 0.31, 0.44, 0.57, 0.69, 0.80, 0.90, 1]
  return frameSkus[thresholds.findIndex((threshold) => value < threshold)] ?? frameSkus[0]
}

function showcaseBehavior(
  sequence: number,
  contextIndex: number,
  frameSku: string,
  recentOffsetMinutes: number | null,
  engaged: boolean,
  highIntentCandidate: boolean,
) {
  if (recentOffsetMinutes !== null) {
    const recentPatterns = [
      { eventTypes: ['merchant_page_viewed', 'merchant_recommendation_completed', 'merchant_frame_selected', 'merchant_tryon_started', 'merchant_tryon_completed'], intentTypes: ['FAVORITE'] as const },
      { eventTypes: ['merchant_page_viewed', 'merchant_recommendation_completed', 'merchant_frame_selected', 'merchant_compare_started'], intentTypes: ['PRODUCT_CLICK'] as const },
      { eventTypes: ['merchant_page_viewed', 'merchant_recommendation_completed', 'merchant_frame_selected', 'merchant_tryon_started', 'merchant_tryon_completed'], intentTypes: ['PRODUCT_CLICK', 'INQUIRY'] as const },
      { eventTypes: ['merchant_page_viewed', 'merchant_recommendation_completed', 'merchant_frame_selected', 'merchant_tryon_started', 'merchant_tryon_completed'], intentTypes: ['FAVORITE', 'PRODUCT_CLICK'] as const },
    ]
    return recentPatterns[Math.min(3, Math.floor((recentOffsetMinutes - 2) / 3))]
  }

  let eventTypes = ['merchant_page_viewed']
  let intentTypes: LocalDashboardSimulationRow['intentTypes'] = []
  if (deterministicUnit(sequence, 89) < [0.72, 0.78, 0.81, 0.69][contextIndex]) eventTypes.push('merchant_recommendation_completed')

  if (engaged) {
    eventTypes.push('merchant_frame_selected')
    const tryOnChance = frameSku === 'SIM-OPT-002' ? 0.7 : contextIndex === 3 ? 0.68 : contextIndex === 0 ? 0.5 : 0.44
    if (deterministicUnit(sequence, 97) < tryOnChance) {
      eventTypes.push('merchant_tryon_started')
      if (deterministicUnit(sequence, 101) < (contextIndex === 3 ? 0.84 : 0.78)) eventTypes.push('merchant_tryon_completed')
    }
    const compareChance = frameSku === 'SIM-OPT-003' ? 0.36 : contextIndex === 3 ? 0.21 : 0.14
    if (deterministicUnit(sequence, 107) < compareChance) eventTypes.push('merchant_compare_started')
    if (deterministicUnit(sequence, 109) < (frameSku === 'SIM-OPT-001' ? 0.34 : 0.17)) intentTypes.push('FAVORITE')
    if (deterministicUnit(sequence, 113) < (frameSku === 'SIM-OPT-004' ? 0.34 : 0.14)) intentTypes.push('PRODUCT_CLICK')
    if (deterministicUnit(sequence, 127) < (frameSku === 'SIM-OPT-004' ? 0.1 : 0.045)) intentTypes.push('INQUIRY')
  }

  if (highIntentCandidate) {
    eventTypes = ['merchant_page_viewed', 'merchant_recommendation_completed', 'merchant_frame_selected']
    intentTypes = []
    if (frameSku === 'SIM-OPT-001') intentTypes = ['FAVORITE', 'PRODUCT_CLICK']
    else if (frameSku === 'SIM-OPT-002') {
      eventTypes.push('merchant_tryon_started', 'merchant_tryon_completed')
      intentTypes = ['FAVORITE']
    } else if (frameSku === 'SIM-OPT-003') {
      eventTypes.push('merchant_compare_started')
      intentTypes = ['FAVORITE']
    } else if (frameSku === 'SIM-OPT-004') {
      eventTypes.push('merchant_tryon_started', 'merchant_tryon_completed')
      intentTypes = ['PRODUCT_CLICK']
    } else if (sequence % 2 === 0) {
      eventTypes.push('merchant_tryon_started', 'merchant_tryon_completed')
      intentTypes = ['FAVORITE']
    } else {
      eventTypes.push('merchant_compare_started')
      intentTypes = ['FAVORITE']
    }
  } else {
    const completedTryOn = eventTypes.includes('merchant_tryon_completed')
    const favorited = intentTypes.includes('FAVORITE')
    if (completedTryOn) {
      eventTypes = eventTypes.filter((type) => type !== 'merchant_compare_started')
      intentTypes = intentTypes.filter((type) => type !== 'FAVORITE' && type !== 'PRODUCT_CLICK' && type !== 'INQUIRY')
    } else if (favorited) {
      eventTypes = eventTypes.filter((type) => type !== 'merchant_compare_started')
      intentTypes = intentTypes.filter((type) => type !== 'PRODUCT_CLICK' && type !== 'INQUIRY')
    }
  }
  return { eventTypes, intentTypes }
}

function showcaseRow(sequence: number, dayOffset: number, todayIndex: number, dailyVisitors: number, now: Date): LocalDashboardSimulationRow {
  const contextIndex = experienceForShowcaseSession(sequence, dayOffset)
  const frameSku = frameForShowcaseSession(sequence, dayOffset)
  const recentOffsetMinutes = dayOffset === 0 && todayIndex < 4 ? [2, 5, 8, 11][todayIndex] : null
  const engagedTarget = showcaseDailyEngagedTarget(now, dayOffset, dailyVisitors)
  const highIntentTarget = dayOffset === 0 ? 0 : showcaseDailyHighIntentTarget(dayOffset, dailyVisitors)
  const recentCount = dayOffset === 0 ? Math.min(4, dailyVisitors) : 0
  const remainingVisitors = dailyVisitors - recentCount
  const remainingIndex = todayIndex - recentCount
  const remainingEngagedTarget = Math.max(0, engagedTarget - recentCount)
  const quotaEngaged = dayOffset === 0
    ? remainingIndex >= 0 && quotaIncludes(remainingIndex, remainingEngagedTarget, remainingVisitors)
    : quotaIncludes(todayIndex, engagedTarget, dailyVisitors)
  const engaged = recentOffsetMinutes !== null || quotaEngaged
  const engagedRank = dayOffset === 0
    ? -1
    : Math.floor(((todayIndex + 1) * engagedTarget) / dailyVisitors) - 1
  const highIntentCandidate = dayOffset !== 0 && quotaEngaged
    && quotaIncludes(engagedRank, highIntentTarget, engagedTarget)
  const behavior = showcaseBehavior(sequence, contextIndex, frameSku, recentOffsetMinutes, engaged || highIntentCandidate, highIntentCandidate)
  return {
    sequence,
    experienceSlug: LOCAL_DASHBOARD_SIMULATION_CONTEXTS[contextIndex].slug,
    dayOffset,
    recentOffsetMinutes,
    frameSku,
    ...sourceForShowcaseSession(sequence, dayOffset),
    eventTypes: [...behavior.eventTypes],
    intentTypes: [...behavior.intentTypes],
  }
}

function buildLowVolumeSchedule(): LocalDashboardSimulationRow[] {
  const rows: LocalDashboardSimulationRow[] = []
  let sequence = 0
  rows.push(lowVolumeRow(sequence++, 0, 2))
  rows.push(lowVolumeRow(sequence++, 2, 9))
  for (let contextIndex = 0; contextIndex < LOCAL_DASHBOARD_SIMULATION_CONTEXTS.length; contextIndex += 1) {
    for (const dayOffset of CURRENT_30_DAY_OFFSETS[contextIndex]) rows.push(lowVolumeRow(sequence++, contextIndex, dayOffset))
    for (const dayOffset of PREVIOUS_30_DAY_OFFSETS[contextIndex]) rows.push(lowVolumeRow(sequence++, contextIndex, dayOffset))
  }
  return rows.sort((left, right) => left.dayOffset - right.dayOffset || left.sequence - right.sequence)
}

function buildShowcaseSchedule(now: Date): LocalDashboardSimulationRow[] {
  const rows: LocalDashboardSimulationRow[] = []
  let sequence = 0
  for (let dayOffset = 59; dayOffset >= 0; dayOffset -= 1) {
    const dailyVisitors = localDashboardShowcaseDailyVisitors(now, dayOffset)
    for (let todayIndex = 0; todayIndex < dailyVisitors; todayIndex += 1) {
      rows.push(showcaseRow(sequence++, dayOffset, todayIndex, dailyVisitors, now))
    }
  }
  return rows
}

/**
 * Stable behavioral shape relative to `now`. Showcase has a full, deliberately
 * shaped 30-day cohort and equivalent prior period; low-volume preserves the
 * sparse reliability boundary; empty deliberately contains no session rows.
 */
export function buildLocalDashboardSimulationSchedule(
  now: Date,
  preset: LocalDashboardSimulationPreset = 'low-volume',
): LocalDashboardSimulationRow[] {
  if (Number.isNaN(now.getTime())) throw new Error('Simulation schedule requires a valid Local reference time.')
  if (preset === 'empty') return []
  return preset === 'showcase' ? buildShowcaseSchedule(now) : buildLowVolumeSchedule()
}

function localHttpOrigin(value: string | undefined, name: string): void {
  if (!value) throw new Error(`Refusing: ${name} must be an explicit Local HTTP origin.`)
  let url: URL
  try { url = new URL(value) } catch { throw new Error(`Refusing: ${name} must be a valid Local HTTP origin.`) }
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname)
    || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error(`Refusing: ${name} must target an HTTP loopback origin.`)
  }
}

function assertLocalDatabase(value: string | undefined, name: string): URL {
  if (!value || !isLoopbackDatabaseUrl(value)) throw new Error(`Refusing: ${name} must target the Local loopback database.`)
  let url: URL
  try { url = new URL(value) } catch { throw new Error(`Refusing: ${name} is not a valid PostgreSQL URL.`) }
  if (url.hostname !== '127.0.0.1' || !url.port || url.pathname !== '/visutry_local') {
    throw new Error(`Refusing: ${name} must target 127.0.0.1:<Local-port>/visutry_local.`)
  }
  return url
}

export function assertLocalDashboardSimulationEnvironment(env: Record<string, string | undefined>): string {
  if (env.APP_ENV?.trim().toLowerCase() !== 'local' || env.VERCEL_ENV || env.VERCEL) {
    throw new Error('Refusing: dashboard simulation requires explicit APP_ENV=local outside Vercel.')
  }
  if (env.NODE_ENV === 'production') throw new Error('Refusing: production Node mode is not allowed for the Local simulation.')
  if (!['true', '1'].includes(env.ENABLE_MOCKS?.trim().toLowerCase() ?? '')
    || !['true', '1'].includes(env.TEST_MODE?.trim().toLowerCase() ?? '')) {
    throw new Error('Refusing: Local mock authentication and TEST_MODE must both be enabled.')
  }
  if (env.STRIPE_MERCHANT_BILLING_MODE?.trim().toLowerCase() !== 'test') {
    throw new Error('Refusing: Stripe mode must explicitly be test; the fixture never calls Stripe.')
  }
  if (env.STRIPE_SECRET_KEY && !env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    throw new Error('Refusing: a live Stripe secret is not allowed in the Local simulation process.')
  }
  if (env.STRIPE_PUBLISHABLE_KEY && !env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_')) {
    throw new Error('Refusing: a live Stripe publishable key is not allowed in the Local simulation process.')
  }

  localHttpOrigin(env.NEXTAUTH_URL, 'NEXTAUTH_URL')
  localHttpOrigin(env.NEXT_PUBLIC_SITE_URL, 'NEXT_PUBLIC_SITE_URL')
  const database = assertLocalDatabase(env.DATABASE_URL, 'DATABASE_URL')
  const unpooled = assertLocalDatabase(env.DATABASE_URL_UNPOOLED, 'DATABASE_URL_UNPOOLED')
  if (database.hostname !== unpooled.hostname || database.port !== unpooled.port || database.pathname !== unpooled.pathname) {
    throw new Error('Refusing: DATABASE_URL and DATABASE_URL_UNPOOLED must identify the same Local database.')
  }

  const expectedIdentity = `local:127.0.0.1:${database.port}/visutry_local`
  if (env.VISUTRY_DATABASE_IDENTITY !== expectedIdentity) {
    throw new Error('Refusing: VISUTRY_DATABASE_IDENTITY must exactly match the Local loopback database target.')
  }
  return expectedIdentity
}
