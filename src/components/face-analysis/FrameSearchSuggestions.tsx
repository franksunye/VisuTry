'use client'

import { ExternalLink } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { buildGoogleFrameSearchUrl, getFrameSearchStyles } from '@/lib/face-search'
import { analytics } from '@/lib/analytics'
import { FACE_ANALYSIS_LAYOUT } from '@/config/face-analysis'

interface FrameSearchSuggestionsProps {
  faceShape: string
  catalogStyles?: string[]
}

export function FrameSearchSuggestions({
  faceShape,
  catalogStyles,
}: FrameSearchSuggestionsProps) {
  const t = useTranslations('faceAnalysis.frameSearch')
  const styles = getFrameSearchStyles(catalogStyles, faceShape)

  if (styles.length === 0) return null

  const handleSearch = (style: string) => {
    const query = `best ${style} glasses for ${faceShape} face`
    analytics.trackFaceAnalysisFrameSearch(faceShape, style, query)
    window.open(buildGoogleFrameSearchUrl(faceShape, style), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={FACE_ANALYSIS_LAYOUT.card + ' p-5'}>
      <h4 className="text-sm font-semibold text-gray-900 mb-1">{t('title')}</h4>
      <p className="text-sm text-gray-600 mb-4">{t('description')}</p>
      <div className="flex flex-wrap gap-2">
        {styles.map((style) => (
          <button
            key={style}
            type="button"
            onClick={() => handleSearch(style)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 transition-colors"
          >
            {t('searchStyle', { style })}
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-3">{t('opensGoogle')}</p>
    </div>
  )
}
