import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { ExperienceDiscoveryContent } from '@/components/store/ExperienceDiscoveryContent'
import { StoreShopperExperience } from '@/components/store/StoreShopperExperience'
import { resolveStoreAssetAccessPolicy } from '@/modules/store/infrastructure/config/store-asset-access-policy'
import { getPublicExperienceDiscoveryForRoute } from '@/modules/store/application/get-public-experience-discovery-route'
import { buildExperienceDiscoveryMetadata, discoveryCanonicalUrl } from '@/lib/store-discovery-seo'
import { getValidLocale } from '@/i18n'

interface MerchantStorePageProps {
  params: {
    locale: string
    merchantSlug: string
  }
}

// Merchant slugs are provisioned from the catalog/config delivery path.
// Keep the generic Store route dynamic so refresh and App Router navigation
// work for newly imported merchants without a static-param build step.
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: MerchantStorePageProps): Promise<Metadata> {
  setRequestLocale(params.locale)
  const locale = getValidLocale(params.locale)
  const pathname = `/${locale}/store/${params.merchantSlug}`
  const discovery = await getPublicExperienceDiscoveryForRoute(params.merchantSlug)
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
  const discovery = await getPublicExperienceDiscoveryForRoute(params.merchantSlug)
  if (!discovery) notFound()
  const assetPolicy = resolveStoreAssetAccessPolicy()

  return <div>
    <ExperienceDiscoveryContent
      discovery={discovery}
      locale={locale}
      pathname={`/${locale}/store/${params.merchantSlug}`}
    />
    <section aria-label="Interactive shopping experience">
      <StoreShopperExperience
        merchantSlug={params.merchantSlug}
        locale={locale}
        publicPocStorage={assetPolicy.publicPoc}
      />
    </section>
  </div>
}
