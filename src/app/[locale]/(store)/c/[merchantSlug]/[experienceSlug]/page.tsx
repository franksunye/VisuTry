import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { ExperienceDiscoveryContent } from '@/components/store/ExperienceDiscoveryContent'
import { InteractiveCommerceLauncher } from '@/components/store/InteractiveCommerceLauncher'
import { resolveStoreAssetAccessPolicy } from '@/modules/store/infrastructure/config/store-asset-access-policy'
import { getPublicExperienceDiscoveryForRoute } from '@/modules/store/application/get-public-experience-discovery-route'
import { buildExperienceDiscoveryMetadata, discoveryCanonicalUrl } from '@/lib/store-discovery-seo'
import { getValidLocale } from '@/i18n'

interface CampaignExperiencePageProps {
  params: {
    locale: string
    merchantSlug: string
    experienceSlug: string
  }
}

export const revalidate = 5 * 60
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
  const discovery = await getPublicExperienceDiscoveryForRoute(params.merchantSlug, params.experienceSlug, locale)
  if (!discovery) notFound()
  const assetPolicy = resolveStoreAssetAccessPolicy()
  return <div>
    <ExperienceDiscoveryContent
      discovery={discovery}
      locale={locale}
      pathname={`/${locale}/c/${params.merchantSlug}/${params.experienceSlug}`}
    />
    <InteractiveCommerceLauncher
        merchantSlug={params.merchantSlug}
        experienceSlug={params.experienceSlug}
        locale={locale}
        publicPocStorage={assetPolicy.publicPoc}
    />
  </div>
}
