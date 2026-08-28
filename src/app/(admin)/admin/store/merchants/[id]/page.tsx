import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowUpRight, ExternalLink, ImageIcon, MessageCircle, MousePointerClick, ScanFace, Store, Users } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { createStoreRuntime, getExperienceAdminWorkspace, getMerchantAnalyticsSnapshot, getMerchantInsights } from '@/modules/store/application'
import type { MerchantInsightsDto } from '@/modules/store/application/get-merchant-insights'
import type { MerchantAnalyticsSummary } from '@/modules/store/application/merchant-analytics'
import { MERCHANT_CLASSIFICATION_LABELS, normalizeMerchantClassification, type MerchantClassification } from '@/modules/merchant/domain/merchant-classification'
import { commercialStateForPresentation, getMerchantCommercialState } from '@/modules/merchant/application/merchant-commercial-entitlements'
import { getMerchantBillingSummary } from '@/modules/merchant/application/merchant-billing'
import { adminActivitySignals, adminPerformanceCards, formatC1Percent, formatC1PeriodCaption } from './merchant-insights-view'

export const dynamic = 'force-dynamic'

interface PageProps { params: { id: string } }
type CatalogFrame = MerchantInsightsDto['catalog']['frames'][number]

function price(value: number | null, currency: string | null) {
  if (value === null || !currency) return 'Price not listed'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(value / 100)
}
function formatDate(value: string) { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value)) }
function formatDateTime(value: Date | number | string | null) { return value === null ? 'Not recorded' : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)) }
function billingEventStatusLabel(status: string, reason: string | null, duplicateCount: number) {
  const base = status === 'PROCESSED' ? 'Processed' : status === 'IGNORED' && reason === 'OUT_OF_ORDER' ? 'Ignored · out of order' : status === 'REJECTED' ? `Rejected · ${reason ?? 'unclassified'}` : status === 'IGNORED' ? `Ignored · ${reason ?? 'no state change'}` : status
  return duplicateCount > 0 ? `${base} · ${duplicateCount} duplicate delivery${duplicateCount === 1 ? '' : 'ies'}` : base
}

function Provenance({ classification }: { classification: string }) {
  const normalized = normalizeMerchantClassification(classification)
  const classes: Record<MerchantClassification, string> = {
    REAL: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    POSSIBLE_EXTERNAL: 'bg-sky-50 text-sky-700 ring-sky-200',
    INTERNAL: 'bg-slate-100 text-slate-700 ring-slate-200',
    TEST: 'bg-orange-50 text-orange-700 ring-orange-200',
    AUTOMATION: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200',
    REFERENCE: 'bg-amber-50 text-amber-800 ring-amber-200',
    SUSPICIOUS: 'bg-red-50 text-red-700 ring-red-200',
    UNKNOWN: 'bg-slate-50 text-slate-500 ring-slate-200',
  }
  return <span title={normalized === 'REFERENCE' ? 'Simulation data — not live merchant traffic' : undefined} className={`rounded-full px-2.5 py-1.5 text-[11px] font-semibold ring-1 ${classes[normalized]}`}>{MERCHANT_CLASSIFICATION_LABELS[normalized]}</span>
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-8 text-center"><p className="text-sm font-semibold text-slate-700">{title}</p><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">{copy}</p></div>
}

function CatalogImage({ frame }: { frame: CatalogFrame }) {
  return <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-200">{frame.imageUrl ? <Image src={frame.imageUrl} alt="" fill sizes="64px" className="object-contain p-1" /> : <ImageIcon className="m-auto h-4 w-4 text-slate-300" />}</div>
}

function ActivitySignals({ metrics }: { metrics: MerchantInsightsDto['metrics'] }) {
  const signals = adminActivitySignals(metrics)
  if (metrics.sessions === 0 && signals.every((signal) => signal.value === 0)) {
    return <EmptyState title="No shopper activity yet" copy="Share an Experience or send traffic to its public route to start collecting intent." />
  }
  return <div className="grid gap-2 md:grid-cols-7">{signals.map((signal, index) => <div key={signal.label} className="relative rounded-xl bg-slate-50 p-3"><p className="text-[11px] text-slate-500">{signal.label}</p><p className="mt-2 text-2xl font-semibold tabular-nums text-slate-950">{signal.value}</p>{index < signals.length - 1 ? <span className="absolute -right-1.5 top-1/2 hidden -translate-y-1/2 text-slate-300 md:block">→</span> : null}</div>)}</div>
}

