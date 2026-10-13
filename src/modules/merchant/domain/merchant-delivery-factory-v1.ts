import { z } from 'zod/v4'
import { assertDecisionJourneyPolicy, type DecisionJourneyPolicy } from '@/modules/store/domain/decision-journey'
import { assertExperienceDeliveryPolicy, type ExperienceDeliveryPolicy } from '@/modules/store/domain/delivery-profile'
import { PRESENTATION_MODES } from '@/modules/store/domain/presentation-mode'
import { MERCHANT_CLASSIFICATIONS, type MerchantClassification } from '@/modules/merchant/domain/merchant-classification'
import { MERCHANT_BRAND_PALETTE } from '@/modules/merchant/domain/merchant-brand-kit'

/**
 * Merchant Delivery Factory v1. This module is a PURE, side-effect-free
 * proposal validator and deterministic diff. It does not authenticate, write,
 * publish, charge, upload, or claim that an external operator has approved.
 * A future Apply MUST re-read and re-authorize every resource transactionally
 * through canonical Merchant commands; this proposal never grants authority.
 */
const slug = z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const frameId = z.string().min(1).max(120)
const uniqueFrames = z.array(frameId).max(1000).refine(
  ids => ids.length === new Set(ids).size,
  'frame IDs must not repeat',
)
const journey = z.custom<DecisionJourneyPolicy>((value) => {
  try { assertDecisionJourneyPolicy(value); return true } catch { return false }
}, 'Invalid canonical Decision Journey policy')
const delivery = z.custom<ExperienceDeliveryPolicy>((value) => {
  try { assertExperienceDeliveryPolicy(value); return true } catch { return false }
}, 'Invalid bounded Experience delivery policy')

const configuration = z.strictObject({
  name: z.string().trim().min(1).max(120),
  headline: z.string().trim().max(240).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  presentationMode: z.enum(PRESENTATION_MODES).optional(),
  journeyPolicy: journey.optional(),
  deliveryPolicy: delivery.optional(),
  selectedFrameIds: uniqueFrames,
})

const campaign = z.strictObject({
  slug,
  ...configuration.shape,
}).refine(value => value.slug !== 'default', 'Campaign slug may not use Store slug')

export const merchantDeliveryManifestV1Schema = z.strictObject({
  version: z.literal(1),
  merchantSlug: slug,
  classification: z.enum(MERCHANT_CLASSIFICATIONS),
  catalog: z.strictObject({
    sourceMethod: z.enum(['URL', 'CSV', 'MANUAL']),
    // Existing catalog resource IDs only. Discovery/import approval is a
    // separate action, never embedded in an apparent "apply everything" call.
    expectedFrameIds: uniqueFrames,
  }),
  brand: z.strictObject({
    displayName: z.string().trim().min(1).max(120),
    // Match the existing fixed accessible Brand Kit palette. Normalize case
    // to canonical persisted values; never accept arbitrary CSS/color strings.
    accentColor: z.string().refine(
      color => MERCHANT_BRAND_PALETTE.some(({ hex }) => hex.toLowerCase() === color.toLowerCase()),
      'Select a supported Brand Kit accent color',
    ).transform(color => MERCHANT_BRAND_PALETTE.find(({ hex }) => hex.toLowerCase() === color.toLowerCase())!.hex).nullable().optional(),
    // Assets require authenticated Human UI staging and readback, not scripts.
    logoAssetUrl: z.url().startsWith('https://').nullable().optional(),
  }),
  store: configuration,
  campaigns: z.array(campaign).max(20).default([]).superRefine((campaigns, ctx) => {
    const seen = new Set<string>()
    for (const [index, item] of campaigns.entries()) {
      if (seen.has(item.slug)) ctx.addIssue({ code: 'custom', path: [index, 'slug'], message: 'Duplicate Campaign slug' })
      seen.add(item.slug)
    }
  }),
})
export type MerchantDeliveryManifestV1 = z.infer<typeof merchantDeliveryManifestV1Schema>

export type FactorySnapshotExperience = {
  id: string
  status: 'DRAFT' | 'ACTIVE' | 'ENDED' | 'ARCHIVED'
  name: string
  headline: string | null
  description: string | null
  presentationMode: string | null
  journeyPolicy: unknown
  deliveryPolicy: unknown
  selectedFrameIds: string[]
}
export type FactorySnapshotV1 = {
  merchantId: string
  merchantSlug: string
  classification: MerchantClassification
  brandDisplayName: string
  brandAccentColor: string | null
  logoAssetUrl: string | null
  // Only ACTIVE, owned, previously validated catalog resource IDs.
  activeFrameIds: string[]
  // ACTIVE, tenant-owned frames satisfying the canonical Store display rules.
  // Recommendation enrichment is not required for basic Store display.
  storeEligibleFrameIds: string[]
  store: FactorySnapshotExperience | null
  campaigns: Array<FactorySnapshotExperience & { slug: string }>
}

export type FactoryPlanStepV1 = {
  resource: 'BRAND' | 'STORE' | 'CAMPAIGN'
  target: string
  action: 'NO_CHANGE' | 'CREATE_DRAFT' | 'UPDATE_DRAFT' | 'HUMAN_REVIEW_REQUIRED'
  changedFields: string[]
}
export type MerchantFactoryDryRunV1 = {
  version: 1
  classification: 'READ_ONLY_UNAUTHORIZED_PROPOSAL'
  merchantSlug: string
  merchantId: string
  steps: FactoryPlanStepV1[]
  blockers: string[]
  warnings: string[]
  canApply: false
  releaseReady: false
}

