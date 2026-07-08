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
    analytics.trackCustomEvent('store_landing_viewed', {
      source: 'store_landing',
      locale,
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
        analytics.trackCustomEvent('store_cta_clicked', {
          source: 'store_landing',
          locale,
          cta_location: ctaLocation,
          href,
        })
      }}
    >
      {children}
    </a>
  )
}