function ExperienceComparison({ experiences, merchantId }: { experiences: MerchantAnalyticsSummary[]; merchantId: string }) {
  if (experiences.length === 0) return <EmptyState title="No Experiences yet" copy="Create a Store or Campaign Experience to compare shopper activity here." />
  return <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b border-slate-200 text-left text-xs text-slate-500"><th className="pb-3 pr-4 font-semibold">Experience</th><th className="pb-3 pr-4 font-semibold">Visits</th><th className="pb-3 pr-4 font-semibold">Engagement</th><th className="pb-3 pr-4 font-semibold">Try-On completion</th><th className="pb-3 pr-4 font-semibold">High intent</th><th className="pb-3 pr-4 font-semibold">Favorites</th><th className="pb-3 font-semibold"> </th></tr></thead><tbody>{experiences.map((summary) => <tr key={summary.experience.id} className="border-b border-slate-100 last:border-0"><td className="py-4 pr-4"><div className="flex items-center gap-2"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${summary.experience.type === 'CAMPAIGN' ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700'}`}>{summary.experience.type === 'CAMPAIGN' ? 'Campaign' : 'Store'}</span>{summary.referenceData ? <span title="Simulation data — not live merchant traffic" className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800">Reference</span> : null}</div><p className="mt-2 font-semibold text-slate-900">{summary.experience.name}</p></td><td className="py-4 pr-4 tabular-nums font-semibold text-slate-900">{summary.metrics.visits}</td><td className="py-4 pr-4 tabular-nums text-slate-700">{formatC1Percent(summary.metrics.engagementRate)}</td><td className="py-4 pr-4 tabular-nums text-slate-700">{formatC1Percent(summary.metrics.tryOnCompletionRate)}</td><td className="py-4 pr-4 tabular-nums text-slate-700">{formatC1Percent(summary.metrics.highIntentRate)}</td><td className="py-4 pr-4 tabular-nums text-slate-700">{summary.metrics.favorites}</td><td className="py-4 text-right"><Link href={`/admin/store/merchants/${merchantId}/experiences/${summary.experience.id}`} className="font-semibold text-teal-700 hover:text-teal-900">Inspect</Link></td></tr>)}</tbody></table></div>
}

