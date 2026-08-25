import { prisma } from '@/lib/prisma'

export type MerchantAttributionBucket = {
  source: string | null
  medium: string | null
  acquisitionSurface: string | null
  experienceId: string | null
  aiAgentSource: string | null
  sessions: number
}

/** Read the existing MerchantSession acquisition context for future Admin reporting. */
export async function getMerchantAttributionBreakdown(input: {
  merchantId: string
  experienceId?: string | null
}): Promise<MerchantAttributionBucket[]> {
  const rows = await prisma.merchantSession.groupBy({
    by: ['source', 'medium', 'acquisitionSurface', 'experienceId', 'aiAgentSource'],
    where: {
      merchantId: input.merchantId,
      ...(input.experienceId ? { experienceId: input.experienceId } : {}),
    },
    _count: { _all: true },
  })

  return rows.map((row) => ({
    source: row.source,
    medium: row.medium,
    acquisitionSurface: row.acquisitionSurface,
    experienceId: row.experienceId,
    aiAgentSource: row.aiAgentSource,
    sessions: row._count._all,
  }))
}
