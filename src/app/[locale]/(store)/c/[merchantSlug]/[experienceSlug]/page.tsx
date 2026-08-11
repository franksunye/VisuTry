import { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { StoreShopperExperience } from '@/components/store/StoreShopperExperience'
import { resolveStoreAssetAccessPolicy } from '@/modules/store/infrastructure/config/store-asset-access-policy'

interface CampaignExperiencePageProps {
  params: {
    locale: string
    merchantSlug: string
    experienceSlug: string
  }
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: CampaignExperiencePageProps): Promise<Metadata> {
  setRequestLocale(params.locale)
  const t = await getTranslations({ locale: params.locale, namespace: 'storeShopper.meta' })
  return {
    title: `${params.experienceSlug} · ${t('title', { slug: params.merchantSlug })}`,
    description: t('description'),
    robots: { index: false, follow: false },
  }
}

export default async function CampaignExperiencePage({ params }: CampaignExperiencePageProps) {
  setRequestLocale(params.locale)
  const assetPolicy = resolveStoreAssetAccessPolicy()
  return (
    <StoreShopperExperience
      merchantSlug={params.merchantSlug}
      experienceSlug={params.experienceSlug}
      locale={params.locale}
      publicPocStorage={assetPolicy.publicPoc}
    />
  )
}
