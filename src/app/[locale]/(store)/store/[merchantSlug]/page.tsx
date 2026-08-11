import { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { StoreShopperExperience } from '@/components/store/StoreShopperExperience'
import { resolveStoreAssetAccessPolicy } from '@/modules/store/infrastructure/config/store-asset-access-policy'

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
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'storeShopper.meta',
  })

  return {
    title: t('title', { slug: params.merchantSlug }),
    description: t('description'),
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function MerchantStorePage({ params }: MerchantStorePageProps) {
  setRequestLocale(params.locale)
  const assetPolicy = resolveStoreAssetAccessPolicy()

  return (
    <StoreShopperExperience
      merchantSlug={params.merchantSlug}
      locale={params.locale}
      publicPocStorage={assetPolicy.publicPoc}
    />
  )
}
