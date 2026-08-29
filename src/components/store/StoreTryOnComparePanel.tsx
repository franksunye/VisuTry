'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Heart, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { FRAME_DISPATCH_STAGGER_MS, sleep } from '@/lib/try-on/batch-types'
import { isUnknownPollFailure, type StoreTryOnPollFailReason } from '@/lib/store-tryon-poll-policy'
import { startStoreTryOnPollLoop } from '@/lib/store-tryon-poll-loop'
import type { MerchantRuntimeTryOnTaskRef } from '@/lib/commerce-handoff/merchant-runtime-state'
import { buildStoreOutboundUrl } from '@/lib/store-outbound-links'
import {
  appendMerchantContinuation,
  createMerchantContinuation,
  merchantPricingPath,
  type MerchantContinuationContext,
} from '@/lib/commerce-handoff/merchant-continuation'
import type { StoreExperiencePolicy } from '@/modules/store/domain/experience-policy'

type FrameMeta = {
  id: string
  name: string
  imageUrl: string | null
  productUrl: string | null
  price: number | null
  currency: string | null
  shape: string
  productBrand: string | null
}

type TryOnRetryAction = 'resume' | 'resubmit' | 'none'

type TryOnTile = {
  merchantFrameId: string
  taskId: string | null
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'timed_out' | 'status_unknown'
  resultImageUrl: string | null
  errorMessage: string | null
  retryAction: TryOnRetryAction
  frame: FrameMeta
}

type StoreTryOnComparePanelProps = {
  merchantSlug: string
  experienceType: 'STORE' | 'CAMPAIGN'
  experienceSlug?: string
  locale: string
  merchantSessionId: string
  selectedFrames: FrameMeta[]
  photoPreview?: string
  accent: string
  onError: (message: string) => void
  experiencePolicy: StoreExperiencePolicy
  initialBatchId?: string | null
  initialTasks?: MerchantRuntimeTryOnTaskRef[] | null
  onContinuationBatchId?: (batchId: string) => void
  onTryOnTasksChange?: (tasks: MerchantRuntimeTryOnTaskRef[]) => void
}

function restoreTilesFromTasks(
  selectedFrames: FrameMeta[],
  initialTasks?: MerchantRuntimeTryOnTaskRef[] | null,
): TryOnTile[] {
  if (!initialTasks?.length) return []
  return initialTasks.flatMap((task) => {
    const frame = selectedFrames.find((item) => item.id === task.merchantFrameId)
    if (!frame || !task.taskId) return []
    return [{
      merchantFrameId: task.merchantFrameId,
      taskId: task.taskId,
      status: 'processing' as const,
      resultImageUrl: null,
      errorMessage: null,
      retryAction: 'none' as const,
      frame,
    }]
  })
}

function retryActionForPollFailure(reason: StoreTryOnPollFailReason): TryOnRetryAction {
  if (isUnknownPollFailure(reason)) return 'resume'
  if (reason === 'session_restart' || reason === 'unavailable' || reason === 'forbidden') return 'none'
  return 'resubmit'
}

