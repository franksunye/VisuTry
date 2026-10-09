'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowUpRight, CheckCircle2, Copy, Glasses, Heart, ShieldCheck } from 'lucide-react'
import { DecisionResultQr } from './DecisionResultQr'
import type { DecisionJourneyStage } from '@/modules/store/domain/decision-journey'
import type { DecisionResultView } from '@/modules/store/application/decision-result-service'
import { MerchantHandoffLink } from '@/components/store/MerchantHandoffLink'

function formatExpiry(value: string, locale: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'soon'
  return `${new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(date)} UTC`
}

function resolveAccentColor(value: string | null): string {
  return value && /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value) ? value : '#2563eb'
}

function shopperExperienceLabel(name: string | null | undefined): string | null {
  const raw = name?.trim()
  if (!raw) return null
  const hasTimestamp = /(?:^|[\s_-])20\d{2}[-_/]?\d{2}[-_/]?\d{2}(?:[T_ -]\d{2}[:_-]?\d{2}[:_-]?\d{2}(?:\.\d+)?Z?)?/i.test(raw)
  const hasQaMarker = /(?:^|[\s_-])(?:qa|test|fixture|local)(?:[\s_-]|$)/i.test(raw)
  const looksLikeInternalId = /(?:store-rank|ranking[-_ ]?v\d|^[a-f\d]{16,}$)/i.test(raw)
  if (looksLikeInternalId || (hasTimestamp && hasQaMarker)) return null

  const withoutTimestamp = raw.replace(/[\s_-]*(?:20\d{2}[-_/]?\d{2}[-_/]?\d{2}(?:[T_ -]\d{2}[:_-]?\d{2}[:_-]?\d{2}(?:\.\d+)?Z?)?).*$/i, '').trim()
  const readable = (hasTimestamp ? withoutTimestamp : raw).replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
  return readable || null
}

function DecisionResultFrameThumbnail({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const unavailable = !imageUrl || failedUrl === imageUrl

  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-white sm:h-20 sm:w-20">
      {unavailable ? (
        <div role="img" aria-label={`${name} image unavailable`} className="flex h-full w-full items-center justify-center text-slate-300">
          <Glasses className="h-6 w-6" aria-hidden="true" />
        </div>
      ) : (
        <Image
          src={imageUrl}
          alt={`${name} product thumbnail`}
          fill
          unoptimized
          sizes="(min-width: 640px) 80px, 56px"
          className="object-contain p-1"
          onError={() => setFailedUrl(imageUrl)}
        />
      )}
    </div>
  )
}

