'use client'

import { useEffect, useRef, useState } from 'react'
import { Activity, GitCompare, Glasses, MousePointerClick, Sparkles } from 'lucide-react'
import {
  hasMerchantLivePulseChange,
  merchantLivePulseRefreshDelay,
  newlyArrivedMerchantLiveActivity,
  type MerchantLiveActivity,
  type MerchantLivePulse,
} from '@/modules/merchant/domain/merchant-live-pulse'

type Freshness = 'LOADING' | 'LIVE' | 'STALE' | 'PAUSED'

function number(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function activityLabel(kind: MerchantLiveActivity['kind']): string {
  switch (kind) {
    case 'TRY_ON_COMPLETED': return 'Try-On completed'
    case 'PRODUCT_CLICK': return 'Product clicked'
    case 'COMPARE_STARTED': return 'Compared frames'
    case 'RECOMMENDATION_COMPLETED': return 'Recommendation completed'
  }
}

function activityIcon(kind: MerchantLiveActivity['kind']) {
  switch (kind) {
    case 'TRY_ON_COMPLETED': return Glasses
    case 'PRODUCT_CLICK': return MousePointerClick
    case 'COMPARE_STARTED': return GitCompare
    case 'RECOMMENDATION_COMPLETED': return Sparkles
  }
}

function relativeTime(value: string, now: number): string {
  const minutes = Math.max(0, Math.floor((now - Date.parse(value)) / 60_000))
  return minutes === 0 ? 'now' : `${minutes}m ago`
}

function updatedLabel(pulse: MerchantLivePulse | null, now: number): string {
  if (!pulse) return 'Updated recently'
  const seconds = Math.max(0, Math.floor((now - Date.parse(pulse.generatedAt)) / 1000))
  return `Updated ${seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m`} ago`
}

export function MerchantLivePulse({ merchantId, variant = 'home' }: { merchantId: string; variant?: 'home' | 'analytics' }) {
  const [pulse, setPulse] = useState<MerchantLivePulse | null>(null)
  const [freshness, setFreshness] = useState<Freshness>('LOADING')
  const [moment, setMoment] = useState<MerchantLiveActivity | null>(null)
  const [clock, setClock] = useState(() => Date.now())
  const pulseRef = useRef<MerchantLivePulse | null>(null)
  const knownActivityIds = useRef(new Set<string>())
  const momentTimer = useRef<number | null>(null)

  useEffect(() => {
    let disposed = false
    let pollTimer: number | null = null
    let staleTimer: number | null = null
    let requestTimeout: number | null = null
    let inFlight: AbortController | null = null
    let baselineLoaded = false
    let consecutiveFailures = 0
    let lastMeaningfulChangeAt = Date.now()
    let lastImmediateRefreshAt = 0

    const isVisible = () => document.visibilityState === 'visible'
    const clearPollTimer = () => {
      if (pollTimer !== null) window.clearTimeout(pollTimer)
      pollTimer = null
    }
    const rememberActivity = (items: MerchantLiveActivity[]) => {
      for (const item of items) {
        knownActivityIds.current.add(item.id)
        if (knownActivityIds.current.size > 100) {
          const oldest = knownActivityIds.current.values().next().value
          if (oldest) knownActivityIds.current.delete(oldest)
        }
      }
    }
    const schedule = () => {
      clearPollTimer()
      if (disposed || !isVisible()) return
      pollTimer = window.setTimeout(() => void refresh(), merchantLivePulseRefreshDelay({
        now: Date.now(),
        lastMeaningfulChangeAt,
        consecutiveFailures,
      }))
    }
    const refresh = async () => {
      if (disposed || !isVisible()) return
      inFlight?.abort()
      const controller = new AbortController()
      inFlight = controller
      let timedOut = false
      const timeoutId = window.setTimeout(() => {
        timedOut = true
        controller.abort()
      }, 8_000)
      requestTimeout = timeoutId
      try {
        const response = await fetch(`/api/merchant/${encodeURIComponent(merchantId)}/live-pulse`, {
          method: 'GET',
          cache: 'no-store',
          credentials: 'same-origin',
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) throw new Error('Live pulse request failed')
        const envelope = await response.json() as { success?: boolean; data?: MerchantLivePulse }
        if (!envelope.success || !envelope.data || controller.signal.aborted || disposed) throw new Error('Live pulse response unavailable')

        const next = envelope.data
        const previous = pulseRef.current
        if (!baselineLoaded || !previous) {
          baselineLoaded = true
          lastMeaningfulChangeAt = Date.now()
          rememberActivity(next.recentActivity)
        } else {
          const arrived = newlyArrivedMerchantLiveActivity(previous, next, knownActivityIds.current)
          if (arrived) {
            setMoment(arrived)
            if (momentTimer.current !== null) window.clearTimeout(momentTimer.current)
            momentTimer.current = window.setTimeout(() => setMoment(null), 3_500)
          }
          if (arrived || hasMerchantLivePulseChange(previous, next)) lastMeaningfulChangeAt = Date.now()
          rememberActivity(next.recentActivity)
        }

        pulseRef.current = next
        setPulse(next)
        setFreshness('LIVE')
        setClock(Date.now())
        consecutiveFailures = 0
        if (staleTimer !== null) window.clearTimeout(staleTimer)
        staleTimer = window.setTimeout(() => {
          if (!disposed) setFreshness('STALE')
        }, 45_000)
      } catch {
        if ((!controller.signal.aborted || timedOut) && !disposed) {
          if (staleTimer !== null) window.clearTimeout(staleTimer)
          staleTimer = null
          consecutiveFailures = Math.min(3, consecutiveFailures + 1)
          setFreshness('PAUSED')
        }
      } finally {
        window.clearTimeout(timeoutId)
        if (requestTimeout === timeoutId) requestTimeout = null
        if (inFlight === controller) {
          inFlight = null
          schedule()
        }
      }
    }
    const refreshImmediately = () => {
      if (disposed || !isVisible() || Date.now() - lastImmediateRefreshAt < 1_000) return
      lastImmediateRefreshAt = Date.now()
      clearPollTimer()
      void refresh()
    }
    const handleVisibility = () => {
      if (isVisible()) refreshImmediately()
      else {
        clearPollTimer()
        inFlight?.abort()
      }
    }

    if (isVisible()) void refresh()
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', refreshImmediately)
    return () => {
      disposed = true
      clearPollTimer()
      if (staleTimer !== null) window.clearTimeout(staleTimer)
      if (requestTimeout !== null) window.clearTimeout(requestTimeout)
      inFlight?.abort()
      if (momentTimer.current !== null) window.clearTimeout(momentTimer.current)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', refreshImmediately)
    }
  }, [merchantId])

  useEffect(() => {
    if (freshness !== 'STALE') return
    const timer = window.setInterval(() => setClock(Date.now()), 10_000)
    return () => window.clearInterval(timer)
  }, [freshness])

  const statusLabel = freshness === 'LIVE'
    ? 'Live'
    : freshness === 'STALE'
      ? updatedLabel(pulse, clock)
      : freshness === 'PAUSED'
        ? 'Live data paused'
        : 'Checking activity'
  const hasRecentActivity = Boolean(pulse && (
    pulse.activeShoppers > 0
    || pulse.recentWindow.visitors > 0
    || pulse.recentWindow.tryOnCompletions > 0
    || pulse.recentWindow.productClicks > 0
    || pulse.recentActivity.length > 0
  ))

  if (variant === 'analytics') {
    return <section data-testid="merchant-analytics-recent-activity" aria-labelledby="merchant-live-pulse-title" className="min-w-0 rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id="merchant-live-pulse-title" className="text-base font-semibold tracking-tight text-slate-950">Recent shopper activity</h2>
          <p className="mt-0.5 text-[10px] text-slate-400">Anonymous · last 15 min</p>
        </div>
        <span aria-label={`Live data status: ${statusLabel}`} className={`mt-1 inline-flex shrink-0 items-center gap-1.5 text-[10px] font-medium ${freshness === 'LIVE' ? 'text-emerald-700' : freshness === 'PAUSED' ? 'text-amber-800' : 'text-slate-500'}`}>
          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${freshness === 'LIVE' ? 'bg-emerald-600' : freshness === 'PAUSED' ? 'bg-amber-600' : 'bg-slate-400'}`} />
          {statusLabel}
        </span>
      </div>

      {pulse?.recentActivity.length ? <ol aria-label="Anonymous recent shopper actions" className="relative mt-3 space-y-0.5 before:absolute before:bottom-3 before:left-[9px] before:top-3 before:w-px before:bg-slate-100">
        {pulse.recentActivity.slice(0, 5).map((item) => {
          const Icon = activityIcon(item.kind)
          return <li key={item.id} className="relative flex min-w-0 items-start gap-2.5 py-2">
            <span aria-hidden="true" className="relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-white text-blue-600"><Icon className="h-3 w-3" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <p className="min-w-0 truncate text-xs font-medium text-slate-800">{activityLabel(item.kind)}</p>
                <time className="shrink-0 text-[10px] tabular-nums text-slate-500" dateTime={item.occurredAt}>{relativeTime(item.occurredAt, clock)}</time>
              </div>
              {item.frame || item.experience ? <p className="mt-0.5 truncate text-[10px] text-slate-500">{item.frame?.name}{item.frame && item.experience ? ' · ' : ''}{item.experience ? `${item.experience.type === 'STORE' ? 'Store' : 'Campaign'} · ${item.experience.name}` : ''}</p> : null}
            </div>
          </li>
        })}
      </ol> : <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Activity className="h-3 w-3" /></span>
        <p>{pulse ? 'No recent activity' : freshness === 'PAUSED' ? 'Activity unavailable' : 'Checking activity'}</p>
      </div>}
      {freshness === 'PAUSED' && pulse ? <p className="sr-only">Showing the last successful update.</p> : null}
    </section>
  }

  return (
    <section aria-labelledby="merchant-live-pulse-title" className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.11em] text-slate-500">
            <Activity aria-hidden="true" className="h-3.5 w-3.5 text-blue-600" />Live activity
            <span className="font-medium normal-case tracking-normal text-slate-500">Anonymous · last 15 minutes</span>
          </p>
          <h2 id="merchant-live-pulse-title" className="sr-only">Recent shopper activity</h2>
        </div>
        <span aria-label={`Live data status: ${statusLabel}`} className={`inline-flex items-center gap-1.5 text-xs font-semibold ${freshness === 'LIVE' ? 'text-emerald-700' : freshness === 'PAUSED' ? 'text-amber-800' : 'text-slate-500'}`}>
          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${freshness === 'LIVE' ? 'bg-emerald-600' : freshness === 'PAUSED' ? 'bg-amber-600' : 'bg-slate-400'}`} />
          {statusLabel}
        </span>
      </div>

      {moment && (
        <div aria-live="polite" aria-atomic="true" className="merchant-live-moment pointer-events-none absolute left-3 right-3 top-12 z-10 rounded-lg border border-blue-100 bg-blue-50/95 px-3 py-2 text-sm text-slate-800 shadow-sm sm:left-auto sm:right-5 sm:max-w-sm">
          <span className="font-semibold">{activityLabel(moment.kind)}</span>
          {moment.frame && <span> · {moment.frame.name}</span>}
          <span className="ml-2 text-xs text-slate-500">just now</span>
        </div>
      )}

      {hasRecentActivity && pulse ? <>
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(140px,0.6fr)_minmax(0,1.4fr)] sm:items-center">
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-semibold tracking-tight tabular-nums text-slate-950">{number(pulse.activeShoppers)}</p>
            <p className="text-sm text-slate-600">active now</p>
          </div>
          <dl className="grid grid-cols-3 divide-x divide-slate-200">
            {[
              { label: 'Visitors', value: pulse.recentWindow.visitors },
              { label: 'Try-Ons', value: pulse.recentWindow.tryOnCompletions },
              { label: 'Product clicks', value: pulse.recentWindow.productClicks },
            ].map((metric) => (
              <div key={metric.label} className="min-w-0 px-2 first:pl-0 last:pr-0 sm:px-4">
                <dd className="text-sm font-semibold tabular-nums text-slate-900">{number(metric.value)}</dd>
                <dt className="mt-0.5 truncate text-[11px] text-slate-500">{metric.label}</dt>
              </div>
            ))}
          </dl>
        </div>
        {pulse.recentActivity.length > 0 ? <div className="mt-3 border-t border-slate-100 pt-2.5">
          <h3 className="sr-only">Anonymous recent shopper actions</h3>
          <ul aria-label="Anonymous recent shopper actions" className="divide-y divide-slate-100">
            {pulse.recentActivity.slice(0, 3).map((item) => {
              const Icon = activityIcon(item.kind)
              return <li key={item.id} className="flex min-w-0 items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="flex min-w-0 items-center gap-2 text-sm text-slate-900">
                    <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-500"><Icon className="h-3.5 w-3.5" /></span>
                    <span className="min-w-0 truncate">
                      <span className="font-medium">{activityLabel(item.kind)}</span>
                      {item.frame && <span className="text-slate-600"> · {item.frame.name}</span>}
                    </span>
                  </p>
                  {item.experience && <p className="mt-0.5 truncate pl-9 text-xs text-slate-500">{item.experience.type === 'STORE' ? 'Store' : 'Campaign'} · {item.experience.name}</p>}
                </div>
                <time className="shrink-0 pt-0.5 text-xs tabular-nums text-slate-500" dateTime={item.occurredAt}>{relativeTime(item.occurredAt, clock)}</time>
              </li>
            })}
          </ul>
        </div> : null}
      </> : <div className="mt-3 flex items-center gap-2.5 border-t border-slate-100 pt-3 text-sm text-slate-500">
        <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-400"><Activity className="h-3.5 w-3.5" /></span>
        <p>{pulse ? 'No live shopper activity right now' : freshness === 'PAUSED' ? 'Live activity is temporarily unavailable.' : 'Checking for recent shopper activity.'}</p>
      </div>}
      {freshness === 'PAUSED' && pulse && (
        <p className="mt-2 text-xs text-slate-500">Showing the last successful update.</p>
      )}
    </section>
  )
}
