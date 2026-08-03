'use client'

import { ArrowRight, Glasses, Grid2X2, ScanFace, Sparkles } from 'lucide-react'
import { GrowthFunnelLink } from '@/components/analytics/GrowthFunnelLink'

export type ProductContinuationAction = 'detector' | 'try_on' | 'compare' | 'advisor'

export type ProductContinuationCtasProps = {
  locale: string
  sourcePage: string
  queryCluster: string
  contentCluster?: string
  ctaLocation?: string
  labels?: {
    detector?: string
    tryOn?: string
    compare?: string
    advisor?: string
  }
  /** Which product paths to expose, in display order. First item is the primary CTA. */
  include?: ProductContinuationAction[]
  layout?: 'hero' | 'stack' | 'compact'
  className?: string
}

const DEFAULT_LABELS = {
  detector: 'Detect my face shape',
  tryOn: 'Open virtual try-on',
  compare: 'Compare frames',
  advisor: 'Get glasses advice',
}

const ACTION_CONFIG: Record<
  ProductContinuationAction,
  {
    destination: string
    productPath: string
    href: (locale: string, sourcePage: string) => string
    icon: typeof ScanFace
    labelKey: keyof typeof DEFAULT_LABELS
  }
> = {
  detector: {
    destination: 'face-shape-detector',
    productPath: 'face_shape_detector',
    href: (locale) => `/${locale}/face-shape-detector`,
    icon: ScanFace,
    labelKey: 'detector',
  },
  try_on: {
    destination: 'virtual-try-on',
    productPath: 'virtual_try_on',
    href: (locale, sourcePage) =>
      `/${locale}/try-on/glasses?source_page=${encodeURIComponent(sourcePage)}`,
    icon: Glasses,
    labelKey: 'tryOn',
  },
  compare: {
    destination: 'frame-compare',
    productPath: 'frame_compare',
    href: (locale, sourcePage) =>
      `/${locale}/try-on/glasses/compare?source_page=${encodeURIComponent(sourcePage)}`,
    icon: Grid2X2,
    labelKey: 'compare',
  },
  advisor: {
    destination: 'glasses-advisor',
    productPath: 'glasses_advisor',
    href: (locale) => `/${locale}/face-analysis`,
    icon: Sparkles,
    labelKey: 'advisor',
  },
}

/**
 * Shared Detector → Advisor → Try-On → Compare continuation CTAs for
 * Search→Tool landings and post-result surfaces.
 */
export function ProductContinuationCtas({
  locale,
  sourcePage,
  queryCluster,
  contentCluster = 'search-tool',
  ctaLocation = 'product-continuation',
  labels,
  include = ['detector', 'try_on', 'compare'],
  layout = 'hero',
  className = '',
}: ProductContinuationCtasProps) {
  const copy = { ...DEFAULT_LABELS, ...labels }
  const linkClass =
    layout === 'compact'
      ? 'inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50'
      : layout === 'stack'
        ? 'inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50'
        : 'inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50'

  const primaryClass =
    layout === 'compact'
      ? 'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700'
      : layout === 'stack'
        ? 'inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700'
        : 'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700'

  const containerClass =
    layout === 'stack'
      ? `flex flex-col gap-2 ${className}`
      : `flex flex-col gap-3 sm:flex-row sm:flex-wrap ${className}`

  return (
    <div className={containerClass}>
      {include.map((action, index) => {
        const config = ACTION_CONFIG[action]
        const Icon = config.icon
        return (
          <GrowthFunnelLink
            key={action}
            href={config.href(locale, sourcePage)}
            sourcePage={sourcePage}
            destination={config.destination}
            ctaLocation={`${ctaLocation}-${action.replace('_', '-')}`}
            queryCluster={queryCluster}
            contentCluster={contentCluster}
            productPath={config.productPath}
            className={index === 0 ? primaryClass : linkClass}
          >
            <Icon className="h-4 w-4" />
            {copy[config.labelKey]}
            <ArrowRight className="h-4 w-4" />
          </GrowthFunnelLink>
        )
      })}
    </div>
  )
}
