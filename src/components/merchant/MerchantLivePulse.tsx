'use client'

import { useEffect, useRef, useState } from 'react'
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

function relativeTime(value: string, now: number): string {
  const minutes = Math.max(0, Math.floor((now - Date.parse(value)) / 60_000))
  return minutes === 0 ? 'now' : `${minutes}m ago`
}

function updatedLabel(pulse: MerchantLivePulse | null, now: number): string {
  if (!pulse) return 'Updated recently'
  const seconds = Math.max(0, Math.floor((now - Date.parse(pulse.generatedAt)) / 1000))
  return `Updated ${seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m`} ago`
}

export function MerchantLivePulse({ merchantId }: { merchantId: string }) {
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

  return (
    <section aria-labelledby="merchant-live-pulse-title" className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="merchant-live-pulse-title" className="text-sm font-semibold text-slate-950">Live activity</h2>
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

      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(150px,0.75fr)_2fr] sm:items-center">
        <div className="flex items-baseline gap-2 sm:block">
          <p className="tabular-nums text-2xl font-semibold tracking-tight text-slate-950">{pulse ? number(pulse.activeShoppers) : '—'}</p>
          <div>
            <p className="text-sm font-medium text-slate-800">active shoppers</p>
            <p className="text-xs text-slate-500">Sessions active in the last 5 minutes</p>
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-medium text-slate-500">Last 15 minutes</p>
          <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-lg bg-slate-50 py-2.5">
            {[
              { label: 'Visitors', value: pulse?.recentWindow.visitors },
              { label: 'Try-Ons', value: pulse?.recentWindow.tryOnCompletions },
              { label: 'Product clicks', value: pulse?.recentWindow.productClicks },
            ].map((metric) => (
              <div key={metric.label} className="min-w-0 px-2 text-center sm:px-3">
                <p className="tabular-nums text-base font-semibold text-slate-900">{metric.value == null ? '—' : number(metric.value)}</p>
                <p className="mt-0.5 truncate text-[11px] leading-4 text-slate-500 sm:text-xs">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {pulse && !hasRecentActivity && (
        <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">No live shopper activity right now</p>
      )}
      {freshness === 'PAUSED' && pulse && (
        <p className="mt-2 text-xs text-slate-500">Showing the last successful update.</p>
      )}

      <div className="mt-3 border-t border-slate-100 pt-3">
        <h3 className="text-xs font-semibold text-slate-700">Recent activity</h3>
        {pulse?.recentActivity.length ? (
          <ul className="mt-1 divide-y divide-slate-100">
            {pulse.recentActivity.map((item) => (
              <li key={item.id} className="flex min-w-0 items-start justify-between gap-3 py-2 first:pt-1 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-900">
                    <span className="font-medium">{activityLabel(item.kind)}</span>
                    {item.frame && <span className="text-slate-600"> · {item.frame.name}</span>}
                  </p>
                  {item.experience && <p className="truncate text-xs text-slate-500">{item.experience.type === 'STORE' ? 'Store' : 'Campaign'} · {item.experience.name}</p>}
                </div>
                <time className="shrink-0 pt-0.5 text-xs tabular-nums text-slate-500" dateTime={item.occurredAt}>{relativeTime(item.occurredAt, clock)}</time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-slate-500">{pulse ? 'No recent activity' : 'Recent activity will appear here.'}</p>
        )}
      </div>
    </section>
  )
}
