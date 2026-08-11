import { prisma } from '@/lib/prisma'

export const EXPERIENCE_ADMIN_FILTERS = ['ALL', 'STORE', 'CAMPAIGN'] as const
export type ExperienceAdminFilter = (typeof EXPERIENCE_ADMIN_FILTERS)[number]

export type ExperienceAdminMetricCounts = {
  sessions: number
  recommendations: number
  tryOns: number
  compareStarts: number
  favorites: number
  productClicks: number
  inquiries: number
}

export type ExperienceAdminSummary = {
  id: string
  merchantId: string
  type: 'STORE' | 'CAMPAIGN' | 'LEGACY'
  slug: string | null
  name: string
  status: string
  startAt: string | null
  endAt: string | null
  catalogFrameCount: number
  referenceData: boolean
  metrics: ExperienceAdminMetricCounts
  publicPath: string | null
}

export type ExperienceAdminWorkspace = {
  merchant: {
    id: string
    slug: string
    name: string
    referenceData: boolean
  }
  experiences: ExperienceAdminSummary[]
  legacy: ExperienceAdminSummary
}

const EMPTY_METRICS: ExperienceAdminMetricCounts = {
  sessions: 0,
  recommendations: 0,
  tryOns: 0,
  compareStarts: 0,
  favorites: 0,
  productClicks: 0,
  inquiries: 0,
}

function createMetricMap() {
  return new Map<string | null, ExperienceAdminMetricCounts>()
}

function getMetrics(
  metrics: Map<string | null, ExperienceAdminMetricCounts>,
  experienceId: string | null,
) {
  const existing = metrics.get(experienceId)
  if (existing) return existing
  const created = { ...EMPTY_METRICS }
  metrics.set(experienceId, created)
  return created
}

function publicPath(merchantSlug: string, type: 'STORE' | 'CAMPAIGN' | 'LEGACY', slug: string | null) {
  if (!slug || type === 'LEGACY') return null
  return type === 'STORE'
    ? `/en/store/${merchantSlug}`
    : `/en/c/${merchantSlug}/${slug}`
}

export async function getExperienceAdminWorkspace(input: {
  merchantId: string
  filter?: ExperienceAdminFilter
}): Promise<ExperienceAdminWorkspace | null> {
  const filter = input.filter ?? 'ALL'
  const merchant = await prisma.merchant.findUnique({
    where: { id: input.merchantId },
    select: { id: true, slug: true, name: true, referenceData: true },
  })
  if (!merchant) return null

  const experiences = await prisma.experience.findMany({
    where: {
      merchantId: input.merchantId,
      ...(filter === 'ALL' ? {} : { type: filter }),
    },
    orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      merchantId: true,
      type: true,
      slug: true,
      name: true,
      status: true,
      startAt: true,
      endAt: true,
      referenceData: true,
      frames: {
        where: { active: true },
        select: { merchantFrameId: true },
      },
    },
  })

  const [sessionGroups, eventGroups, intentGroups] = await Promise.all([
    prisma.merchantSession.groupBy({
      by: ['experienceId'],
      where: { merchantId: input.merchantId },
      _count: { _all: true },
    }),
    prisma.merchantEvent.groupBy({
      by: ['experienceId', 'type'],
      where: { merchantId: input.merchantId },
      _count: { _all: true },
    }),
    prisma.merchantIntent.groupBy({
      by: ['experienceId', 'type'],
      where: { merchantId: input.merchantId },
      _count: { _all: true },
    }),
  ])

  const metrics = createMetricMap()
  for (const row of sessionGroups) {
    getMetrics(metrics, row.experienceId).sessions = row._count._all
  }
  for (const row of eventGroups) {
    const target = getMetrics(metrics, row.experienceId)
    if (row.type === 'merchant_recommendation_completed') target.recommendations = row._count._all
    if (row.type === 'merchant_tryon_completed') target.tryOns = row._count._all
    if (row.type === 'merchant_compare_started') target.compareStarts = row._count._all
  }
  for (const row of intentGroups) {
    const target = getMetrics(metrics, row.experienceId)
    if (row.type === 'FAVORITE') target.favorites = row._count._all
    if (row.type === 'PRODUCT_CLICK') target.productClicks = row._count._all
    if (row.type === 'INQUIRY') target.inquiries = row._count._all
  }

  const summaries = experiences.map((experience) => ({
    id: experience.id,
    merchantId: experience.merchantId,
    type: experience.type,
    slug: experience.slug,
    name: experience.name,
    status: experience.status,
    startAt: experience.startAt?.toISOString() ?? null,
    endAt: experience.endAt?.toISOString() ?? null,
    catalogFrameCount: experience.frames.length,
    referenceData: merchant.referenceData || experience.referenceData,
    metrics: metrics.get(experience.id) ?? { ...EMPTY_METRICS },
    publicPath: publicPath(merchant.slug, experience.type, experience.slug),
  }))

  const legacy: ExperienceAdminSummary = {
    id: 'legacy-unassigned',
    merchantId: merchant.id,
    type: 'LEGACY',
    slug: null,
    name: 'Legacy / Unassigned',
    status: 'LEGACY',
    startAt: null,
    endAt: null,
    catalogFrameCount: 0,
    referenceData: merchant.referenceData,
    metrics: metrics.get(null) ?? { ...EMPTY_METRICS },
    publicPath: null,
  }

  return {
    merchant,
    experiences: summaries,
    legacy,
  }
}
