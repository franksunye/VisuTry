import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createStoreRuntime, getMerchantInsights } from '@/modules/store/application'
import { ExperienceDetailEditor, type ExperienceDetailData } from '@/components/admin/ExperienceAdminUI'

export const dynamic = 'force-dynamic'

export default async function AdminExperienceDetailPage({ params }: { params: { id: string; experienceId: string } }) {
  const [merchant, experience, catalog] = await Promise.all([
    prisma.merchant.findUnique({ where: { id: params.id }, select: { id: true, slug: true, name: true, referenceData: true } }),
    prisma.experience.findFirst({
      where: { id: params.experienceId, merchantId: params.id },
      include: {
        frames: {
          where: { active: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          select: { merchantFrameId: true },
        },
      },
    }),
    prisma.merchantFrame.findMany({
      where: { merchantId: params.id },
      orderBy: [{ name: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, name: true, brand: true, sku: true, imageUrl: true, productUrl: true, shape: true, widthClass: true, status: true },
    }),
  ])
  if (!merchant || !experience) notFound()

  let insights
  try {
    const runtime = createStoreRuntime()
    insights = await getMerchantInsights({
      merchants: runtime.merchants,
      events: runtime.events,
      merchantId: params.id,
      experienceId: params.experienceId,
      recordInsightsViewed: true,
    })
  } catch {
    notFound()
  }

  const initial: ExperienceDetailData = {
    merchant,
    experience: {
      id: experience.id,
      type: experience.type,
      slug: experience.slug,
      name: experience.name,
      status: experience.status,
      headline: experience.headline,
      description: experience.description,
      primaryCtaLabel: experience.primaryCtaLabel,
      primaryCtaUrl: experience.primaryCtaUrl,
      offerLabel: experience.offerLabel,
      offerCode: experience.offerCode,
      startAt: experience.startAt?.toISOString() ?? null,
      endAt: experience.endAt?.toISOString() ?? null,
      referenceData: merchant.referenceData || experience.referenceData,
      selectedFrameIds: experience.frames.map((frame) => frame.merchantFrameId),
    },
    catalog,
    insights,
  }

  return <ExperienceDetailEditor initial={initial} />
}
