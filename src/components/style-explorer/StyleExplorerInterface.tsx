'use client'

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  Glasses,
  Info,
  Loader2,
  RefreshCw,
  RotateCcw,
  Share2,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react'
import { ImageUpload } from '@/components/upload/ImageUpload'
import {
  STYLE_EXPLORER_GLASSES_PRESETS,
  getTopPickPresetById,
  type GlassesPreset,
  type StyleIntent,
  type StyleOccasion,
} from '@/config/glasses-presets'
import { analytics } from '@/lib/analytics'
import { selectStyleExplorerFrames } from '@/lib/style-explorer/frame-selector'
import { getStyleLookCopy } from '@/lib/style-explorer/look-copy'
import type {
  StyleExplorerCategoryFilter,
  StyleLookCopy,
} from '@/lib/style-explorer/types'
import { cn } from '@/utils/cn'

type TaskStatus = 'queued' | 'processing' | 'completed' | 'failed'
type TaskPreset = Pick<GlassesPreset, 'id' | 'name' | 'style' | 'assetPath'>

interface ExplorerTask {
  taskId: string
  status: TaskStatus
  resultImageUrl?: string | null
  errorMessage?: string | null
  preset: TaskPreset
}

interface ExplorerBatch {
  batchId: string
  requiredCredits: number
  remainingCreditsBefore: number
  recovered?: boolean
  startedAt?: string
  userImageUrl?: string | null
  tasks: ExplorerTask[]
}

interface UploadedImage {
  file?: File
  preview: string
}

const STYLE_OPTIONS: Array<{ value: StyleIntent; label: string }> = [
  { value: 'professional', label: 'Professional' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'classic', label: 'Classic' },
  { value: 'creative', label: 'Creative' },
  { value: 'bold', label: 'Bold' },
  { value: 'vacation', label: 'Vacation' },
]

const CATEGORY_OPTIONS: Array<{ value: StyleExplorerCategoryFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'optical', label: 'Optical' },
  { value: 'sunglasses', label: 'Sunglasses' },
]

const OCCASION_OPTIONS: Array<{ value: StyleOccasion; label: string }> = [
  { value: 'everyday', label: 'Everyday' },
  { value: 'work', label: 'Work' },
  { value: 'weekend', label: 'Weekend' },
  { value: 'outdoor', label: 'Outdoor' },
]

const FRAME_DISPATCH_STAGGER_MS = 3000

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function normalizeStatus(status: unknown): TaskStatus {
  const value = String(status || '').toLowerCase()
  if (value === 'queued' || value === 'completed' || value === 'failed') return value
  return 'processing'
}

function queuedTask(batchId: string, preset: TaskPreset, index: number): ExplorerTask {
  return {
    taskId: `queued-${batchId}-${preset.id}-${index}`,
    status: 'queued',
    resultImageUrl: null,
    errorMessage: null,
    preset,
  }
}

