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
    sponsoredUsage: createPrismaMerchantSponsoredUsageRepository(),
    assets: createVercelBlobAssetStore(),
    generation: createStoreGenerationAdapter(),
  }
}
