'use client'

import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Clock, Lock, ScanFace, Unlock, XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { FaceAnalysisTaskResponse } from '@/types/face-analysis'
import { getThumbnailUrl, getResponsiveSizes, IMAGE_QUALITY } from '@/lib/image-utils'

interface RecentFaceAnalysesProps {
  locale: string
  analyses: FaceAnalysisTaskResponse[]
}

export function RecentFaceAnalyses({ locale, analyses }: RecentFaceAnalysesProps) {
  const t = useTranslations('faceAnalysis.dashboard')

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  if (analyses.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t('title')}</h2>
        </div>
        <div className="p-8 text-center">
          <ScanFace className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{t('empty')}</p>
          <Link
            href={`/${locale}/face-analysis`}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {t('startAnalysis')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{t('title')}</h2>
      </div>

      <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {analyses.map((analysis) => {
          const shapeLabel =
            analysis.basicResult?.faceShapeDisplayName ||
            analysis.detectedShape ||
            '—'
          const confidence =
            analysis.basicResult?.confidence ?? analysis.confidence ?? null
          const confidencePercent =
            confidence !== null ? Math.round(confidence * 100) : null

          return (
            <Link
              key={analysis.id}
              href={`/${locale}/face-analysis?taskId=${analysis.id}`}
              className="group border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="relative aspect-[4/5] bg-gray-100">
                <Image
                  src={getThumbnailUrl(analysis.userImageUrl)}
                  alt={shapeLabel}
                  fill
                  className="object-cover"
                  sizes={getResponsiveSizes(300)}
                  quality={IMAGE_QUALITY.THUMBNAIL}
                />
                <div className="absolute top-2 right-2">
                  {analysis.reportUnlocked ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                      <Unlock className="w-3 h-3" />
                      {t('unlocked')}
                    </span>
                  ) : analysis.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-gray-700 bg-white/90 rounded-full">
                      <Lock className="w-3 h-3" />
                      {t('locked')}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">{shapeLabel}</p>
                    {confidencePercent !== null && (
                      <p className="text-xs text-gray-500">{confidencePercent}%</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    {getStatusIcon(analysis.status)}
                    <span>
                      {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2 group-hover:underline">{t('viewReport')}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
