import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  canUseCommercialFeature,
  isCommercialPeriodActive,
  resolveMerchantCommercialState,
  resolveMerchantCommercialPeriod,
  type CommercialFeature,
  type CommercialUsage,
  type EntitlementDecision,
  type MerchantCommercialFields,
  type MerchantCommercialState,
} from '@/modules/store/domain/merchant-commercial-state'
export { commercialStateForPresentation } from '@/modules/store/domain/merchant-commercial-state'

const commercialMerchantSelect = {
  id: true,
  planCode: true,
  commercialStatus: true,
  commercialStage: true,
  pricingVersion: true,
  entitlementVersion: true,
  commerceSessionAllowance: true,
  standardRenderAllowance: true,
  campaignAllowance: true,
  entitlementEffectiveFrom: true,
  billingPeriodEnd: true,
  commercialExceptionCode: true,
  createdAt: true,
} satisfies Prisma.MerchantSelect

type CommercialMerchantRow = Prisma.MerchantGetPayload<{ select: typeof commercialMerchantSelect }>

export class MerchantCommercialError extends Error {
  readonly code: NonNullable<EntitlementDecision['code']>
  readonly httpStatus = 409
  readonly decision: EntitlementDecision

  constructor(decision: EntitlementDecision) {
    super(decision.message)
    this.name = 'MerchantCommercialError'
    this.code = decision.code ?? 'FEATURE_NOT_INCLUDED'
    this.decision = decision
  }
}

function fields(row: CommercialMerchantRow): MerchantCommercialFields {
  return row
}

async function usageForMerchant(
  merchantId: string,
  row: CommercialMerchantRow,
  now: Date,
): Promise<CommercialUsage> {
  const period = resolveMerchantCommercialPeriod(fields(row), now)
  const periodFilter = period.start || period.end
    ? { createdAt: { ...(period.start ? { gte: period.start } : {}), ...(period.end ? { lt: period.end } : {}) } }
    : {}
  const [aiCommerceSessions, activeCampaigns, catalogItems, standardTryOnGenerations] = await Promise.all([
    prisma.merchantUsageLedger.count({ where: { merchantId, kind: 'AI_COMMERCE_SESSION', ...periodFilter } }),
    prisma.experience.count({ where: { merchantId, type: 'CAMPAIGN', status: 'ACTIVE' } }),
    prisma.merchantFrame.count({ where: { merchantId } }),
    prisma.merchantUsageLedger.count({ where: { merchantId, kind: 'RENDER_SUCCESS', ...periodFilter } }),
  ])
  return { aiCommerceSessions, activeCampaigns, catalogItems, standardTryOnGenerations }
}

export async function getMerchantCommercialState(input: { merchantId: string; now?: Date }): Promise<MerchantCommercialState> {
  const now = input.now ?? new Date()
  const merchant = await prisma.merchant.findUnique({ where: { id: input.merchantId }, select: commercialMerchantSelect })
  if (!merchant) throw new Error('Merchant not found')
  const usage = await usageForMerchant(input.merchantId, merchant, now)
  return resolveMerchantCommercialState(fields(merchant), usage, now)
}

export async function decideMerchantFeature(input: {
  merchantId: string
  feature: CommercialFeature
  now?: Date
}): Promise<{ state: MerchantCommercialState; decision: EntitlementDecision }> {
  const state = await getMerchantCommercialState({ merchantId: input.merchantId, now: input.now })
  return { state, decision: canUseCommercialFeature(state, input.feature) }
}

/** Server-authoritative feature decision API for Merchant runtime callers. */
export async function canUseFeature(input: {
  merchantId: string
  feature: CommercialFeature
  now?: Date
}): Promise<EntitlementDecision> {
  return (await decideMerchantFeature(input)).decision
}

export async function requireMerchantFeature(input: {
  merchantId: string
  feature: CommercialFeature
  now?: Date
}): Promise<MerchantCommercialState> {
  const result = await decideMerchantFeature(input)
  if (!result.decision.allowed) throw new MerchantCommercialError(result.decision)
  return result.state
}

export async function canActivateMerchantCampaign(input: { merchantId: string; currentStatus: string; now?: Date }) {
  if (input.currentStatus === 'ACTIVE') return { allowed: true as const, state: await getMerchantCommercialState({ merchantId: input.merchantId, now: input.now }) }
  const result = await decideMerchantFeature({ merchantId: input.merchantId, feature: 'CAMPAIGN', now: input.now })
  return { ...result, allowed: result.decision.allowed }
}

