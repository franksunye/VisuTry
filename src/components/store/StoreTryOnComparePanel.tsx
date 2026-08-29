'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Heart, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { FRAME_DISPATCH_STAGGER_MS, sleep } from '@/lib/try-on/batch-types'
import {
  decidePollHttpStatus,
  decidePollNetworkFailure,
  nextPollDelayMs,
  STORE_TRYON_POLL_MAX_DURATION_MS,
} from '@/lib/store-tryon-poll-policy'
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

type TryOnTile = {
  merchantFrameId: string
  taskId: string | null
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'timed_out'
  resultImageUrl: string | null
  errorMessage: string | null
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
  onContinuationBatchId?: (batchId: string) => void
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
  onContinuationBatchId,
}: StoreTryOnComparePanelProps) {
  const t = useTranslations('storeShopper')
  const [tiles, setTiles] = useState<TryOnTile[]>([])
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
  const pollControllersRef = useRef(new Map<string, () => void>())
  const pollStartedAtRef = useRef(new Map<string, number>())

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
    setDispatching(true)
    onError('')
    setContinuationState(null)
    const nextBatchId = batchId || (
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `batch-${Date.now()}`
    )
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
        pollStartedAtRef.current.delete(taskId)
      }
    }

    const applyTile = (taskId: string, patch: Partial<TryOnTile>) => {
      setTiles((current) =>
        current.map((item) => (item.taskId === taskId ? { ...item, ...patch } : item)),
      )
    }

    const failMessage = (reason: 'not_found' | 'server_error' | 'network' | 'timed_out' | 'forbidden') => {
      if (reason === 'timed_out') return t('tryOn.timedOut')
      if (reason === 'not_found') return t('tryOn.failed')
      return t('errors.tryOn')
    }

    for (const taskId of taskIds) {
      if (pollControllersRef.current.has(taskId)) continue
      if (!pollStartedAtRef.current.has(taskId)) {
        pollStartedAtRef.current.set(taskId, Date.now())
      }
      const startedAt = pollStartedAtRef.current.get(taskId)!
      let cancelled = false
      let timeoutId: ReturnType<typeof setTimeout> | null = null
      let attempt = 0
      let networkFailures = 0
      let serverErrors = 0

      const stop = () => {
        cancelled = true
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
      }

      const schedule = (delayMs: number) => {
        if (cancelled) return
        timeoutId = setTimeout(() => {
          void run()
        }, delayMs)
      }

      const run = async () => {
        if (cancelled) return
        const elapsedMs = Date.now() - startedAt
        if (elapsedMs >= STORE_TRYON_POLL_MAX_DURATION_MS) {
          applyTile(taskId, { status: 'timed_out', errorMessage: t('tryOn.timedOut') })
          return
        }

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
          if (cancelled) return

          const decision = decidePollHttpStatus({
            status: res.status,
            retryAfterHeader: res.headers.get('retry-after'),
            serverErrorCount: serverErrors,
            elapsedMs,
          })

          if (decision.action === 'entitlement') {
            let code: 'AUTH_REQUIRED' | 'CONSUMER_CREDITS_REQUIRED' = 'AUTH_REQUIRED'
            try {
              const json = await res.json()
              if (json.code === 'CONSUMER_CREDITS_REQUIRED') code = 'CONSUMER_CREDITS_REQUIRED'
            } catch {
              // Keep AUTH_REQUIRED when the body cannot be parsed.
            }
            setContinuationState(code)
            applyTile(taskId, {
              status: 'failed',
              errorMessage: t('errors.tryOn'),
            })
            return
          }

          if (decision.action === 'fail') {
            applyTile(taskId, {
              status: decision.reason === 'timed_out' ? 'timed_out' : 'failed',
              errorMessage: failMessage(decision.reason),
            })
            return
          }

          if (decision.action === 'retry') {
            if (res.status >= 500) serverErrors += 1
            attempt += 1
            schedule(decision.delayMs)
            return
          }

          const json = await res.json()
          if (cancelled) return
          if (!json.success) {
            serverErrors += 1
            const retry = decidePollHttpStatus({
              status: 500,
              serverErrorCount: serverErrors - 1,
              elapsedMs,
            })
            if (retry.action === 'retry') {
              attempt += 1
              schedule(retry.delayMs)
              return
            }
            applyTile(taskId, { status: 'failed', errorMessage: json.error || t('errors.tryOn') })
            return
          }

          const status = String(json.data.status).toLowerCase()
          if (status === 'completed' || status === 'failed') {
            setTiles((current) =>
              current.map((item) =>
                item.taskId === taskId
                  ? {
                      ...item,
                      status: status === 'completed' ? 'completed' : 'failed',
                      resultImageUrl: json.data.resultImageUrl ?? item.resultImageUrl,
                      errorMessage: json.data.errorMessage ?? (status === 'failed' ? t('tryOn.failed') : item.errorMessage),
                      frame: json.data.frame ? { ...item.frame, ...json.data.frame } : item.frame,
                    }
                  : item,
              ),
            )
            return
          }

          attempt += 1
          schedule(nextPollDelayMs(attempt))
        } catch {
          if (cancelled) return
          networkFailures += 1
          const decision = decidePollNetworkFailure({
            networkFailureCount: networkFailures,
            elapsedMs: Date.now() - startedAt,
          })
          if (decision.action === 'fail') {
            applyTile(taskId, {
              status: decision.reason === 'timed_out' ? 'timed_out' : 'failed',
              errorMessage: failMessage(decision.reason),
            })
            return
          }
          attempt += 1
          if (decision.action === 'retry') schedule(decision.delayMs)
        }
      }

      pollControllersRef.current.set(taskId, stop)
      schedule(nextPollDelayMs(0))
    }
  }, [activeTaskKey, merchantSlug, merchantSessionId, locale, t])

  useEffect(() => {
    const controllers = pollControllersRef.current
    const startedAt = pollStartedAtRef.current
    return () => {
      for (const stop of controllers.values()) stop()
      controllers.clear()
      startedAt.clear()
    }
  }, [])

  const completed = tiles.filter((tile) => tile.status === 'completed' && tile.resultImageUrl)
  const showCompare = experiencePolicy.compareEnabled && compareStarted && completed.length >= 2

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
    <section className="rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-[0_22px_70px_rgba(15,23,42,0.07)] sm:p-7">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Step 3 · {t('tryOn.editLabel')}</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold text-slate-950 sm:text-3xl">{t('tryOn.title')}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{t('tryOn.subtitle')}</p>
        </div>
        {tiles.length === 0 ? (
          <button
            type="button"
            onClick={() => void startTryOn()}
            disabled={dispatching}
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
                {selectedFrames.length === 1
                  ? (t.has('tryOn.startOne') ? t('tryOn.startOne') : 'Try On This Frame')
                  : t('tryOn.start', { count: selectedFrames.length })}
              </>
            )}
          </button>
        ) : null}
      </div>

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
                        {tile.status === 'failed' || tile.status === 'timed_out' ? (
                          <>
                            <p className={tile.status === 'timed_out' ? 'text-amber-800' : 'text-red-600'}>
                              {tile.errorMessage || (tile.status === 'timed_out'
                                ? (t.has('tryOn.timedOut') ? t('tryOn.timedOut') : 'Try-On is taking longer than expected')
                                : t('tryOn.failed'))}
                            </p>
                            <button
                              type="button"
                              onClick={() => void retryFailed(tile)}
                              className="inline-flex items-center gap-1 text-sm font-medium text-gray-800 underline"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              {t('tryOn.retry')}
                            </button>
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
