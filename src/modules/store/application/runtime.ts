import {
  createPrismaMerchantRepository,
  createPrismaMerchantFrameRepository,
  createPrismaMerchantSessionRepository,
  createPrismaMerchantEventRepository,
  createPrismaMerchantIntentRepository,
  createPrismaStoreUsageRepository,
  createVercelBlobAssetStore,
  createStoreGenerationAdapter,
} from '../infrastructure'

/** Composition root for Store API routes — wires Prisma/Blob adapters. */
export function createStoreRuntime() {
  return {
    merchants: createPrismaMerchantRepository(),
    frames: createPrismaMerchantFrameRepository(),
    sessions: createPrismaMerchantSessionRepository(),
    events: createPrismaMerchantEventRepository(),
    intents: createPrismaMerchantIntentRepository(),
    usage: createPrismaStoreUsageRepository(),
    assets: createVercelBlobAssetStore(),
    generation: createStoreGenerationAdapter(),
  }
}