function deviceTypeLabel(): string {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'desktop'
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
  experienceType,
  experienceSlug,
  locale,
  merchantSessionId,
  selectedFrames,
  photoPreview,
  accent,
  onError,
  experiencePolicy,
  initialBatchId,
  initialTasks,
  onContinuationBatchId,
  onTryOnTasksChange,
}: StoreTryOnComparePanelProps) {
  const t = useTranslations('storeShopper')
  const [tiles, setTiles] = useState<TryOnTile[]>(() => restoreTilesFromTasks(selectedFrames, initialTasks))
  const [batchId, setBatchId] = useState<string | null>(initialBatchId ?? null)
  const [dispatching, setDispatching] = useState(false)
  const [compareStarted, setCompareStarted] = useState(false)
  const [favoritedIds, setFavoritedIds] = useState<string[]>([])
  const [inquiryFrameId, setInquiryFrameId] = useState<string | null>(null)
  const [inquiryEmail, setInquiryEmail] = useState('')
  const [inquiryName, setInquiryName] = useState('')
  const [inquiryNote, setInquiryNote] = useState('')
  const [inquirySending, setInquirySending] = useState(false)
  const [inquirySent, setInquirySent] = useState(false)
  const [continuationState, setContinuationState] = useState<'AUTH_REQUIRED' | 'CONSUMER_CREDITS_REQUIRED' | null>(null)
  const [sessionNotice, setSessionNotice] = useState<'session_restart' | 'unavailable' | null>(null)
  const pollControllersRef = useRef(new Map<string, () => void>())
  const inFlightSubmitRef = useRef(new Set<string>())

  useEffect(() => {
    if (initialBatchId && !batchId) setBatchId(initialBatchId)
  }, [batchId, initialBatchId])

  const merchantContinuation: MerchantContinuationContext | null = createMerchantContinuation({
    locale,
    merchantSlug,
    experienceType,
    experienceSlug,
  })

  const signInHref = merchantContinuation
    ? `/${locale}/auth/signin?callbackUrl=${encodeURIComponent(appendMerchantContinuation(merchantContinuation.canonicalReturnPath, merchantContinuation))}`
    : `/${locale}/auth/signin`
  const pricingHref = merchantContinuation ? merchantPricingPath(merchantContinuation) : `/${locale}/pricing`

  const postIntent = useCallback(
    async (input: {
      type: 'FAVORITE' | 'PRODUCT_CLICK' | 'INQUIRY'
      merchantFrameId: string
      productUrl?: string | null
      email?: string
      name?: string
      note?: string
    }) => {
      const res = await fetch('/api/store/sessions/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantSlug,
          merchantSessionId,
          type: input.type,
          merchantFrameId: input.merchantFrameId,
          clientActionId: `${input.type.toLowerCase()}:${merchantSessionId}:${input.merchantFrameId}:${Date.now()}`,
          productUrl: input.productUrl ?? undefined,
          email: input.email,
          name: input.name,
          note: input.note,
          locale,
          deviceType: deviceTypeLabel(),
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || t('errors.intent'))
      }
      return json.data
    },
    [merchantSlug, merchantSessionId, locale, t],
  )

  const startTryOn = useCallback(async () => {
    if (!experiencePolicy.tryOnEnabled || selectedFrames.length === 0 || dispatching) return
    const framesToSubmit = selectedFrames.filter(
      (frame) => !tiles.some((tile) => tile.merchantFrameId === frame.id && Boolean(tile.taskId)),
    )
    if (framesToSubmit.length === 0) return
    setDispatching(true)
    onError('')
    setContinuationState(null)
    setSessionNotice(null)
    const nextBatchId = batchId || (
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `batch-${Date.now()}`
    )
    setBatchId(nextBatchId)
    setCompareStarted(false)

    setTiles((current) => {
      const byFrame = new Map(current.map((tile) => [tile.merchantFrameId, tile]))
      const next = selectedFrames.map((frame) => {
        const existing = byFrame.get(frame.id)
        if (existing?.taskId) return existing
        return {
          merchantFrameId: frame.id,
          taskId: null,
          status: 'queued' as const,
          resultImageUrl: null,
          errorMessage: null,
          retryAction: 'none' as const,
          frame,
        }
      })
      const extras = current.filter(
        (tile) => tile.taskId && !selectedFrames.some((item) => item.id === tile.merchantFrameId),
      )
      return [...next, ...extras]
    })

    for (let i = 0; i < framesToSubmit.length; i++) {
      const frame = framesToSubmit[i]
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
          if (json.code === 'AUTH_REQUIRED' || json.code === 'CONSUMER_CREDITS_REQUIRED') {
            setContinuationState(json.code)
            onContinuationBatchId?.(nextBatchId)
            // The server rejected this submission before creating a task. Remove
            // this frame and every later placeholder that was never submitted;
            // only task-backed tiles may remain visible or enter polling.
            setTiles((current) =>
              current.filter((tile) => tile.taskId || tile.status !== 'queued'),
            )
            break
          }
          setTiles((current) =>
            current.map((tile) =>
              tile.merchantFrameId === frame.id
                ? {
                    ...tile,
                    status: 'failed',
                    errorMessage: json.error || t('errors.tryOn'),
                    retryAction: 'resubmit',
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
                    retryAction: json.data.status === 'failed' ? 'resubmit' : 'none',
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
              ? { ...tile, status: 'failed', errorMessage: t('errors.tryOn'), retryAction: 'resubmit' }
              : tile,
          ),
        )
      }

      if (i < framesToSubmit.length - 1) {
        await sleep(FRAME_DISPATCH_STAGGER_MS)
      }
    }

    setDispatching(false)
  }, [
    selectedFrames,
    tiles,
    dispatching,
    merchantSlug,
    merchantSessionId,
    locale,
    onError,
    batchId,
    onContinuationBatchId,
    experiencePolicy.tryOnEnabled,
    t,
  ])

  const activeTaskKey = tiles
    .filter((tile) => tile.taskId && (tile.status === 'processing' || tile.status === 'queued'))
    .map((tile) => tile.taskId)
    .sort()
    .join(',')

  useEffect(() => {
    const taskIds = activeTaskKey ? activeTaskKey.split(',').filter(Boolean) : []
    const active = new Set(taskIds)

    for (const [taskId, stop] of [...pollControllersRef.current.entries()]) {
      if (!active.has(taskId)) {
        stop()
        pollControllersRef.current.delete(taskId)
      }
    }

    const applyTile = (taskId: string, patch: Partial<TryOnTile>) => {
      setTiles((current) =>
        current.map((item) => {
          if (item.taskId !== taskId) return item
          if (item.status === 'completed' && patch.status && patch.status !== 'completed') {
            return item
          }
          return { ...item, ...patch }
        }),
      )
    }

    const failMessage = (reason: StoreTryOnPollFailReason) => {
      if (reason === 'timed_out') return t('tryOn.timedOut')
      if (reason === 'session_restart') return t('errors.sessionRestart')
      if (reason === 'unavailable') return t('errors.capabilityUnavailable')
      if (reason === 'not_found') return t('tryOn.failed')
      return t('errors.tryOn')
    }

    for (const taskId of taskIds) {
      if (pollControllersRef.current.has(taskId)) continue

      const handle = startStoreTryOnPollLoop({
        poll: async (signal) => {
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
            signal,
          })
          let body: unknown = null
          try {
            body = await res.json()
          } catch {
            body = null
          }
          return {
            httpStatus: res.status,
            retryAfterHeader: res.headers.get('retry-after'),
            body,
          }
        },
        onTerminal: (result) => {
          pollControllersRef.current.delete(taskId)
          if (result.kind === 'completed') {
            applyTile(taskId, {
              status: 'completed',
              resultImageUrl: result.data.resultImageUrl ?? null,
              errorMessage: null,
              retryAction: 'none',
            })
            if (result.data.frame) {
              setTiles((current) =>
                current.map((item) =>
                  item.taskId === taskId
                    ? { ...item, frame: { ...item.frame, ...(result.data.frame as Partial<FrameMeta>) } }
                    : item,
                ),
              )
            }
            return
          }
          if (result.kind === 'confirmed_failed') {
            applyTile(taskId, {
              status: 'failed',
              errorMessage: result.data.errorMessage || t('tryOn.failed'),
              retryAction: 'resubmit',
            })
            return
          }
          if (result.kind === 'timed_out') {
            applyTile(taskId, {
              status: 'timed_out',
              errorMessage: t('tryOn.timedOut'),
              retryAction: 'resume',
            })
            return
          }
          if (result.kind === 'entitlement') {
            setContinuationState(result.code)
            applyTile(taskId, {
              status: 'failed',
              errorMessage: t('errors.tryOn'),
              retryAction: 'none',
            })
            return
          }
          if (result.reason === 'session_restart') {
            setSessionNotice('session_restart')
            applyTile(taskId, {
              status: 'failed',
              errorMessage: failMessage(result.reason),
              retryAction: 'none',
            })
            return
          }
          if (result.reason === 'unavailable' || result.reason === 'forbidden') {
            setSessionNotice('unavailable')
            applyTile(taskId, {
              status: 'failed',
              errorMessage: failMessage(result.reason),
              retryAction: 'none',
            })
            return
          }
          applyTile(taskId, {
            status: isUnknownPollFailure(result.reason) ? 'status_unknown' : 'failed',
            errorMessage: failMessage(result.reason),
            retryAction: retryActionForPollFailure(result.reason),
          })
        },
      })
      pollControllersRef.current.set(taskId, handle.stop)
    }

    return () => {
      for (const taskId of taskIds) {
        const stop = pollControllersRef.current.get(taskId)
        if (stop) {
          stop()
          pollControllersRef.current.delete(taskId)
        }
      }
    }
  }, [activeTaskKey, merchantSlug, merchantSessionId, locale, t])

  useEffect(() => {
    const controllers = pollControllersRef.current
    return () => {
      for (const stop of controllers.values()) stop()
      controllers.clear()
    }
  }, [])

  useEffect(() => {
    const tasks = tiles
      .filter((tile): tile is TryOnTile & { taskId: string } => Boolean(tile.taskId))
      .map((tile) => ({ merchantFrameId: tile.merchantFrameId, taskId: tile.taskId }))
    onTryOnTasksChange?.(tasks)
  }, [tiles, onTryOnTasksChange])

  const completed = tiles.filter((tile) => tile.status === 'completed' && tile.resultImageUrl)
  const showCompare = experiencePolicy.compareEnabled && compareStarted && completed.length >= 2

  const resumeUnknownStatus = (tile: TryOnTile) => {
    if (!tile.taskId) return
    setSessionNotice(null)
    setTiles((current) =>
      current.map((item) =>
        item.merchantFrameId === tile.merchantFrameId
          ? { ...item, status: 'processing', errorMessage: null, retryAction: 'none' }
          : item,
      ),
    )
  }

  const resubmitFailed = async (tile: TryOnTile) => {
    if (!batchId || tile.retryAction !== 'resubmit') return
    if (inFlightSubmitRef.current.has(tile.merchantFrameId)) return
    inFlightSubmitRef.current.add(tile.merchantFrameId)
    setTiles((current) =>
      current.map((item) =>
        item.merchantFrameId === tile.merchantFrameId
          ? { ...item, status: 'queued', errorMessage: null, taskId: null, retryAction: 'none' }
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
        if (json.code === 'AUTH_REQUIRED' || json.code === 'CONSUMER_CREDITS_REQUIRED') {
          setContinuationState(json.code)
          onContinuationBatchId?.(batchId)
          setTiles((current) =>
            current.filter((item) => item.taskId || item.status !== 'queued'),
          )
          return
        }
        setTiles((current) =>
          current.map((item) =>
            item.merchantFrameId === tile.merchantFrameId
              ? {
                  ...item,
                  status: 'failed',
                  errorMessage: json.error || t('errors.tryOn'),
                  retryAction: 'resubmit',
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
                retryAction: 'none',
              }
            : item,
        ),
      )
    } catch {
      setTiles((current) =>
        current.map((item) =>
          item.merchantFrameId === tile.merchantFrameId
            ? { ...item, status: 'failed', errorMessage: t('errors.tryOn'), retryAction: 'resubmit' }
            : item,
        ),
      )
    } finally {
      inFlightSubmitRef.current.delete(tile.merchantFrameId)
    }
  }

  const framesNeedingSubmit = selectedFrames.filter(
    (frame) => !tiles.some((tile) => tile.merchantFrameId === frame.id && Boolean(tile.taskId)),
  )

  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-[0_22px_70px_rgba(15,23,42,0.07)] sm:p-7">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Step 3 · {t('tryOn.editLabel')}</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold text-slate-950 sm:text-3xl">{t('tryOn.title')}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{t('tryOn.subtitle')}</p>
        </div>
        {framesNeedingSubmit.length > 0 ? (
          <button
            type="button"
            onClick={() => void startTryOn()}
            disabled={dispatching}
            data-testid="store-tryon-start"
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60"
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
                {framesNeedingSubmit.length === 1
                  ? (t.has('tryOn.startOne') ? t('tryOn.startOne') : 'Try On This Frame')
                  : t('tryOn.start', { count: framesNeedingSubmit.length })}
              </>
            )}
          </button>
        ) : null}
      </div>

      {sessionNotice ? (
        <div
          className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800"
          role="alert"
          data-testid={sessionNotice === 'session_restart' ? 'store-tryon-session-restart' : 'store-tryon-unavailable'}
        >
          <p className="font-semibold">
            {sessionNotice === 'session_restart'
              ? t('errors.sessionRestart')
              : t('errors.capabilityUnavailable')}
          </p>
        </div>
      ) : null}

      {continuationState ? (
        <div
          className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
          role="alert"
          data-testid="merchant-entitlement-continuation"
        >
          <p className="font-semibold">
            {continuationState === 'AUTH_REQUIRED'
              ? 'Your sponsored Try-On is used. Sign in to continue with Consumer credits.'
              : 'Your Consumer credits are unavailable. Buy credits to continue this experience.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {continuationState === 'AUTH_REQUIRED' ? (
              <Link
                href={signInHref}
                className="inline-flex items-center rounded-xl bg-slate-950 px-3 py-2 font-semibold text-white hover:bg-slate-800"
                data-testid="merchant-sign-in-continuation"
              >
                Sign in to continue
              </Link>
            ) : null}
            <Link
              href={pricingHref}
              className="inline-flex items-center rounded-xl border border-amber-300 bg-white px-3 py-2 font-semibold text-amber-950 hover:bg-amber-100"
              data-testid="merchant-credits-continuation"
            >
              Get Consumer credits
            </Link>
          </div>
        </div>
      ) : null}

      {tiles.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {tiles.map((tile) => {
              const priceLabel = formatPrice(tile.frame.price, tile.frame.currency)
              return (
                <div
                  key={tile.merchantFrameId}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="relative aspect-[4/5] bg-gradient-to-b from-slate-50 to-slate-100">
                    {tile.status === 'completed' && tile.resultImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tile.resultImageUrl}
                        alt={tile.frame.name}
                        data-testid={`store-tryon-result-${tile.taskId || tile.merchantFrameId}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-3 p-5 text-center text-sm text-slate-500" role="status" aria-live="polite">
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
                        {tile.status === 'failed' || tile.status === 'timed_out' || tile.status === 'status_unknown' ? (
                          <>
                            <p className={tile.status === 'failed' ? 'text-red-600' : 'text-amber-800'}>
                              {tile.errorMessage || (tile.status === 'timed_out'
                                ? t('tryOn.timedOut')
                                : t('tryOn.failed'))}
                            </p>
                            {tile.retryAction === 'resume' ? (
                              <button
                                type="button"
                                data-testid="store-tryon-check-again"
                                onClick={() => resumeUnknownStatus(tile)}
                                className="inline-flex items-center gap-1 text-sm font-medium text-gray-800 underline"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                {t('tryOn.checkAgain')}
                              </button>
                            ) : null}
                            {tile.retryAction === 'resubmit' ? (
                              <button
                                type="button"
                                data-testid="store-tryon-try-again"
                                onClick={() => void resubmitFailed(tile)}
                                className="inline-flex items-center gap-1 text-sm font-medium text-gray-800 underline"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                {t('tryOn.tryAgain')}
                              </button>
                            ) : null}
                          </>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 p-4">
                    <p className="font-semibold text-slate-900">{tile.frame.name}</p>
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">{tile.frame.productBrand || t('tryOn.storeBrand')}</p>
                    <p className="text-xs capitalize text-slate-400">{tile.frame.shape}</p>
                    {priceLabel && (
                      <p className="text-sm font-medium text-gray-800">{priceLabel}</p>
                    )}
                    {tile.frame.productUrl && (
                      <button
                        type="button"
                        className="text-sm font-medium underline"
                        style={{ color: accent }}
                        onClick={async () => {
                          try {
                            await postIntent({
                              type: 'PRODUCT_CLICK',
                              merchantFrameId: tile.merchantFrameId,
                              productUrl: tile.frame.productUrl,
                            })
                            window.open(
                              buildStoreOutboundUrl(tile.frame.productUrl!, { experienceType, experienceSlug, linkType: 'product' }),
                              '_blank',
                              'noopener,noreferrer',
                            )
                          } catch (error) {
                            onError(error instanceof Error ? error.message : t('errors.intent'))
                          }
                        }}
                      >
                        {t('tryOn.viewProduct')}
                      </button>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={favoritedIds.includes(tile.merchantFrameId)}
                        onClick={async () => {
                          try {
                            await postIntent({
                              type: 'FAVORITE',
                              merchantFrameId: tile.merchantFrameId,
                            })
                            setFavoritedIds((ids) =>
                              ids.includes(tile.merchantFrameId)
                                ? ids
                                : [...ids, tile.merchantFrameId],
                            )
                          } catch (error) {
                            onError(error instanceof Error ? error.message : t('errors.intent'))
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                      >
                        <Heart
                          className="h-3.5 w-3.5"
                          fill={favoritedIds.includes(tile.merchantFrameId) ? accent : 'none'}
                          style={{ color: accent }}
                        />
                        {favoritedIds.includes(tile.merchantFrameId)
                          ? t('intent.favorited')
                          : t('intent.favorite')}
                      </button>
                      {experiencePolicy.inquiryEnabled ? (
                        <button
                          type="button"
                          onClick={() => {
                            setInquiryFrameId(tile.merchantFrameId)
                            setInquirySent(false)
                          }}
                          className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {t('intent.inquire')}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {experiencePolicy.inquiryEnabled && inquiryFrameId && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-sm font-semibold text-gray-900">{t('intent.inquiryTitle')}</h3>
              <p className="mt-1 text-xs text-gray-600">{t('intent.inquirySubtitle')}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <input
                  type="email"
                  value={inquiryEmail}
                  onChange={(e) => setInquiryEmail(e.target.value)}
                  placeholder={t('intent.email')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  placeholder={t('intent.nameOptional')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <textarea
                value={inquiryNote}
                onChange={(e) => setInquiryNote(e.target.value)}
                placeholder={t('intent.noteOptional')}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                rows={3}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={inquirySending}
                  onClick={async () => {
                    setInquirySending(true)
                    try {
                      await postIntent({
                        type: 'INQUIRY',
                        merchantFrameId: inquiryFrameId,
                        email: inquiryEmail,
                        name: inquiryName || undefined,
                        note: inquiryNote || undefined,
                      })
                      setInquirySent(true)
                      setInquiryFrameId(null)
                      setInquiryEmail('')
                      setInquiryName('')
                      setInquiryNote('')
                    } catch (error) {
                      onError(error instanceof Error ? error.message : t('errors.intent'))
                    } finally {
                      setInquirySending(false)
                    }
                  }}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: accent }}
                >
                  {inquirySending ? t('intent.sending') : t('intent.send')}
                </button>
                <button
                  type="button"
                  onClick={() => setInquiryFrameId(null)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700"
                >
                  {t('intent.cancel')}
                </button>
              </div>
            </div>
          )}

          {experiencePolicy.inquiryEnabled && inquirySent && (
            <p className="mt-3 text-sm text-emerald-700">{t('intent.sent')}</p>
          )}

          {experiencePolicy.compareEnabled && completed.length >= 2 && !showCompare && (
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch('/api/store/sessions/compare', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      merchantSlug,
                      merchantSessionId,
                      clientActionId: `compare:${merchantSessionId}:${Date.now()}`,
                      frameIds: completed.map((tile) => tile.merchantFrameId),
                      locale,
                      deviceType: deviceTypeLabel(),
                    }),
                  })
                  const json = await res.json()
                  if (!res.ok || !json.success) {
                    throw new Error(json.error || t('errors.intent'))
                  }
                  setCompareStarted(true)
                } catch (error) {
                  onError(error instanceof Error ? error.message : t('errors.intent'))
                }
              }}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
            >
              {t('tryOn.openCompare', { count: completed.length })}
            </button>
          )}

          {showCompare && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="mb-3 font-serif text-xl font-semibold text-slate-900">{t('tryOn.compareTitle')}</h3>
              {photoPreview && (
                <p className="mb-3 text-xs text-gray-500">{t('tryOn.compareHint')}</p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {completed.map((tile) => (
                  <div key={`compare-${tile.merchantFrameId}`} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tile.resultImageUrl!}
                      alt={tile.frame.name}
                      className="aspect-[4/5] w-full object-cover"
                    />
                    <div className="p-3">
                      <p className="text-sm font-semibold text-gray-900">{tile.frame.name}</p>
                      <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">{tile.frame.productBrand || t('tryOn.storeBrand')}</p>
                      {tile.frame.productUrl ? (
                        <button
                          type="button"
                          className="mt-2 text-xs font-semibold underline"
                          style={{ color: accent }}
                          onClick={async () => {
                            try {
                              await postIntent({ type: 'PRODUCT_CLICK', merchantFrameId: tile.merchantFrameId, productUrl: tile.frame.productUrl })
                              window.open(
                                buildStoreOutboundUrl(tile.frame.productUrl!, { experienceType, experienceSlug, linkType: 'product' }),
                                '_blank',
                                'noopener,noreferrer',
                              )
                            } catch (error) {
                              onError(error instanceof Error ? error.message : t('errors.intent'))
                            }
                          }}
                        >
                          {t('tryOn.viewProduct')}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
