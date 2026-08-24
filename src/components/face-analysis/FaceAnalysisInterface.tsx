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
import { analytics, getCheckoutAttribution, getUserType, type ProductType } from '@/lib/analytics'
import { analyzeFaceGeometryFromFile } from '@/lib/face-landmark-client'
import { consumeFaceAnalysisPhotoHandoff } from '@/lib/face-analysis-photo-handoff'
import { PRICE_CONFIG, QUOTA_CONFIG } from '@/config/pricing'
import { FaceAnalysisStepper } from './FaceAnalysisStepper'
import { FaceAnalysisResult } from './FaceAnalysisResult'
import { cn } from '@/utils/cn'

type Step = 'photo' | 'analysis' | 'report' | 'analyzing'

const REPORT_NAV_ITEMS = [
  { label: 'Overview', href: '#overview' },
  { label: 'Face Analysis', href: '#face-analysis-details' },
  { label: 'Recommendations', href: '#recommendations' },
  { label: 'Style Guide', href: '#style-guide' },
]

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
  const handledPhotoHandoffRef = useRef<string | null>(null)
  const handoffPreviewUrlRef = useRef<string | null>(null)

  const remainingTrials = session?.user?.remainingTrials ?? 0
  const hasQuota = remainingTrials >= FACE_ANALYSIS_CREDIT_COST
  const purchasedCreditsRemaining = Math.max(
    0,
    (session?.user?.creditsPurchased ?? 0) - (session?.user?.creditsUsed ?? 0)
  )
  const willUseIncludedAnalysisCredit = Boolean(
    session
      && !session.user.isPremiumActive
      && purchasedCreditsRemaining === 0
      && (session.user.freeTrialsUsed ?? 0) < QUOTA_CONFIG.FREE_TRIAL
  )
  const userType = getUserType(
    !!session?.user?.isPremiumActive,
    purchasedCreditsRemaining,
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
      const geometry = await analyzeFaceGeometryFromFile(userImage.file)
      const formData = new FormData()
      formData.append('userImage', userImage.file)
      formData.append('clientSubmissionId', crypto.randomUUID())
      formData.append('geometryAnalysis', JSON.stringify(geometry))
      formData.append('siteLocale', locale)

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
      const successUrl = `${window.location.origin}/${locale}/face-analysis?unlock=success&taskId=${task.id}&session_id={CHECKOUT_SESSION_ID}`
      const cancelUrl = `${window.location.origin}/${locale}/face-analysis?unlock=cancel&taskId=${task.id}&checkout_product=CREDITS_PACK&checkout_value=${PRICE_CONFIG.CREDITS_PACK / 100}`

      const response = await fetch('/api/payment/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType: 'CREDITS_PACK',
          successUrl,
          cancelUrl,
          unlockTaskId: task.id,
          attribution: getCheckoutAttribution(locale),
          locale,
        }),
      })

      const json = await response.json()
      if (!json.success || !json.data?.url) {
        throw new Error(json.error || 'Failed to create checkout session')
      }

      analytics.trackBeginCheckout(
        'CREDITS_PACK' as ProductType,
        PRICE_CONFIG.CREDITS_PACK / 100,
        {
          checkoutSessionId: json.data.sessionId,
          purchaseContext: 'face_analysis_report',
          faceAnalysisTaskId: task.id,
        },
      )
      window.location.href = json.data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
      setIsUnlocking(false)
    }
  }

  useEffect(() => {
    const source = searchParams.get('source')
    const handoffId = searchParams.get('photoHandoff')
    if (source !== 'free-face-shape-detector' || !handoffId) return
    if (handledPhotoHandoffRef.current === handoffId) return
    handledPhotoHandoffRef.current = handoffId

    let cancelled = false
    consumeFaceAnalysisPhotoHandoff(handoffId)
      .then((file) => {
        if (cancelled || !file) return

        const preview = URL.createObjectURL(file)
        handoffPreviewUrlRef.current = preview
        setUserImage({ file, preview })
        setCurrentStep('analysis')
        setTask(null)
        setError(null)
        analytics.trackFaceAnalysisUpload(file.type || 'unknown', file.size, userType, 'detector_handoff')
        analytics.trackFaceAnalysisPhotoHandoffRestored(searchParams.get('faceShape'))
      })
      .catch(() => {
        // Private browsing and browser storage policies may make the handoff unavailable.
        // The standard upload control remains the safe fallback.
      })
      .finally(() => {
        if (cancelled) return
        const nextUrl = new URL(window.location.href)
        if (nextUrl.searchParams.get('photoHandoff') === handoffId) {
          nextUrl.searchParams.delete('photoHandoff')
          window.history.replaceState(null, '', nextUrl.toString())
        }
      })

    return () => {
      cancelled = true
    }
  }, [searchParams, userType])

  useEffect(() => {
    return () => {
      if (handoffPreviewUrlRef.current) URL.revokeObjectURL(handoffPreviewUrlRef.current)
    }
  }, [])

  useEffect(() => {
    const unlock = searchParams.get('unlock')
    const taskId = searchParams.get('taskId')
    if (!taskId) return

    const queryKey = `${taskId}:${unlock ?? ''}`
    if (handledQueryRef.current === queryKey) return
    handledQueryRef.current = queryKey

    if (unlock === 'success') {
      // Consume the one-shot payment return marker before refreshing the
      // session. session.update() temporarily sets NextAuth to loading; if a
      // gate ever remounts this component, the clean URL prevents the unlock
      // flow from starting again.
      const nextUrl = new URL(window.location.href)
      nextUrl.searchParams.delete('unlock')
      handledQueryRef.current = `${taskId}:`
      window.history.replaceState(null, '', nextUrl.toString())

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
  const hideEmptyResultOnMobile = !userImage && !isProcessing && !isRestoringTask && !task

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
        <div className="order-1 space-y-4 sm:space-y-5">
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
              <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-4 sm:p-5')}>
                <div className="mb-3 flex items-center justify-between sm:mb-4">
                  <h3 className="font-semibold text-gray-900">
                    <span className="mr-2 text-blue-600">1</span>
                    {t('upload.title')}
                  </h3>
                  {userImage && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      {t('upload.uploaded')}
                    </span>
                  )}
                </div>
                <ImageUpload
                  onImageSelect={(file, preview) => {
                    if (handoffPreviewUrlRef.current) {
                      URL.revokeObjectURL(handoffPreviewUrlRef.current)
                      handoffPreviewUrlRef.current = null
                    }
                    analytics.trackFaceAnalysisUpload(file.type || 'unknown', file.size, userType)
                    setUserImage({ file, preview })
                    setCurrentStep('analysis')
                    setTask(null)
                    setError(null)
                  }}
                  onImageRemove={() => {
                    if (handoffPreviewUrlRef.current) {
                      URL.revokeObjectURL(handoffPreviewUrlRef.current)
                      handoffPreviewUrlRef.current = null
                    }
                    setUserImage(null)
                    setCurrentStep('photo')
                    setTask(null)
                  }}
                  currentImage={userImage?.preview}
                  label={t('upload.label')}
                  description={t('upload.description')}
                  loading={isProcessing}
                  height="h-[176px] sm:h-[220px]"
                  iconType="user"
                />
                {userImage && (
                  <p className="mt-2 text-sm text-green-700 sm:mt-3">{t('upload.ready')}</p>
                )}
              </div>

              <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-4 sm:p-5')}>
                <h3 className="mb-2 font-semibold text-gray-900">
                  <span className="mr-2 text-blue-600">2</span>
                  {t('analyze.title')}
                </h3>
                <p className="mb-3 text-sm text-gray-600 sm:mb-4">{t('analyze.description')}</p>
                {hasQuota ? (
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={!userImage || isProcessing}
                    className={cn(FACE_ANALYSIS_LAYOUT.primaryButton, 'w-full')}
                  >
                    {isProcessing ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        {t('analyze.analyzing')}
                      </>
                    ) : (
                      <>
                        <ScanFace className="mr-2 h-4 w-4" />
                        {isCompleted ? t('analyze.again') : t('analyze.button')}
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    href={`/${locale}/pricing`}
                    className={cn(FACE_ANALYSIS_LAYOUT.primaryButton, 'w-full')}
                    onClick={() => analytics.trackViewPricing('face_analysis', userType, remainingTrials)}
                  >
                    {t('footer.getCredits')}
                  </Link>
                )}
                <p className="mt-3 flex items-center gap-1 text-xs text-gray-500">
                  <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                  {hasQuota
                    ? willUseIncludedAnalysisCredit
                      ? t('analyze.includedCreditNote')
                      : t('analyze.creditNote', { count: FACE_ANALYSIS_CREDIT_COST })
                    : t('footer.noCredits')}
                </p>
              </div>
            </>
          )}
        </div>

        <div className={cn('order-2 2xl:order-2', hideEmptyResultOnMobile && 'hidden lg:block')}>
          <div
            className={cn(
              hasResult ? 'p-4 sm:p-6' : 'p-3 sm:p-5 lg:p-6',
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
                onCreditsChanged={() => update()}
              />
            )}

            {!isProcessing && !isRestoringTask && !task && (
              <div className="flex h-full flex-col items-center justify-center p-2 text-center sm:p-6">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 sm:mb-4 sm:h-20 sm:w-20">
                  <Sparkles className="h-5 w-5 text-gray-400 sm:h-10 sm:w-10" />
                </div>
                <p className="mb-1 text-sm font-medium text-gray-700 sm:mb-2 sm:text-base">{t('empty.title')}</p>
                <p className="max-w-md text-xs leading-5 text-gray-500 sm:text-sm">{t('empty.description')}</p>
              </div>
            )}

            {!isProcessing && task?.status === 'failed' && (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                <p className="mb-2 font-medium text-red-600">{t('failed.title')}</p>
                <p className="mb-4 text-sm text-gray-600">{task.errorMessage || error}</p>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  className={FACE_ANALYSIS_LAYOUT.secondaryButton}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {t('failed.retry')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && !task?.errorMessage && (
        <p className="mt-4 text-center text-sm text-red-600">{error}</p>
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
  const [activeHref, setActiveHref] = useState('#overview')

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash
      if (REPORT_NAV_ITEMS.some((item) => item.href === hash)) {
        setActiveHref(hash)
      }
    }

    syncFromHash()
    window.addEventListener('hashchange', syncFromHash)

    if (typeof IntersectionObserver === 'undefined') {
      return () => window.removeEventListener('hashchange', syncFromHash)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]

        if (visible?.target.id) {
          setActiveHref(`#${visible.target.id}`)
        }
      },
      {
        rootMargin: '-22% 0px -68% 0px',
        threshold: 0.01,
      }
    )

    REPORT_NAV_ITEMS.forEach((item) => {
      const target = document.getElementById(item.href.slice(1))
      if (target) observer.observe(target)
    })

    return () => {
      window.removeEventListener('hashchange', syncFromHash)
      observer.disconnect()
    }
  }, [])

  return (
    <aside className="grid gap-4 lg:grid-cols-[1fr_1.2fr] 2xl:sticky 2xl:top-24 2xl:block 2xl:space-y-4">
      <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-3 sm:p-4')}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-950">Analysis Completed</p>
            <p className="text-xs text-gray-500">Completed on {completedDate}</p>
          </div>
          <button
            type="button"
            onClick={onAnalyzeAgain}
            className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 2xl:hidden"
          >
            Retake
          </button>
        </div>
      </div>

      <nav className={cn(FACE_ANALYSIS_LAYOUT.card, 'hidden p-2 2xl:block')}>
        {REPORT_NAV_ITEMS.map((item, index) => {
          const isActive = activeHref === item.href
          return (
            <a
              key={item.label}
              href={item.href}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => setActiveHref(item.href)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-blue-50 hover:text-blue-700',
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold shadow-sm',
                  isActive ? 'text-blue-700' : 'text-gray-600'
                )}
              >
                {index + 1}
              </span>
              {item.label}
            </a>
          )
        })}
      </nav>

      <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'hidden p-4 2xl:block')}>
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
          {task.userImageUrl ? (
            <Image
              src={task.userImageUrl}
              unoptimized
              alt="Your analyzed photo"
              fill
              className="object-cover"
              sizes="260px"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-xs text-gray-500">
              Photo available after the report is unlocked.
            </div>
          )}
        </div>
        <p className="mt-3 text-center text-xs leading-5 text-gray-500">
          Clear lighting and a front-facing photo help improve frame guidance.
        </p>
      </div>

      <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'hidden border-blue-200 bg-blue-50/60 p-4 2xl:block')}>
        <div className="mb-3 flex items-center justify-center text-blue-600">
          <Sparkles className="h-7 w-7" />
        </div>
        <p className="text-center text-sm font-semibold text-gray-950">
          {task.reportUnlocked ? 'Premium Report Unlocked' : 'Report Preview'}
        </p>
        <ul className="mt-3 space-y-1.5 text-left text-xs leading-5 text-gray-600">
          {[
            'Detailed face analysis',
            'Personalized frame picks',
            'Style and fit guidance',
            'Lifetime access',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-blue-600" />
              <span>{item}</span>
            </li>
          ))}
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