export function StyleExplorerInterface({ initialRemainingCredits = 0 }: { initialRemainingCredits?: number }) {
  const params = useParams()
  const locale = (params.locale as string) || 'en'
  const { data: session, update } = useSession()
  const remainingCredits = session?.user?.remainingTrials ?? initialRemainingCredits
  const [userImage, setUserImage] = useState<UploadedImage | null>(null)
  const [styleIntent, setStyleIntent] = useState<StyleIntent>('minimal')
  const [category, setCategory] = useState<StyleExplorerCategoryFilter>('all')
  const [occasion, setOccasion] = useState<StyleOccasion>('work')
  const [recommendationIds, setRecommendationIds] = useState<string[]>(() =>
    selectStyleExplorerFrames({ styleIntent: 'minimal', category: 'all', occasion: 'work', limit: 4 })
      .map((item) => item.presetId),
  )
  const [batch, setBatch] = useState<ExplorerBatch | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null)
  const [detailTask, setDetailTask] = useState<ExplorerTask | null>(null)
  const [shareNotice, setShareNotice] = useState<string | null>(null)

  const recommendedPresets = useMemo(
    () => recommendationIds.map(getTopPickPresetById).filter(Boolean) as GlassesPreset[],
    [recommendationIds],
  )
  const completedCount = batch?.tasks.filter((task) => task.status === 'completed').length ?? 0
  const failedTasks = batch?.tasks.filter((task) => task.status === 'failed') ?? []
  const activeCount = batch?.tasks.filter((task) => task.status === 'queued' || task.status === 'processing').length ?? 0
  const isLocked = isSubmitting || isRetrying || activeCount > 0
  const canGenerate = Boolean(userImage?.file && !batch && recommendationIds.length === 4 && remainingCredits >= 4 && !isLocked)

  const recommend = (
    nextStyle = styleIntent,
    nextCategory = category,
    nextOccasion = occasion,
    exclusions: string[] = [],
    pins: string[] = [],
  ) => {
    const ids = selectStyleExplorerFrames({
      styleIntent: nextStyle,
      category: nextCategory,
      occasion: nextOccasion,
      limit: 4,
      exclusionIds: exclusions,
      pinnedPresetIds: pins,
    }).map((item) => item.presetId)
    setRecommendationIds(ids)
    analytics.trackCustomEvent('style_explorer_frames_recommended', {
      style_intent: nextStyle,
      category: nextCategory,
      occasion: nextOccasion,
      preset_ids: ids.join(','),
    })
  }

  useEffect(() => {
    analytics.trackCustomEvent('style_explorer_viewed')
  }, [])

  useEffect(() => {
    if (!batch || activeCount === 0) return
    let cancelled = false

    const poll = async () => {
      const updates = await Promise.all(batch.tasks
        .filter((task) => task.status === 'processing' && !task.taskId.startsWith('queued-') && !task.taskId.includes('-failed'))
        .map(async (task) => {
          try {
            const response = await fetch('/api/try-on/poll', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ taskId: task.taskId }),
            })
            const payload = await response.json()
            if (!response.ok || !payload.success) return null
            return {
              taskId: task.taskId,
              status: normalizeStatus(payload.data?.status),
              resultImageUrl: payload.data?.resultImageUrl ?? task.resultImageUrl ?? null,
              errorMessage: payload.data?.error ?? payload.data?.errorMessage ?? task.errorMessage ?? null,
            }
          } catch {
            return null
          }
        }))

      if (cancelled) return
      const valid = updates.filter(Boolean) as Array<Partial<ExplorerTask> & { taskId: string }>
      if (!valid.length) return
      setBatch((current) => current ? ({
        ...current,
        tasks: current.tasks.map((task) => {
          const next = valid.find((item) => item.taskId === task.taskId)
          return next ? { ...task, ...next } : task
        }),
      }) : current)
    }

    const interval = window.setInterval(poll, 7000)
    void poll()
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [activeCount, batch])

  useEffect(() => {
    if (!batch || activeCount !== 0) return
    void update()
    const failed = batch.tasks.filter((task) => task.status === 'failed').length
    analytics.trackCustomEvent(failed ? 'style_explorer_generation_partial' : 'style_explorer_generation_completed', {
      batch_id: batch.batchId,
      completed_count: completedCount,
      failed_count: failed,
    })
  }, [activeCount, batch, completedCount, update])

  useEffect(() => {
    if (batch || isSubmitting || isRetrying) return
    let cancelled = false

    const recover = async () => {
      try {
        const response = await fetch('/api/try-on/glasses/style-explorer/current')
        const payload = await response.json()
        if (!response.ok || !payload.success || !payload.data || cancelled) return
        const recovered = {
          ...payload.data,
          tasks: payload.data.tasks.map((task: ExplorerTask) => ({ ...task, status: normalizeStatus(task.status) })),
        } as ExplorerBatch
        setBatch(recovered)
        setRecommendationIds(recovered.tasks.map((task) => task.preset.id))
        if (recovered.userImageUrl) setUserImage({ preview: recovered.userImageUrl })
        if (payload.data.styleIntent) setStyleIntent(payload.data.styleIntent)
        if (payload.data.occasion) setOccasion(payload.data.occasion)
        if (payload.data.category) setCategory(payload.data.category)
      } catch {
        // Recovery is opportunistic.
      }
    }

    void recover()
    return () => {
      cancelled = true
    }
  }, [batch, isRetrying, isSubmitting])

  const dispatchFrames = async (
    batchId: string,
    presets: Array<TaskPreset & { batchIndex?: number; lookKey?: string }>,
    batchSize: number,
  ) => {
    if (!userImage?.file) return

    for (let index = 0; index < presets.length; index += 1) {
      if (index > 0) await sleep(FRAME_DISPATCH_STAGGER_MS)
      const preset = presets[index]
      const batchIndex = typeof preset.batchIndex === 'number' ? preset.batchIndex : index
      try {
        const formData = new FormData()
        formData.append('userImage', userImage.file)
        formData.append('framePresetId', preset.id)
        formData.append('batchId', batchId)
        formData.append('batchSize', String(batchSize))
        formData.append('batchIndex', String(batchIndex))
        formData.append('styleIntent', styleIntent)
        formData.append('occasion', occasion)
        formData.append('category', category)
        formData.append('lookKey', preset.lookKey ?? `${styleIntent}-${preset.id}`)

        const response = await fetch('/api/try-on/glasses/style-explorer/frame', { method: 'POST', body: formData })
        const payload = await response.json()
        if (!response.ok || !payload.success) throw new Error(payload.error || `Failed to submit ${preset.name}`)
        const task = { ...payload.data.task, status: normalizeStatus(payload.data.task.status) } as ExplorerTask
        setBatch((current) => current ? ({
          ...current,
          tasks: current.tasks.map((item) => item.preset.id === preset.id ? task : item),
        }) : current)
      } catch (reason) {
        const failed = {
          ...queuedTask(batchId, preset, batchIndex),
          status: 'failed' as const,
          errorMessage: reason instanceof Error ? reason.message : `Failed to submit ${preset.name}`,
        }
        setBatch((current) => current ? ({
          ...current,
          tasks: current.tasks.map((item) => item.preset.id === preset.id ? failed : item),
        }) : current)
      }
    }
  }

  const handleGenerate = async () => {
    if (!userImage?.file || recommendationIds.length !== 4) return
    if (remainingCredits < 4) {
      setError('Style Explorer needs 4 credits to create four distinct looks.')
      return
    }
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/try-on/glasses/style-explorer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ styleIntent, occasion, category, presetIds: recommendationIds }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Style Explorer failed to start')
      const nextBatch = {
        ...payload.data,
        tasks: payload.data.presets.map((preset: TaskPreset, index: number) =>
          queuedTask(payload.data.batchId, preset, index)),
      } as ExplorerBatch
      setBatch(nextBatch)
      analytics.trackCustomEvent('style_explorer_generation_started', {
        batch_id: payload.data.batchId,
        preset_ids: recommendationIds.join(','),
        style_intent: styleIntent,
        occasion,
        category,
      })
      await dispatchFrames(payload.data.batchId, payload.data.presets, 4)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Style Explorer failed to start')
    } finally {
      setIsSubmitting(false)
    }
  }

  const retryFailed = async () => {
    if (!userImage?.file || !batch || !failedTasks.length) {
      setError('Upload your photo again to retry failed looks.')
      return
    }
    if (remainingCredits < failedTasks.length) {
      setError(`You need ${failedTasks.length} credits to retry failed looks.`)
      return
    }
    setIsRetrying(true)
    setError(null)
    const retryPresets = failedTasks.map((task, index) => ({ ...task.preset, batchIndex: index }))
    setBatch((current) => current ? ({
      ...current,
      tasks: current.tasks.map((task) => {
        const retry = retryPresets.find((preset) => preset.id === task.preset.id)
        return retry ? queuedTask(current.batchId, retry, retry.batchIndex) : task
      }),
    }) : current)
    await dispatchFrames(batch.batchId, retryPresets, batch.tasks.length)
    setIsRetrying(false)
  }

  const download = async (task: ExplorerTask) => {
    if (!task.resultImageUrl) return
    analytics.trackCustomEvent('style_explorer_download_clicked', { task_id: task.taskId })
    try {
      const response = await fetch(task.resultImageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `visutry-style-${task.taskId}.jpg`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError('Download failed. Please try again.')
    }
  }

  const share = async (task: ExplorerTask) => {
    const shareUrl = `${window.location.origin}/${locale}/share/${task.taskId}`
    analytics.trackCustomEvent('style_explorer_share_clicked', { task_id: task.taskId })
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My VisuTry eyewear look',
          text: 'Check out this eyewear look I created with VisuTry.',
          url: shareUrl,
        })
        setShareNotice('Shared')
      } else {
        await navigator.clipboard.writeText(shareUrl)
        setShareNotice('Link copied')
      }
      analytics.trackCustomEvent('style_explorer_share_completed', { task_id: task.taskId })
      window.setTimeout(() => setShareNotice(null), 2000)
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'AbortError') return
      try {
        await navigator.clipboard.writeText(shareUrl)
        setShareNotice('Link copied')
      } catch {
        setError('Could not share this look.')
      }
    }
  }

  const reset = () => {
    setBatch(null)
    setError(null)
    setDetailTask(null)
    analytics.trackCustomEvent('style_explorer_explore_again_clicked')
  }

  const replacementOptions = STYLE_EXPLORER_GLASSES_PRESETS.filter((preset) => (
    (category === 'all' || preset.category === category) && !recommendationIds.includes(preset.id)
  ))

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-gray-950">Style Explorer</h1>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">NEW</span>
          </div>
          <p className="mt-1 text-sm text-gray-600">Discover how different eyewear styles can change your look.</p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm">
          <span className="font-semibold text-gray-700">Credits</span>
          <span className="font-bold text-gray-950">{remainingCredits}</span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <StepHeading number="1" title="Your Photo" />
            <ImageUpload
              currentImage={userImage?.preview}
              loading={isLocked}
              onImageSelect={(file, preview) => {
                setUserImage({ file, preview })
                setBatch(null)
                analytics.trackCustomEvent('style_explorer_photo_uploaded', { file_type: file.type })
              }}
              onImageRemove={() => {
                setUserImage(null)
                setBatch(null)
              }}
              label="Your photo"
              description="Clear front-facing photo"
              height="h-[210px]"
              iconType="user"
            />
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <StepHeading number="2" title="Define Your Style" />
            <ControlGroup label="Style Intent">
              <div className="grid grid-cols-3 gap-2">
                {STYLE_OPTIONS.map((option) => (
                  <ChoiceButton
                    key={option.value}
                    active={styleIntent === option.value}
                    disabled={isLocked}
                    onClick={() => {
                      setStyleIntent(option.value)
                      setBatch(null)
                      recommend(option.value, category, occasion)
                      analytics.trackCustomEvent('style_explorer_style_selected', { style_intent: option.value })
                    }}
                  >
                    {option.label}
                  </ChoiceButton>
                ))}
              </div>
            </ControlGroup>
            <ControlGroup label="Frame Category">
              <div className="grid grid-cols-3 gap-2">
                {CATEGORY_OPTIONS.map((option) => (
                  <ChoiceButton
                    key={option.value}
                    active={category === option.value}
                    disabled={isLocked}
                    onClick={() => {
                      setCategory(option.value)
                      setBatch(null)
                      recommend(styleIntent, option.value, occasion)
                      analytics.trackCustomEvent('style_explorer_category_selected', { category: option.value })
                    }}
                  >
                    {option.label}
                  </ChoiceButton>
                ))}
              </div>
            </ControlGroup>
            <ControlGroup label="Occasion (Optional)">
              <div className="grid grid-cols-4 gap-2">
                {OCCASION_OPTIONS.map((option) => (
                  <ChoiceButton
                    key={option.value}
                    active={occasion === option.value}
                    disabled={isLocked}
                    onClick={() => {
                      setOccasion(option.value)
                      setBatch(null)
                      recommend(styleIntent, category, option.value)
                      analytics.trackCustomEvent('style_explorer_occasion_selected', { occasion: option.value })
                    }}
                  >
                    {option.label}
                  </ChoiceButton>
                ))}
              </div>
            </ControlGroup>

            <div className="mt-4 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-600">Recommended Frames</h3>
              <button
                type="button"
                disabled={isLocked}
                onClick={() => {
                  recommend(styleIntent, category, occasion, recommendationIds)
                  analytics.trackCustomEvent('style_explorer_frames_refreshed')
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 disabled:text-gray-400"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {recommendedPresets.map((preset, index) => (
                <button
                  key={preset.id}
                  type="button"
                  disabled={isLocked}
                  onClick={() => setReplaceIndex(index)}
                  className="rounded-md border border-gray-200 p-1.5 text-center hover:border-blue-400 disabled:cursor-not-allowed"
                  title={`Replace ${preset.name}`}
                >
                  <img src={`/${preset.assetPath}`} alt={preset.name} className="aspect-square w-full object-contain" />
                  <span className="mt-1 block truncate text-[10px] font-semibold text-gray-700">{preset.name}</span>
                </button>
              ))}
            </div>

            {remainingCredits < 4 && (
              <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Four looks require 4 credits. You currently have {remainingCredits}.{' '}
                <Link href={`/${locale}/pricing`} className="font-bold underline">Get credits</Link>
              </p>
            )}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isLocked ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isLocked ? 'Exploring Looks...' : 'Explore 4 Looks'}
            </button>
            <p className="mt-2 text-center text-xs text-gray-500">Uses 4 credits</p>
          </section>
        </aside>

        <section className="min-h-[680px] rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <StepHeading number="3" title={batch ? 'Your Looks' : 'Explore Your Looks'} />
            {batch && activeCount === 0 && (
              <div className="flex gap-2">
                <Link
                  href={`/${locale}/dashboard/history`}
                  onClick={() => analytics.trackCustomEvent('style_explorer_dashboard_clicked')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700 hover:border-blue-300"
                >
                  View in Dashboard
                </Link>
                <button onClick={reset} className="rounded-lg border border-blue-300 px-3 py-2 text-xs font-bold text-blue-700">
                  Explore Again
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <XCircle className="mt-0.5 h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          {shareNotice && (
            <div className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-gray-950 px-4 py-2 text-sm font-semibold text-white">
              {shareNotice}
            </div>
          )}

          {!userImage && !batch ? (
            <EmptyWorkspace presets={recommendedPresets} />
          ) : !batch ? (
            <PreviewGrid presets={recommendedPresets} styleIntent={styleIntent} occasion={occasion} />
          ) : (
            <>
              {activeCount > 0 && (
                <p className="mb-4 text-sm text-gray-500">
                  Creating your {styleIntent} looks for {occasion}. This may take a few moments. You can leave this page
                  and check completed results in Dashboard History.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                {batch.tasks.map((task) => {
                  const preset = getTopPickPresetById(task.preset.id)
                  const look = preset ? getStyleLookCopy(preset, styleIntent, occasion) : null
                  return (
                    <ResultCard
                      key={task.taskId}
                      task={task}
                      look={look}
                      onDetail={() => task.status === 'completed' && setDetailTask(task)}
                      onDownload={() => download(task)}
                      onShare={() => share(task)}
                    />
                  )
                })}
              </div>
              {activeCount === 0 && (
                <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="inline-flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" /> Saved automatically to your Dashboard History.
                  </p>
                  {failedTasks.length > 0 && (
                    <button
                      type="button"
                      onClick={retryFailed}
                      disabled={isRetrying || remainingCredits < failedTasks.length}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:bg-gray-300"
                    >
                      <RotateCcw className="h-4 w-4" /> Retry Failed ({failedTasks.length})
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {replaceIndex !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/50 p-4" onClick={() => setReplaceIndex(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="replace-frame-title"
            className="max-h-[80vh] w-full max-w-3xl overflow-auto rounded-xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 id="replace-frame-title" className="font-bold text-gray-950">Replace this frame</h2>
                <p className="text-sm text-gray-500">The other three recommendations stay unchanged.</p>
              </div>
              <button onClick={() => setReplaceIndex(null)} aria-label="Close replacement selector"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {replacementOptions.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setRecommendationIds((current) => current.map((id, index) => index === replaceIndex ? preset.id : id))
                    setReplaceIndex(null)
                    analytics.trackCustomEvent('style_explorer_frame_replaced', { preset_id: preset.id })
                  }}
                  className="rounded-lg border border-gray-200 p-3 text-left hover:border-blue-400"
                >
                  <img src={`/${preset.assetPath}`} alt={preset.name} className="aspect-square w-full object-contain" />
                  <p className="mt-2 text-xs font-bold text-gray-900">{preset.name}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {detailTask && (
        <LookDrawer
          task={detailTask}
          locale={locale}
          styleIntent={styleIntent}
          occasion={occasion}
          onClose={() => setDetailTask(null)}
          onDownload={() => download(detailTask)}
          onShare={() => share(detailTask)}
        />
      )}
    </main>
  )
}

function StepHeading({ number, title }: { number: string; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">{number}</span>
      <h2 className="text-sm font-bold text-gray-950">{title}</h2>
    </div>
  )
}

function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold text-gray-600">{label}</p>
      {children}
    </div>
  )
}

function ChoiceButton({ active, disabled, onClick, children }: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded-md border px-2 py-2 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        active ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300',
      )}
    >
      {children}
    </button>
  )
}

function EmptyWorkspace({ presets }: { presets: GlassesPreset[] }) {
  return (
    <div className="flex min-h-[590px] flex-col items-center justify-center text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Glasses className="h-10 w-10" />
      </span>
      <h2 className="mt-5 text-xl font-bold text-gray-950">Discover four distinct looks</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-gray-600">
        We&apos;ll select frames that match your style and create four different looks for you.
      </p>
      <div className="mt-8 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
        {presets.map((preset, index) => (
          <div key={preset.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <img src={`/${preset.assetPath}`} alt="" className="aspect-square w-full object-contain opacity-50" />
            <p className="mt-2 text-xs font-semibold text-gray-500">Look {index + 1}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewGrid({ presets, styleIntent, occasion }: {
  presets: GlassesPreset[]
  styleIntent: StyleIntent
  occasion: StyleOccasion
}) {
  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">Based on {styleIntent} style for {occasion}.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {presets.map((preset, index) => {
          const look = getStyleLookCopy(preset, styleIntent, occasion)
          return (
            <article key={preset.id} className="overflow-hidden rounded-lg border border-gray-200">
              <div className="flex aspect-[2/1] items-center justify-center bg-gray-50 p-5">
                <img src={`/${preset.assetPath}`} alt={preset.name} className="h-full w-full object-contain" />
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-gray-950">{index + 1}. {look.name}</h3>
                <TagList tags={look.tags} />
                <p className="mt-3 text-sm leading-5 text-gray-600">{look.summary}</p>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function ResultCard({ task, look, onDetail, onDownload, onShare }: {
  task: ExplorerTask
  look: StyleLookCopy | null
  onDetail: () => void
  onDownload: () => void
  onShare: () => void
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <button type="button" onClick={onDetail} className="relative block aspect-[4/3] w-full bg-gray-50 text-left">
        {task.status === 'completed' && task.resultImageUrl ? (
          <img src={task.resultImageUrl} alt={`${look?.name ?? task.preset.name} result`} className="h-full w-full object-cover" />
        ) : task.status === 'failed' ? (
          <span className="flex h-full flex-col items-center justify-center px-6 text-center text-red-600">
            <XCircle className="mb-3 h-8 w-8" />
            <span className="text-sm font-semibold">{task.errorMessage || 'Generation failed'}</span>
          </span>
        ) : (
          <span className="relative flex h-full flex-col items-center justify-center overflow-hidden">
            <span className="absolute inset-0 bg-gray-100" />
            <Loader2 className={cn('relative mb-3 h-9 w-9 animate-spin', task.status === 'queued' ? 'text-gray-400' : 'text-blue-600')} />
            <span className="relative text-sm font-semibold text-gray-600">
              {task.status === 'queued' ? 'Queued' : 'Generating'} {look?.name ?? task.preset.name}
            </span>
            <span className="absolute inset-x-0 bottom-0 h-1 overflow-hidden bg-gray-200">
              <span className="block h-full w-1/3 animate-pulse bg-blue-600" />
            </span>
          </span>
        )}
        {task.status === 'completed' && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 text-gray-600 shadow"><Info className="h-4 w-4" /></span>
        )}
      </button>
      <div className="p-4">
        <h3 className="text-sm font-bold text-gray-950">{look?.name ?? task.preset.name}</h3>
        {look && <TagList tags={look.tags} />}
        {look && <p className="mt-2 text-sm leading-5 text-gray-600">{look.summary}</p>}
        {task.status === 'completed' && (
          <div className="mt-3 flex justify-end gap-2 border-t border-gray-100 pt-3">
            <button onClick={onDownload} aria-label="Download look" className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-700"><Download className="h-4 w-4" /></button>
            <button onClick={onShare} aria-label="Share look" className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-700"><Share2 className="h-4 w-4" /></button>
            <button onClick={onDetail} aria-label="View look details" className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-700"><Info className="h-4 w-4" /></button>
          </div>
        )}
      </div>
    </article>
  )
}

function TagList({ tags }: { tags: string[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold capitalize text-blue-700">{tag}</span>
      ))}
    </div>
  )
}

function LookDrawer({ task, locale, styleIntent, occasion, onClose, onDownload, onShare }: {
  task: ExplorerTask
  locale: string
  styleIntent: StyleIntent
  occasion: StyleOccasion
  onClose: () => void
  onDownload: () => void
  onShare: () => void
}) {
  const preset = getTopPickPresetById(task.preset.id)
  if (!preset || !task.resultImageUrl) return null
  const look = getStyleLookCopy(preset, styleIntent, occasion)

  return (
    <div className="fixed inset-0 z-[60] bg-gray-950/50" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="look-detail-title"
        className="ml-auto h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <span className="text-sm font-bold text-gray-950">Look Detail</span>
          <button onClick={onClose} aria-label="Close details"><X className="h-5 w-5" /></button>
        </div>
        <img src={task.resultImageUrl} alt={look.name} className="aspect-[4/3] w-full object-cover" />
        <div className="space-y-5 p-5">
          <div>
            <h2 id="look-detail-title" className="text-lg font-bold text-gray-950">{look.name}</h2>
            <TagList tags={look.tags} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-950">Why it works</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">{look.whyItWorks}</p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-950">Frame details</h3>
            <dl className="mt-2 grid grid-cols-[100px_1fr] gap-y-2 text-sm">
              <dt className="text-gray-500">Frame type</dt><dd className="capitalize text-gray-800">{preset.shape.replace(/-/g, ' ')}</dd>
              <dt className="text-gray-500">Material</dt><dd className="capitalize text-gray-800">{preset.material}</dd>
              <dt className="text-gray-500">Color</dt><dd className="capitalize text-gray-800">{preset.colorFamily}</dd>
              <dt className="text-gray-500">Best for</dt><dd className="capitalize text-gray-800">{preset.occasionTags.join(', ')}</dd>
              <dt className="text-gray-500">Face shapes</dt><dd className="capitalize text-gray-800">{preset.suitableFaceShapes?.join(', ')}</dd>
            </dl>
          </div>
          <p className="inline-flex items-center gap-2 text-sm text-green-700"><Check className="h-4 w-4" /> Saved automatically to Dashboard History</p>
          <button onClick={onDownload} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700">
            <Download className="h-4 w-4" /> Download Image
          </button>
          <button onClick={onShare} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-300 px-4 py-3 text-sm font-bold text-blue-700">
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? <Share2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Share Look
          </button>
          <Link href={`/${locale}/dashboard/history`} className="block text-center text-sm font-bold text-blue-700 hover:underline">View in Dashboard</Link>
        </div>
      </aside>
    </div>
  )
}
