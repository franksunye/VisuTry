'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
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
  FaceAnalysisTaskResponse,
  FrameRecommendation,
  StyleTip,
} from '@/types/face-analysis'
import { FaceWireframeOverlay } from './FaceWireframeOverlay'
import { UnlockCreditsBanner } from './UnlockCreditsBanner'
import { FrameSearchSuggestions } from './FrameSearchSuggestions'
import { cn } from '@/utils/cn'
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

  const handleDownload = () => {
    window.print()
  }

  if (!basic) return null

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900">Your AI Face Shape Report</h2>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              AI-powered
            </span>
            {task.status === 'completed' && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                {t('completed')}
              </span>
            )}
          </div>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Style guidance for frame selection and AI try-on. Not medical or biometric advice.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          disabled={!isUnlocked}
          className="inline-flex items-center justify-center rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
        >
          <Download className="mr-2 h-4 w-4" />
          {isUnlocked ? 'Download Report' : 'Unlock to Download'}
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[250px_minmax(0,1fr)_270px]">
        <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'overflow-hidden p-4')}>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[280px] overflow-hidden rounded-lg bg-gray-100 xl:max-w-none">
            <Image
              src={task.userImageUrl}
              alt={t('yourPhoto')}
              fill
              className="object-cover"
              sizes="320px"
            />
            <FaceWireframeOverlay className="absolute inset-0 h-full w-full pointer-events-none" />
          </div>
          <p className="mt-3 text-center text-xs text-gray-500">{t('wireframeCaption')}</p>
        </div>

        <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-5')}>
          <p className="mb-3 text-sm font-semibold text-gray-900">Your Face Shape</p>
          <div className="flex items-center gap-4">
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <ShapeIcon className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-3xl font-bold leading-tight capitalize text-gray-950">
                {basic.faceShapeDisplayName?.replace(' Face', '') || basic.faceShape}
              </h3>
              {confidencePercent !== null && (
                <span className="mt-2 inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                  {confidencePercent}% confidence
                </span>
              )}
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

        <div className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-5')}>
          <p className="mb-4 text-sm font-semibold text-gray-900">{t('keyFeatures')}</p>
          <ul className="space-y-4">
            {(full?.overview?.strengths ?? basic.keyFeatures).slice(0, 5).map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-gray-700">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {isUnlocked ? (
        <>
          {metrics.length > 0 && <MetricsSection metrics={metrics} />}

          <div className="grid items-start gap-5 xl:grid-cols-2">
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

          <div className="grid items-start gap-5 xl:grid-cols-2">
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

function MetricsSection({ metrics }: { metrics: FaceAnalysisMetric[] }) {
  return (
    <section className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-4 sm:p-5')}>
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <h3 className="text-sm font-semibold text-gray-950">Face Analysis Details</h3>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
          <Info className="h-3.5 w-3.5" />
          AI analyzes your facial structure and proportions.
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {metrics.map((metric) => (
          <div key={metric.id} className="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold text-gray-950">{metric.label}</p>
            <MetricVisual metric={metric} />
            <p className="mt-3 text-sm font-semibold text-blue-700">{metric.value}</p>
            {metric.id === 'faceShape' ? (
              <p className="mt-1 text-xs font-semibold text-green-600">{metric.score}% Match</p>
            ) : (
              <p className="mt-1 text-xs font-semibold text-gray-950">{metric.caption}</p>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-500">
        <Info className="h-3.5 w-3.5 shrink-0" />
        These measurements are estimated by AI and may not be 100% accurate.
      </div>
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
    <section className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-5')}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-950">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', badgeClassName)}>
          {badge}
        </span>
      </div>
      <div className={cn('grid gap-3', isAvoid ? 'sm:grid-cols-1' : 'sm:grid-cols-2')}>
        {recommendations.slice(0, isAvoid ? 3 : 4).map((item) => (
          <div
            key={item.type}
            className={cn(
              'rounded-xl border',
              isAvoid
                ? 'border-red-100 bg-red-50/40 p-4'
                : 'border-gray-200 bg-white p-3 transition-shadow hover:shadow-sm'
            )}
          >
            {isAvoid ? (
              <>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <FramePresetThumbnail
                    preset={getTopPickPresetForStyle(item.displayName || item.type)}
                    alt={`${item.displayName} glasses`}
                    isAvoid
                  />
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                    {item.score}% match
                  </span>
                </div>
                <p className="font-semibold text-gray-950">{item.displayName}</p>
                <p className="mt-1 text-xs leading-5 text-gray-600">{item.reason}</p>
              </>
            ) : (
              <>
                <FramePresetProductImage
                  preset={getTopPickPresetForStyle(item.displayName || item.type)}
                  alt={`${item.displayName} glasses`}
                />
                <div className="mt-3">
                  <p className="text-sm font-semibold text-gray-950">{item.displayName}</p>
                  <p className="mt-1 text-sm font-semibold text-green-600">{item.score}% Match</p>
                  <p className="mt-2 text-xs leading-5 text-gray-600">{item.reason}</p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      {!isAvoid && (
        <div className="mt-5 border-t border-gray-100 pt-4 text-center">
          <button
            type="button"
            className="inline-flex items-center text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
          >
            View all frame recommendations
            <span className="ml-1">→</span>
          </button>
        </div>
      )}
    </section>
  )
}

function StyleGuidePanel({ tips }: { tips: StyleTip[] }) {
  return (
    <section className={cn(FACE_ANALYSIS_LAYOUT.card, 'p-5')}>
      <h3 className="text-base font-semibold text-gray-950">Personal Style Guide</h3>
      <p className="mt-1 text-sm text-gray-500">Practical styling advice for your frame search.</p>
      <div className="mt-5 grid gap-3">
        {tips.map((tip) => (
          <div key={tip.title} className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
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
  const creditLabel = remainingCredits === 1 ? '1 credit' : `${remainingCredits} credits`
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
      <div className={cn(
        'mt-5 rounded-xl border p-4 text-sm leading-6',
        hasCredits ? 'border-blue-100 bg-blue-50/60 text-blue-950' : 'border-amber-200 bg-amber-50 text-amber-950'
      )}>
        {hasCredits ? (
          <>
            Each AI glasses try-on uses 1 credit per generated photo. You have{' '}
            <span className="font-semibold">{creditLabel}</span> available. Generating this 4-frame comparison will use up to{' '}
            <span className="font-semibold">{requiredCredits} credits</span>; failed generations are not charged.
          </>
        ) : (
          <>
            Each AI glasses try-on uses 1 credit per generated photo. You need{' '}
            <span className="font-semibold">{requiredCredits} credits</span> for this top-picks comparison, and you currently have{' '}
            <span className="font-semibold">{creditLabel}</span>.
          </>
        )}
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
      'relative h-12 w-24 shrink-0 overflow-hidden rounded-lg border bg-white',
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
    <div className="relative h-[92px] w-full overflow-hidden rounded-lg bg-white">
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

function MetricVisual({ metric }: { metric: FaceAnalysisMetric }) {
  return (
    <div className="relative mx-auto mt-3 h-[108px] w-[108px]">
      <Image
        src="/assets/face-analysis/neutral-face-wireframe.png"
        alt="Neutral face analysis wireframe"
        fill
        className="object-contain opacity-95"
        sizes="108px"
      />
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full" fill="none" aria-hidden>
        {metric.id === 'faceShape' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            <path d="M60 13c18 0 30 14 31 36 1 26-10 45-24 56-3 2.5-5.5 3.5-7 3.5s-4-1-7-3.5C39 94 28 75 29 49c1-22 13-36 31-36Z" stroke="#2563EB" strokeWidth="3" />
            <path d="M37 31c7-10 16-14 23-14s16 4 23 14" stroke="#2563EB" strokeWidth="2" />
          </g>
        )}
        {metric.id === 'faceLength' && (
          <g strokeLinecap="round">
            <line x1="60" y1="18" x2="60" y2="104" stroke="#2563EB" strokeWidth="2.7" />
            <line x1="41" y1="20" x2="60" y2="20" stroke="#2563EB" strokeDasharray="2 6" strokeWidth="2" />
            <line x1="41" y1="102" x2="60" y2="102" stroke="#2563EB" strokeDasharray="2 6" strokeWidth="2" />
            <circle cx="60" cy="20" r="2.4" fill="#60A5FA" />
            <circle cx="60" cy="102" r="2.4" fill="#60A5FA" />
          </g>
        )}
        {metric.id === 'faceWidth' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            <line x1="30" y1="58" x2="90" y2="58" stroke="#2563EB" strokeDasharray="2.5 4.5" strokeWidth="2.6" />
            <circle cx="32" cy="58" r="4" fill="#60A5FA" />
            <circle cx="88" cy="58" r="4" fill="#60A5FA" />
          </g>
        )}
        {metric.id === 'jawline' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            <path d="M37 69c2.8 16 13.5 28.5 23 31 9.5-2.5 20.2-15 23-31" stroke="#2563EB" strokeWidth="4" />
            <path d="M46 85c8.4 7.2 19.6 7.2 28 0" stroke="#2563EB" strokeWidth="2.4" />
          </g>
        )}
        {metric.id === 'cheekbones' && (
          <g>
            <ellipse cx="36" cy="61" rx="7.5" ry="9.8" fill="#60A5FA" opacity="0.82" />
            <ellipse cx="84" cy="61" rx="7.5" ry="9.8" fill="#60A5FA" opacity="0.82" />
          </g>
        )}
        {metric.id === 'symmetry' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            <line x1="60" y1="17" x2="60" y2="104" stroke="#2563EB" strokeWidth="3" />
            <path d="M60 19c13 3.5 24 18 24 39 0 23-9.5 38-24 44" stroke="#2563EB" strokeWidth="2.2" />
            <path d="M60 19c-13 3.5-24 18-24 39 0 23 9.5 38 24 44" stroke="#2563EB" strokeWidth="1.4" opacity="0.35" />
          </g>
        )}
      </svg>
    </div>
  )
}

function fallbackMetricSummary(features: string[]) {
  return features.slice(0, 4).map((feature, index) => ({
    label: ['Structure', 'Balance', 'Frame Fit', 'Style'][index] ?? 'Feature',
    value: feature,
  }))
}
