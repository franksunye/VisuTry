import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  Database,
  HeartHandshake,
  Package,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import {
  filterMerchantPortfolioRows,
  isMerchantPortfolioFilter,
  MERCHANT_CLASSIFICATION_LABELS,
  MERCHANT_PORTFOLIO_FILTER_LABELS,
  summarizeMerchantPortfolio,
  type MerchantPortfolioFilter,
} from '@/modules/merchant/domain/merchant-classification'

export const dynamic = 'force-dynamic'

async function RetentionHealthCard() {
  const now = new Date()
  const [blockedAssets, blockedTasks, oldestBlockedAsset, oldestBlockedTask, pendingOrphans] =
    await Promise.all([
      prisma.storeAsset.count({ where: { retentionStatus: 'DELETE_BLOCKED', deletedAt: null } }),
      prisma.tryOnTask.count({
        where: { retentionStatus: 'DELETE_BLOCKED', origin: { in: ['STORE_DEMO', 'STORE_PILOT'] } },
      }),
      prisma.storeAsset.findFirst({
        where: { retentionStatus: 'DELETE_BLOCKED', deletedAt: null },
        orderBy: { expiresAt: 'asc' },
        select: { expiresAt: true },
      }),
      prisma.tryOnTask.findFirst({
        where: { retentionStatus: 'DELETE_BLOCKED', origin: { in: ['STORE_DEMO', 'STORE_PILOT'] } },
        orderBy: { expiresAt: 'asc' },
        select: { expiresAt: true },
      }),
      prisma.storeOrphanBlob.count({ where: { deletedAt: null } }),
    ])

  const oldestCandidates = [oldestBlockedAsset?.expiresAt, oldestBlockedTask?.expiresAt].filter(Boolean) as Date[]
  const oldest = oldestCandidates.length > 0
    ? new Date(Math.min(...oldestCandidates.map((date) => date.getTime())))
    : null
  const healthy = blockedAssets + blockedTasks + pendingOrphans === 0

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className={`rounded-xl p-2.5 ${healthy ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold text-slate-950">Privacy & retention health</h2>
            <p className="mt-1 text-sm text-slate-500">Shopper assets expire automatically and are never exposed in merchant insights.</p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${healthy ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {healthy ? 'All systems healthy' : 'Review required'}
        </span>
      </div>
      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">Blocked assets</dt><dd className="mt-1 text-xl font-semibold text-slate-950">{blockedAssets}</dd></div>
        <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">Blocked try-ons</dt><dd className="mt-1 text-xl font-semibold text-slate-950">{blockedTasks}</dd></div>
        <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">Pending orphans</dt><dd className="mt-1 text-xl font-semibold text-slate-950">{pendingOrphans}</dd></div>
      </dl>
      <p className="mt-3 text-xs text-slate-400">
        Checked {now.toLocaleString('en-US')} · oldest blocked expiry {oldest ? oldest.toISOString() : 'none'}
      </p>
    </section>
  )
}

type AdminStoreMerchantsPageProps = {
  searchParams?: { view?: string }
}

const classificationBadgeClasses: Record<string, string> = {
  REAL: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  POSSIBLE_EXTERNAL: 'bg-sky-50 text-sky-700 ring-sky-200',
  INTERNAL: 'bg-slate-100 text-slate-700 ring-slate-200',
  TEST: 'bg-orange-50 text-orange-700 ring-orange-200',
  AUTOMATION: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200',
  REFERENCE: 'bg-amber-50 text-amber-800 ring-amber-200',
  SUSPICIOUS: 'bg-red-50 text-red-700 ring-red-200',
  UNKNOWN: 'bg-slate-50 text-slate-500 ring-slate-200',
}

function merchantClassificationCopy(classification: string): string {
  switch (classification) {
    case 'REAL': return 'Included in commercial KPIs'
    case 'POSSIBLE_EXTERNAL': return 'Activation evidence required before commercial KPIs'
    case 'REFERENCE': return 'Simulation data — not live merchant traffic'
    case 'INTERNAL': return 'VisuTry-owned workspace — excluded from commercial KPIs'
    case 'TEST': return 'Test fixture — excluded from commercial KPIs'
    case 'AUTOMATION': return 'Automation fixture — excluded from commercial KPIs'
    case 'SUSPICIOUS': return 'Needs provenance review — excluded from commercial KPIs'
    default: return 'Unclassified — excluded from commercial KPIs'
  }
}

export default async function AdminStoreMerchantsPage({ searchParams }: AdminStoreMerchantsPageProps) {
  const filter: MerchantPortfolioFilter = isMerchantPortfolioFilter(searchParams?.view)
    ? searchParams.view
    : 'COMMERCIAL'
  const merchants = await prisma.merchant.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      slug: true,
      name: true,
      logoUrl: true,
      websiteUrl: true,
      status: true,
      classification: true,
      updatedAt: true,
      _count: { select: { sessions: true, frames: true, intents: true, experiences: true } },
    },
  })

  const visibleMerchants = filterMerchantPortfolioRows(merchants, filter)
  const summary = summarizeMerchantPortfolio(merchants, filter)
  const countForFilter = (candidate: MerchantPortfolioFilter) => filterMerchantPortfolioRows(merchants, candidate).length

  const summaryCards = [
    { label: 'Active merchants', value: summary.active, icon: Store, color: 'bg-teal-50 text-teal-700' },
    { label: 'Active Experiences', value: summary.experiences, icon: Sparkles, color: 'bg-blue-50 text-blue-700' },
    { label: 'Shopper sessions', value: summary.sessions, icon: Users, color: 'bg-violet-50 text-violet-700' },
    { label: 'Intent signals', value: summary.intents, icon: HeartHandshake, color: 'bg-rose-50 text-rose-700' },
  ]

  return (
    <div className="space-y-8 pb-12">
      <section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-7 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Merchant portfolio</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Commerce Experiences</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">See which merchants, Experiences, and shopper intent signals need attention next.</p>
        </div>
        <p className="text-sm text-slate-500">{visibleMerchants.length} of {merchants.length} configured merchants</p>
      </section>

      <nav className="flex flex-wrap gap-2" aria-label="Merchant portfolio views">
        {(Object.keys(MERCHANT_PORTFOLIO_FILTER_LABELS) as MerchantPortfolioFilter[]).map((candidate) => {
          const active = candidate === filter
          const href = candidate === 'COMMERCIAL' ? '/admin/store' : `/admin/store?view=${candidate}`
          return (
            <Link
              key={candidate}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ring-1 transition ${active ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'}`}
            >
              {MERCHANT_PORTFOLIO_FILTER_LABELS[candidate]}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'}`}>{countForFilter(candidate)}</span>
            </Link>
          )
        })}
      </nav>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Store portfolio summary">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-sm font-medium text-slate-500">{card.label}</p><p className="mt-2 text-3xl font-semibold text-slate-950">{card.value}</p></div>
                <span className={`rounded-xl p-3 ${card.color}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
              </div>
            </article>
          )
        })}
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Merchant portfolio</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Merchant portfolio</h2>
          </div>
          <span className="text-sm text-slate-500">{visibleMerchants.length} shown · {MERCHANT_PORTFOLIO_FILTER_LABELS[filter]} view</span>
        </div>

        {visibleMerchants.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <Database className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
            <p className="mt-3 text-sm text-slate-500">No merchants match this view. Commercial KPIs include only merchants classified as <code>REAL</code>; possible external and non-commercial rows remain available in the other views.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {visibleMerchants.map((merchant) => (
              <article key={merchant.id} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                    {merchant.logoUrl ? <Image src={merchant.logoUrl} alt="" fill sizes="56px" className="object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400"><Store className="h-6 w-6" /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-950">{merchant.name}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${classificationBadgeClasses[merchant.classification] ?? classificationBadgeClasses.UNKNOWN}`}>{MERCHANT_CLASSIFICATION_LABELS[merchant.classification] ?? 'Unknown'}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{merchantClassificationCopy(merchant.classification)}</p>
                  </div>
                </div>
                <dl className="mt-5 grid grid-cols-3 divide-x divide-slate-100 rounded-xl bg-slate-50 py-3 text-center">
                  <div><dt className="text-[10px] uppercase tracking-wide text-slate-400">Catalog</dt><dd className="mt-1 font-semibold text-slate-900">{merchant._count.frames} frames</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-wide text-slate-400">Experiences</dt><dd className="mt-1 font-semibold text-slate-900">{merchant._count.experiences}</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-wide text-slate-400">Sessions</dt><dd className="mt-1 font-semibold text-slate-900">{merchant._count.sessions}</dd></div>
                </dl>
                <div className="mt-5 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-400">{merchant._count.intents > 0 ? `${merchant._count.intents} intent signals` : 'No intent signals yet'}</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <Link href={`/admin/store/merchants/${merchant.id}/experiences`} className="text-sm font-semibold text-violet-700 transition hover:text-violet-900">Experiences</Link>
                    <Link href={`/admin/store/merchants/${merchant.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition group-hover:gap-3">
                      Open overview <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <RetentionHealthCard />
    </div>
  )
}
