'use client'

import { ArrowRight, Glasses, Grid2X2, ScanFace } from 'lucide-react'
import { GrowthFunnelLink } from '@/components/analytics/GrowthFunnelLink'

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
  /** Which product paths to expose. Defaults to the full GTM continuation set. */
  include?: Array<'detector' | 'try_on' | 'compare' | 'advisor'>
  layout?: 'hero' | 'stack' | 'compact'
  className?: string
}

const DEFAULT_LABELS = {
  detector: 'Detect my face shape',
  tryOn: 'Open virtual try-on',
  compare: 'Compare frames',
  advisor: 'Get glasses advice',
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
      {include.includes('detector') && (
        <GrowthFunnelLink
          href={`/${locale}/face-shape-detector`}
          sourcePage={sourcePage}
          destination="face-shape-detector"
          ctaLocation={`${ctaLocation}-detector`}
          queryCluster={queryCluster}
          contentCluster={contentCluster}
          productPath="face_shape_detector"
          className={primaryClass}
        >
          <ScanFace className="h-4 w-4" />
          {copy.detector}
          <ArrowRight className="h-4 w-4" />
        </GrowthFunnelLink>
      )}
      {include.includes('try_on') && (
        <GrowthFunnelLink
          href={`/${locale}/try-on/glasses?source=${encodeURIComponent(sourcePage)}`}
          sourcePage={sourcePage}
          destination="virtual-try-on"
          ctaLocation={`${ctaLocation}-try-on`}
          queryCluster={queryCluster}
          contentCluster={contentCluster}
          productPath="virtual_try_on"
          className={include.includes('detector') ? linkClass : primaryClass}
        >
          <Glasses className="h-4 w-4" />
          {copy.tryOn}
          <ArrowRight className="h-4 w-4" />
        </GrowthFunnelLink>
      )}
      {include.includes('compare') && (
        <GrowthFunnelLink
          href={`/${locale}/try-on/glasses/compare?source=${encodeURIComponent(sourcePage)}`}
          sourcePage={sourcePage}
          destination="frame-compare"
          ctaLocation={`${ctaLocation}-compare`}
          queryCluster={queryCluster}
          contentCluster={contentCluster}
          productPath="frame_compare"
          className={linkClass}
        >
          <Grid2X2 className="h-4 w-4" />
          {copy.compare}
          <ArrowRight className="h-4 w-4" />
        </GrowthFunnelLink>
      )}
      {include.includes('advisor') && (
        <GrowthFunnelLink
          href={`/${locale}/face-analysis`}
          sourcePage={sourcePage}
          destination="glasses-advisor"
          ctaLocation={`${ctaLocation}-advisor`}
          queryCluster={queryCluster}
          contentCluster={contentCluster}
          productPath="glasses_advisor"
          className={linkClass}
        >
          {copy.advisor}
          <ArrowRight className="h-4 w-4" />
        </GrowthFunnelLink>
      )}
    </div>
  )
}
