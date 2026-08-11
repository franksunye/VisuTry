'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Check, ChevronDown, ChevronUp, HelpCircle, Layers3, Save, Search, Sparkles } from 'lucide-react'
import type { MerchantInsightsDto } from '@/modules/store/application/get-merchant-insights'
import type { ExperienceAdminSummary, ExperienceAdminWorkspace } from '@/modules/store/application/get-experience-admin'

function formatDate(value: string | null) {
  if (!value) return 'No date'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(value))
}

function metricRate(value: number, base: number) {
  if (base <= 0) return '—'
  return `${Math.round((value / base) * 100)}%`
}

function StatusBadge({ status, type }: { status: string; type: ExperienceAdminSummary['type'] }) {
  const statusClass = status === 'ACTIVE'
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
    : status === 'DRAFT'
      ? 'bg-amber-50 text-amber-700 ring-amber-100'
      : 'bg-slate-100 text-slate-600 ring-slate-200'
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1">
      <span className={`rounded-full px-2 py-0.5 ${type === 'CAMPAIGN' ? 'bg-violet-50 text-violet-700' : type === 'STORE' ? 'bg-blue-50 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
        {type === 'LEGACY' ? 'Legacy' : type === 'CAMPAIGN' ? 'Campaign' : 'Store'}
      </span>
      <span className={statusClass}>{status}</span>
    </span>
  )
}

function SummaryMetrics({ summary }: { summary: ExperienceAdminSummary }) {
  const metrics = [
    ['Sessions', summary.metrics.sessions],
    ['Recommendations', summary.metrics.recommendations],
    ['Try-ons', summary.metrics.tryOns],
    ['Compare', summary.metrics.compareStarts],
    ['Favorites', summary.metrics.favorites],
    ['Clicks', summary.metrics.productClicks],
    ['Inquiries', summary.metrics.inquiries],
  ] as const
  return (
    <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
      {metrics.map(([label, value]) => (
        <div key={label} className="rounded-xl bg-slate-50 px-3 py-2.5">
          <dt className="text-[10px] uppercase tracking-wide text-slate-400">{label}</dt>
          <dd className="mt-1 text-lg font-semibold text-slate-950">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function ExperiencesList({ workspace }: { workspace: ExperienceAdminWorkspace }) {
  const [filter, setFilter] = useState<'ALL' | 'STORE' | 'CAMPAIGN'>('ALL')
  const visible = workspace.experiences.filter((experience) => filter === 'ALL' || experience.type === filter)
  const showLegacy = filter === 'ALL'

  return (
    <div className="space-y-7 pb-12">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#173F4B] via-[#102F39] to-[#091C23] px-6 py-8 text-white shadow-xl sm:px-8">
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Link href={`/admin/store/merchants/${workspace.merchant.id}`} className="text-sm font-medium text-white/70 hover:text-white">
              ← {workspace.merchant.name} intelligence
            </Link>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Merchant control plane</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Experiences</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
              Manage one hosted Store and targeted Campaign journeys from the same merchant catalog.
            </p>
            {workspace.merchant.referenceData ? (
              <p className="mt-4 inline-flex rounded-full bg-amber-300/20 px-3 py-1 text-[11px] font-semibold text-amber-100 ring-1 ring-amber-200/30">
                Reference Pilot · Simulation · not live merchant traffic
              </p>
            ) : null}
          </div>
          <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
            <p className="text-xs uppercase tracking-wide text-white/55">Merchant catalog</p>
            <p className="mt-1 text-2xl font-semibold">{workspace.merchant.merchantCatalogFrameCount}</p>
            <p className="text-xs text-white/60">active frames</p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Performance surfaces</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{workspace.merchant.name} Experiences</h2>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="tablist" aria-label="Experience type filter">
          {(['ALL', 'STORE', 'CAMPAIGN'] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              onClick={() => setFilter(value)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${filter === value ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              {value === 'ALL' ? 'All' : value === 'STORE' ? 'Store' : 'Campaign'}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">No Experiences in this view.</div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {visible.map((experience) => (
            <article key={experience.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><StatusBadge status={experience.status} type={experience.type} /></div>
                  <h3 className="mt-3 truncate text-xl font-semibold text-slate-950">{experience.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{experience.slug ? `/${experience.slug}` : 'Historical traffic without Experience context'}</p>
                </div>
                {experience.publicPath ? <Link href={`/admin/store/merchants/${workspace.merchant.id}/experiences/${experience.id}`} className="shrink-0 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-700">Open detail</Link> : null}
              </div>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                <span><strong className="font-semibold text-slate-800">{experience.catalogFrameCount}</strong> catalog frames</span>
                <span>{formatDate(experience.startAt)} — {formatDate(experience.endAt)}</span>
                {experience.publicPath ? <Link href={experience.publicPath} target="_blank" className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900">Public route <ArrowUpRight className="h-3.5 w-3.5" /></Link> : null}
              </div>
              <SummaryMetrics summary={experience} />
              {experience.referenceData ? <p className="mt-4 text-[11px] font-medium text-amber-700">Reference / synthetic provenance is included in this signal view.</p> : null}
            </article>
          ))}
        </div>
      )}

      {showLegacy ? (
        <article className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5">
          <div className="flex items-start gap-3"><HelpCircle className="mt-0.5 h-5 w-5 text-slate-400" /><div><h3 className="font-semibold text-slate-800">Legacy / Unassigned traffic</h3><p className="mt-1 text-sm text-slate-500">Sessions, events, and intents created before Experience attribution remain visible and are not silently dropped.</p></div></div>
          <SummaryMetrics summary={workspace.legacy} />
        </article>
      ) : null}
    </div>
  )
}

type CatalogFrame = {
  id: string
  name: string
  sku: string | null
  imageUrl: string | null
  productUrl: string | null
  shape: string
  widthClass: string | null
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE'
}

export type ExperienceDetailData = {
  merchant: { id: string; slug: string; name: string; referenceData: boolean }
  experience: {
    id: string
    type: 'STORE' | 'CAMPAIGN'
    slug: string
    name: string
    status: string
    headline: string | null
    description: string | null
    primaryCtaLabel: string | null
    primaryCtaUrl: string | null
    offerLabel: string | null
    offerCode: string | null
    startAt: string | null
    endAt: string | null
    referenceData: boolean
    selectedFrameIds: string[]
  }
  catalog: CatalogFrame[]
  insights: MerchantInsightsDto
}

export function ExperienceDetailEditor({ initial }: { initial: ExperienceDetailData }) {
  const [experience, setExperience] = useState(initial.experience)
  const [selectedFrameIds, setSelectedFrameIds] = useState(initial.experience.selectedFrameIds)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState<'config' | 'catalog' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const catalogById = useMemo(() => new Map(initial.catalog.map((frame) => [frame.id, frame])), [initial.catalog])
  const filteredCatalog = initial.catalog.filter((frame) => `${frame.name} ${frame.sku ?? ''} ${frame.shape}`.toLowerCase().includes(search.toLowerCase()))
  const selectedFrames = selectedFrameIds.map((id) => catalogById.get(id)).filter(Boolean) as CatalogFrame[]
  const availableFrames = filteredCatalog.filter((frame) => frame.status === 'ACTIVE' && !selectedFrameIds.includes(frame.id))
  const metrics = initial.insights.metrics
  const stages = [
    ['Sessions', metrics.sessions],
    ['Recommendation', metrics.recommendations],
    ['Try-On', metrics.tryOns],
    ['Compare', metrics.compareStarts],
    ['Favorite / Shortlist', metrics.favorites],
    ['Product Click', metrics.productClicks],
    ['Inquiry', metrics.inquiries],
  ] as const

  async function saveConfig(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving('config'); setMessage(null)
    const response = await fetch(`/api/admin/store/merchants/${initial.merchant.id}/experiences/${experience.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(experience) })
    const payload = await response.json().catch(() => null)
    setSaving(null)
    setMessage(response.ok ? 'Experience configuration saved.' : payload?.error || 'Could not save configuration.')
  }

  async function saveCatalog() {
    setSaving('catalog'); setMessage(null)
    const response = await fetch(`/api/admin/store/merchants/${initial.merchant.id}/experiences/${experience.id}/frames`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ frameIds: selectedFrameIds }) })
    const payload = await response.json().catch(() => null)
    setSaving(null)
    setMessage(response.ok ? 'Catalog selection saved.' : payload?.error || 'Could not save catalog selection.')
  }

  function update(field: keyof typeof experience, value: string) {
    setExperience((current) => ({ ...current, [field]: value || null }))
  }

  function moveSelected(index: number, direction: -1 | 1) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= selectedFrameIds.length) return
    setSelectedFrameIds((current) => {
      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(nextIndex, 0, item)
      return next
    })
  }

  return (
    <div className="space-y-7 pb-12">
      <section className="rounded-3xl bg-gradient-to-br from-[#173F4B] via-[#102F39] to-[#091C23] px-6 py-7 text-white shadow-xl sm:px-8">
        <Link href={`/admin/store/merchants/${initial.merchant.id}/experiences`} className="text-sm font-medium text-white/70 hover:text-white"><ArrowLeft className="mr-1 inline h-4 w-4" /> Experiences</Link>
        <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div><div className="flex flex-wrap items-center gap-2"><h1 className="text-3xl font-semibold tracking-tight">{experience.name}</h1><StatusBadge status={experience.status} type={experience.type} /></div><p className="mt-2 text-sm text-white/70">{experience.type === 'STORE' ? 'Persistent hosted Store' : 'Targeted Campaign journey'} · /{experience.slug}</p>{initial.merchant.referenceData || experience.referenceData ? <p className="mt-3 inline-flex rounded-full bg-amber-300/20 px-3 py-1 text-[11px] font-semibold text-amber-100 ring-1 ring-amber-200/30">Reference Pilot · Simulation · no revenue data</p> : null}</div>
          <div className="flex flex-wrap gap-3"><Link href={experience.type === 'STORE' ? `/en/store/${initial.merchant.slug}` : `/en/c/${initial.merchant.slug}/${experience.slug}`} target="_blank" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100">Open public route <ArrowUpRight className="h-4 w-4" /></Link></div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Catalog size</p><p className="mt-2 text-3xl font-semibold text-slate-950">{selectedFrameIds.length}</p><p className="mt-1 text-xs text-slate-400">Merchant-owned frames selected</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Sessions</p><p className="mt-2 text-3xl font-semibold text-slate-950">{metrics.sessions}</p><p className="mt-1 text-xs text-slate-400">Experience-scoped sessions</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Try-Ons</p><p className="mt-2 text-3xl font-semibold text-slate-950">{metrics.tryOns}</p><p className="mt-1 text-xs text-slate-400">{metricRate(metrics.tryOns, metrics.sessions)} of sessions</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Intent signals</p><p className="mt-2 text-3xl font-semibold text-slate-950">{metrics.favorites + metrics.productClicks + metrics.inquiries}</p><p className="mt-1 text-xs text-slate-400">Favorites, clicks, inquiries</p></div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Experience funnel</p><h2 className="mt-2 text-xl font-semibold text-slate-950">Shopper decision path</h2><p className="mt-1 text-sm text-slate-500">Conversion signals only. Revenue and checkout are intentionally not inferred.</p></div>
        <div className="mt-6 grid gap-2 md:grid-cols-7">
          {stages.map(([label, value], index) => <div key={label} className="relative rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p><p className="mt-1 text-xs font-medium text-blue-700">{metricRate(value, metrics.sessions)} of sessions</p>{index < stages.length - 1 ? <span className="absolute -right-1.5 top-1/2 hidden -translate-y-1/2 text-slate-300 md:block">→</span> : null}</div>)}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={saveConfig} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Configuration</p><h2 className="mt-2 text-xl font-semibold text-slate-950">Experience settings</h2><p className="mt-1 text-sm text-slate-500">Small, safe controls for copy, dates, CTA, and offer.</p></div><Layers3 className="h-5 w-5 text-slate-300" /></div>
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-slate-700">Name<input value={experience.name} onChange={(event) => setExperience((current) => ({ ...current, name: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-700">Status<select value={experience.status} onChange={(event) => update('status', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option>DRAFT</option><option>ACTIVE</option><option>ENDED</option><option>ARCHIVED</option></select></label><label className="block text-sm font-medium text-slate-700">Public slug<input value={experience.slug} disabled className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500" /></label></div>
            <label className="block text-sm font-medium text-slate-700">Headline<input value={experience.headline ?? ''} onChange={(event) => update('headline', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
            <label className="block text-sm font-medium text-slate-700">Description<textarea value={experience.description ?? ''} onChange={(event) => update('description', event.target.value)} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-700">Start at<input type="datetime-local" value={experience.startAt ? experience.startAt.slice(0, 16) : ''} onChange={(event) => update('startAt', event.target.value ? new Date(event.target.value).toISOString() : '')} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><label className="block text-sm font-medium text-slate-700">End at<input type="datetime-local" value={experience.endAt ? experience.endAt.slice(0, 16) : ''} onChange={(event) => update('endAt', event.target.value ? new Date(event.target.value).toISOString() : '')} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label></div>
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-700">Primary CTA label<input value={experience.primaryCtaLabel ?? ''} onChange={(event) => update('primaryCtaLabel', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><label className="block text-sm font-medium text-slate-700">Primary CTA URL<input value={experience.primaryCtaUrl ?? ''} onChange={(event) => update('primaryCtaUrl', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label></div>
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-700">Offer label<input value={experience.offerLabel ?? ''} onChange={(event) => update('offerLabel', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><label className="block text-sm font-medium text-slate-700">Offer code<input value={experience.offerCode ?? ''} onChange={(event) => update('offerCode', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label></div>
          </div>
          <button type="submit" disabled={saving !== null} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving === 'config' ? 'Saving…' : 'Save configuration'}</button>
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Catalog selection</p><h2 className="mt-2 text-xl font-semibold text-slate-950">Choose frames from the merchant catalog</h2><p className="mt-1 text-sm text-slate-500">Frames remain merchant-owned; this Experience stores only a selection and order.</p></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{selectedFrameIds.length} selected</span></div>
          <div className="relative mt-5"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input aria-label="Search catalog" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search frames, SKU, or shape" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" /></div>
          <div className="mt-5 space-y-3"><h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Selected order</h3>{selectedFrames.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">No frames selected yet.</p> : selectedFrames.map((frame, index) => <div key={frame.id} className="flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50/50 p-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-xs font-bold text-white">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{frame.name}</p><p className="text-xs text-slate-500">{frame.sku || frame.shape}{frame.status !== 'ACTIVE' ? ` · ${frame.status.toLowerCase()}` : ''}</p></div><button type="button" aria-label={`Move ${frame.name} up`} onClick={() => moveSelected(index, -1)} disabled={index === 0} className="rounded-lg p-1.5 text-slate-400 hover:bg-white disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button><button type="button" aria-label={`Move ${frame.name} down`} onClick={() => moveSelected(index, 1)} disabled={index === selectedFrames.length - 1} className="rounded-lg p-1.5 text-slate-400 hover:bg-white disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button><button type="button" onClick={() => setSelectedFrameIds((current) => current.filter((id) => id !== frame.id))} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-rose-700 hover:bg-white">Remove</button></div>)}</div>
          <div className="mt-6 space-y-3"><h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Available merchant frames</h3>{availableFrames.length === 0 ? <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No matching unselected active frames.</p> : <div className="grid gap-2 sm:grid-cols-2">{availableFrames.map((frame) => <button type="button" key={frame.id} onClick={() => setSelectedFrameIds((current) => [...current, frame.id])} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-teal-300 hover:bg-teal-50/40"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400"><Sparkles className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{frame.name}</span><span className="block truncate text-xs text-slate-500">{frame.sku || frame.shape}</span></span><span className="text-lg text-teal-700">+</span></button>)}</div>}</div>
          <button type="button" disabled={saving !== null} onClick={saveCatalog} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Check className="h-4 w-4" />{saving === 'catalog' ? 'Saving…' : 'Save catalog selection'}</button>
        </section>
      </div>
      {message ? <p role="status" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">{message}</p> : null}
    </div>
  )
}
