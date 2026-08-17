import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { ExperienceDiscoveryContent } from '@/components/store/ExperienceDiscoveryContent'
import { InteractiveCommerceLauncher } from '@/components/store/InteractiveCommerceLauncher'
import { StorePresentationDisclosure } from '@/components/store/StorePresentationDisclosure'
import { resolveStoreAssetAccessPolicy } from '@/modules/store/infrastructure/config/store-asset-access-policy'
import { getPublicExperienceDiscoveryForRoute } from '@/modules/store/application/get-public-experience-discovery-route'
import { isPublicStoreRouteAdmitted } from '@/modules/store/application/public-route-admission'
import { buildExperienceDiscoveryMetadata, discoveryCanonicalUrl } from '@/lib/store-discovery-seo'
import { getValidLocale } from '@/i18n'
import { RouteMessagesProvider } from '@/components/i18n/RouteMessagesProvider'

interface MerchantStorePageProps {
  params: {
    locale: string
    merchantSlug: string
  }
}

// Newly imported merchants remain eligible through dynamic params. Public
// discovery HTML stays on-demand ISR, but time-based refresh is a 7-day
// safety net only — successful writes already call revalidateTag/Path.
export const revalidate = 7 * 24 * 60 * 60
export const dynamicParams = true

// Enable on-demand ISR for merchant slugs that are not known at build time.
// Keeping this list empty prevents a catalog snapshot from becoming a build
// dependency while allowing newly published merchants to render and cache.
export function generateStaticParams() {
  return []
}

export async function generateMetadata({
  params,
}: MerchantStorePageProps): Promise<Metadata> {
  setRequestLocale(params.locale)
  const locale = getValidLocale(params.locale)
  const pathname = `/${locale}/store/${params.merchantSlug}`
  const admitted = await isPublicStoreRouteAdmitted({ merchantSlug: params.merchantSlug })
  if (!admitted) {
    return {
      title: 'Store not found | VisuTry',
      alternates: { canonical: discoveryCanonicalUrl(pathname) },
      robots: { index: false, follow: false },
    }
  }
  const discovery = await getPublicExperienceDiscoveryForRoute(params.merchantSlug, null, locale)
  if (!discovery) {
    return {
      title: 'Store not found | VisuTry',
      alternates: { canonical: discoveryCanonicalUrl(pathname) },
      robots: { index: false, follow: false },
    }
  }

  return buildExperienceDiscoveryMetadata({ discovery, locale, pathname })
}

export default async function MerchantStorePage({ params }: MerchantStorePageProps) {
  setRequestLocale(params.locale)
  const locale = getValidLocale(params.locale)
  const admitted = await isPublicStoreRouteAdmitted({ merchantSlug: params.merchantSlug })
  if (!admitted) notFound()
  const discovery = await getPublicExperienceDiscoveryForRoute(params.merchantSlug, null, locale)
  if (!discovery) notFound()
  const assetPolicy = resolveStoreAssetAccessPolicy()

  return <div>
    <ExperienceDiscoveryContent
      discovery={discovery}
      locale={locale}
      pathname={`/${locale}/store/${params.merchantSlug}`}
    />
    <RouteMessagesProvider namespaces={['storeShopper']}>
      <InteractiveCommerceLauncher
          merchantSlug={params.merchantSlug}
          locale={locale}
          publicPocStorage={assetPolicy.publicPoc}
      />
    </RouteMessagesProvider>
    <div className="bg-[#f7f8fb] px-5 pb-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        <StorePresentationDisclosure referenceData={discovery.merchant.referenceData || discovery.experience.referenceData} />
      </div>
    </div>
  </div>
}
