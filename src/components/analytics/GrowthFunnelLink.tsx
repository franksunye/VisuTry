'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { analytics, setGrowthContext } from '@/lib/analytics'

interface GrowthFunnelLinkProps {
  href: string
  sourcePage: string
  destination: string
  ctaLocation: string
  queryCluster: string
  contentCluster?: string
  productPath?: string
  prefetch?: boolean
  className?: string
  children: ReactNode
}

/** A normal Next.js link with one consistent high-intent SEO funnel event. */
export function GrowthFunnelLink({
  href,
  sourcePage,
  destination,
  ctaLocation,
  queryCluster,
  contentCluster,
  productPath,
  prefetch,
  className,
  children,
}: GrowthFunnelLinkProps) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={className}
      onClick={() => {
        setGrowthContext({
          source_page: sourcePage,
          query_cluster: queryCluster,
          ...(contentCluster ? { content_cluster: contentCluster } : {}),
          ...(productPath ? { product_path: productPath } : {}),
        })
        analytics.trackCustomEvent('seo_funnel_click', {
          source_page: sourcePage,
          destination,
          cta_location: ctaLocation,
          query_cluster: queryCluster,
          ...(contentCluster ? { content_cluster: contentCluster } : {}),
          ...(productPath ? { product_path: productPath } : {}),
        })
      }}
    >
      {children}
    </Link>
  )
}
