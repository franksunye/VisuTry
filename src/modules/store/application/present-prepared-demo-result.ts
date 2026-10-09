import { createHash } from 'node:crypto'
import { StoreDomainError, experienceContainsFrame, merchantInactive, merchantNotFound } from '../domain'
import { isCanonicalVisuTryDemo } from '../domain/prepared-demo-results'
import { preparedDemoReferenceForAsset, findPreparedDemoAssetForFrameSku } from '../infrastructure/prepared-demo/prepared-result-manifest'
import { readPreparedDemoResultAsset } from '../infrastructure/prepared-demo/prepared-result-asset-store'
import { resolveStoreExperiencePolicy } from '../domain/experience-policy'
import type {
  DecisionResultRepository,
  ExperienceRepository,
  MerchantFrameRepository,
  MerchantRepository,
  MerchantSessionRepository,
} from './ports/repositories'
import type { AssetStore } from './ports/asset-store'
import { requireOperableStoreSession } from './require-store-session'

export async function presentPreparedDemoResult(input: {
  merchants: MerchantRepository
  frames: MerchantFrameRepository
  sessions: MerchantSessionRepository
  experiences?: ExperienceRepository
  decisionResults: DecisionResultRepository
  assets: AssetStore
  slug: string
  merchantSessionId: string
  capabilityToken: string | null
  shareToken: string
  merchantFrameId: string
  locale?: string | null
  deviceType?: string | null
  env?: Record<string, string | undefined>
}) {
  const merchant = await input.merchants.findBySlug(input.slug)
  if (!merchant) throw merchantNotFound()
  if (merchant.status !== 'ACTIVE') throw merchantInactive()
  if (!isCanonicalVisuTryDemo(merchant)) {
    throw new StoreDomainError('CAPABILITY_DISABLED', 'Prepared Demo results are not available for this Store.', 403)
  }

  const session = await requireOperableStoreSession({
    sessions: input.sessions,
    merchantId: merchant.id,
    merchantSessionId: input.merchantSessionId,
    capabilityToken: input.capabilityToken,
  })
  if (!session.photoAssetId) {
    throw new StoreDomainError('VALIDATION_ERROR', 'Use the canonical Demo Shopper photo before continuing to prepared results.', 409)
  }

  const experience = session.experienceId && input.experiences
    ? await input.experiences.findByMerchantAndId(merchant.id, session.experienceId)
    : null
  if (experience && (
    experience.status !== 'ACTIVE'
    || (experience.type !== 'STORE' && experience.type !== 'CAMPAIGN')
  )) {
    throw new StoreDomainError('CAPABILITY_DISABLED', 'Prepared Demo results are available only in active Demo Store or Campaign experiences.', 403)
  }
  const policy = resolveStoreExperiencePolicy(merchant, experience)
  // An approved prepared image represents Try-On, not a mandatory Compare.
  // Demo merchant, active Experience, authorized photo, frame, provenance and
  // private Result-token checks remain unchanged.
  if (!policy.tryOnEnabled) {
    throw new StoreDomainError('CAPABILITY_DISABLED', 'Prepared Try-On is not enabled for this Demo experience.', 403)
  }

  const frame = await input.frames.findActiveByMerchantAndId(merchant.id, input.merchantFrameId)
  if (!frame || (experience && !experienceContainsFrame(experience, frame.id))) {
    throw new StoreDomainError('FRAME_INACTIVE', 'The selected Demo frame is unavailable.', 409)
  }
  if (!frame.sku) throw new StoreDomainError('FRAME_INACTIVE', 'The selected frame has no canonical Demo SKU.', 409)

  const asset = findPreparedDemoAssetForFrameSku(frame.sku, input.env ?? process.env)
  if (!asset || asset.frameSku !== frame.sku || !asset.demoOnly || !asset.notForSale) {
    throw new StoreDomainError('FRAME_INACTIVE', 'No prepared Demo result is approved for the selected frame.', 409)
  }

  const photoRecord = await input.assets.assertAccess({
    assetId: session.photoAssetId,
    merchantId: merchant.id,
    merchantSessionId: session.id,
  })
  if (photoRecord.purpose !== 'SHOPPER_PHOTO' || photoRecord.retentionStatus !== 'ACTIVE') {
    throw new StoreDomainError('SESSION_UNAUTHORIZED', 'The Demo Shopper photo is not available for this session.', 403)
  }
  const photo = await input.assets.getBytes(session.photoAssetId, merchant.id)
  if (!photo || createHash('sha256').update(photo.body).digest('hex') !== asset.shopperPhotoSha256) {
    throw new StoreDomainError('VALIDATION_ERROR', 'Prepared results require the approved VisuTry Demo Shopper v1 photo.', 409)
  }

  const bytes = await readPreparedDemoResultAsset(asset, input.env)
  if (!bytes) {
    throw new StoreDomainError('CAPABILITY_DISABLED', 'Prepared Demo result media is not configured for this environment.', 503)
  }

  const reference = preparedDemoReferenceForAsset(asset, frame.id, new Date().toISOString())
  const saved = await input.decisionResults.recordPreparedDemoResult({
    merchantId: merchant.id,
    merchantSessionId: session.id,
    shareToken: input.shareToken,
    reference,
  })
  if (!saved) {
    throw new StoreDomainError('SESSION_UNAUTHORIZED', 'The private Decision Result is no longer available for this session.', 403)
  }

  // No TryOnTask, UsageLedger, MerchantEvent, GenerationRequest, or
  // GenerationAttempt is created by PREPARED_DEMO.
  return {
    source: 'PREPARED_DEMO' as const,
    sourceRef: reference.sourceRef,
    merchantFrameId: frame.id,
    presentedAt: reference.presentedAt,
    disclosure: asset.assetClass === 'LOCAL_QA_FIXTURE' ? 'LOCAL_QA_FIXTURE' as const : 'PREPARED_DEMO' as const,
    frame: {
      id: frame.id,
      name: frame.name,
      imageUrl: frame.imageUrl,
      productUrl: frame.productUrl,
      price: frame.price,
      currency: frame.currency,
      shape: frame.shape,
      productBrand: frame.brand,
    },
  }
}
