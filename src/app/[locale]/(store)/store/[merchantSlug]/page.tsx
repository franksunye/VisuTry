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

export const dynamic = 'force-static'

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
