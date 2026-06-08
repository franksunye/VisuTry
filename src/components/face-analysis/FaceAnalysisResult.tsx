'use client'

import Image from 'next/image'
import { CheckCircle2, Lock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FACE_ANALYSIS_LAYOUT, getFaceShapeIcon } from '@/config/face-analysis'
import { FaceAnalysisTaskResponse } from '@/types/face-analysis'
import { FaceWireframeOverlay } from './FaceWireframeOverlay'
import { UnlockCreditsBanner } from './UnlockCreditsBanner'
import { FrameSearchSuggestions } from './FrameSearchSuggestions'
import { cn } from '@/utils/cn'

interface FaceAnalysisResultProps {
  task: FaceAnalysisTaskResponse
  onUnlock: () => void
  isUnlocking?: boolean
}

export function FaceAnalysisResult({ task, onUnlock, isUnlocking }: FaceAnalysisResultProps) {
  const t = useTranslations('faceAnalysis.result')
  const basic = task.basicResult
  const full = task.fullResult
  const teaser = task.lockedTeaser
  const confidencePercent = basic ? Math.round((basic.confidence ?? 0) * 100) : null
  const ShapeIcon = basic ? getFaceShapeIcon(basic.faceShape) : getFaceShapeIcon('oval')

  const previewBestFrames = teaser?.bestFrames ?? full?.bestFrames ?? []
  const previewFramesToAvoid = teaser?.framesToAvoid ?? full?.framesToAvoid ?? []
  const searchStyles =
    full?.catalogRecommendedStyles ??
    teaser?.catalogRecommendedStyles

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">{t('title')}</h2>
        {task.status === 'completed' && (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {t('completed')}
          </span>
        )}
      </div>

      {basic && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
          <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-4 overflow-hidden')}>
            <div className="relative aspect-[4/5] w-full max-w-[220px] mx-auto rounded-xl overflow-hidden bg-gray-100">
              <Image
                src={task.userImageUrl}
                alt={t('yourPhoto')}
                fill
                className="object-cover"
                sizes="220px"
              />
              <FaceWireframeOverlay className="absolute inset-0 w-full h-full pointer-events-none" />
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">{t('wireframeCaption')}</p>
          </div>

          <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-5')}>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600">
                <ShapeIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">
                    {basic.faceShapeDisplayName || basic.faceShape}
                  </h3>
                  {confidencePercent !== null && (
                    <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                      {t('confidence', { percent: confidencePercent })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{t('confidenceDisclaimer')}</p>
                <p className="text-sm text-gray-600 mt-2">{basic.summary}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">{t('keyFeatures')}</h4>
              <ul className="space-y-2">
                {basic.keyFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-5 relative overflow-hidden')}>
            {!task.reportUnlocked && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] p-4 text-center">
                <Lock className="w-8 h-8 text-gray-500 mb-2" />
                <p className="text-sm font-medium text-gray-800">{t('lockedTitle')}</p>
                <p className="text-xs text-gray-500 mt-1">{t('lockedDescription')}</p>
              </div>
            )}

            <div className={cn(!task.reportUnlocked && 'blur-sm select-none pointer-events-none')}>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('previewTitle')}</h4>
              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <p className="font-medium text-gray-900">{t('bestFrames')}</p>
                  <p>{previewBestFrames.join(' · ')}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t('framesToAvoid')}</p>
                  <p>{previewFramesToAvoid.join(' · ')}</p>
                </div>
                {task.reportUnlocked && full?.styleGuide && (
                  <div>
                    <p className="font-medium text-gray-900">{t('styleGuide')}</p>
                    <p>{full.styleGuide}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {basic && (
        <FrameSearchSuggestions
          faceShape={basic.faceShape}
          catalogStyles={searchStyles}
        />
      )}

      {!task.reportUnlocked && task.status === 'completed' && (
        <UnlockCreditsBanner onUnlock={onUnlock} isLoading={isUnlocking} faceShape={basic?.faceShape} />
      )}
    </div>
  )
}
