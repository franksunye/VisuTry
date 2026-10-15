import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getDecisionResultView } from '@/modules/store/application'
import { getPublicExperienceDiscovery } from '@/modules/store/application/get-public-experience-discovery'
import { createPublicStoreReadRuntime } from '@/modules/store/application/public-read-runtime'
import { isArchivedCampaignExperience } from '@/modules/store/domain/experience'
import { DecisionResultPageClient } from '@/components/store/DecisionResultPageClient'

export const dynamic = 'force-dynamic'

export default async function DecisionResultPage({ params, searchParams }: { params: { locale: string; token: string }; searchParams?: { deliveryProfile?: string } }) {
  const result = await getDecisionResultView(params.token)
  if (!result) notFound()
  const archivedCampaign = isArchivedCampaignExperience(result.experience)
  const archivedExperienceSlug = archivedCampaign ? result.experience?.slug : null
  const [archivedCopy, archivedDiscovery] = archivedExperienceSlug ? await Promise.all([
    getTranslations({ locale: params.locale, namespace: 'storeShopper.archivedCampaign' }),
    (async () => {
      try {
        const runtime = createPublicStoreReadRuntime()
        return await getPublicExperienceDiscovery({
          merchants: runtime.merchants,
          frames: runtime.frames,
          experiences: runtime.experiences,
          slug: result.merchant.slug,
          experienceSlug: archivedExperienceSlug,
        })
      } catch {
        // An optional Store link must never make an otherwise readable
        // private Result fail. The link fails closed if public reads fail.
        return null
      }
    })(),
  ]) : [null, null]
  return <DecisionResultPageClient
    locale={params.locale}
    token={params.token}
    result={result}
    kioskMode={searchParams?.deliveryProfile === 'kiosk' && result.experience?.deliveryPolicy.kioskEnabled === true}
    archivedCampaignCopy={archivedCopy ? { title: archivedCopy('title'), body: archivedCopy('body'), storeLink: archivedCopy('storeLink') } : undefined}
    hasActivePublicStore={archivedDiscovery?.merchant.hasActivePublicStore === true}
  />
}
