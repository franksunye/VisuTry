'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'

const LazyMerchantShopperAccountControl = dynamic(
  () => import('@/components/store/MerchantShopperAccountControl').then((module) => module.MerchantShopperAccountControl),
  { ssr: false },
)

export function MerchantShopperAccountControlSlot(
  props: ComponentProps<typeof LazyMerchantShopperAccountControl>,
) {
  return <LazyMerchantShopperAccountControl {...props} />
}