function differ(expected: Record<string, unknown>, actual: FactorySnapshotExperience): string[] {
  return Object.entries(expected).filter(([key, value]) =>
    value !== undefined && JSON.stringify(value) !== JSON.stringify(actual[key as keyof FactorySnapshotExperience]),
  ).map(([key]) => key)
}

function experiencePlan(
  resource: 'STORE' | 'CAMPAIGN',
  target: string,
  desired: z.infer<typeof configuration>,
  current: FactorySnapshotExperience | null,
  blockers: string[],
): FactoryPlanStepV1 {
  if (!current) {
    return { resource, target, action: 'CREATE_DRAFT', changedFields: Object.keys(desired).sort() }
  }
  const changes = differ(desired, current)
  if (changes.length === 0) return { resource, target, action: 'NO_CHANGE', changedFields: [] }
  if (current.status !== 'DRAFT') {
    blockers.push(`${resource} ${target}: ${current.status} configuration changes require a separate authenticated Human action`)
    return { resource, target, action: 'HUMAN_REVIEW_REQUIRED', changedFields: changes }
  }
  return { resource, target, action: 'UPDATE_DRAFT', changedFields: changes }
}

/** Safe to execute with untrusted proposed input; NEVER performs an actual write. */
export function buildMerchantFactoryDryRunV1(
  proposed: unknown,
  snapshot: FactorySnapshotV1,
): MerchantFactoryDryRunV1 {
  const manifest = merchantDeliveryManifestV1Schema.parse(proposed)
  if (!snapshot.merchantId || manifest.merchantSlug !== snapshot.merchantSlug) {
    throw new Error('FACTORY_TENANT_MISMATCH')
  }
  const blockers: string[] = []
  const warnings: string[] = []
  if (manifest.classification !== snapshot.classification) {
    blockers.push('Merchant classification changes are Human-only and require independent verification')
  }
  const ownedFrames = new Set(snapshot.activeFrameIds)
  for (const id of manifest.catalog.expectedFrameIds) {
    if (!ownedFrames.has(id)) blockers.push(`Catalog resource is missing, inactive, or not tenant-owned: ${id}`)
  }
  const expected = new Set(manifest.catalog.expectedFrameIds)
  const selection = [manifest.store, ...manifest.campaigns]
  for (const item of selection) for (const id of item.selectedFrameIds) {
    if (!ownedFrames.has(id)) blockers.push(`Selected frame is not active and tenant-owned: ${id}`)
    if (!expected.has(id)) blockers.push(`Selected frame is not included in the expected Catalog manifest: ${id}`)
  }
  const storeEligibleFrames = new Set(snapshot.storeEligibleFrameIds)
  for (const id of manifest.store.selectedFrameIds) {
    // Do not claim a private Store preview is ready simply because a product
    // exists and is ACTIVE. This mirrors setMerchantStoreFrames / public display
    // eligibility; it is intentionally less strict than recommendation readiness.
    if (ownedFrames.has(id) && !storeEligibleFrames.has(id)) {
      blockers.push(`Store selected frame is not display-ready: ${id}`)
    }
  }
  // Existing Catalog extras are never removed/deactivated by a Factory run.
  if (snapshot.activeFrameIds.some(id => !expected.has(id))) {
    warnings.push('Existing Catalog has additional active resources; Factory will not delete or deactivate them')
  }
  const brandChanges: string[] = []
  if (manifest.brand.displayName !== snapshot.brandDisplayName) brandChanges.push('displayName')
  if (manifest.brand.accentColor !== undefined && manifest.brand.accentColor !== snapshot.brandAccentColor) brandChanges.push('accentColor')
  if (manifest.brand.logoAssetUrl !== undefined && manifest.brand.logoAssetUrl !== snapshot.logoAssetUrl) brandChanges.push('logoAssetUrl')
  if (brandChanges.length) blockers.push('Brand and media configuration require authenticated Human UI review')
  const steps: FactoryPlanStepV1[] = [{
    resource: 'BRAND',
    target: manifest.merchantSlug,
    action: brandChanges.length ? 'HUMAN_REVIEW_REQUIRED' : 'NO_CHANGE',
    changedFields: brandChanges,
  }]
  steps.push(experiencePlan('STORE', 'default', manifest.store, snapshot.store, blockers))

  const campaignBySlug = new Map(snapshot.campaigns.map(item => [item.slug, item]))
  for (const item of manifest.campaigns) {
    steps.push(experiencePlan('CAMPAIGN', item.slug, item, campaignBySlug.get(item.slug) ?? null, blockers))
  }
  for (const item of snapshot.campaigns) {
    if (!manifest.campaigns.some(c => c.slug === item.slug)) {
      warnings.push(`Existing Campaign ${item.slug} is not part of this manifest; it is left unchanged`)
    }
  }
  return {
    version: 1,
    classification: 'READ_ONLY_UNAUTHORIZED_PROPOSAL',
    merchantSlug: manifest.merchantSlug,
    merchantId: snapshot.merchantId,
    steps,
    blockers: [...new Set(blockers)],
    warnings,
    canApply: false,
    releaseReady: false,
  }
}
