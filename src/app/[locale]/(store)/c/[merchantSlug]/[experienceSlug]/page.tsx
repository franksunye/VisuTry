import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { ExperienceDiscoveryContent } from '@/components/store/ExperienceDiscoveryContent'
import { InteractiveCommerceLauncher } from '@/components/store/InteractiveCommerceLauncher'
import { StorePresentationDisclosure } from '@/components/store/StorePresentationDisclosure'
import { resolveStoreAssetAccessPolicy } from '@/modules/store/infrastructure/config/store-asset-access-policy'
import { getPublicExperienceDiscoveryForRoute } from '@/modules/store/application/get-public-experience-discovery-route'
import { isPublicCampaignRouteAdmitted } from '@/modules/store/application/public-route-admission'
import { buildExperienceDiscoveryMetadata, discoveryCanonicalUrl } from '@/lib/store-discovery-seo'
import { getValidLocale } from '@/i18n'
import { RouteMessagesProvider } from '@/components/i18n/RouteMessagesProvider'

interface CampaignExperiencePageProps {
  params: {
    locale: string
    merchantSlug: string
    experienceSlug: string
  }
}

// Campaign HTML is invalidated on successful public-discovery writes.
// Keep a 7-day ISR safety net instead of hourly regeneration.
export const revalidate = 7 * 24 * 60 * 60
export const dynamicParams = true

// Campaign slugs are published after deploy; empty build-time params keep the
// route eligible for on-demand ISR without baking a campaign snapshot into
// the build.
export function generateStaticParams() {
  return []
}

export async function generateMetadata({
  params,
}: CampaignExperiencePageProps): Promise<Metadata> {
  setRequestLocale(params.locale)
  const locale = getValidLocale(params.locale)
  const pathname = `/${locale}/c/${params.merchantSlug}/${params.experienceSlug}`
  const admitted = await isPublicCampaignRouteAdmitted({
    merchantSlug: params.merchantSlug,
    experienceSlug: params.experienceSlug,
  })
  if (!admitted) {
    return {
      title: 'Campaign not found | VisuTry',
      alternates: { canonical: discoveryCanonicalUrl(pathname) },
      robots: { index: false, follow: false },
    }
  }
  const discovery = await getPublicExperienceDiscoveryForRoute(params.merchantSlug, params.experienceSlug, locale)
  if (!discovery) {
    return {
      title: 'Campaign not found | VisuTry',
      alternates: { canonical: discoveryCanonicalUrl(pathname) },
      robots: { index: false, follow: false },
    }
  }
  return buildExperienceDiscoveryMetadata({ discovery, locale, pathname })
}

export default async function CampaignExperiencePage({ params }: CampaignExperiencePageProps) {
  setRequestLocale(params.locale)
  const locale = getValidLocale(params.locale)
  const admitted = await isPublicCampaignRouteAdmitted({
    merchantSlug: params.merchantSlug,
    experienceSlug: params.experienceSlug,
  })
  if (!admitted) notFound()
  const discovery = await getPublicExperienceDiscoveryForRoute(params.merchantSlug, params.experienceSlug, locale)
  if (!discovery) notFound()
  const assetPolicy = resolveStoreAssetAccessPolicy()
  return <div>
    <ExperienceDiscoveryContent
      discovery={discovery}
      locale={locale}
      pathname={`/${locale}/c/${params.merchantSlug}/${params.experienceSlug}`}
    />
    <RouteMessagesProvider namespaces={['storeShopper']}>
      <InteractiveCommerceLauncher
          merchantSlug={params.merchantSlug}
          experienceSlug={params.experienceSlug}
          locale={locale}
          publicPocStorage={assetPolicy.publicPoc}
          generativeTryOnAvailable={discovery.merchant.generativeTryOnAvailable}
      />
    </RouteMessagesProvider>
    <div className="bg-[#f7f8fb] px-5 pb-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        <StorePresentationDisclosure referenceData={discovery.merchant.referenceData || discovery.experience.referenceData} />
      </div>
    </div>
  </div>
}
