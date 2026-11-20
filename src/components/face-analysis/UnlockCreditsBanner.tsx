'use client'

import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Lock, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FACE_ANALYSIS_LAYOUT } from '@/config/face-analysis'
import { getFaceShapeContent } from '@/config/face-shape-content'
import { PRICE_CONFIG, QUOTA_CONFIG } from '@/config/pricing'
import { analytics } from '@/lib/analytics'

interface UnlockCreditsBannerProps {
  onUnlock: () => void
  isLoading?: boolean
  faceShape?: string
  previewBestFrames?: string[]
}

export function UnlockCreditsBanner({
  onUnlock,
  isLoading,
  faceShape,
  previewBestFrames,
}: UnlockCreditsBannerProps) {
  const t = useTranslations('faceAnalysis.unlock')
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = (params.locale as string) || 'en'
  const taskId = searchParams.get('taskId')?.trim() || ''
  const price = (PRICE_CONFIG.CREDITS_PACK / 100).toFixed(2)
  // These are already-public lockedTeaser strings returned by the API.
  // Never fabricate match scores, rankings, or paid fit explanations.
  const shape = locale === 'en' ? getFaceShapeContent(faceShape || '') : null
  const teaserDirections = (previewBestFrames || [])
    .filter((value) => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim().slice(0, 48))
    .slice(0, 2)
  const paywallHref = taskId
    ? `/${locale}/pricing?source=face-analysis-unlock&taskId=${encodeURIComponent(taskId)}`
    : null

  const trackClick = () => {
    if (faceShape) {
      analytics.trackFaceAnalysisUnlockClick(faceShape, 'face_analysis')
    }
  }

  const handleFallbackClick = () => {
    trackClick()
    onUnlock()
  }

  const buttonContent = isLoading ? (
    <>
      <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin" />
      {t('redirecting')}
    </>
  ) : (
    <>
      <Lock className="w-4 h-4 mr-2" />
      {t('button', { price })}
    </>
  )

  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            {t('title')}
          </h3>
          {shape && teaserDirections.length > 0 && (
            <p data-testid="advisor-personalized-unlock-preview" className="mt-2 rounded-lg border border-blue-100 bg-white/80 px-3 py-2 text-xs leading-5 text-gray-800 sm:text-sm">
              Your <strong>{shape.name.toLowerCase()} face</strong> preview points toward <strong>{teaserDirections.join(' · ')}</strong>. Unlock the fit reasons and a try-on-ready shortlist.
            </p>
          )}
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            <li>{t('feature1')}</li>
            <li>{t('feature2', { count: QUOTA_CONFIG.CREDITS_PACK })}</li>
            <li>{t('feature3')}</li>
          </ul>
        </div>
        <div className="flex flex-col items-stretch sm:items-end gap-2">
          <p className="text-sm text-gray-600 text-right">{t('price', { price })}</p>
          {paywallHref ? (
            <Link
              href={paywallHref}
              onClick={trackClick}
              className={FACE_ANALYSIS_LAYOUT.primaryButton}
            >
              {buttonContent}
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleFallbackClick}
              disabled={isLoading}
              className={FACE_ANALYSIS_LAYOUT.primaryButton}
            >
              {buttonContent}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
