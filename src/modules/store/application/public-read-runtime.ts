import { createStoreRuntime } from './runtime'

/**
 * Provider boundary for public Store discovery reads. The Vercel provider
 * continues to use the existing Prisma composition root.
 */
export function createPublicStoreReadRuntime() {
  const runtime = createStoreRuntime()
  return {
    merchants: runtime.merchants,
    frames: runtime.frames,
    experiences: runtime.experiences,
  }
}
