'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { FRAME_DISPATCH_STAGGER_MS, sleep } from '@/lib/try-on/batch-types'

type FrameMeta = {
  id: string
  name: string
  imageUrl: string | null
  productUrl: string | null
  price: number | null
  currency: string | null
  shape: string
}

type TryOnTile = {
  merchantFrameId: string
  taskId: string | null
  status: 'queued' | 'processing' | 'completed' | 'failed'
  resultImageUrl: string | null
  errorMessage: string | null
  frame: FrameMeta
}

type StoreTryOnComparePanelProps = {
  merchantSlug: string
  locale: string
  merchantSessionId: string
  selectedFrames: FrameMeta[]
  photoPreview?: string
  accent: string
  onError: (message: string) => void
}

function deviceTypeLabel(): string {
  if (typeof window === 'undefined') return 'desktop'
  return window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop'
}

function formatPrice(price: number | null, currency: string | null): string | null {
  if (price === null || price === undefined) return null
  const code = (currency || 'usd').toUpperCase()
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
    }).format(price / 100)
  } catch {
    return `${(price / 100).toFixed(2)} ${code}`
  }
}

export function StoreTryOnComparePanel({
  merchantSlug,
  locale,
  merchantSessionId,
  selectedFrames,
  photoPreview,
  accent,
  onError,
}: StoreTryOnComparePanelProps) {
  const t = useTranslations('storeShopper')
  const [tiles, setTiles] = useState<TryOnTile[]>([])
  const [batchId, setBatchId] = useState<string | null>(null)
  const [dispatching, setDispatching] = useState(false)
  const [compareStarted, setCompareStarted] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTryOn = useCallback(async () => {
    if (selectedFrames.length === 0 || dispatching) return
    setDispatching(true)
    onError('')
    const nextBatchId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `batch-${Date.now()}`
    setBatchId(nextBatchId)
    setCompareStarted(false)

    const initial: TryOnTile[] = selectedFrames.map((frame) => ({
      merchantFrameId: frame.id,
      taskId: null,
      status: 'queued',
      resultImageUrl: null,
      errorMessage: null,
      frame,
    }))
    setTiles(initial)

    for (let i = 0; i < selectedFrames.length; i++) {
      const frame = selectedFrames[i]
      try {
        const res = await fetch('/api/store/sessions/try-on', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchantSlug,
            merchantSessionId,
            merchantFrameId: frame.id,
            batchId: nextBatchId,
            clientSubmissionId: `${nextBatchId}:${frame.id}`,
            locale,
            deviceType: deviceTypeLabel(),
          }),
        })
        const json = await res.json()
        if (!res.ok || !json.success) {
          setTiles((current) =>
            current.map((tile) =>
              tile.merchantFrameId === frame.id
                ? {
                    ...tile,
                    status: 'failed',
                    errorMessage: json.error || t('errors.tryOn'),
                  }
                : tile,
            ),
          )
        } else {
          setTiles((current) =>
            current.map((tile) =>
              tile.merchantFrameId === frame.id
                ? {
                    ...tile,
                    taskId: json.data.taskId,
                    status:
                      json.data.status === 'completed'
                        ? 'completed'
                        : json.data.status === 'failed'
                          ? 'failed'
                          : 'processing',
                    resultImageUrl: null,
                    frame: { ...tile.frame, ...json.data.frame },
                  }
                : tile,
            ),
          )
        }
      } catch {
        setTiles((current) =>
          current.map((tile) =>
            tile.merchantFrameId === frame.id
              ? { ...tile, status: 'failed', errorMessage: t('errors.tryOn') }
              : tile,
          ),
        )
      }

      if (i < selectedFrames.length - 1) {
        await sleep(FRAME_DISPATCH_STAGGER_MS)
      }
    }

    setDispatching(false)
  }, [
    selectedFrames,
    dispatching,
    merchantSlug,
    merchantSessionId,
    locale,
    onError,
    t,
  ])

  const activeTaskKey = tiles
    .filter((tile) => tile.taskId && (tile.status === 'processing' || tile.status === 'queued'))
    .map((tile) => tile.taskId)
    .sort()
    .join(',')

  useEffect(() => {
    if (!activeTaskKey) {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      return
    }

    const taskIds = activeTaskKey.split(',').filter(Boolean)

    const pollOnce = async () => {
      await Promise.all(
        taskIds.map(async (taskId) => {
          try {
            const res = await fetch('/api/store/sessions/try-on/poll', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                merchantSlug,
                merchantSessionId,
                taskId,
                locale,
                deviceType: deviceTypeLabel(),
              }),
            })
            const json = await res.json()
            if (!res.ok || !json.success) return

            const status = String(json.data.status).toLowerCase()
            setTiles((current) =>
              current.map((item) =>
                item.taskId === taskId
                  ? {
                      ...item,
                      status:
                        status === 'completed'
                          ? 'completed'
                          : status === 'failed'
                            ? 'failed'
                            : 'processing',
                      resultImageUrl: json.data.resultImageUrl ?? item.resultImageUrl,
                      errorMessage: json.data.errorMessage ?? item.errorMessage,
                      frame: json.data.frame
                        ? { ...item.frame, ...json.data.frame }
                        : item.frame,
                    }
                  : item,
              ),
            )
          } catch {
            // keep polling
          }
        }),
      )
    }

    void pollOnce()
    pollRef.current = setInterval(() => {
      void pollOnce()
    }, 7000)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [activeTaskKey, merchantSlug, merchantSessionId, locale])

  const completed = tiles.filter((tile) => tile.status === 'completed' && tile.resultImageUrl)
  const showCompare = compareStarted && completed.length >= 2

  const retryFailed = async (tile: TryOnTile) => {
    if (!batchId) return
    setTiles((current) =>
      current.map((item) =>
        item.merchantFrameId === tile.merchantFrameId
          ? { ...item, status: 'queued', errorMessage: null, taskId: null }
          : item,
      ),
    )
    try {
      const res = await fetch('/api/store/sessions/try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantSlug,
          merchantSessionId,
          merchantFrameId: tile.merchantFrameId,
          batchId,
          clientSubmissionId: `${batchId}:${tile.merchantFrameId}:retry:${Date.now()}`,
          locale,
          deviceType: deviceTypeLabel(),
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setTiles((current) =>
          current.map((item) =>
            item.merchantFrameId === tile.merchantFrameId
              ? {
                  ...item,
                  status: 'failed',
                  errorMessage: json.error || t('errors.tryOn'),
                }
              : item,
          ),
        )
        return
      }
      setTiles((current) =>
        current.map((item) =>
          item.merchantFrameId === tile.merchantFrameId
            ? {
                ...item,
                taskId: json.data.taskId,
                status: 'processing',
              }
            : item,
        ),
      )
    } catch {
      setTiles((current) =>
        current.map((item) =>
          item.merchantFrameId === tile.merchantFrameId
            ? { ...item, status: 'failed', errorMessage: t('errors.tryOn') }
            : item,
        ),
      )
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t('tryOn.title')}</h2>
          <p className="mt-1 text-sm text-gray-600">{t('tryOn.subtitle')}</p>
        </div>
        {tiles.length === 0 ? (
          <button
            type="button"
            onClick={() => void startTryOn()}
            disabled={dispatching}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: accent }}
          >
            {dispatching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('tryOn.starting')}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {t('tryOn.start', { count: selectedFrames.length })}
              </>
            )}
          </button>
        ) : null}
      </div>

      {tiles.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {tiles.map((tile) => {
              const priceLabel = formatPrice(tile.frame.price, tile.frame.currency)
              return (
                <div
                  key={tile.merchantFrameId}
                  className="overflow-hidden rounded-xl border border-gray-200"
                >
                  <div className="relative aspect-[4/5] bg-gray-100">
                    {tile.status === 'completed' && tile.resultImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tile.resultImageUrl}
                        alt={tile.frame.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-sm text-gray-500">
                        {(tile.status === 'queued' || tile.status === 'processing') && (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>
                              {tile.status === 'queued'
                                ? t('tryOn.queued')
                                : t('tryOn.processing')}
                            </span>
                          </>
                        )}
                        {tile.status === 'failed' && (
                          <>
                            <p className="text-red-600">{tile.errorMessage || t('tryOn.failed')}</p>
                            <button
                              type="button"
                              onClick={() => void retryFailed(tile)}
                              className="inline-flex items-center gap-1 text-sm font-medium text-gray-800 underline"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              {t('tryOn.retry')}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="font-medium text-gray-900">{tile.frame.name}</p>
                    <p className="text-xs capitalize text-gray-500">{tile.frame.shape}</p>
                    {priceLabel && (
                      <p className="text-sm font-medium text-gray-800">{priceLabel}</p>
                    )}
                    {tile.frame.productUrl && (
                      <a
                        href={tile.frame.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium underline"
                        style={{ color: accent }}
                      >
                        {t('tryOn.viewProduct')}
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {completed.length >= 2 && !showCompare && (
            <button
              type="button"
              onClick={() => setCompareStarted(true)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              {t('tryOn.openCompare', { count: completed.length })}
            </button>
          )}

          {showCompare && (
            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-3 text-base font-semibold text-gray-900">{t('tryOn.compareTitle')}</h3>
              {photoPreview && (
                <p className="mb-3 text-xs text-gray-500">{t('tryOn.compareHint')}</p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {completed.map((tile) => (
                  <div key={`compare-${tile.merchantFrameId}`} className="overflow-hidden rounded-lg bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tile.resultImageUrl!}
                      alt={tile.frame.name}
                      className="aspect-[4/5] w-full object-cover"
                    />
                    <div className="p-2 text-sm font-medium text-gray-900">{tile.frame.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
