'use client'

import Link from 'next/link'
import { ArrowRight, Glasses, ScanFace } from 'lucide-react'
import { analytics } from '@/lib/analytics'

type FaceAnalysisFunnelCTAProps = {
  locale: string
  title?: string
  body?: string
  tone?: 'blue' | 'light'
  sourcePage?: string
  ctaLocation?: string
}

export function FaceAnalysisFunnelCTA({
  locale,
  title = 'Find your best frames before you try them on',
  body = 'Find your likely face shape free and privately, then continue into personalized advice or virtual glasses try-on.',
  tone = 'blue',
  sourcePage,
  ctaLocation = 'blog_funnel_cta',
}: FaceAnalysisFunnelCTAProps) {
  const localePrefix = `/${locale}`
  const isBlue = tone === 'blue'
  const getSourcePage = () => sourcePage || window.location.pathname

  return (
    <div
      className={`not-prose my-8 rounded-lg p-6 ${
        isBlue
          ? 'bg-blue-600 text-white'
          : 'border border-blue-100 bg-blue-50 text-gray-950'
      }`}
    >
      <div className="mb-4 flex items-start gap-3">
        <span
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
            isBlue ? 'bg-white/15 text-white' : 'bg-white text-blue-600'
          }`}
        >
          <ScanFace className="h-5 w-5" />
        </span>
        <div>
          <h2 className={`text-2xl font-bold ${isBlue ? 'text-white' : 'text-gray-950'}`}>
            {title}
          </h2>
          <p className={`mt-2 text-base leading-7 ${isBlue ? 'text-blue-50' : 'text-gray-600'}`}>
            {body}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href={`${localePrefix}/face-shape-detector`}
          onClick={() =>
            analytics.trackBlogFunnelClick({
              sourcePage: getSourcePage(),
              destination: 'face_shape_detector',
              ctaLocation,
              locale,
            })
          }
          className={`inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold transition-colors ${
            isBlue
              ? 'bg-white text-blue-700 hover:bg-blue-50'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Detect my face shape — free
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
        <Link
          href={`${localePrefix}/try-on/glasses`}
          onClick={() =>
            analytics.trackBlogFunnelClick({
              sourcePage: getSourcePage(),
              destination: 'glasses_try_on',
              ctaLocation,
              locale,
            })
          }
          className={`inline-flex items-center justify-center rounded-lg border px-5 py-3 text-sm font-semibold transition-colors ${
            isBlue
              ? 'border-blue-200 text-white hover:bg-blue-500'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Glasses className="mr-2 h-4 w-4" />
          Try on glasses
        </Link>
      </div>
    </div>
  )
}