export function DecisionResultPageClient({ locale, token, result, kioskMode = false }: { locale: string; token: string; result: DecisionResultView; kioskMode?: boolean }) {
  const [copied, setCopied] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const resetInFlight = useRef(false)
  const resultExperience = result.experience
  const resultPath = `/${locale}/result/${encodeURIComponent(token)}`
  const accentColor = resolveAccentColor(result.merchant.accentColor)
  const experienceLabel = shopperExperienceLabel(resultExperience?.name)
  const enabledStages = new Set<DecisionJourneyStage>(result.journey.enabledStages)
  const hasStage = (stage: DecisionJourneyStage) => enabledStages.has(stage)
  const publicExperiencePath = resultExperience?.type === 'CAMPAIGN'
    ? `/${locale}/c/${encodeURIComponent(result.merchant.slug)}/${encodeURIComponent(resultExperience.slug)}`
    : `/${locale}/store/${encodeURIComponent(result.merchant.slug)}`
  const canShowTryOn = hasStage('TRY_ON') && result.tryOnResults.length > 0
  const canShowCompare = hasStage('COMPARE') && result.compare !== null && result.compare.frameIds.length >= 2
  const fitFields = result.faceFit ? [
    result.faceFit.faceShape ? { label: 'Face shape', value: result.faceFit.faceShape } : null,
    result.faceFit.preferredWidthClass ? { label: 'Frame width', value: result.faceFit.preferredWidthClass } : null,
    result.faceFit.geometryQualityBand ? { label: 'Analysis quality', value: result.faceFit.geometryQualityBand } : null,
  ].filter((field): field is { label: string; value: string } => field !== null) : []

  const absoluteResultUrl = useMemo(() => {
    if (typeof window === 'undefined') return resultPath
    return `${window.location.origin}${resultPath}`
  }, [resultPath])

  const copyResultLink = async () => {
    setShareError(null)
    try {
      await navigator.clipboard.writeText(absoluteResultUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
      setShareError('Copying the link is unavailable in this browser.')
    }
  }

  const shareResultLink = async () => {
    setShareError(null)
    if (typeof navigator.share !== 'function') {
      await copyResultLink()
      return
    }
    try {
      await navigator.share({
        title: 'Your eyewear shortlist',
        text: `A shortlist from ${result.merchant.name}`,
        url: absoluteResultUrl,
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setShareError('Sharing is unavailable right now. You can copy the private result link instead.')
    }
  }

  const startNewShopper = useCallback(async () => {
    if (!kioskMode || resetInFlight.current) return
    resetInFlight.current = true
    setResetting(true)
    setResetError(null)
    try {
      const response = await fetch(`/api/store/results/${encodeURIComponent(token)}/kiosk-reset`, { method: 'POST', cache: 'no-store' })
      if (!response.ok) throw new Error('The kiosk reset could not be confirmed.')
      const experiencePath = result.experience?.type === 'CAMPAIGN'
        ? `/${locale}/c/${encodeURIComponent(result.merchant.slug)}/${encodeURIComponent(result.experience.slug)}/kiosk`
        : `/${locale}/store/${encodeURIComponent(result.merchant.slug)}/kiosk`
      const nextUrl = new URL(experiencePath, window.location.origin)
      nextUrl.searchParams.set('kioskReset', `${Date.now()}-${Math.random().toString(36).slice(2)}`)
      nextUrl.searchParams.set('kioskResetReason', 'manual')
      window.location.replace(`${nextUrl.pathname}${nextUrl.search}`)
    } catch {
      setResetError('The secure reset could not be confirmed. Keep this screen private and retry before the next shopper.')
      setResetting(false)
      resetInFlight.current = false
    }
  }, [kioskMode, locale, result.experience, result.merchant.slug, token])

  useEffect(() => {
    if (!kioskMode) return
    let timer = 0
    const arm = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => { void startNewShopper() }, (result.experience?.deliveryPolicy.kioskIdleTimeoutSeconds ?? 120) * 1000)
    }
    const activityEvents = ['pointerdown', 'touchstart', 'keydown'] as const
    arm()
    activityEvents.forEach((name) => window.addEventListener(name, arm, { passive: true }))
    return () => {
      window.clearTimeout(timer)
      activityEvents.forEach((name) => window.removeEventListener(name, arm))
    }
  }, [kioskMode, result.experience?.deliveryPolicy.kioskIdleTimeoutSeconds, startNewShopper])

  return (
    <main className="min-h-screen bg-[#f7f8fb] px-4 py-5 text-slate-950 sm:px-8 sm:py-10" style={{ borderTop: `4px solid ${accentColor}` }}>
      <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
        <header className="rounded-[1.5rem] bg-slate-950 p-5 text-white shadow-xl sm:rounded-[2rem] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              {result.merchant.logoUrl ? <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white p-1"><Image src={result.merchant.logoUrl} alt={`${result.merchant.name} logo`} fill unoptimized sizes="44px" className="object-contain" /></div> : null}
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">{result.merchant.name}</p>
              <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-5xl">
                {result.journey.experienceType === 'CAMPAIGN' ? 'Your campaign shortlist' : 'Your eyewear shortlist'}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                {experienceLabel ? `Selected for ${experienceLabel}.` : 'A considered set of frames for your next step.'}
                {result.merchant.referenceData ? ' Reference demonstration.' : ''}
              </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-xs text-slate-300"><ShieldCheck className="h-4 w-4 text-cyan-300" aria-hidden="true" /> Private link · expires {formatExpiry(result.expiresAt, locale)}</div>
              {kioskMode ? <button type="button" onClick={() => void startNewShopper()} disabled={resetting} className="min-h-12 touch-manipulation rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60">{resetting ? 'Resetting…' : 'New shopper'}</button> : null}
            </div>
          </div>
        </header>
        {resetError ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{resetError}</p> : null}

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6">
          <div className="space-y-5 sm:space-y-6">
            {hasStage('FIT_PROFILE') && result.faceFit ? (
              <section aria-labelledby="result-fit-heading" className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[2rem] sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Fit profile</p>
                <h2 id="result-fit-heading" className="mt-2 font-serif text-2xl font-semibold">A lightweight style guide</h2>
                {fitFields.length ? <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-3">{fitFields.map((field) => (
                  <div key={field.label} className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">{field.label}</p><p className="mt-1 font-semibold capitalize">{field.value}</p></div>
                ))}</div> : <p className="mt-4 text-sm leading-6 text-slate-600">Fit insights were not available for this photo. You can still explore the frames below.</p>}
                <p className="mt-3 text-xs leading-5 text-slate-500">Style guidance only; it is not a medical assessment or a guarantee of fit.</p>
              </section>
            ) : null}

            {hasStage('RECOMMENDATION') && result.recommendation?.frames.length ? (
              <section aria-labelledby="result-recommendation-heading" className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[2rem] sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Recommendation</p><h2 id="result-recommendation-heading" className="mt-2 font-serif text-2xl font-semibold">Your curated shortlist</h2></div>
                  {result.favoriteFrameIds.length ? <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700"><Heart className="h-3.5 w-3.5 fill-current" aria-hidden="true" />{result.favoriteFrameIds.length} saved</span> : null}
                </div>
                <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2">
                  {result.recommendation.frames.map((frame, index) => (
                    <article key={frame.frameId} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <DecisionResultFrameThumbnail imageUrl={frame.imageUrl} name={frame.name} />
                        <div className="min-w-0 flex-1">
                          {index === 0 ? <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-800">Top pick</span> : null}
                          <p className="mt-1 break-words font-semibold">{frame.name}</p>
                        </div>
                      </div>
                      {frame.reason ? <p className="mt-3 text-sm leading-5 text-slate-600">{frame.reason}</p> : null}
                      {frame.productUrl ? <a href={frame.productUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-blue-700">View product <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></a> : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : hasStage('RECOMMENDATION') ? (
              <section aria-labelledby="result-empty-heading" className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[2rem] sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Shortlist</p>
                <h2 id="result-empty-heading" className="mt-2 font-serif text-2xl font-semibold">Your result is not available</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">We could not find product recommendations in this private result. Return to the experience to start again.</p>
                <a href={publicExperiencePath} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Return to the experience</a>
              </section>
            ) : null}

            {canShowTryOn ? (
              <section aria-labelledby="result-tryon-heading" className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[2rem] sm:p-6">
                <div className="flex items-center gap-3"><Glasses className="h-5 w-5 text-blue-600" aria-hidden="true" /><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Try-On</p><h2 id="result-tryon-heading" className="mt-1 font-serif text-2xl font-semibold">Completed looks</h2></div></div>
                <div className="mt-4 grid gap-4 sm:mt-5 sm:grid-cols-2">
                  {result.tryOnResults.map((item) => (
                    <figure key={item.assetRef} className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                      {item.disclosure === 'LOCAL_QA_FIXTURE' ? (
                        <div role="img" aria-label="Local QA fixture image intentionally omitted" className="flex min-h-28 items-center justify-center bg-slate-50 p-5 text-center text-sm text-slate-500">Local QA fixture · image intentionally omitted</div>
                      ) : (
                        <div className="relative aspect-[4/3] bg-white"><Image src={item.imageUrl} alt={item.name || 'Prepared demonstration look'} fill unoptimized sizes="(min-width: 640px) 50vw, 100vw" className="object-contain" /></div>
                      )}
                      <figcaption className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                        <span className="min-w-0"><span className="block break-words font-semibold">{item.name || 'Selected frame'}</span>{item.disclosure ? <span className="mt-1 block text-xs font-medium text-slate-600">{item.disclosure === 'LOCAL_QA_FIXTURE' ? 'Test asset · not a shopper Try-On image' : 'Prepared demonstration result'}</span> : null}</span>
                        {item.productUrl ? <a href={item.productUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-700">Shop frame</a> : null}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            ) : null}

            {canShowCompare ? (
              <section aria-labelledby="result-compare-heading" className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[2rem] sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Compare</p>
                <h2 id="result-compare-heading" className="mt-2 font-serif text-2xl font-semibold">Frames you compared</h2>
                {result.compareFrames.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{result.compareFrames.map((frame) => (
                  <article key={frame.frameId} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <DecisionResultFrameThumbnail imageUrl={frame.imageUrl} name={frame.name} />
                    <div className="min-w-0 flex-1"><p className="break-words font-semibold">{frame.name}</p>
                      {frame.productUrl ? <a href={frame.productUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-blue-700">View product <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></a> : null}
                    </div>
                  </article>
                ))}</div> : <p className="mt-2 text-sm leading-6 text-slate-600">These frames are no longer available. Browse the experience for current styles.</p>}
              </section>
            ) : null}
          </div>

          <aside className="space-y-5 sm:space-y-6">
            <section aria-labelledby="result-share-heading" className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[2rem]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Your private link</p>
              <h2 id="result-share-heading" className="mt-2 font-serif text-2xl font-semibold">Keep this shortlist</h2>
              <p className="mt-2 text-sm leading-5 text-slate-600">Share or reopen it until {formatExpiry(result.expiresAt, locale)}.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => void copyResultLink()} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700"><Copy className="h-4 w-4" aria-hidden="true" />{copied ? 'Copied' : 'Copy link'}</button>
                <button type="button" onClick={() => void shareResultLink()} className="min-h-11 flex-1 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white">Share</button>
              </div>
              {shareError ? <p role="status" className="mt-3 text-xs leading-5 text-rose-700">{shareError}</p> : null}
              <p role="status" aria-live="polite" className="sr-only">{copied ? 'Private result link copied.' : ''}</p>
              <div data-testid="result-qr-continuation" className={kioskMode ? 'mt-5 border-t border-slate-100 pt-5' : 'mt-5 hidden border-t border-slate-100 pt-5 md:block'}>
                <p className="text-sm font-semibold">{kioskMode ? 'Continue on your phone' : 'Open on another device'}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Scan this private link to open the same shortlist on another screen.</p>
                <div className="mt-4 flex justify-center"><DecisionResultQr value={absoluteResultUrl} /></div>
              </div>
            </section>

            {resultExperience?.primaryCta || resultExperience?.secondaryCta ? (
              <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[2rem]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Next step</p>
                <div className="mt-4 space-y-3">
                  {[resultExperience.primaryCta, resultExperience.secondaryCta].filter((cta) => cta !== null).map((cta, index) => cta && (
                    <MerchantHandoffLink
                      key={`${cta.action}-${index}`}
                      handoff={cta}
                      merchantSlug={result.merchant.slug}
                      experienceSlug={resultExperience.slug}
                      experienceType={resultExperience.type}
                      surface="RESULT"
                      locale={locale}
                      className="flex min-h-11 items-center justify-between rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                    >
                      {cta.label}<ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </MerchantHandoffLink>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-5 text-emerald-900"><CheckCircle2 className="mb-2 h-5 w-5" aria-hidden="true" />This private result is from {result.merchant.name} and expires automatically.</div>
          </aside>
        </section>
      </div>
    </main>
  )
}