export default async function AdminMerchantInsightsPage({ params }: PageProps) {
  const runtime = createStoreRuntime()
  let insights: MerchantInsightsDto
  const workspace = await getExperienceAdminWorkspace({ merchantId: params.id })
  if (!workspace) notFound()
  try {
    insights = await getMerchantInsights({ merchants: runtime.merchants, events: runtime.events, merchantId: params.id, recordInsightsViewed: true })
  } catch { notFound() }
  const analytics = await getMerchantAnalyticsSnapshot({
    actor: { actorType: 'SYSTEM', actorId: `admin:${params.id}`, merchantId: params.id },
  })
  const commercial = commercialStateForPresentation(await getMerchantCommercialState({ merchantId: params.id }))
  const billing = await getMerchantBillingSummary({ merchantId: params.id })
  const recentBillingEvents = await prisma.merchantBillingEvent.findMany({
    where: { merchantId: params.id },
    orderBy: { createdAt: 'desc' },
    take: 8,
    select: { id: true, eventType: true, status: true, processingReason: true, stripeCustomerId: true, stripeSubscriptionId: true, stripePriceId: true, eventCreatedAt: true, processedAt: true, duplicateCount: true, lastDuplicateAt: true, createdAt: true },
  })

  const { merchant, dataProvenance, metrics, topFrames, recentSessions, recentInquiries, catalog } = insights
  const reference = dataProvenance.referenceData || merchant.referenceData
  const activeExperiences = workspace.experiences.filter((experience) => experience.status === 'ACTIVE').length
  const performanceCards = adminPerformanceCards(analytics.metrics)

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col justify-between gap-6 border-b border-slate-200 pb-7 lg:flex-row lg:items-end">
        <div className="flex items-start gap-4"><div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">{merchant.logoUrl ? <Image src={merchant.logoUrl} alt="" fill sizes="64px" className="object-cover" /> : <Store className="h-7 w-7 text-slate-400" />}</div><div><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{merchant.name}</h1><Provenance classification={merchant.classification} /></div><p className="mt-2 text-sm text-slate-500">Merchant overview · shopper activity · campaign performance</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>{catalog.active} active frames</span><span>{activeExperiences} active Experiences</span><span>{merchant.status[0] + merchant.status.slice(1).toLowerCase()}</span></div></div></div>
        <div className="flex flex-wrap gap-2"><Link href={`/admin/store/merchants/${merchant.id}/experiences`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Experiences</Link><Link href={`/en/store/${merchant.slug}`} target="_blank" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">Open public Store <ArrowUpRight className="h-4 w-4" /></Link>{merchant.websiteUrl && !merchant.websiteUrl.includes('example.com') ? <Link href={merchant.websiteUrl} target="_blank" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Website <ExternalLink className="h-4 w-4" /></Link> : null}</div>
      </header>

      {reference ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><strong>Reference data.</strong> Simulation activity for product demonstration.</p> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="commercial-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Commercial state</p><h2 id="commercial-heading" className="mt-1 text-xl font-semibold text-slate-950">Plan &amp; entitlement visibility</h2></div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">{commercial.isCanonical ? 'Canonical plan' : 'Legacy · not enrolled'} · {commercial.status}</span>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs text-slate-500">Enrollment</dt><dd className="mt-1 font-semibold text-slate-900">{commercial.isCanonical ? 'Canonical' : 'Legacy / not enrolled'}</dd></div>
          <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs text-slate-500">Plan</dt><dd className="mt-1 font-semibold text-slate-900">{commercial.planName}</dd></div>
          <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs text-slate-500">AI Commerce Sessions</dt><dd className="mt-1 font-semibold text-slate-900">{commercial.aiCommerceSessionLimit === null ? `${commercial.usage.aiCommerceSessions} · Not metered` : `${commercial.usage.aiCommerceSessions} / ${commercial.aiCommerceSessionLimit}`}</dd></div>
          <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs text-slate-500">Active Campaigns</dt><dd className="mt-1 font-semibold text-slate-900">{commercial.usage.activeCampaigns} / {commercial.limits.activeCampaigns ?? 'Custom'}</dd></div>
          <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs text-slate-500">Catalog Items</dt><dd className="mt-1 font-semibold text-slate-900">{commercial.usage.catalogItems} / {commercial.limits.catalogItems ?? 'Custom'}</dd></div>
          <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs text-slate-500">Period end</dt><dd className="mt-1 font-semibold text-slate-900">{commercial.periodEnd ? formatDate(commercial.periodEnd) : 'Not applicable'}</dd></div>
          <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs text-slate-500">Billing provider</dt><dd className="mt-1 font-semibold text-slate-900">{billing ? billing.provider : 'Not connected'}</dd></div>
          <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs text-slate-500">Billing status</dt><dd className="mt-1 font-semibold text-slate-900">{billing?.subscriptionStatus ?? 'No provider subscription'}</dd></div>
          <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs text-slate-500">Provider identity</dt><dd className="mt-1 font-mono text-xs text-slate-700">{billing?.maskedCustomerId ?? 'Not connected'}{billing?.maskedSubscriptionId ? <><br />{billing.maskedSubscriptionId}</> : null}</dd></div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="billing-events-heading">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Billing operations</p><h2 id="billing-events-heading" className="mt-1 text-xl font-semibold text-slate-950">Recent provider events</h2><p className="mt-1 text-sm text-slate-500">Verified Stripe event outcomes only. Payloads and secret provider details are not shown here.</p></div><span className="text-xs text-slate-400">{recentBillingEvents.length} shown</span></div>
        <div className="mt-5 overflow-x-auto">{recentBillingEvents.length === 0 ? <EmptyState title="No verified billing event has arrived" copy="This Merchant has no recorded Stripe webhook for the current billing boundary." /> : <table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs text-slate-500"><th className="pb-3 pr-4 font-semibold">Event</th><th className="pb-3 pr-4 font-semibold">Outcome</th><th className="pb-3 pr-4 font-semibold">Price</th><th className="pb-3 pr-4 font-semibold">Event time</th><th className="pb-3 font-semibold">Recorded</th></tr></thead><tbody>{recentBillingEvents.map((event) => <tr key={event.id} className="border-b border-slate-100 last:border-0"><td className="py-3 pr-4"><p className="font-semibold text-slate-900">{event.eventType}</p><p className="mt-1 text-xs text-slate-500">{event.stripeCustomerId ? `${event.stripeCustomerId.slice(0, 4)}••••${event.stripeCustomerId.slice(-4)}` : 'No customer identity'}</p></td><td className="py-3 pr-4 text-xs font-semibold text-slate-700">{billingEventStatusLabel(event.status, event.processingReason, event.duplicateCount)}</td><td className="py-3 pr-4 font-mono text-xs text-slate-600">{event.stripePriceId ? `${event.stripePriceId.slice(0, 6)}…` : 'Not present'}</td><td className="py-3 pr-4 text-xs text-slate-600">{formatDateTime(event.eventCreatedAt === null ? null : event.eventCreatedAt * 1000)}</td><td className="py-3 text-xs text-slate-500">{formatDateTime(event.processedAt ?? event.createdAt)}</td></tr>)}</tbody></table>}</div>
      </section>

      <section aria-labelledby="snapshot-heading">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Performance snapshot</p>
          <h2 id="snapshot-heading" className="mt-1 text-2xl font-semibold text-slate-950">What is happening for this merchant?</h2>
          <p className="mt-1 text-sm text-slate-500">{formatC1PeriodCaption(analytics.period)}. Same C1 contract as MCP and Merchant Control Center. Merchant CTA is unavailable.</p>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {performanceCards.map((card) => (
            <div key={card.key} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-950">{card.value}</p>
              <p className="mt-1 text-xs text-slate-400">{card.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="comparison-heading"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Experience comparison</p><h2 id="comparison-heading" className="mt-1 text-xl font-semibold text-slate-950">Store and Campaign performance</h2><p className="mt-1 text-sm text-slate-500">Same 30-day C1 analytics contract used by MCP and Merchant Control Center. Merchant CTA is unavailable. The table does not assign a winner or infer revenue.</p></div><Link href={`/admin/store/merchants/${merchant.id}/experiences`} className="text-sm font-semibold text-teal-700 hover:text-teal-900">View all Experiences <ArrowUpRight className="ml-1 inline h-4 w-4" /></Link></div><div className="mt-5"><ExperienceComparison experiences={analytics.experiences} merchantId={merchant.id} /></div></section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="activity-heading"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Shopper actions</p><h2 id="activity-heading" className="mt-1 text-xl font-semibold text-slate-950">Operational activity signals</h2><p className="mt-1 text-sm text-slate-500">All-time interaction volume from operational insights. These are event counts, not session rates or C1 engagement.</p></div><span className="text-xs text-slate-400">No checkout or purchase data</span></div><div className="mt-5"><ActivitySignals metrics={metrics} /></div></section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"><article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Interest</p><h2 className="mt-1 text-xl font-semibold text-slate-950">Most explored frames</h2><p className="mt-1 text-sm text-slate-500">Frame-level activity from recommendation, Try-On, and intent events.</p></div><ScanFace className="h-5 w-5 text-slate-300" aria-hidden="true" /></div>{topFrames.length === 0 ? <div className="mt-5"><EmptyState title="No frame interest yet" copy="Product-level signals will appear after shoppers select, try on, save, or visit a frame." /></div> : <div className="mt-5 grid gap-3 sm:grid-cols-2">{topFrames.slice(0, 6).map((frame) => <div key={frame.frameId} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-50">{frame.imageUrl ? <Image src={frame.imageUrl} alt="" fill sizes="64px" className="object-contain p-1" /> : <ImageIcon className="m-auto h-4 w-4 text-slate-300" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{frame.name}</p><p className="truncate text-xs text-slate-500">{frame.brand || 'Brand not provided'} · {frame.tryOns} Try-On · {frame.favorites} Favorite</p></div></div>)}</div>}</article><article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Intent</p><h2 className="mt-1 text-xl font-semibold text-slate-950">Recent inquiries</h2><p className="mt-1 text-sm text-slate-500">Higher-intent shopper actions captured by this merchant.</p></div><MessageCircle className="h-5 w-5 text-slate-300" aria-hidden="true" /></div>{recentInquiries.length === 0 ? <div className="mt-5"><EmptyState title="No inquiries yet" copy="Higher-intent shopper actions will appear here when captured." /></div> : <div className="mt-5 divide-y divide-slate-100">{recentInquiries.slice(0, 5).map((inquiry) => <div key={inquiry.intentId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-800">{inquiry.initials}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{inquiry.name}</p><p className="truncate text-xs text-slate-500">{inquiry.frameName}</p></div><time className="shrink-0 text-xs text-slate-400" dateTime={inquiry.createdAt}>{formatDate(inquiry.createdAt)}</time></div>)}</div>}</article></section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]"><article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Catalog</p><h2 className="mt-1 text-xl font-semibold text-slate-950">Catalog interest</h2><p className="mt-1 text-sm text-slate-500">{catalog.active} active frames · {catalog.approved} reviewed</p></div><Link href={`/admin/store/merchants/${merchant.id}/experiences`} className="text-sm font-semibold text-teal-700 hover:text-teal-900">Manage edits</Link></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{catalog.frames.slice(0, 6).map((frame) => <div key={frame.frameId} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><CatalogImage frame={frame} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{frame.name}</p><p className="truncate text-xs text-slate-500">{frame.brand || 'Brand not provided'} · {price(frame.price, frame.currency)}</p></div><span className="text-xs tabular-nums text-slate-500">{frame.productClicks} clicks</span></div>)}</div></article><article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Shopper activity</p><h2 className="mt-1 text-xl font-semibold text-slate-950">Recent journeys</h2><p className="mt-1 text-sm text-slate-500">Anonymous behavior only; shopper images remain private.</p></div><MousePointerClick className="h-5 w-5 text-slate-300" aria-hidden="true" /></div>{recentSessions.length === 0 ? <div className="mt-5"><EmptyState title="No sessions yet" copy="Share an Experience or send traffic to its public route to start collecting intent." /></div> : <div className="mt-5 space-y-2">{recentSessions.slice(0, 5).map((session) => <div key={session.sessionId} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{session.shopperName || session.shortLabel}</p><p className="mt-1 text-xs text-slate-500">{session.recommendedCount} selected · {session.triedCount} tried</p></div><span className="shrink-0 text-xs text-slate-400">{formatDate(session.createdAt)}</span></div>)}</div>}</article></section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Operational details</p><h2 className="mt-1 text-xl font-semibold text-slate-950">Experience policy and catalog health</h2></div><Users className="h-5 w-5 text-slate-300" aria-hidden="true" /></div><dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl bg-white p-4"><dt className="text-xs text-slate-500">Try-On</dt><dd className="mt-1 font-semibold text-slate-900">{merchant.experiencePolicy.tryOnEnabled ? 'Enabled' : 'Disabled'}</dd></div><div className="rounded-xl bg-white p-4"><dt className="text-xs text-slate-500">Compare</dt><dd className="mt-1 font-semibold text-slate-900">{merchant.experiencePolicy.compareEnabled ? `Up to ${merchant.experiencePolicy.maxCompareFrames}` : 'Disabled'}</dd></div><div className="rounded-xl bg-white p-4"><dt className="text-xs text-slate-500">Inquiry</dt><dd className="mt-1 font-semibold text-slate-900">{merchant.experiencePolicy.inquiryEnabled ? 'Enabled' : 'Disabled'}</dd></div><div className="rounded-xl bg-white p-4"><dt className="text-xs text-slate-500">Try-On failures</dt><dd className="mt-1 font-semibold text-slate-900">{metrics.tryOnFailures}</dd></div></dl></section>
    </div>
  )
}