export const canActivateCampaign = canActivateMerchantCampaign

export async function canAddMerchantCatalogItems(input: { merchantId: string; additionalItems?: number; now?: Date }) {
  const state = await getMerchantCommercialState({ merchantId: input.merchantId, now: input.now })
  const additionalItems = Math.max(0, input.additionalItems ?? 1)
  const limit = state.plan.catalogItems
  const allowed = limit === null || state.usage.catalogItems + additionalItems <= limit
  if (allowed) return { allowed: true as const, state }
  const decision = canUseCommercialFeature({ ...state, featureAvailability: { ...state.featureAvailability, CATALOG: false } }, 'CATALOG')
  return { allowed: false as const, state, decision }
}

export const canAddCatalogItem = canAddMerchantCatalogItems

/**
 * Idempotently marks one MerchantSession as a billable AI Commerce Session.
 * Normal Store session creation never calls this function.
 */
export async function consumeAICommerceSession(input: {
  merchantId: string
  merchantSessionId: string
  now?: Date
}): Promise<{ consumed: boolean; alreadyConsumed: boolean; used: number; limit: number | null; state: MerchantCommercialState }> {
  const now = input.now ?? new Date()
  const merchant = await prisma.merchant.findUnique({ where: { id: input.merchantId }, select: commercialMerchantSelect })
  if (!merchant) throw new Error('Merchant not found')
  const period = resolveMerchantCommercialPeriod(fields(merchant), now)
  const current = await usageForMerchant(input.merchantId, merchant, now)
  const state = resolveMerchantCommercialState(fields(merchant), current, now)
  const limit = state.aiCommerceSessionLimit
  if (limit === null) return { consumed: false, alreadyConsumed: false, used: current.aiCommerceSessions, limit: null, state }

  const result = await prisma.$transaction(async (tx) => {
    const session = await tx.merchantSession.findFirst({
      where: { id: input.merchantSessionId, merchantId: input.merchantId },
      select: { id: true, billableAICommerceSession: true },
    })
    if (!session) throw new Error('Merchant session not found')
    if (!isCommercialPeriodActive(state) || state.status === 'USAGE_EXHAUSTED') {
      return { consumed: false, alreadyConsumed: false, used: current.aiCommerceSessions }
    }
    const existing = await tx.merchantUsageLedger.findUnique({ where: { dedupeKey: `ai-commerce-session:${input.merchantSessionId}` }, select: { id: true } })
    if (existing) {
      if (!session.billableAICommerceSession) {
        await tx.merchantSession.update({ where: { id: session.id }, data: { billableAICommerceSession: true, billableAICommerceSessionAt: now }, select: { id: true } })
      }
      const used = await tx.merchantUsageLedger.count({ where: { merchantId: input.merchantId, kind: 'AI_COMMERCE_SESSION', ...(period.start || period.end ? { createdAt: { ...(period.start ? { gte: period.start } : {}), ...(period.end ? { lt: period.end } : {}) } } : {}) } })
      return { consumed: false, alreadyConsumed: true, used }
    }
    const filter = period.start || period.end
      ? { createdAt: { ...(period.start ? { gte: period.start } : {}), ...(period.end ? { lt: period.end } : {}) } }
      : {}
    const used = await tx.merchantUsageLedger.count({ where: { merchantId: input.merchantId, kind: 'AI_COMMERCE_SESSION', ...filter } })
    if (used >= limit) return { consumed: false, alreadyConsumed: false, used }
    try {
      await tx.merchantUsageLedger.create({ data: { merchantId: input.merchantId, merchantSessionId: input.merchantSessionId, kind: 'AI_COMMERCE_SESSION', dedupeKey: `ai-commerce-session:${input.merchantSessionId}` } })
      await tx.merchantSession.update({ where: { id: session.id }, data: { billableAICommerceSession: true, billableAICommerceSessionAt: now }, select: { id: true } })
      return { consumed: true, alreadyConsumed: false, used: used + 1 }
    } catch (error) {
      if ((error as { code?: string }).code !== 'P2002') throw error
      const raced = await tx.merchantUsageLedger.count({ where: { merchantId: input.merchantId, kind: 'AI_COMMERCE_SESSION', ...filter } })
      return { consumed: false, alreadyConsumed: true, used: raced }
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  const nextState = resolveMerchantCommercialState(fields(merchant), { ...current, aiCommerceSessions: result.used }, now)
  return { ...result, limit, state: nextState }
}
