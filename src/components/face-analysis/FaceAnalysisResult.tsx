'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Glasses,
  Info,
  Loader2,
  Lock,
  Sparkles,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FACE_ANALYSIS_LAYOUT, getFaceShapeIcon } from '@/config/face-analysis'
import {
  FaceAnalysisMetric,
  FaceGeometryAnalysis,
  FaceAnalysisTaskResponse,
  FaceLandmarkPoint,
  FrameRecommendation,
  StyleTip,
} from '@/types/face-analysis'
import {
  detectFaceLandmarksFromImage,
  FaceLandmarkDetectionResult,
} from '@/lib/face-landmark-client'
import { FaceLandmarkMeshOverlay } from './FaceLandmarkMeshOverlay'
import { UnlockCreditsBanner } from './UnlockCreditsBanner'
import { FrameSearchSuggestions } from './FrameSearchSuggestions'
import { cn } from '@/utils/cn'
import { analytics } from '@/lib/analytics'
import {
  DEFAULT_TOP_PICK_PRESET_IDS,
  getTopPickPresetForStyle,
  type GlassesPreset,
} from '@/config/glasses-presets'

interface FaceAnalysisResultProps {
  task: FaceAnalysisTaskResponse
  onUnlock: () => void
  isUnlocking?: boolean
  remainingCredits?: number
}

