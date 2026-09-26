'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight, CheckCircle2, Copy, Glasses, Heart, ShieldCheck } from 'lucide-react'
import { DecisionResultQr } from './DecisionResultQr'
import type { DecisionResultView } from '@/modules/store/application/decision-result-service'

function formatExpiry(value: string): string {
  return new Date(value).toISOString().replace('.000Z', ' UTC').replace('T', ' ')
}

export function DecisionResultPageClient({ locale, token, result }: { locale: string; token: string; result: DecisionResultView }) {
  const [copied, setCopied] = useState(false)
  const resultPath = `/${locale}/result/${encodeURIComponent(token)}`
  const absoluteResultUrl = useMemo(() => {
    if (typeof window === 'undefined') return resultPath
    return `${window.location.origin}${resultPath}`
  }, [resultPath])

  const copyResultLink = async () => {
    try {
      await navigator.clipboard.writeText(absoluteResultUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] px-4 py-8 text-slate-950 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Private Decision Result</p>
              <h1 className="mt-3 font-serif text-3xl font-semibold sm:text-5xl">Your {result.experience?.name || 'shopping'} result</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">A canonical result for {result.merchant.name}, backed by the same Merchant Experience journey on every device.</p>
            </div>
              <div className="flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-xs text-slate-300"><ShieldCheck className="h-4 w-4 text-cyan-300" /> Expires {formatExpiry(result.expiresAt)}</div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-6">
            {result.faceFit ? (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Fit summary</p>
                <h2 className="mt-2 font-serif text-2xl font-semibold">A lightweight read of your fit</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Face shape</p><p className="mt-1 font-semibold capitalize">{result.faceFit.faceShape || 'Not measured'}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Frame width</p><p className="mt-1 font-semibold capitalize">{result.faceFit.preferredWidthClass || 'Flexible'}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Analysis quality</p><p className="mt-1 font-semibold capitalize">{result.faceFit.geometryQualityBand || 'Unavailable'}</p></div>
                </div>
              </section>
            ) : null}

            {result.recommendation ? (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Recommendation</p><h2 className="mt-2 font-serif text-2xl font-semibold">Your curated shortlist</h2></div>
                  <span className="text-xs text-slate-400">{result.recommendation.rankingVersion}</span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {result.recommendation.frames.map((frame) => (
                    <div key={frame.frameId} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{frame.name}</p><p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-400">{frame.sku || 'Merchant frame'}</p></div><span className="text-sm font-semibold text-blue-700">{Math.round(frame.score)}</span></div>
                      <p className="mt-3 text-sm leading-5 text-slate-600">{frame.reason}</p>
                      {frame.productUrl ? <a href={frame.productUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700">View product <ArrowUpRight className="h-3.5 w-3.5" /></a> : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3"><Glasses className="h-5 w-5 text-blue-600" /><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Try-On results</p><h2 className="mt-1 font-serif text-2xl font-semibold">Your completed looks</h2></div></div>
              {result.tryOnResults.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2">{result.tryOnResults.map((item) => <figure key={item.assetRef} className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50"><div className="relative aspect-square bg-white"><Image src={item.imageUrl} alt={item.name || 'Completed virtual try-on'} fill unoptimized sizes="(min-width: 640px) 50vw, 100vw" className="object-contain" /></div><figcaption className="flex items-center justify-between gap-3 p-4 text-sm"><span className="font-semibold">{item.name || item.sku || 'Selected frame'}</span>{item.productUrl ? <a href={item.productUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-700">Shop frame</a> : null}</figcaption></figure>)}</div> : <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">Your recommendation is saved. Completed Try-On looks will appear here as they finish.</p>}
              {result.favoriteFrameIds.length ? <p className="mt-4 flex items-center gap-2 text-sm text-rose-700"><Heart className="h-4 w-4 fill-current" /> {result.favoriteFrameIds.length} saved favorite{result.favoriteFrameIds.length === 1 ? '' : 's'}</p> : null}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 text-center shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Continue on your phone</p>
              <h2 className="mt-2 font-serif text-2xl font-semibold">Scan this result</h2>
              <p className="mt-2 text-sm leading-5 text-slate-500">The QR link opens this same canonical result in a clean browser. No session storage is required.</p>
              <div className="mt-5 flex justify-center"><DecisionResultQr value={absoluteResultUrl} /></div>
              <button type="button" onClick={() => void copyResultLink()} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"><Copy className="h-4 w-4" /> {copied ? 'Copied' : 'Copy result link'}</button>
            </section>

            {result.experience?.primaryCta || result.experience?.secondaryCta ? (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Next step</p>
                <div className="mt-4 space-y-3">
                  {[result.experience.primaryCta, result.experience.secondaryCta].filter(Boolean).map((cta, index) => cta && (
                    cta.url.startsWith('/') ? (
                      <Link key={`${cta.url}-${index}`} href={cta.url} className="flex items-center justify-between rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                        {cta.label}<ArrowUpRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <a key={`${cta.url}-${index}`} href={cta.url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                        {cta.label}<ArrowUpRight className="h-4 w-4" />
                      </a>
                    )
                  ))}
                </div>
              </section>
            ) : null}

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-5 text-emerald-900"><CheckCircle2 className="mb-2 h-5 w-5" />This result is scoped to {result.merchant.name} and expires automatically.</div>
          </aside>
        </section>
      </div>
    </main>
  )
}
