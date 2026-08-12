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
  }
}