export function FaceAnalysisResult({
  task,
  onUnlock,
  isUnlocking,
  remainingCredits = 0,
}: FaceAnalysisResultProps) {
  const params = useParams()
  const locale = (params.locale as string) || 'en'
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

  const isUnlocked = task.reportUnlocked && !!full
  const metrics = full?.metrics ?? []
  const recommended = full?.frameRecommendations ?? []
  const avoid = full?.avoidRecommendations ?? []
  const styleTips = full?.styleTips ?? []
  const tryOnStyles = full?.tryOnGuidance?.topStyles ?? recommended.slice(0, 4).map((item) => item.displayName)

  if (!basic) return null

  const geometry = full?.geometry ?? basic.geometry
  const hasMeasuredGeometry = geometry?.status === 'measured'

  return (
    <div className="space-y-4 sm:space-y-5">
      <div
        id="overview"
        className="scroll-mt-28 flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-gray-950 sm:text-xl">
              Your AI Face Shape Report
            </h2>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 sm:px-2.5 sm:py-1 sm:text-xs">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              {hasMeasuredGeometry ? 'Landmark measured' : 'AI-powered'}
            </span>
            {task.status === 'completed' && (
              <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700 sm:px-2.5 sm:py-1 sm:text-xs">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                {t('completed')}
              </span>
            )}
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-gray-500 sm:text-sm">
            {hasMeasuredGeometry
              ? 'Landmark-assisted proportions with AI styling guidance. Not medical or biometric advice.'
              : 'Style guidance for frame selection and AI try-on. Not medical or biometric advice.'}
          </p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.05fr)] xl:grid-cols-[250px_minmax(0,1fr)_270px]">
        <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'overflow-hidden p-3 sm:p-4')}>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[220px] overflow-hidden rounded-lg bg-gray-100 sm:max-w-[280px] xl:max-w-none">
            <Image
              src={task.userImageUrl}
              alt={t('yourPhoto')}
              fill
              className="object-cover"
              sizes="320px"
            />
            <FaceLandmarkMeshOverlay
              imageUrl={task.userImageUrl}
              className="absolute inset-0 h-full w-full pointer-events-none"
            />
          </div>
          <p className="mt-2 text-center text-[11px] text-gray-500 sm:text-xs">
            {hasMeasuredGeometry ? 'Live landmark mesh overlay' : t('wireframeCaption')}
          </p>
        </div>

        <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-4 sm:p-5')}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Your Face Shape</p>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 sm:h-[52px] sm:w-[52px]">
              <ShapeIcon className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <h3 className="text-2xl font-bold leading-tight capitalize text-gray-950 sm:text-3xl">
                {basic.faceShapeDisplayName?.replace(' Face', '') || basic.faceShape}
              </h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {confidencePercent !== null && (
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                    {confidencePercent}% confidence
                  </span>
                )}
                {hasMeasuredGeometry && (
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                    {geometry.qualityScore}% photo quality
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-gray-600">
            {full?.overview?.summary || basic.summary}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-gray-100 pt-4">
            {(metrics.length > 0 ? metrics.slice(1, 5) : fallbackMetricSummary(basic.keyFeatures)).map((metric) => (
              <div key={metric.label}>
                <p className="text-xs text-gray-500">{metric.label}</p>
                <p className="text-sm font-semibold text-gray-900">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-4 sm:p-5 lg:col-span-2 xl:col-span-1')}>
          <p className="mb-3 text-sm font-semibold text-gray-900">{t('keyFeatures')}</p>
          <ul className="grid gap-3 sm:grid-cols-2 xl:block xl:space-y-4">
            {(full?.overview?.strengths ?? basic.keyFeatures).slice(0, 5).map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm leading-6 text-gray-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-5">
        <div>
          <p className="text-sm font-semibold text-blue-950">
            See which frames suit your {basic.faceShapeDisplayName?.toLowerCase() || `${basic.faceShape} face`}
          </p>
          <p className="mt-1 text-sm leading-6 text-blue-800">
            Use virtual try-on as the visual check before choosing a frame.
          </p>
        </div>
        <Link
          href={`/${locale}/try-on/glasses?source=face-analysis`}
          onClick={() => analytics.trackTryOnFromFaceAnalysis(task.id, 0, 0, 'open_try_on')}
          className="mt-3 inline-flex w-full shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:mt-0 sm:w-auto"
        >
          <Glasses className="mr-2 h-4 w-4" />
          Open virtual try-on
        </Link>
      </section>

      {isUnlocked ? (
        <>
          {metrics.length > 0 && (
            <MetricsSection
              metrics={metrics}
              geometry={geometry}
              imageUrl={task.userImageUrl}
            />
          )}

          <div id="recommendations" className="scroll-mt-28 grid items-start gap-5 xl:grid-cols-2">
            <FrameRecommendationPanel
              title="Frames to Wear"
              subtitle="Best frame shapes that complement your face shape."
              badge="Top picks"
              badgeClassName="bg-green-50 text-green-700"
              recommendations={recommended}
            />
            <FrameRecommendationPanel
              title="Frames to Avoid"
              subtitle="Frame shapes that may not flatter your proportions."
              badge="Avoid"
              badgeClassName="bg-red-50 text-red-700"
              recommendations={avoid}
              isAvoid
            />
          </div>

          <div id="style-guide" className="scroll-mt-28 grid items-start gap-5 xl:grid-cols-2">
            <StyleGuidePanel tips={styleTips} />
            <TryOnTopPicksPanel
              styles={tryOnStyles}
              locale={locale}
              faceAnalysisTaskId={task.id}
              remainingCredits={remainingCredits}
              note={full?.tryOnGuidance?.note}
              cta={full?.tryOnGuidance?.cta}
            />
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <AlertTriangle className="mr-2 inline h-4 w-4 align-text-bottom" />
            {full?.overview?.disclaimer ||
              'AI-estimated style guidance based on the uploaded photo. Results are not medical or biometric measurements.'}
          </div>
        </>
      ) : (
        <LockedPremiumPreview
          bestFrames={previewBestFrames}
          framesToAvoid={previewFramesToAvoid}
          onUnlock={onUnlock}
          isUnlocking={isUnlocking}
          faceShape={basic.faceShape}
        />
      )}

      <FrameSearchSuggestions
        faceShape={basic.faceShape}
        catalogStyles={searchStyles}
      />
    </div>
  )
}

function MetricsSection({
  metrics,
  geometry,
  imageUrl,
}: {
  metrics: FaceAnalysisMetric[]
  geometry?: FaceGeometryAnalysis
  imageUrl: string
}) {
  const isMeasured = geometry?.status === 'measured'
  const landmarkDetection = useMetricLandmarkDetection(imageUrl, isMeasured)

  return (
    <section id="face-analysis-details" className={cn(FACE_ANALYSIS_LAYOUT.card, 'scroll-mt-28 p-4 sm:p-5')}>
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <h3 className="text-sm font-semibold text-gray-950">
            {isMeasured ? 'Measured Face Analysis Details' : 'Face Analysis Details'}
          </h3>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
          <Info className="h-3.5 w-3.5" />
          {isMeasured
            ? 'On-device landmarks estimate facial proportions before AI styling review.'
            : 'AI analyzes your facial structure and proportions.'}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        {metrics.map((metric) => (
          <div key={metric.id} className="rounded-lg border border-gray-200 bg-white p-3 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-4">
            <p className="text-xs font-semibold text-gray-950">{metric.label}</p>
            <MetricVisual metric={metric} landmarkDetection={landmarkDetection} />
            <p className="mt-2 text-xs font-semibold text-blue-700 sm:mt-3 sm:text-sm">{metric.value}</p>
            {metric.id === 'faceShape' ? (
              <p className="mt-1 text-[11px] font-semibold text-green-600 sm:text-xs">{metric.score}% Match</p>
            ) : (
              <p className="mt-1 text-[11px] font-semibold text-gray-950 sm:text-xs">{metric.caption}</p>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-500">
        <Info className="h-3.5 w-3.5 shrink-0" />
        {isMeasured
          ? 'Measurements are estimated from a single uploaded photo and can vary with angle, lighting, and pose.'
          : 'These measurements are estimated by AI and may not be 100% accurate.'}
      </div>
      {isMeasured && geometry.warnings.length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
          {geometry.warnings.join(' ')}
        </div>
      )}
    </section>
  )
}

function FrameRecommendationPanel({
  title,
  subtitle,
  badge,
  badgeClassName,
  recommendations,
  isAvoid = false,
}: {
  title: string
  subtitle: string
  badge: string
  badgeClassName: string
  recommendations: FrameRecommendation[]
  isAvoid?: boolean
}) {
  return (
    <section className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-4 sm:p-5')}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-950">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', badgeClassName)}>
          {badge}
        </span>
      </div>
      <div className={cn('grid gap-3', isAvoid ? 'sm:grid-cols-1' : 'grid-cols-2 xl:grid-cols-4')}>
        {recommendations.slice(0, isAvoid ? 3 : 4).map((item) => (
          <div
            key={item.type}
            className={cn(
              'rounded-xl border',
              isAvoid
                ? 'border-red-100 bg-red-50/40 p-3 sm:p-4'
                : 'border-gray-200 bg-white p-2.5 transition-shadow hover:shadow-sm sm:p-3'
            )}
          >
            {isAvoid ? (
              <>
                <div className="flex items-center gap-3">
                  <FramePresetThumbnail
                    preset={getTopPickPresetForStyle(item.displayName || item.type)}
                    alt={`${item.displayName} glasses`}
                    isAvoid
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-950">{item.displayName}</p>
                      <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                        {item.score}% match
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-gray-600">{item.reason}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <FramePresetProductImage
                  preset={getTopPickPresetForStyle(item.displayName || item.type)}
                  alt={`${item.displayName} glasses`}
                />
                <div className="mt-3">
                  <p className="text-sm font-semibold text-gray-950">{item.displayName}</p>
                  <p className="mt-1 text-xs font-semibold text-green-600">{item.score}% Match</p>
                  <p className="mt-1.5 text-xs leading-5 text-gray-600">{item.reason}</p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function StyleGuidePanel({ tips }: { tips: StyleTip[] }) {
  return (
    <section className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-4 sm:p-5')}>
      <h3 className="text-base font-semibold text-gray-950">Personal Style Guide</h3>
      <p className="mt-1 text-sm text-gray-500">Practical styling advice for your frame search.</p>
      <div className="mt-4 grid gap-3">
        {tips.map((tip) => (
          <div key={tip.title} className="rounded-xl border border-blue-100 bg-blue-50/40 p-3 sm:p-4">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-950">{tip.title}</p>
                <p className="mt-1 text-sm leading-6 text-gray-600">{tip.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function TryOnTopPicksPanel({
  styles,
  locale,
  faceAnalysisTaskId,
  remainingCredits,
  note,
  cta,
}: {
  styles: string[]
  locale: string
  faceAnalysisTaskId: string
  remainingCredits: number
  note?: string
  cta?: string
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [batchResult, setBatchResult] = useState<TopPicksBatchResult | null>(null)
  const requiredCredits = Math.min(Math.max(styles.length, 4), 4)
  const hasCredits = remainingCredits >= requiredCredits
  const generatedTasks = batchResult?.tasks ?? []
  const completedCount = generatedTasks.filter((task) => task.status === 'completed').length
  const processingCount = generatedTasks.filter((task) => task.status === 'processing').length
  const presetIds = getPresetIdsForStyles(styles)

  useEffect(() => {
    if (!batchResult || processingCount === 0) return

    let cancelled = false

    const pollProcessingTasks = async () => {
      const updates = await Promise.all(
        batchResult.tasks
          .filter((task) => task.status === 'processing')
          .map(async (task) => {
            try {
              const response = await fetch('/api/try-on/poll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId: task.taskId }),
              })
              const payload = await response.json()
              if (!response.ok || !payload.success) return null

              const status = String(payload.data?.status || '').toLowerCase()
              if (!['completed', 'failed', 'processing', 'pending'].includes(status)) return null

              return {
                taskId: task.taskId,
                status: status === 'pending' ? 'processing' : status,
                resultImageUrl: payload.data?.resultImageUrl ?? task.resultImageUrl ?? null,
                errorMessage: payload.data?.error ?? task.errorMessage ?? null,
              }
            } catch {
              return null
            }
          })
      )

      if (cancelled) return

      const validUpdates = updates.filter(Boolean) as Array<{
        taskId: string
        status: TopPicksBatchResult['tasks'][number]['status']
        resultImageUrl?: string | null
        errorMessage?: string | null
      }>

      if (validUpdates.length === 0) return

      setBatchResult((current) => {
        if (!current) return current
        return {
          ...current,
          tasks: current.tasks.map((task) => {
            const update = validUpdates.find((item) => item.taskId === task.taskId)
            return update ? { ...task, ...update } : task
          }),
        }
      })
    }

    const intervalId = window.setInterval(pollProcessingTasks, 7000)
    void pollProcessingTasks()

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [batchResult, processingCount])

  const handleGenerateTopPicks = async () => {
    setIsGenerating(true)
    setError(null)
    setBatchResult(null)
    analytics.trackTryOnFromFaceAnalysis(
      faceAnalysisTaskId,
      presetIds.length,
      requiredCredits,
      'generate_top_picks'
    )

    try {
      const response = await fetch('/api/face-analysis/top-picks-try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faceAnalysisTaskId, framePresetIds: presetIds }),
      })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to generate top picks try-on.')
      }

      setBatchResult(payload.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate top picks try-on.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <section className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-5')}>
      <h3 className="text-base font-semibold text-gray-950">Try On Your Top Picks</h3>
      <p className="mt-1 text-sm leading-6 text-gray-500">
        {note || 'Use these frame directions as your next try-on starting point before deciding what to buy.'}
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {styles.slice(0, 4).map((style) => (
          <div key={style} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <FramePresetThumbnail
                preset={getTopPickPresetForStyle(style)}
                alt={`${style} glasses`}
              />
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                Direction
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-950">{style}</p>
            <p className="mt-1 text-xs leading-5 text-gray-500">Try this frame direction with a real glasses image.</p>
          </div>
        ))}
      </div>
      {generatedTasks.length > 0 && (
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-gray-950">
              Generated top picks
            </p>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
              {processingCount > 0
                ? `${processingCount} processing`
                : `${completedCount}/${generatedTasks.length} completed`}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {generatedTasks.map((task) => (
              <div key={task.taskId} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="relative aspect-square bg-gray-50">
                  {task.resultImageUrl ? (
                    <Image
                      src={task.resultImageUrl}
                      alt={`${task.preset.name} try-on result`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 45vw, 240px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-4 text-center text-xs text-gray-500">
                      {task.status === 'failed' ? 'Generation failed' : 'Processing'}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-950">{task.preset.name}</p>
                  <p className={cn(
                    'mt-1 text-xs font-medium capitalize',
                    task.status === 'completed'
                      ? 'text-green-700'
                      : task.status === 'processing'
                        ? 'text-blue-700'
                        : 'text-red-600'
                  )}>
                    {task.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href={`/${locale}/dashboard`}
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
          >
            View in Dashboard
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm leading-6 text-red-700">
          {error}
        </div>
      )}

      {hasCredits ? (
        <button
          type="button"
          onClick={handleGenerateTopPicks}
          disabled={isGenerating}
          className="mt-5 inline-flex w-full items-center justify-center rounded-lg border border-blue-200 px-4 py-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Glasses className="mr-2 h-4 w-4" />
          )}
          {isGenerating ? 'Submitting 4 top picks...' : (cta || 'Generate 4 top picks on your photo')}
        </button>
      ) : (
        <Link
          href={`/${locale}/pricing`}
          className="mt-5 inline-flex w-full items-center justify-center rounded-lg border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-50"
        >
          <Glasses className="mr-2 h-4 w-4" />
          Get credits to try top picks
        </Link>
      )}
    </section>
  )
}

interface TopPicksBatchResult {
  batchId: string
  requiredCredits: number
  creditsUsed: number
  tasks: Array<{
    taskId: string
    status: 'completed' | 'failed' | 'processing'
    resultImageUrl?: string | null
    errorMessage?: string | null
    preset: {
      id: string
      name: string
      style: string
    }
  }>
}

function getPresetIdsForStyles(styles: string[]) {
  const ids = styles.slice(0, 4).map((style) => getTopPickPresetForStyle(style).id)
  const uniqueIds = Array.from(new Set(ids))

  for (const fallbackId of DEFAULT_TOP_PICK_PRESET_IDS) {
    if (uniqueIds.length >= 4) break
    if (!uniqueIds.includes(fallbackId)) {
      uniqueIds.push(fallbackId)
    }
  }

  return uniqueIds.slice(0, 4)
}

function FramePresetThumbnail({
  preset,
  alt,
  isAvoid = false,
}: {
  preset: GlassesPreset
  alt: string
  isAvoid?: boolean
}) {
  return (
    <div className={cn(
      'relative h-10 w-20 shrink-0 overflow-hidden rounded-lg border bg-white sm:h-12 sm:w-24',
      isAvoid ? 'border-red-100' : 'border-gray-100'
    )}>
      <Image
        src={`/${preset.assetPath}`}
        alt={alt}
        fill
        className="object-contain p-1.5"
        sizes="96px"
      />
    </div>
  )
}

function FramePresetProductImage({
  preset,
  alt,
}: {
  preset: GlassesPreset
  alt: string
}) {
  return (
    <div className="relative h-[62px] w-full overflow-hidden rounded-lg bg-white sm:h-[92px]">
      <Image
        src={`/${preset.assetPath}`}
        alt={alt}
        fill
        className="object-contain p-2"
        sizes="(max-width: 768px) 42vw, 180px"
      />
    </div>
  )
}

function LockedPremiumPreview({
  bestFrames,
  framesToAvoid,
  onUnlock,
  isUnlocking,
  faceShape,
}: {
  bestFrames: string[]
  framesToAvoid: string[]
  onUnlock: () => void
  isUnlocking?: boolean
  faceShape?: string
}) {
  return (
    <div className="space-y-5">
      <section className={cn(FACE_ANALYSIS_LAYOUT.card, 'relative overflow-hidden p-5')}>
        <div className="grid gap-5 md:grid-cols-3">
          <PremiumPreviewCard title="Face metrics" lines={['Face length', 'Face width', 'Jawline', 'Symmetry']} />
          <PremiumPreviewCard title="Best frames" lines={bestFrames.length ? bestFrames : ['Round frames', 'Aviator frames']} />
          <PremiumPreviewCard title="Style guide" lines={['Personalized frame notes', 'Fit and sizing tips', 'Try-on guidance']} />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 p-6 text-center backdrop-blur-[2px]">
          <Lock className="mb-3 h-9 w-9 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-950">Unlock your complete report</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-gray-600">
            See detailed metrics, frame scores, styles to avoid, and a personal style guide built for your face shape.
          </p>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-5')}>
          <p className="mb-3 text-sm font-semibold text-gray-900">Preview: best frame directions</p>
          <p className="text-sm leading-6 text-gray-600">{bestFrames.join(' · ')}</p>
        </div>
        <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-5')}>
          <p className="mb-3 text-sm font-semibold text-gray-900">Preview: styles to avoid</p>
          <p className="text-sm leading-6 text-gray-600">{framesToAvoid.join(' · ')}</p>
        </div>
      </div>

      <UnlockCreditsBanner onUnlock={onUnlock} isLoading={isUnlocking} faceShape={faceShape} />
    </div>
  )
}

function PremiumPreviewCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 blur-sm">
      <p className="mb-3 text-sm font-semibold text-gray-950">{title}</p>
      <div className="space-y-2">
        {lines.map((line) => (
          <div key={line} className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            {line}
          </div>
        ))}
      </div>
    </div>
  )
}

function useMetricLandmarkDetection(imageUrl: string, enabled: boolean) {
  const [detection, setDetection] = useState<FaceLandmarkDetectionResult | null>(null)

  useEffect(() => {
    if (!enabled) {
      setDetection(null)
      return
    }

    let cancelled = false
    const image = new window.Image()
    if (isCrossOriginUrl(imageUrl)) {
      image.crossOrigin = 'anonymous'
    }
    image.decoding = 'async'
    image.src = imageUrl

    async function detect() {
      try {
        await image.decode()
        if (cancelled) return
        const result = await detectFaceLandmarksFromImage(image)
        if (!cancelled) setDetection(result)
      } catch {
        if (!cancelled) setDetection(null)
      }
    }

    void detect()

    return () => {
      cancelled = true
    }
  }, [enabled, imageUrl])

  return detection
}

function isCrossOriginUrl(url: string) {
  if (typeof window === 'undefined') return false
  try {
    return new URL(url, window.location.href).origin !== window.location.origin
  } catch {
    return false
  }
}

function MetricVisual({
  metric,
  landmarkDetection,
}: {
  metric: FaceAnalysisMetric
  landmarkDetection: FaceLandmarkDetectionResult | null
}) {
  if (landmarkDetection?.landmarks.length) {
    return <LandmarkMetricVisual metric={metric} landmarks={landmarkDetection.landmarks} />
  }

  return <FallbackMetricVisual metric={metric} />
}

const FACE_OVAL_INDICES = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109, 10,
]

const JAWLINE_INDICES = [172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397]
const LEFT_EYE_INDICES = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7, 33]
const RIGHT_EYE_INDICES = [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249, 263]
const LEFT_BROW_INDICES = [70, 63, 105, 66, 107]
const RIGHT_BROW_INDICES = [336, 296, 334, 293, 300]
const NOSE_BRIDGE_INDICES = [168, 6, 197, 195, 5, 4, 1]
const NOSE_BASE_INDICES = [98, 97, 2, 326, 327]
const UPPER_LIP_INDICES = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291]
const LOWER_LIP_INDICES = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291]

function LandmarkMetricVisual({
  metric,
  landmarks,
}: {
  metric: FaceAnalysisMetric
  landmarks: FaceLandmarkPoint[]
}) {
  const mapPoint = createLandmarkMiniMapper(landmarks)
  const outlinePath = buildPath(FACE_OVAL_INDICES, landmarks, mapPoint)
  const jawPath = buildPath(JAWLINE_INDICES, landmarks, mapPoint)
  const top = landmarks[10]
  const chin = landmarks[152]
  const leftFace = landmarks[234]
  const rightFace = landmarks[454]
  const leftCheek = landmarks[123]
  const rightCheek = landmarks[352]
  const noseBridge = landmarks[168]
  const eyeLeft = landmarks[33]
  const eyeRight = landmarks[263]

  return (
    <div className="relative mx-auto mt-2 h-[74px] w-[74px] sm:mt-3 sm:h-[108px] sm:w-[108px]">
      <svg viewBox="0 0 120 120" className="h-full w-full" fill="none" aria-hidden>
        <LandmarkSketch landmarks={landmarks} mapPoint={mapPoint} outlinePath={outlinePath} />
        {eyeLeft && eyeRight && (
          <line
            {...lineProps(mapPoint(eyeLeft), mapPoint(eyeRight))}
            stroke="#94A3B8"
            strokeWidth="1"
            opacity="0.24"
            strokeDasharray="2.5 5"
          />
        )}

        {metric.id === 'faceShape' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            <path d={outlinePath} stroke="rgba(37,99,235,0.18)" strokeWidth="7" />
            <path d={outlinePath} stroke="#2563EB" strokeWidth="3" />
          </g>
        )}

        {metric.id === 'faceLength' && top && chin && (
          <g strokeLinecap="round">
            <line {...lineProps(mapPoint(top), mapPoint(chin))} stroke="rgba(37,99,235,0.18)" strokeWidth="7" />
            <line {...lineProps(mapPoint(top), mapPoint(chin))} stroke="#2563EB" strokeWidth="2.8" />
            <MetricPoint point={mapPoint(top)} />
            <MetricPoint point={mapPoint(chin)} />
          </g>
        )}

        {metric.id === 'faceWidth' && leftFace && rightFace && (
          <g strokeLinecap="round">
            <line {...lineProps(mapPoint(leftFace), mapPoint(rightFace))} stroke="rgba(37,99,235,0.18)" strokeWidth="7" />
            <line
              {...lineProps(mapPoint(leftFace), mapPoint(rightFace))}
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeDasharray="3 4.5"
            />
            <MetricPoint point={mapPoint(leftFace)} fill="#60A5FA" />
            <MetricPoint point={mapPoint(rightFace)} fill="#60A5FA" />
          </g>
        )}

        {metric.id === 'jawline' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            <path d={jawPath} stroke="rgba(37,99,235,0.18)" strokeWidth="8" />
            <path d={jawPath} stroke="#2563EB" strokeWidth="4" />
          </g>
        )}

        {metric.id === 'cheekbones' && leftCheek && rightCheek && (
          <g>
            <line
              {...lineProps(mapPoint(leftCheek), mapPoint(rightCheek))}
              stroke="#2563EB"
              strokeWidth="1.8"
              strokeDasharray="3 5"
              opacity="0.6"
            />
            <MetricCheek point={mapPoint(leftCheek)} />
            <MetricCheek point={mapPoint(rightCheek)} />
          </g>
        )}

        {metric.id === 'symmetry' && top && chin && noseBridge && (
          <g strokeLinecap="round">
            <line
              x1={mapPoint(noseBridge).x}
              y1={mapPoint(top).y}
              x2={mapPoint(noseBridge).x}
              y2={mapPoint(chin).y}
              stroke="rgba(37,99,235,0.18)"
              strokeWidth="7"
            />
            <line
              x1={mapPoint(noseBridge).x}
              y1={mapPoint(top).y}
              x2={mapPoint(noseBridge).x}
              y2={mapPoint(chin).y}
              stroke="#2563EB"
              strokeWidth="3"
            />
          </g>
        )}
      </svg>
    </div>
  )
}

function LandmarkSketch({
  landmarks,
  mapPoint,
  outlinePath,
}: {
  landmarks: FaceLandmarkPoint[]
  mapPoint: (point: FaceLandmarkPoint) => { x: number; y: number }
  outlinePath: string
}) {
  const sketchPaths = [
    { d: outlinePath, width: 1.25, opacity: 0.34 },
    { d: buildPath(LEFT_EYE_INDICES, landmarks, mapPoint), width: 1, opacity: 0.3 },
    { d: buildPath(RIGHT_EYE_INDICES, landmarks, mapPoint), width: 1, opacity: 0.3 },
    { d: buildPath(LEFT_BROW_INDICES, landmarks, mapPoint), width: 1, opacity: 0.24 },
    { d: buildPath(RIGHT_BROW_INDICES, landmarks, mapPoint), width: 1, opacity: 0.24 },
    { d: buildPath(NOSE_BRIDGE_INDICES, landmarks, mapPoint), width: 1, opacity: 0.25 },
    { d: buildPath(NOSE_BASE_INDICES, landmarks, mapPoint), width: 1, opacity: 0.22 },
    { d: buildPath(UPPER_LIP_INDICES, landmarks, mapPoint), width: 1, opacity: 0.27 },
    { d: buildPath(LOWER_LIP_INDICES, landmarks, mapPoint), width: 1, opacity: 0.23 },
  ]

  return (
    <g stroke="#64748B" strokeLinecap="round" strokeLinejoin="round">
      {sketchPaths.map((path, index) => (
        path.d ? (
          <path
            key={index}
            d={path.d}
            strokeWidth={path.width}
            opacity={path.opacity}
          />
        ) : null
      ))}
    </g>
  )
}

function MetricPoint({
  point,
  fill = '#2563EB',
}: {
  point: { x: number; y: number }
  fill?: string
}) {
  return <circle cx={point.x} cy={point.y} r="3" fill={fill} stroke="white" strokeWidth="1.2" />
}

function MetricCheek({ point }: { point: { x: number; y: number } }) {
  return (
    <>
      <ellipse cx={point.x} cy={point.y} rx="9.5" ry="11.5" fill="rgba(37,99,235,0.14)" />
      <ellipse cx={point.x} cy={point.y} rx="7.5" ry="9.8" fill="#60A5FA" opacity="0.86" />
    </>
  )
}

function createLandmarkMiniMapper(landmarks: FaceLandmarkPoint[]) {
  const facePoints = FACE_OVAL_INDICES
    .map((index) => landmarks[index])
    .filter((point): point is FaceLandmarkPoint => Boolean(point))
  const xs = facePoints.map((point) => point.x)
  const ys = facePoints.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const width = Math.max(maxX - minX, 0.001)
  const height = Math.max(maxY - minY, 0.001)
  const scale = 82 / Math.max(width, height)
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  return (point: FaceLandmarkPoint) => ({
    x: 60 + (point.x - centerX) * scale,
    y: 60 + (point.y - centerY) * scale,
  })
}

function buildPath(
  indices: number[],
  landmarks: FaceLandmarkPoint[],
  mapPoint: (point: FaceLandmarkPoint) => { x: number; y: number }
) {
  const points = indices
    .map((index) => landmarks[index])
    .filter((point): point is FaceLandmarkPoint => Boolean(point))
    .map(mapPoint)

  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${roundSvg(point.x)} ${roundSvg(point.y)}`)
    .join(' ')
}

function lineProps(start: { x: number; y: number }, end: { x: number; y: number }) {
  return {
    x1: start.x,
    y1: start.y,
    x2: end.x,
    y2: end.y,
  }
}

function roundSvg(value: number) {
  return Math.round(value * 10) / 10
}

function FallbackMetricVisual({ metric }: { metric: FaceAnalysisMetric }) {
  const shapePath = metric.id === 'faceShape' ? getFaceShapeMetricPath(metric.value) : null

  return (
    <div className="relative mx-auto mt-2 h-[74px] w-[74px] sm:mt-3 sm:h-[108px] sm:w-[108px]">
      <Image
        src="/assets/face-analysis/neutral-face-wireframe.png"
        alt="Neutral face analysis wireframe"
        fill
        className="object-contain opacity-90"
        sizes="108px"
      />
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full" fill="none" aria-hidden>
        {shapePath && (
          <g strokeLinecap="round" strokeLinejoin="round">
            <path d={shapePath} stroke="rgba(37,99,235,0.18)" strokeWidth="7" />
            <path d={shapePath} stroke="#2563EB" strokeWidth="3.2" />
            <path d="M38 31c6.8-8.2 15.4-11.6 22-11.6s15.2 3.4 22 11.6" stroke="#60A5FA" strokeWidth="1.6" opacity="0.9" />
          </g>
        )}
        {metric.id === 'faceLength' && (
          <g strokeLinecap="round">
            <line x1="60" y1="18" x2="60" y2="104" stroke="rgba(37,99,235,0.18)" strokeWidth="7" />
            <line x1="60" y1="18" x2="60" y2="104" stroke="#2563EB" strokeWidth="2.8" />
            <line x1="41" y1="20" x2="60" y2="20" stroke="#60A5FA" strokeDasharray="3 5" strokeWidth="2" />
            <line x1="41" y1="102" x2="60" y2="102" stroke="#60A5FA" strokeDasharray="3 5" strokeWidth="2" />
            <circle cx="60" cy="20" r="3" fill="#2563EB" stroke="white" strokeWidth="1.2" />
            <circle cx="60" cy="102" r="3" fill="#2563EB" stroke="white" strokeWidth="1.2" />
          </g>
        )}
        {metric.id === 'faceWidth' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            <line x1="30" y1="58" x2="90" y2="58" stroke="rgba(37,99,235,0.18)" strokeWidth="7" />
            <line x1="30" y1="58" x2="90" y2="58" stroke="#2563EB" strokeDasharray="3 4.5" strokeWidth="2.5" />
            <circle cx="32" cy="58" r="4.5" fill="#60A5FA" stroke="white" strokeWidth="1.2" />
            <circle cx="88" cy="58" r="4.5" fill="#60A5FA" stroke="white" strokeWidth="1.2" />
          </g>
        )}
        {metric.id === 'jawline' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            <path d="M36.5 69c3 16.5 14 29 23.5 31.5C69.5 98 80.5 85.5 83.5 69" stroke="rgba(37,99,235,0.18)" strokeWidth="8" />
            <path d="M37 69c2.8 16 13.5 28.5 23 31 9.5-2.5 20.2-15 23-31" stroke="#2563EB" strokeWidth="4.2" />
            <path d="M47 86c8 6.6 18 6.6 26 0" stroke="#60A5FA" strokeWidth="2" />
          </g>
        )}
        {metric.id === 'cheekbones' && (
          <g>
            <ellipse cx="36" cy="61" rx="9.5" ry="11.5" fill="rgba(37,99,235,0.14)" />
            <ellipse cx="84" cy="61" rx="9.5" ry="11.5" fill="rgba(37,99,235,0.14)" />
            <ellipse cx="36" cy="61" rx="7.5" ry="9.8" fill="#60A5FA" opacity="0.86" />
            <ellipse cx="84" cy="61" rx="7.5" ry="9.8" fill="#60A5FA" opacity="0.86" />
            <path d="M45 58c9 3.5 21 3.5 30 0" stroke="#2563EB" strokeDasharray="3 5" strokeWidth="1.7" strokeLinecap="round" opacity="0.65" />
          </g>
        )}
        {metric.id === 'symmetry' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            <line x1="60" y1="17" x2="60" y2="104" stroke="rgba(37,99,235,0.18)" strokeWidth="7" />
            <line x1="60" y1="17" x2="60" y2="104" stroke="#2563EB" strokeWidth="3" />
            <path d="M60 19c13 3.5 24 18 24 39 0 23-9.5 38-24 44" stroke="#60A5FA" strokeWidth="2.1" />
            <path d="M60 19c-13 3.5-24 18-24 39 0 23 9.5 38 24 44" stroke="#60A5FA" strokeWidth="1.4" opacity="0.35" />
          </g>
        )}
      </svg>
    </div>
  )
}

function getFaceShapeMetricPath(value: string) {
  const shape = value.toLowerCase()
  if (shape.includes('round')) {
    return 'M60 18c19.5 0 33 14.8 34 36.5 1 23.5-12.5 41-26.5 49-3.2 1.8-5.8 2.7-7.5 2.7s-4.3-.9-7.5-2.7C38.5 95.5 25 78 26 54.5 27 32.8 40.5 18 60 18Z'
  }
  if (shape.includes('square')) {
    return 'M60 14c18.5 0 31 13.5 31.5 35.5.5 23.5-9 44.5-24.5 53.5-3 1.8-5.4 2.7-7 2.7s-4-.9-7-2.7C37.5 94 28 73 28.5 49.5 29 27.5 41.5 14 60 14Z'
  }
  if (shape.includes('heart')) {
    return 'M60 15c18.5 0 32 12.5 33 33 1.2 25.5-13.5 45-26 55.5-3 2.5-5.4 3.7-7 3.7s-4-1.2-7-3.7C40.5 93 25.8 73.5 27 48 28 27.5 41.5 15 60 15Z'
  }
  if (shape.includes('diamond')) {
    return 'M60 15c16 0 26 13 31 34 2 8.5-1 22-8 34-5.8 10-15.5 21.5-23 24-7.5-2.5-17.2-14-23-24-7-12-10-25.5-8-34 5-21 15-34 31-34Z'
  }
  if (shape.includes('oblong')) {
    return 'M60 10c17 0 28 14.5 29 38 1.2 30.5-9.8 49-22 58.5-3 2.3-5.4 3.5-7 3.5s-4-1.2-7-3.5C40.8 97 29.8 78.5 31 48c1-23.5 12-38 29-38Z'
  }
  if (shape.includes('triangle')) {
    return 'M60 17c17 0 27.5 12.5 29 31.5 1.8 24.5-7.8 44-22 54-3 2.1-5.4 3.2-7 3.2s-4-1.1-7-3.2c-14.2-10-23.8-29.5-22-54C32.5 29.5 43 17 60 17Z'
  }
  return 'M60 13c18 0 30 14 31 36 1 26-10 45-24 56-3 2.5-5.5 3.5-7 3.5s-4-1-7-3.5C39 94 28 75 29 49c1-22 13-36 31-36Z'
}

function fallbackMetricSummary(features: string[]) {
  return features.slice(0, 4).map((feature, index) => ({
    label: ['Structure', 'Balance', 'Frame Fit', 'Style'][index] ?? 'Feature',
    value: feature,
  }))
}
