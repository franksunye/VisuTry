'use client'

import { Lock, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FACE_ANALYSIS_LAYOUT } from '@/config/face-analysis'
import { PRICE_CONFIG, QUOTA_CONFIG } from '@/config/pricing'
import { analytics } from '@/lib/analytics'

interface UnlockCreditsBannerProps {
  onUnlock: () => void
  isLoading?: boolean
  faceShape?: string
}

export function UnlockCreditsBanner({
  onUnlock,
  isLoading,
  faceShape,
}: UnlockCreditsBannerProps) {
  const t = useTranslations('faceAnalysis.unlock')
  const price = (PRICE_CONFIG.CREDITS_PACK / 100).toFixed(2)

  const handleClick = () => {
    if (faceShape) {
      analytics.trackFaceAnalysisUnlockClick(faceShape, 'face_analysis')
    }
    onUnlock()
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            {t('title')}
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            <li>{t('feature1')}</li>
            <li>{t('feature2', { count: QUOTA_CONFIG.CREDITS_PACK })}</li>
            <li>{t('feature3')}</li>
          </ul>
        </div>
        <div className="flex flex-col items-stretch sm:items-end gap-2">
          <p className="text-sm text-gray-600 text-right">{t('price', { price })}</p>
          <button
            type="button"
            onClick={handleClick}
            disabled={isLoading}
            className={FACE_ANALYSIS_LAYOUT.primaryButton}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin" />
                {t('redirecting')}
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                {t('button')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
