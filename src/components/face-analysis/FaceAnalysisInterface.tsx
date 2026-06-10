'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Camera, CheckCircle2, HelpCircle, RotateCcw, ScanFace, Sparkles } from 'lucide-react'
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
  const [isRestoringTask, setIsRestoringTask] = useState(false)
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
        const completedTask = {
          ...json.data.task,
          createdAt: json.data.task.createdAt || new Date().toISOString(),
          progress: 100,
        }
        setTask({
          ...completedTask,
        })
        setIsProcessing(false)
        setCurrentStep('report')
        const nextUrl = new URL(window.location.href)
        nextUrl.searchParams.set('taskId', completedTask.id)
        nextUrl.searchParams.delete('unlock')
        window.history.replaceState(null, '', nextUrl.toString())
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
      setIsRestoringTask(true)
      refreshTask(taskId, { syncSession: true })
        .then(() => {
          analytics.trackFaceAnalysisUnlockSuccess(taskId)
        })
        .finally(() => setIsRestoringTask(false))
      return
    }

    if (!unlock) {
      setIsRestoringTask(true)
      refreshTask(taskId, { syncSession: false }).finally(() => setIsRestoringTask(false))
    }
  }, [searchParams, refreshTask])

  const stepperStep =
    currentStep === 'analyzing' ? 'analyzing' : currentStep === 'report' ? 'report' : currentStep

  const hasResult = !isProcessing && task?.status === 'completed' && !!task.basicResult

  return (
    <div className={FACE_ANALYSIS_LAYOUT.container}>
      <FaceAnalysisStepper currentStep={stepperStep} />

      <div
        className={cn(
          hasResult
            ? 'flex flex-col gap-5 2xl:grid 2xl:grid-cols-[260px_minmax(0,1fr)]'
            : FACE_ANALYSIS_LAYOUT.grid
        )}
      >
        <div className="space-y-5 order-1">
          {hasResult && task?.basicResult ? (
            <ReportSideRail
              task={task}
              remainingTrials={remainingTrials}
              onAnalyzeAgain={() => {
                setTask(null)
                setCurrentStep(userImage ? 'analysis' : 'photo')
                setError(null)
                const nextUrl = new URL(window.location.href)
                nextUrl.searchParams.delete('taskId')
                nextUrl.searchParams.delete('unlock')
                window.history.replaceState(null, '', nextUrl.toString())
              }}
            />
          ) : isRestoringTask ? (
            <ReportRailSkeleton />
          ) : (
            <>
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
            </>
          )}
        </div>

        <div className="order-3 2xl:order-2">
          <div
            className={cn(
              hasResult ? 'p-5 sm:p-6' : 'p-6',
              hasResult
                ? FACE_ANALYSIS_LAYOUT.resultPanelFilled
                : FACE_ANALYSIS_LAYOUT.resultPanelEmpty
            )}
          >
            {(isProcessing || isRestoringTask) && (
              <LoadingState message={isRestoringTask ? 'Restoring your report...' : t('loading.message')} />
            )}

            {hasResult && task.basicResult && (
              <FaceAnalysisResult
                task={task}
                onUnlock={handleUnlock}
                isUnlocking={isUnlocking}
                remainingCredits={remainingTrials}
              />
            )}

            {!isProcessing && !isRestoringTask && !task && (
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

        <div className="order-2 2xl:order-3 2xl:col-span-2 py-4 2xl:py-0">
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

function ReportRailSkeleton() {
  return (
    <aside className="grid gap-4 lg:grid-cols-[1fr_1.2fr] 2xl:block 2xl:space-y-4">
      <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-4')}>
        <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
      </div>
      <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-4 lg:row-span-2 2xl:row-span-1')}>
        <div className="space-y-3">
          <div className="h-8 animate-pulse rounded-lg bg-blue-50" />
          <div className="h-8 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-8 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-8 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </div>
      <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'hidden p-4 lg:block')}>
        <div className="aspect-[4/5] animate-pulse rounded-lg bg-gray-100" />
      </div>
    </aside>
  )
}

function ReportSideRail({
  task,
  remainingTrials,
  onAnalyzeAgain,
}: {
  task: FaceAnalysisTaskResponse
  remainingTrials: number
  onAnalyzeAgain: () => void
}) {
  const completedDate = new Date(task.createdAt).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <aside className="grid gap-4 lg:grid-cols-[1fr_1.2fr] 2xl:sticky 2xl:top-24 2xl:block 2xl:space-y-4">
      <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-4')}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-950">Analysis Completed</p>
            <p className="text-xs text-gray-500">Completed on {completedDate}</p>
          </div>
        </div>
      </div>

      <nav className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-2 lg:row-span-2 2xl:row-span-1')}>
        {['Overview', 'Face Analysis', 'Recommendations', 'Style Guide'].map((item, index) => (
          <div
            key={item}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
              index === 0 ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
            )}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold shadow-sm">
              {index + 1}
            </span>
            {item}
          </div>
        ))}
      </nav>

      <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'hidden p-4 lg:block')}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-950">Your Photo</p>
          <button
            type="button"
            onClick={onAnalyzeAgain}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Retake
          </button>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-gray-100">
          <Image
            src={task.userImageUrl}
            alt="Your analyzed photo"
            fill
            className="object-cover"
            sizes="260px"
          />
        </div>
        <p className="mt-3 text-center text-xs leading-5 text-gray-500">
          Clear lighting and a front-facing photo help improve frame guidance.
        </p>
      </div>

      <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'border-blue-200 bg-blue-50/60 p-4 lg:hidden 2xl:block')}>
        <div className="mb-3 flex items-center justify-center text-blue-600">
          <Sparkles className="h-7 w-7" />
        </div>
        <p className="text-center text-sm font-semibold text-gray-950">
          {task.reportUnlocked ? 'Premium Report Unlocked' : 'Report Preview'}
        </p>
        <ul className="mt-3 space-y-2 text-xs leading-5 text-gray-600">
          <li>Detailed face analysis</li>
          <li>Personalized frame picks</li>
          <li>Style and fit guidance</li>
        </ul>
        <div className="mt-4 rounded-lg bg-white px-3 py-2 text-center text-sm font-semibold text-gray-800 shadow-sm">
          {remainingTrials} credits left
        </div>
        <button
          type="button"
          onClick={onAnalyzeAgain}
          className="mt-3 flex w-full items-center justify-center rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Re-analyze Photo
        </button>
      </div>
    </aside>
  )
}
