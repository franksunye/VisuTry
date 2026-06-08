'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Camera, HelpCircle, ScanFace, Sparkles } from 'lucide-react'
import { ImageUpload } from '@/components/upload/ImageUpload'
import { LoadingState } from '@/components/try-on/LoadingState'
import {
  FACE_ANALYSIS_CREDIT_COST,
  FACE_ANALYSIS_LAYOUT,
} from '@/config/face-analysis'
import { FaceAnalysisTaskResponse } from '@/types/face-analysis'
import { analytics, getUserType, type ProductType } from '@/lib/analytics'
import { PRICE_CONFIG } from '@/config/pricing'
import { FaceAnalysisStepper } from './FaceAnalysisStepper'
import { FaceAnalysisResult } from './FaceAnalysisResult'
import { cn } from '@/utils/cn'

type Step = 'photo' | 'analysis' | 'report' | 'analyzing'

export function FaceAnalysisInterface() {
  const { data: session, update } = useSession()
  const params = useParams()
  const locale = (params.locale as string) || 'en'
  const searchParams = useSearchParams()
  const t = useTranslations('faceAnalysis')
  const [userImage, setUserImage] = useState<{ file: File; preview: string } | null>(null)
  const [currentStep, setCurrentStep] = useState<Step>('photo')
  const [task, setTask] = useState<FaceAnalysisTaskResponse | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submitInFlightRef = useRef(false)
  const handledQueryRef = useRef<string | null>(null)

  const remainingTrials = session?.user?.remainingTrials ?? 0
  const hasQuota = remainingTrials >= FACE_ANALYSIS_CREDIT_COST
  const userType = getUserType(
    !!session?.user?.isPremiumActive,
    remainingTrials,
    !!session
  )
  const isCompleted = task?.status === 'completed' && !isProcessing

  const refreshTask = useCallback(
    async (taskId: string, options?: { syncSession?: boolean }) => {
      const response = await fetch(`/api/face-analysis/${taskId}`)
      const json = await response.json()
      if (json.success) {
        setTask(json.data)
        if (json.data.status === 'completed') {
          setCurrentStep('report')
          if (options?.syncSession) {
            await update()
          }
        }
      }
      return json
    },
    [update]
  )

  const handleAnalyze = async () => {
    if (!userImage || submitInFlightRef.current || !hasQuota) return

    if (isCompleted) {
      setTask(null)
      setCurrentStep('analysis')
      setError(null)
    }

    submitInFlightRef.current = true
    setError(null)
    setIsProcessing(true)
    setCurrentStep('analyzing')

    const startTime = Date.now()
    analytics.trackFaceAnalysisStart(userType, remainingTrials)

    try {
      const formData = new FormData()
      formData.append('userImage', userImage.file)
      formData.append('clientSubmissionId', crypto.randomUUID())

      const response = await fetch('/api/face-analysis/submit', {
        method: 'POST',
        body: formData,
      })
      const json = await response.json()

      if (!json.success) {
        throw new Error(json.error || 'Failed to start analysis')
      }

      if (json.data.status === 'completed' && json.data.task) {
        setTask({
          ...json.data.task,
          createdAt: json.data.task.createdAt || new Date().toISOString(),
          progress: 100,
        })
        setIsProcessing(false)
        setCurrentStep('report')
        await update()

        const shape = json.data.task.basicResult?.faceShape || 'unknown'
        const confidence = json.data.task.basicResult?.confidence ?? 0
        analytics.trackFaceAnalysisComplete(
          shape,
          confidence,
          Date.now() - startTime,
          userType
        )
        return
      }

      throw new Error('Unexpected analysis response')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start analysis'
      analytics.trackFaceAnalysisFailed(message, userType)
      setError(message)
      setIsProcessing(false)
      setCurrentStep('analysis')
    } finally {
      submitInFlightRef.current = false
    }
  }

  const handleUnlock = async () => {
    if (!task) return
    setIsUnlocking(true)
    setError(null)

    try {
      const successUrl = `${window.location.origin}/${locale}/face-analysis?unlock=success&taskId=${task.id}`
      const cancelUrl = `${window.location.origin}/${locale}/face-analysis?unlock=cancel&taskId=${task.id}`

      const response = await fetch('/api/payment/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType: 'CREDITS_PACK',
          successUrl,
          cancelUrl,
          unlockTaskId: task.id,
        }),
      })

      const json = await response.json()
      if (!json.success || !json.data?.url) {
        throw new Error(json.error || 'Failed to create checkout session')
      }

      analytics.trackBeginCheckout(
        'CREDITS_PACK' as ProductType,
        PRICE_CONFIG.CREDITS_PACK / 100
      )
      window.location.href = json.data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
      setIsUnlocking(false)
    }
  }

  useEffect(() => {
    const unlock = searchParams.get('unlock')
    const taskId = searchParams.get('taskId')
    if (!taskId) return

    const queryKey = `${taskId}:${unlock ?? ''}`
    if (handledQueryRef.current === queryKey) return
    handledQueryRef.current = queryKey

    if (unlock === 'success') {
      refreshTask(taskId, { syncSession: true }).then(() => {
        analytics.trackFaceAnalysisUnlockSuccess(taskId)
      })
      return
    }

    if (!unlock) {
      refreshTask(taskId, { syncSession: false })
    }
  }, [searchParams, refreshTask])

  const stepperStep =
    currentStep === 'analyzing' ? 'analyzing' : currentStep === 'report' ? 'report' : currentStep

  const hasResult = !isProcessing && task?.status === 'completed' && !!task.basicResult

  return (
    <div className={FACE_ANALYSIS_LAYOUT.container}>
      <FaceAnalysisStepper currentStep={stepperStep} />

      <div className={FACE_ANALYSIS_LAYOUT.grid}>
        <div className="space-y-5 order-1">
          <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-5')}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                <span className="text-blue-600 mr-2">1</span>
                {t('upload.title')}
              </h3>
              {userImage && (
                <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                  {t('upload.uploaded')}
                </span>
              )}
            </div>
            <ImageUpload
              onImageSelect={(file, preview) => {
                setUserImage({ file, preview })
                setCurrentStep('analysis')
                setTask(null)
                setError(null)
              }}
              onImageRemove={() => {
                setUserImage(null)
                setCurrentStep('photo')
                setTask(null)
              }}
              currentImage={userImage?.preview}
              label={t('upload.label')}
              description={t('upload.description')}
              loading={isProcessing}
              height="h-[220px]"
              iconType="user"
            />
            {userImage && (
              <p className="text-sm text-green-700 mt-3">{t('upload.ready')}</p>
            )}
          </div>

          <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-5')}>
            <h3 className="font-semibold text-gray-900 mb-2">
              <span className="text-blue-600 mr-2">2</span>
              {t('analyze.title')}
            </h3>
            <p className="text-sm text-gray-600 mb-4">{t('analyze.description')}</p>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!userImage || isProcessing || !hasQuota}
              className={cn(FACE_ANALYSIS_LAYOUT.primaryButton, 'w-full')}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin" />
                  {t('analyze.analyzing')}
                </>
              ) : (
                <>
                  <ScanFace className="w-4 h-4 mr-2" />
                  {isCompleted ? t('analyze.again') : t('analyze.button')}
                </>
              )}
            </button>
            <p className="flex items-center gap-1 text-xs text-gray-500 mt-3">
              <HelpCircle className="w-3.5 h-3.5" />
              {t('analyze.creditNote', { count: FACE_ANALYSIS_CREDIT_COST })}
            </p>
          </div>
        </div>

        <div className="order-3 lg:order-2">
          <div
            className={cn(
              'p-6',
              hasResult
                ? FACE_ANALYSIS_LAYOUT.resultPanelFilled
                : FACE_ANALYSIS_LAYOUT.resultPanelEmpty
            )}
          >
            {isProcessing && <LoadingState message={t('loading.message')} />}

            {hasResult && task.basicResult && (
              <FaceAnalysisResult
                task={task}
                onUnlock={handleUnlock}
                isUnlocking={isUnlocking}
              />
            )}

            {!isProcessing && !task && (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-base font-medium text-gray-700 mb-2">{t('empty.title')}</p>
                <p className="text-sm text-gray-500 max-w-md">{t('empty.description')}</p>
              </div>
            )}

            {!isProcessing && task?.status === 'failed' && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <p className="text-red-600 font-medium mb-2">{t('failed.title')}</p>
                <p className="text-sm text-gray-600 mb-4">{task.errorMessage || error}</p>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  className={FACE_ANALYSIS_LAYOUT.secondaryButton}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {t('failed.retry')}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="order-2 lg:order-3 lg:col-span-2 py-4 lg:py-0">
          {hasQuota ? (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                {t('footer.remainingCredits')}{' '}
                <strong className="text-gray-900">{remainingTrials}</strong>
              </p>
              <p className="text-xs text-gray-500 hidden sm:block">{t('footer.privacy')}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-gray-700">{t('footer.noCredits')}</p>
              <Link href={`/${locale}/pricing`} className={FACE_ANALYSIS_LAYOUT.primaryButton}>
                {t('footer.getCredits')}
              </Link>
            </div>
          )}
        </div>
      </div>

      {error && !task?.errorMessage && (
        <p className="mt-4 text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  )
}
