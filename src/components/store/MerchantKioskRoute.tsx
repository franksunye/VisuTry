import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { RouteMessagesProvider } from '@/components/i18n/RouteMessagesProvider'
import { InteractiveCommerceLauncher } from '@/components/store/InteractiveCommerceLauncher'
import { resolveStoreAssetAccessPolicy } from '@/modules/store/infrastructure/config/store-asset-access-policy'
import { getPublicExperienceDiscoveryForRoute } from '@/modules/store/application/get-public-experience-discovery-route'
import { publicMerchantFromDiscovery } from '@/modules/store/application/get-public-merchant'
import { isPublicCampaignRouteAdmitted, isPublicStoreRouteAdmitted } from '@/modules/store/application/public-route-admission'
import { getValidLocale } from '@/i18n'

export async function MerchantKioskRoute({
  locale: requestedLocale,
  merchantSlug,
  experienceSlug,
}: {
  locale: string
  merchantSlug: string
  experienceSlug?: string
}) {
  setRequestLocale(requestedLocale)
  const locale = getValidLocale(requestedLocale)
  const admitted = experienceSlug
    ? await isPublicCampaignRouteAdmitted({ merchantSlug, experienceSlug })
    : await isPublicStoreRouteAdmitted({ merchantSlug })
  if (!admitted) notFound()

  const discovery = await getPublicExperienceDiscoveryForRoute(merchantSlug, experienceSlug ?? null, locale)
  if (!discovery || !discovery.experience.deliveryPolicy.kioskEnabled) notFound()

  const assetPolicy = resolveStoreAssetAccessPolicy()
  return (
    <RouteMessagesProvider namespaces={['storeShopper']}>
      <InteractiveCommerceLauncher
        merchantSlug={merchantSlug}
        experienceSlug={experienceSlug}
        locale={locale}
        publicPocStorage={assetPolicy.publicPoc}
        generativeTryOnAvailable={discovery.merchant.generativeTryOnAvailable}
        initialPublicMerchant={publicMerchantFromDiscovery(discovery)}
        initialKioskMode
      />
    </RouteMessagesProvider>
  )
}
