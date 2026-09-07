import {
  createPrismaMerchantRepository,
  createPrismaMerchantFrameRepository,
  createPrismaExperienceRepository,
  createPrismaMerchantSessionRepository,
  createPrismaMerchantEventRepository,
  createPrismaMerchantIntentRepository,
  createPrismaStoreUsageRepository,
  createPrismaMerchantSponsoredUsageRepository,
  createVercelBlobAssetStore,
  createStoreGenerationAdapter,
} from '../infrastructure'
import { prisma } from '@/lib/prisma'
import { MERCHANT_ACTIVATION_EVENT } from '@/modules/merchant/domain/merchant-activation'
import { recordMerchantActivationEvent } from '@/modules/merchant/application/merchant-activation'

/** Composition root for Store API routes — wires Prisma/Blob adapters. */
export function createStoreRuntime() {
  return {
    merchants: createPrismaMerchantRepository(),
    frames: createPrismaMerchantFrameRepository(),
    experiences: createPrismaExperienceRepository(),
    sessions: createPrismaMerchantSessionRepository(),
    events: createPrismaMerchantEventRepository(),
    intents: createPrismaMerchantIntentRepository(),
    usage: createPrismaStoreUsageRepository(),
    sponsoredUsage: createPrismaMerchantSponsoredUsageRepository(prisma),
    assets: createVercelBlobAssetStore(),
    generation: createStoreGenerationAdapter(),
    activation: {
      recordFirstShopperSession: ({ merchantId, merchantSessionId }: { merchantId: string; merchantSessionId: string }) =>
        recordMerchantActivationEvent({
          merchantId,
          sessionId: merchantSessionId,
          eventType: MERCHANT_ACTIVATION_EVENT.FIRST_SHOPPER_SESSION,
          source: 'SERVER',
          metadata: { session_id: merchantSessionId },
        }),
    },
  }
}
