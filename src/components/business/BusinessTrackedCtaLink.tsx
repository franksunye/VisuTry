'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { analytics, type BusinessCtaIntentType, type BusinessCtaLocation } from '@/lib/analytics'

type BusinessTrackedCtaLinkProps = {
  href: string
  locale: string
  ctaLocation: BusinessCtaLocation
  intentType: BusinessCtaIntentType
  className?: string
  children: ReactNode
}

/** Client boundary for measured Business CTA clicks rendered inside server pages. */
export function BusinessTrackedCtaLink({
  href,
  locale,
  ctaLocation,
  intentType,
  className,
  children,
}: BusinessTrackedCtaLinkProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      onClick={() => analytics.trackBusinessCtaClicked({ locale, ctaLocation, intentType })}
      className={className}
    >
      {children}
    </Link>
  )
}
