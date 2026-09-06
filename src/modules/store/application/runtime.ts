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
import { createAnalyticsEventSink } from '@/lib/analytics-event-plane'

/** Composition root for Store API routes — wires PostgreSQL, Blob, and optional analytics. */
export function createStoreRuntime() {
  return {
    merchants: createPrismaMerchantRepository(),
    frames: createPrismaMerchantFrameRepository(),
    experiences: createPrismaExperienceRepository(),
    sessions: createPrismaMerchantSessionRepository(),
    events: createPrismaMerchantEventRepository(),
    analytics: createAnalyticsEventSink(),
    intents: createPrismaMerchantIntentRepository(),
    usage: createPrismaStoreUsageRepository(),
    sponsoredUsage: createPrismaMerchantSponsoredUsageRepository(prisma),
    assets: createVercelBlobAssetStore(),
    generation: createStoreGenerationAdapter(),
  }
}
