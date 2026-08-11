import {
  StoreDomainError,
  buildStoreEventIdempotencyKey,
  experienceContainsFrame,
  merchantInactive,
  merchantNotFound,
} from '../domain'
import { experiencePolicyMetadata, maxSelectableStoreFrames, resolveStoreExperiencePolicy } from '../domain/experience-policy'
import type {
  MerchantEventRepository,
  MerchantFrameRepository,
  MerchantRepository,
  MerchantSessionRepository,
  ExperienceRepository,
} from './ports/repositories'
import { requireOperableStoreSession } from './require-store-session'

export type RecordFrameSelectionsInput = {
  merchants: MerchantRepository
  frames: MerchantFrameRepository
  sessions: MerchantSessionRepository
  experiences?: ExperienceRepository
  events: MerchantEventRepository
  slug: string
  merchantSessionId: string
  capabilityToken: string | null
  frameIds: string[]
  locale?: string | null
  deviceType?: string | null
  clientActionId?: string | null
}

export type RecordFrameSelectionsResult = {
  selectedFrameIds: string[]
}

const MAX_SELECTED = 4

export async function recordFrameSelections(
  input: RecordFrameSelectionsInput,
): Promise<RecordFrameSelectionsResult> {
  const merchant = await input.merchants.findBySlug(input.slug)
  if (!merchant) throw merchantNotFound()
  if (merchant.status !== 'ACTIVE') throw merchantInactive()
  const experiencePolicy = resolveStoreExperiencePolicy(merchant)

  const session = await requireOperableStoreSession({
    sessions: input.sessions,
    merchantId: merchant.id,
    merchantSessionId: input.merchantSessionId,
    capabilityToken: input.capabilityToken,
  })
  const experience = session.experienceId && input.experiences
    ? await input.experiences.findByMerchantAndId(merchant.id, session.experienceId)
    : null

  const uniqueIds = Array.from(new Set(input.frameIds.filter(Boolean)))
  const maxSelected = Math.min(MAX_SELECTED, maxSelectableStoreFrames(experiencePolicy))
  if (uniqueIds.length === 0 || uniqueIds.length > maxSelected) {
    throw new StoreDomainError(
      'VALIDATION_ERROR',
      `Select between 1 and ${maxSelected} frames.`,
      400,
    )
  }

  for (const frameId of uniqueIds) {
    const frame = await input.frames.findActiveByMerchantAndId(merchant.id, frameId)
    if (!frame) {
      throw new StoreDomainError(
        'FRAME_INACTIVE',
        'One or more selected frames are unavailable.',
        409,
      )
    }
    if (experience && !experienceContainsFrame(experience, frame.id)) {
      throw new StoreDomainError('FRAME_INACTIVE', 'This frame is not part of the current experience.', 409)
    }

    const actionId =
      input.clientActionId ?? `select:${input.merchantSessionId}:${frameId}`

    await input.events.appendIdempotent({
      eventId: buildStoreEventIdempotencyKey({
        type: 'merchant_frame_selected',
        merchantId: merchant.id,
        merchantSessionId: input.merchantSessionId,
        merchantFrameId: frameId,
        clientActionId: actionId,
      }),
      type: 'merchant_frame_selected',
      merchantId: merchant.id,
      merchantSessionId: input.merchantSessionId,
      merchantFrameId: frameId,
      source: 'SERVER',
      locale: input.locale ?? null,
      deviceType: input.deviceType ?? null,
      metadata: experiencePolicyMetadata(experiencePolicy, {
        selectedFrameCount: uniqueIds.length,
      }),
    })
  }

  await input.sessions.touch(merchant.id, input.merchantSessionId, new Date())

  return { selectedFrameIds: uniqueIds }
}
