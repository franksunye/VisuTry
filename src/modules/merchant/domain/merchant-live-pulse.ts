export type MerchantLiveActivityKind =
  | 'TRY_ON_COMPLETED'
  | 'PRODUCT_CLICK'
  | 'COMPARE_STARTED'
  | 'RECOMMENDATION_COMPLETED'

export type MerchantLiveActivity = {
  id: string
  kind: MerchantLiveActivityKind
  occurredAt: string
  experience: { id: string; type: 'STORE' | 'CAMPAIGN'; name: string } | null
  frame: { id: string; name: string } | null
}

export type MerchantLivePulse = {
  generatedAt: string
  activeWindowMinutes: 5
  activityWindowMinutes: 15
  activeShoppers: number
  recentWindow: {
    visitors: number
    tryOnCompletions: number
    productClicks: number
  }
  recentActivity: MerchantLiveActivity[]
}

export type MerchantLivePulseActivityRow = {
  id: string
  type: string
  createdAt: Date | string
  experienceId: string | null
  experienceType: string | null
  experienceName: string | null
  frameId: string | null
  frameName: string | null
}

function activityKind(type: string): MerchantLiveActivityKind | null {
  switch (type) {
    case 'merchant_tryon_completed': return 'TRY_ON_COMPLETED'
    case 'PRODUCT_CLICK': return 'PRODUCT_CLICK'
    case 'merchant_compare_started': return 'COMPARE_STARTED'
    case 'merchant_recommendation_completed': return 'RECOMMENDATION_COMPLETED'
    default: return null
  }
}

function mapActivity(row: MerchantLivePulseActivityRow): MerchantLiveActivity | null {
  const kind = activityKind(row.type)
  if (!kind) return null
  const experienceType = row.experienceType === 'STORE' || row.experienceType === 'CAMPAIGN'
    ? row.experienceType
    : null
  return {
    id: row.id,
    kind,
    occurredAt: new Date(row.createdAt).toISOString(),
    experience: row.experienceId && experienceType && row.experienceName
      ? { id: row.experienceId, type: experienceType, name: row.experienceName }
      : null,
    frame: row.frameId && row.frameName ? { id: row.frameId, name: row.frameName } : null,
  }
}

/** Shared, provider-independent assembly for Prisma and Cloudflare read paths. */
export function buildMerchantLivePulse(input: {
  now: Date
  activeShoppers: number
  visitors: number
  tryOnCompletions: number
  productClicks: number
  events: MerchantLivePulseActivityRow[]
  intents: MerchantLivePulseActivityRow[]
}): MerchantLivePulse {
  const recentActivity = [...input.events, ...input.intents]
    .map(mapActivity)
    .filter((activity): activity is MerchantLiveActivity => activity !== null)
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt) || b.id.localeCompare(a.id))
    .slice(0, 5)

  return {
    generatedAt: input.now.toISOString(),
    activeWindowMinutes: 5,
    activityWindowMinutes: 15,
    activeShoppers: input.activeShoppers,
    recentWindow: {
      visitors: input.visitors,
      tryOnCompletions: input.tryOnCompletions,
      productClicks: input.productClicks,
    },
    recentActivity,
  }
}

export function merchantLivePulseWindows(now: Date) {
  return {
    activeSince: new Date(now.getTime() - 5 * 60_000),
    activitySince: new Date(now.getTime() - 15 * 60_000),
  }
}

export function merchantLivePulseRefreshDelay(input: {
  now: number
  lastMeaningfulChangeAt: number
  consecutiveFailures: number
}): number {
  if (input.consecutiveFailures > 0) {
    return Math.min(input.consecutiveFailures, 3) * 10_000
  }
  return input.now - input.lastMeaningfulChangeAt < 60_000 ? 10_000 : 30_000
}

export function hasMerchantLivePulseChange(previous: MerchantLivePulse, next: MerchantLivePulse): boolean {
  return previous.activeShoppers !== next.activeShoppers
    || previous.recentWindow.visitors !== next.recentWindow.visitors
    || previous.recentWindow.tryOnCompletions !== next.recentWindow.tryOnCompletions
    || previous.recentWindow.productClicks !== next.recentWindow.productClicks
    || previous.recentActivity[0]?.id !== next.recentActivity[0]?.id
}

export function newlyArrivedMerchantLiveActivity(
  previous: MerchantLivePulse,
  next: MerchantLivePulse,
  knownIds: ReadonlySet<string>,
): MerchantLiveActivity | null {
  const previousGeneratedAt = Date.parse(previous.generatedAt)
  return next.recentActivity.find((activity) =>
    !knownIds.has(activity.id) && Date.parse(activity.occurredAt) > previousGeneratedAt,
  ) ?? null
}
