'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { analytics } from '@/lib/analytics'

interface GrowthFunnelLinkProps {
  href: string
  sourcePage: string
  destination: string
  ctaLocation: string
  queryCluster: string
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
  className,
  children,
}: GrowthFunnelLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        analytics.trackCustomEvent('seo_funnel_click', {
          source_page: sourcePage,
          destination,
          cta_location: ctaLocation,
          query_cluster: queryCluster,
        })
      }}
    >
      {children}
    </Link>
  )
}
