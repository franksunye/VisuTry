'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  HelpCircle,
  Layers3,
  Search,
  Save,
  Sparkles,
} from 'lucide-react'
import type { MerchantInsightsDto } from '@/modules/store/application/get-merchant-insights'
import type { ExperienceAdminSummary, ExperienceAdminWorkspace } from '@/modules/store/application/get-experience-admin'

function formatDate(value: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(value))
}

function scheduleLabel(summary: Pick<ExperienceAdminSummary, 'type' | 'startAt' | 'endAt'>) {
  if (summary.type === 'STORE') return 'Evergreen'
  const start = formatDate(summary.startAt)
  const end = formatDate(summary.endAt)
  if (start && end) return `${start} – ${end}`
  if (start) return `From ${start}`
  if (end) return `Until ${end}`
  return 'No campaign window set'
}

function rate(value: number, denominator: number) {
  if (denominator <= 0) return '—'
  return `${Math.round((value / denominator) * 100)}%`
}

function StatusBadge({ status, type }: { status: string; type: ExperienceAdminSummary['type'] }) {
  const statusClass = status === 'ACTIVE'
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
    : status === 'DRAFT'
      ? 'bg-amber-50 text-amber-700 ring-amber-100'
      : 'bg-slate-100 text-slate-600 ring-slate-200'
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${type === 'CAMPAIGN' ? 'bg-violet-50 text-violet-700 ring-violet-100' : type === 'STORE' ? 'bg-blue-50 text-blue-700 ring-blue-100' : 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
        {type === 'LEGACY' ? 'Historical' : type === 'CAMPAIGN' ? 'Campaign' : 'Store'}
      </span>
      {type !== 'LEGACY' ? <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${statusClass}`}>{status[0] + status.slice(1).toLowerCase()}</span> : null}
    </div>
  )
}

function ReferenceBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      title="Simulation data — not live merchant traffic"
      className={`inline-flex items-center rounded-full bg-amber-50 font-semibold text-amber-800 ring-1 ring-amber-200 ${compact ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-[11px]'}`}
    >
      Reference
    </span>
  )
}

function EmptyState({ title, children, compact = false }: { title: string; children: string; compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 text-center ${compact ? 'px-4 py-6' : 'px-6 py-10'}`}>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">{children}</p>
    </div>
  )
}

function SummaryMetrics({ summary }: { summary: ExperienceAdminSummary }) {
  const metrics = [
    ['Sessions', summary.metrics.sessions],
    ['Try-On', summary.metrics.tryOns],
    ['Compare', summary.metrics.compareStarts],
    ['Favorite', summary.metrics.favorites],
    ['Product Click', summary.metrics.productClicks],
    ['Inquiry', summary.metrics.inquiries],
  ] as const
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-3 xl:grid-cols-6">
      {metrics.map(([label, value]) => (
        <div key={label}>
          <dt className="text-[11px] text-slate-500">{label}</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-950">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function ExperienceRow({ experience, merchantId }: { experience: ExperienceAdminSummary; merchantId: string }) {
  const detailPath = `/admin/store/merchants/${merchantId}/experiences/${experience.id}`
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-md sm:p-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={experience.status} type={experience.type} />
            {experience.referenceData ? <ReferenceBadge compact /> : null}
          </div>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">{experience.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{scheduleLabel(experience)} · {experience.catalogFrameCount} selected frames</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {experience.publicPath ? <Link href={experience.publicPath} target="_blank" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Public route <ExternalLink className="h-3.5 w-3.5" /></Link> : null}
          {experience.publicPath ? <Link href={detailPath} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-700">Open performance <ArrowUpRight className="h-3.5 w-3.5" /></Link> : null}
        </div>
      </div>
      <div className="mt-5"><SummaryMetrics summary={experience} /></div>
      <p className="mt-4 text-xs text-slate-500">
        {experience.metrics.sessions > 0 ? `${rate(experience.metrics.tryOns, experience.metrics.sessions)} Try-On rate · ${rate(experience.metrics.productClicks, experience.metrics.sessions)} Product Click rate` : 'No shopper activity yet'}
      </p>
    </article>
  )
}

export function ExperiencesList({ workspace }: { workspace: ExperienceAdminWorkspace }) {
  const [filter, setFilter] = useState<'ALL' | 'STORE' | 'CAMPAIGN'>('ALL')
  const visible = workspace.experiences.filter((experience) => filter === 'ALL' || experience.type === filter)
  const activeCount = workspace.experiences.filter((experience) => experience.status === 'ACTIVE').length
  const sessions = workspace.experiences.reduce((total, experience) => total + experience.metrics.sessions, 0)
  const intent = workspace.experiences.reduce((total, experience) => total + experience.metrics.favorites + experience.metrics.productClicks + experience.metrics.inquiries, 0)

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-7 md:flex-row md:items-end">
        <div>
          <Link href={`/admin/store/merchants/${workspace.merchant.id}`} className="text-sm font-medium text-slate-500 hover:text-slate-950"><ArrowLeft className="mr-1 inline h-4 w-4" /> {workspace.merchant.name}</Link>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Experiences</h1>
            {workspace.merchant.referenceData ? <ReferenceBadge /> : null}
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Compare the Store and Campaign journeys that shape shopper interest for this merchant.</p>
        </div>
        <dl className="grid grid-cols-3 gap-5 text-right md:text-left">
          <div><dt className="text-xs text-slate-500">Active</dt><dd className="mt-1 text-2xl font-semibold tabular-nums text-slate-950">{activeCount}</dd></div>
          <div><dt className="text-xs text-slate-500">Sessions</dt><dd className="mt-1 text-2xl font-semibold tabular-nums text-slate-950">{sessions}</dd></div>
          <div><dt className="text-xs text-slate-500">Intent</dt><dd className="mt-1 text-2xl font-semibold tabular-nums text-slate-950">{intent}</dd></div>
        </dl>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Campaign portfolio</p><h2 className="mt-1 text-xl font-semibold text-slate-950">Choose the next journey to inspect</h2></div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1" role="tablist" aria-label="Experience type filter">
          {(['ALL', 'STORE', 'CAMPAIGN'] as const).map((value) => <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => setFilter(value)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${filter === value ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>{value === 'ALL' ? 'All' : value[0] + value.slice(1).toLowerCase()}</button>)}
        </div>
      </div>

      {visible.length === 0 ? <EmptyState title="No Experiences in this view" compact>There is no Store or Campaign activity to review here yet.</EmptyState> : <div className="space-y-4">{visible.map((experience) => <ExperienceRow key={experience.id} experience={experience} merchantId={workspace.merchant.id} />)}</div>}

      {filter === 'ALL' && (workspace.legacy.metrics.sessions > 0 || workspace.legacy.metrics.favorites + workspace.legacy.metrics.productClicks + workspace.legacy.metrics.inquiries > 0) ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5 sm:p-6">
          <div className="flex items-start gap-3"><HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" /><div><h2 className="font-semibold text-slate-800">Historical traffic</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Traffic captured before Experience attribution was introduced. It remains visible here, but is not compared with current Store or Campaign journeys.</p></div></div>
          <div className="mt-4 grid max-w-xl grid-cols-3 gap-4 border-t border-slate-200 pt-4 text-sm"><div><p className="text-xs text-slate-500">Sessions</p><p className="mt-1 text-lg font-semibold text-slate-900">{workspace.legacy.metrics.sessions}</p></div><div><p className="text-xs text-slate-500">Favorite</p><p className="mt-1 text-lg font-semibold text-slate-900">{workspace.legacy.metrics.favorites}</p></div><div><p className="text-xs text-slate-500">Inquiry</p><p className="mt-1 text-lg font-semibold text-slate-900">{workspace.legacy.metrics.inquiries}</p></div></div>
        </section>
      ) : null}
    </div>
  )
}

type CatalogFrame = {
  id: string
  name: string
  brand: string | null
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

function DetailFunnel({ metrics }: { metrics: MerchantInsightsDto['metrics'] }) {
  if (metrics.sessions === 0) return <EmptyState title="No shopper activity yet">Performance will appear here after this Experience receives traffic.</EmptyState>
  const groups = [
    { label: 'Traffic', items: [['Sessions', metrics.sessions]] as const },
    { label: 'Engagement', items: [['Recommendation', metrics.recommendations], ['Try-On', metrics.tryOns], ['Compare', metrics.compareStarts]] as const },
    { label: 'Intent', items: [['Favorite', metrics.favorites], ['Product Click', metrics.productClicks], ['Inquiry', metrics.inquiries]] as const },
  ]
  return <div className="grid gap-4 lg:grid-cols-3">{groups.map((group) => <section key={group.label} className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{group.label}</p><div className="mt-4 space-y-3">{group.items.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3"><span className="text-sm text-slate-600">{label}</span><span className="text-lg font-semibold tabular-nums text-slate-950">{value}</span></div>)}</div></section>)}</div>
}

function CatalogThumbnail({ frame }: { frame: CatalogFrame }) {
  return <div className="relative h-12 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-200">{frame.imageUrl ? <Image src={frame.imageUrl} alt="" fill sizes="56px" className="object-contain p-1" /> : <Sparkles className="m-auto h-4 w-4 text-slate-300" />}</div>
}

export function ExperienceDetailEditor({ initial }: { initial: ExperienceDetailData }) {
  const [experience, setExperience] = useState(initial.experience)
  const [selectedFrameIds, setSelectedFrameIds] = useState(initial.experience.selectedFrameIds)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState<'config' | 'catalog' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const catalogById = useMemo(() => new Map(initial.catalog.map((frame) => [frame.id, frame])), [initial.catalog])
  const filteredCatalog = initial.catalog.filter((frame) => `${frame.name} ${frame.brand ?? ''} ${frame.sku ?? ''} ${frame.shape}`.toLowerCase().includes(search.toLowerCase()))
  const selectedFrames = selectedFrameIds.map((id) => catalogById.get(id)).filter(Boolean) as CatalogFrame[]
  const availableFrames = filteredCatalog.filter((frame) => frame.status === 'ACTIVE' && !selectedFrameIds.includes(frame.id))
  const metrics = initial.insights.metrics
  const reference = initial.merchant.referenceData || experience.referenceData

  async function saveConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving('config'); setMessage(null)
    const response = await fetch(`/api/admin/store/merchants/${initial.merchant.id}/experiences/${experience.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(experience) })
    const payload = await response.json().catch(() => null); setSaving(null)
    setMessage(response.ok ? 'Experience settings saved.' : payload?.error || 'Could not save settings.')
  }

  async function saveCatalog() {
    setSaving('catalog'); setMessage(null)
    const response = await fetch(`/api/admin/store/merchants/${initial.merchant.id}/experiences/${experience.id}/frames`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ frameIds: selectedFrameIds }) })
    const payload = await response.json().catch(() => null); setSaving(null)
    setMessage(response.ok ? 'Catalog selection saved.' : payload?.error || 'Could not save catalog selection.')
  }

  function update(field: keyof typeof experience, value: string) { setExperience((current) => ({ ...current, [field]: value || null })) }
  function moveSelected(index: number, direction: -1 | 1) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= selectedFrameIds.length) return
    setSelectedFrameIds((current) => { const next = [...current]; const [item] = next.splice(index, 1); next.splice(nextIndex, 0, item); return next })
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-end">
        <div>
          <Link href={`/admin/store/merchants/${initial.merchant.id}/experiences`} className="text-sm font-medium text-slate-500 hover:text-slate-950"><ArrowLeft className="mr-1 inline h-4 w-4" /> Experiences</Link>
          <div className="mt-5 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{experience.name}</h1><StatusBadge status={experience.status} type={experience.type} />{reference ? <ReferenceBadge /> : null}</div>
          <p className="mt-3 text-sm text-slate-500">{experience.type === 'STORE' ? 'Evergreen Store' : 'Campaign'} · {experience.type === 'STORE' ? 'Evergreen' : scheduleLabel(experience)}</p>
        </div>
        <Link href={experience.type === 'STORE' ? `/en/store/${initial.merchant.slug}` : `/en/c/${initial.merchant.slug}/${experience.slug}`} target="_blank" className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">Open public route <ArrowUpRight className="h-4 w-4" /></Link>
      </header>

      {reference ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><strong>Reference data.</strong> Simulation activity for product demonstration.</p> : null}

      <section aria-labelledby="performance-heading" className="space-y-5">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Performance</p><h2 id="performance-heading" className="mt-1 text-2xl font-semibold text-slate-950">What is happening in this Experience?</h2></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Sessions</p><p className="mt-2 text-3xl font-semibold tabular-nums text-slate-950">{metrics.sessions}</p><p className="mt-1 text-xs text-slate-400">Shopper activity</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Recommendation</p><p className="mt-2 text-3xl font-semibold tabular-nums text-slate-950">{metrics.recommendations}</p><p className="mt-1 text-xs text-slate-400">Curated frame edits</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Try-On</p><p className="mt-2 text-3xl font-semibold tabular-nums text-slate-950">{metrics.tryOns}</p><p className="mt-1 text-xs text-slate-400">{rate(metrics.tryOns, metrics.sessions)} of sessions</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Intent signals</p><p className="mt-2 text-3xl font-semibold tabular-nums text-slate-950">{metrics.favorites + metrics.productClicks + metrics.inquiries}</p><p className="mt-1 text-xs text-slate-400">Favorite · Product Click · Inquiry</p></div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="funnel-heading">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Funnel</p><h2 id="funnel-heading" className="mt-1 text-xl font-semibold text-slate-950">Shopper decision path</h2><p className="mt-1 text-sm text-slate-500">Counts are Experience-scoped. Rates use sessions as the denominator.</p></div><span className="text-xs text-slate-400">No revenue or purchase inference</span></div>
        <div className="mt-5"><DetailFunnel metrics={metrics} /></div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="intent-heading">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Intent</p><h2 id="intent-heading" className="mt-1 text-xl font-semibold text-slate-950">Signals worth following up</h2></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-rose-50 p-4"><p className="text-sm font-medium text-rose-800">Favorite</p><p className="mt-2 text-2xl font-semibold tabular-nums text-rose-950">{metrics.favorites}</p></div><div className="rounded-xl bg-blue-50 p-4"><p className="text-sm font-medium text-blue-800">Product Click</p><p className="mt-2 text-2xl font-semibold tabular-nums text-blue-950">{metrics.productClicks}</p></div><div className="rounded-xl bg-teal-50 p-4"><p className="text-sm font-medium text-teal-800">Inquiry</p><p className="mt-2 text-2xl font-semibold tabular-nums text-teal-950">{metrics.inquiries}</p></div></div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="catalog-heading">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Catalog</p><h2 id="catalog-heading" className="mt-1 text-xl font-semibold text-slate-950">Selected frame edit</h2><p className="mt-1 text-sm text-slate-500">{selectedFrames.length} of {initial.catalog.length} merchant-owned frames selected. Order is preserved for the public Experience.</p></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{selectedFrames.length} selected</span></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{selectedFrames.length === 0 ? <div className="sm:col-span-2 lg:col-span-3"><EmptyState title="No frames selected yet" compact>Select frames below to create this Experience edit.</EmptyState></div> : selectedFrames.map((frame, index) => <div key={frame.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">{index + 1}</span><CatalogThumbnail frame={frame} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{frame.name}</p><p className="truncate text-xs text-slate-500">{frame.brand || 'Brand not provided'} · {frame.shape}</p></div></div>)}</div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="settings-heading">
        <div className="flex items-start gap-3"><Layers3 className="mt-1 h-5 w-5 text-slate-400" /><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Configuration</p><h2 id="settings-heading" className="mt-1 text-xl font-semibold text-slate-950">Experience settings</h2><p className="mt-1 text-sm text-slate-500">Update the existing copy, schedule, CTA, offer, and catalog selection controls.</p></div></div>
        <form onSubmit={saveConfig} className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">Name<input value={experience.name} onChange={(event) => setExperience((current) => ({ ...current, name: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" /></label>
          <label className="block text-sm font-medium text-slate-700">Status<select value={experience.status} onChange={(event) => update('status', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option>DRAFT</option><option>ACTIVE</option><option>ENDED</option><option>ARCHIVED</option></select></label>
          <label className="block text-sm font-medium text-slate-700 lg:col-span-2">Headline<input value={experience.headline ?? ''} onChange={(event) => update('headline', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
          <label className="block text-sm font-medium text-slate-700 lg:col-span-2">Description<textarea value={experience.description ?? ''} onChange={(event) => update('description', event.target.value)} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
          <label className="block text-sm font-medium text-slate-700">Start at<input type="datetime-local" value={experience.startAt ? experience.startAt.slice(0, 16) : ''} onChange={(event) => update('startAt', event.target.value ? new Date(event.target.value).toISOString() : '')} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
          <label className="block text-sm font-medium text-slate-700">End at<input type="datetime-local" value={experience.endAt ? experience.endAt.slice(0, 16) : ''} onChange={(event) => update('endAt', event.target.value ? new Date(event.target.value).toISOString() : '')} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
          <label className="block text-sm font-medium text-slate-700">Primary CTA label<input value={experience.primaryCtaLabel ?? ''} onChange={(event) => update('primaryCtaLabel', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
          <label className="block text-sm font-medium text-slate-700">Primary CTA URL<input value={experience.primaryCtaUrl ?? ''} onChange={(event) => update('primaryCtaUrl', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
          <label className="block text-sm font-medium text-slate-700">Offer label<input value={experience.offerLabel ?? ''} onChange={(event) => update('offerLabel', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
          <label className="block text-sm font-medium text-slate-700">Offer code<input value={experience.offerCode ?? ''} onChange={(event) => update('offerCode', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
          <div className="flex items-center gap-3 lg:col-span-2"><button type="submit" disabled={saving !== null} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving === 'config' ? 'Saving…' : 'Save settings'}</button>{message ? <p role="status" className="text-sm font-medium text-slate-600">{message}</p> : null}</div>
        </form>
        <div className="mt-8 border-t border-slate-200 pt-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="font-semibold text-slate-900">Manage selected frames</h3><p className="mt-1 text-sm text-slate-500">Search by product name, brand, SKU, or shape. Reordering and removal remain unchanged.</p></div><button type="button" disabled={saving !== null} onClick={saveCatalog} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Check className="h-4 w-4" />{saving === 'catalog' ? 'Saving…' : 'Save catalog selection'}</button></div><div className="relative mt-4"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input aria-label="Search catalog" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search frames, brand, SKU, or shape" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" /></div><div className="mt-5 grid gap-3 lg:grid-cols-2"><div className="space-y-2"><h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Selected order</h4>{selectedFrames.map((frame, index) => <div key={frame.id} className="flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50/50 p-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-xs font-bold text-white">{index + 1}</span><CatalogThumbnail frame={frame} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{frame.name}</p><p className="truncate text-xs text-slate-500">{frame.brand || 'Brand not provided'} · {frame.shape}</p></div><button type="button" aria-label={`Move ${frame.name} up`} onClick={() => moveSelected(index, -1)} disabled={index === 0} className="rounded-lg p-1.5 text-slate-400 hover:bg-white disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button><button type="button" aria-label={`Move ${frame.name} down`} onClick={() => moveSelected(index, 1)} disabled={index === selectedFrames.length - 1} className="rounded-lg p-1.5 text-slate-400 hover:bg-white disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button><button type="button" onClick={() => setSelectedFrameIds((current) => current.filter((id) => id !== frame.id))} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-rose-700 hover:bg-white">Remove</button></div>)}</div><div className="space-y-2"><h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Available catalog</h4>{availableFrames.length === 0 ? <EmptyState title="No matching frames" compact>Every matching frame is already selected, or the catalog has no active matches.</EmptyState> : availableFrames.map((frame) => <button type="button" key={frame.id} onClick={() => setSelectedFrameIds((current) => [...current, frame.id])} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-teal-300 hover:bg-teal-50/40"><CatalogThumbnail frame={frame} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{frame.name}</span><span className="block truncate text-xs text-slate-500">{frame.brand || 'Brand not provided'} · {frame.shape}</span></span><span className="text-lg text-teal-700">+</span></button>)}</div></div></div>
      </section>
    </div>
  )
}
