'use client'

import { ReactNode, useEffect } from 'react'
import { analytics } from '@/lib/analytics'

interface StoreLandingTrackerProps {
  locale: string
}

interface StoreCtaLinkProps {
  href: string
  locale: string
  ctaLocation: string
  children: ReactNode
  className?: string
}

export function StoreLandingTracker({ locale }: StoreLandingTrackerProps) {
  useEffect(() => {
    analytics.trackStoreLandingViewed({
      locale,
      landingSurface: 'store_marketing',
    })
  }, [locale])

  return null
}

export function StoreCtaLink({ href, locale, ctaLocation, children, className }: StoreCtaLinkProps) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => {
        analytics.trackStoreCtaClicked({
          locale,
          ctaLocation,
          href,
          intentType: ctaLocation,
          productCategory: 'store_solution',
        })
      }}
    >
      {children}
    </a>
  )
}
