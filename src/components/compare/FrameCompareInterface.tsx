'use client'

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Camera,
  Check,
  Grid2X2,
  Loader2,
  RotateCcw,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { ImageUpload } from '@/components/upload/ImageUpload'
import {
  DEFAULT_TOP_PICK_PRESET_IDS,
  TOP_PICK_GLASSES_PRESETS,
  type GlassesPreset,
} from '@/config/glasses-presets'
import { cn } from '@/utils/cn'

type CompareTaskStatus = 'processing' | 'completed' | 'failed'

interface CompareTask {
  taskId: string
  status: CompareTaskStatus
  resultImageUrl?: string | null
  errorMessage?: string | null
  preset: Pick<GlassesPreset, 'id' | 'name' | 'style' | 'assetPath'>
}

interface CompareBatchResult {
  batchId: string
  requiredCredits: number
  remainingCreditsBefore: number
  tasks: CompareTask[]
}

interface UploadedImage {
  file: File
  preview: string
}

const MAX_SELECTED_FRAMES = 4

function normalizeTaskStatus(status: unknown): CompareTaskStatus {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'completed' || normalized === 'failed') return normalized
  return 'processing'
}

export function FrameCompareInterface({ initialRemainingCredits = 0 }: { initialRemainingCredits?: number }) {
  const params = useParams()
  const locale = (params.locale as string) || 'en'
  const { data: session, update } = useSession()
  const remainingCredits = session?.user?.remainingTrials ?? initialRemainingCredits
  const [userImage, setUserImage] = useState<UploadedImage | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>(DEFAULT_TOP_PICK_PRESET_IDS)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [batchResult, setBatchResult] = useState<CompareBatchResult | null>(null)

  const selectedPresets = useMemo(
    () => TOP_PICK_GLASSES_PRESETS.filter((preset) => selectedIds.includes(preset.id)),
    [selectedIds],
  )
  const hasEnoughCredits = remainingCredits >= selectedIds.length
  const completedCount = batchResult?.tasks.filter((task) => task.status === 'completed').length ?? 0
  const processingCount = batchResult?.tasks.filter((task) => task.status === 'processing').length ?? 0
  const canSubmit = Boolean(userImage && selectedIds.length > 0 && !isSubmitting && hasEnoughCredits)

  useEffect(() => {
    if (!batchResult || processingCount === 0) return

    let cancelled = false

    const pollProcessingTasks = async () => {
      const updates = await Promise.all(
        batchResult.tasks
          .filter((task) => task.status === 'processing' && !task.taskId.includes('-failed'))
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
                status: normalizeTaskStatus(payload.data?.status),
                resultImageUrl: payload.data?.resultImageUrl ?? task.resultImageUrl ?? null,
                errorMessage: payload.data?.error ?? payload.data?.errorMessage ?? task.errorMessage ?? null,
              }
            } catch {
              return null
            }
          }),
      )

      if (cancelled) return

      const validUpdates = updates.filter(Boolean) as Array<Partial<CompareTask> & { taskId: string }>
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

  useEffect(() => {
    if (batchResult && processingCount === 0) {
      void update()
    }
  }, [batchResult, processingCount, update])

  const togglePreset = (presetId: string) => {
    setError(null)
    setSelectedIds((current) => {
      if (current.includes(presetId)) {
        return current.filter((id) => id !== presetId)
      }
      if (current.length >= MAX_SELECTED_FRAMES) {
        return current
      }
      return [...current, presetId]
    })
  }

  const handleSubmit = async () => {
    if (!userImage || selectedIds.length === 0) return
    if (!hasEnoughCredits) {
      setError(`You need ${selectedIds.length} credits to compare these frames.`)
      return
    }

    setIsSubmitting(true)
    setError(null)
    setBatchResult(null)

    try {
      const formData = new FormData()
      formData.append('userImage', userImage.file)
      formData.append('framePresetIds', JSON.stringify(selectedIds))

      const response = await fetch('/api/try-on/glasses/compare', {
        method: 'POST',
        body: formData,
      })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Frame compare failed')
      }

      setBatchResult({
        ...payload.data,
        tasks: payload.data.tasks.map((task: CompareTask) => ({
          ...task,
          status: normalizeTaskStatus(task.status),
        })),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Frame compare failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetResults = () => {
    setBatchResult(null)
    setError(null)
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-col gap-4 border-b border-gray-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="inline-flex items-center gap-2 text-base font-bold tracking-normal text-gray-950">
            <Grid2X2 className="h-4 w-4 text-blue-600" />
            Compare Glasses Frames
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm font-normal text-gray-600">
            Pick up to 4 built-in frames and generate a clean side-by-side try-on comparison.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm">
          <span className="rounded-md bg-gray-100 px-2 py-1 font-semibold text-gray-700">Credits</span>
          <span className="font-bold text-gray-950">{remainingCredits}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[410px_minmax(0,1fr)]">
        <section className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                1
              </span>
              <h2 className="text-base font-bold text-gray-950">Your Photo</h2>
            </div>
            <ImageUpload
              currentImage={userImage?.preview}
              onImageSelect={(file, preview) => {
                setUserImage({ file, preview })
                resetResults()
              }}
              onImageRemove={() => {
                setUserImage(null)
                resetResults()
              }}
              label="Your photo"
              description="Clear front-facing photo"
              height="h-[300px]"
              iconType="user"
            />
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                  2
                </span>
                <h2 className="text-base font-bold text-gray-950">Preset Frames</h2>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                {selectedIds.length}/4 selected
              </span>
            </div>
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-gray-600">Choose frames to compare</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedIds([])
                  resetResults()
                }}
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Clear
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              {TOP_PICK_GLASSES_PRESETS.map((preset) => {
                const selected = selectedIds.includes(preset.id)
                const lockedOut = !selected && selectedIds.length >= MAX_SELECTED_FRAMES
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      togglePreset(preset.id)
                      resetResults()
                    }}
                    disabled={lockedOut}
                    className={cn(
                      'relative rounded-lg border bg-white p-3 text-left transition-all hover:border-blue-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-45',
                      selected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200',
                    )}
                  >
                    {selected && (
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <div className="mb-2 flex h-16 items-center justify-center rounded-md bg-gray-50">
                      <Image
                        src={`/${preset.assetPath}`}
                        alt={`${preset.name} glasses`}
                        width={120}
                        height={64}
                        className="max-h-12 w-auto object-contain"
                      />
                    </div>
                    <div className="truncate text-center text-sm font-semibold text-gray-900">{preset.name}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                3
              </span>
              <div>
                <h2 className="text-base font-bold text-gray-950">Try-On Results</h2>
                <p className="text-sm text-gray-500">
                  {batchResult ? `${completedCount}/${batchResult.tasks.length} completed` : 'Ready for side-by-side comparison'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Try {selectedIds.length || 4} Frames
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                <p className="font-semibold">{error}</p>
                {!hasEnoughCredits && (
                  <Link href={`/${locale}/pricing`} className="mt-1 inline-block font-bold text-red-800 underline">
                    Get credits
                  </Link>
                )}
              </div>
            </div>
          )}

          {!batchResult ? (
            <div className="grid min-h-[560px] gap-4 sm:grid-cols-2">
              {(selectedPresets.length ? selectedPresets : TOP_PICK_GLASSES_PRESETS.slice(0, 4)).map((preset) => (
                <div
                  key={preset.id}
                  className="flex min-h-[260px] flex-col overflow-hidden rounded-lg border border-dashed border-gray-200 bg-gray-50"
                >
                  <div className="flex flex-1 items-center justify-center p-6">
                    {userImage ? (
                      <div className="relative h-full max-h-[260px] w-full overflow-hidden rounded-lg bg-white">
                        <img
                          src={userImage.preview}
                          alt="Uploaded preview"
                          className="h-full w-full object-cover opacity-70 grayscale"
                        />
                      </div>
                    ) : (
                      <div className="text-center text-gray-400">
                        <Camera className="mx-auto mb-3 h-9 w-9" />
                        <p className="text-sm font-semibold">Upload a photo</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
                    <span className="text-sm font-bold text-gray-900">{preset.name}</span>
                    <Image
                      src={`/${preset.assetPath}`}
                      alt={`${preset.name} glasses`}
                      width={86}
                      height={42}
                      className="h-8 w-auto object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {batchResult.tasks.map((task) => (
                <div key={task.taskId} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <div className="relative aspect-[4/5] bg-gray-50">
                    {task.status === 'completed' && task.resultImageUrl ? (
                      <img
                        src={task.resultImageUrl}
                        alt={`${task.preset.name} try-on result`}
                        className="h-full w-full object-cover"
                      />
                    ) : task.status === 'failed' ? (
                      <div className="flex h-full flex-col items-center justify-center px-6 text-center text-red-600">
                        <XCircle className="mb-3 h-8 w-8" />
                        <p className="text-sm font-semibold">{task.errorMessage || 'Generation failed'}</p>
                      </div>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center px-6 text-center text-gray-500">
                        <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-600" />
                        <p className="text-sm font-semibold">Generating {task.preset.name}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-gray-950">{task.preset.name}</p>
                      <p className="text-xs text-gray-500">{task.preset.style}</p>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-bold',
                        task.status === 'completed' && 'bg-green-50 text-green-700',
                        task.status === 'processing' && 'bg-blue-50 text-blue-700',
                        task.status === 'failed' && 'bg-red-50 text-red-700',
                      )}
                    >
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {batchResult && processingCount === 0 && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={resetResults}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-blue-300 hover:text-blue-700"
              >
                <RotateCcw className="h-4 w-4" />
                Compare Again
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
