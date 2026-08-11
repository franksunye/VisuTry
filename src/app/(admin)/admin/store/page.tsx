import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  Database,
  HeartHandshake,
  Package,
  ShieldCheck,
  Store,
  Users,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'

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

export default async function AdminStoreMerchantsPage() {
  const merchants = await prisma.merchant.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 50,
    select: {
      id: true,
      slug: true,
      name: true,
      logoUrl: true,
      websiteUrl: true,
      status: true,
      updatedAt: true,
      _count: { select: { sessions: true, frames: true, intents: true } },
    },
  })

  const summary = merchants.reduce(
    (totals, merchant) => ({
      active: totals.active + (merchant.status === 'ACTIVE' ? 1 : 0),
      frames: totals.frames + merchant._count.frames,
      sessions: totals.sessions + merchant._count.sessions,
      intents: totals.intents + merchant._count.intents,
    }),
    { active: 0, frames: 0, sessions: 0, intents: 0 },
  )

  const summaryCards = [
    { label: 'Active merchants', value: summary.active, icon: Store, color: 'bg-teal-50 text-teal-700' },
    { label: 'Catalog frames', value: summary.frames, icon: Package, color: 'bg-blue-50 text-blue-700' },
    { label: 'Shopper sessions', value: summary.sessions, icon: Users, color: 'bg-violet-50 text-violet-700' },
    { label: 'Purchase signals', value: summary.intents, icon: HeartHandshake, color: 'bg-rose-50 text-rose-700' },
  ]

  return (
    <div className="space-y-8 pb-12">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#173F4B] via-[#102F39] to-[#091C23] px-6 py-8 text-white shadow-xl sm:px-8">
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">VisuTry Commerce</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Store intelligence</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
            Manage merchant catalogs, understand shopper decisions, and turn virtual try-on activity into sales signals.
          </p>
        </div>
      </section>

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
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Stores</h2>
          </div>
          <span className="text-sm text-slate-500">{merchants.length} configured</span>
        </div>

        {merchants.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <Database className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
            <p className="mt-3 text-sm text-slate-500">No merchants yet. Run <code>npm run db:seed:store</code> to seed Luna Optical.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {merchants.map((merchant) => (
              <article key={merchant.id} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                    {merchant.logoUrl ? <Image src={merchant.logoUrl} alt="" fill sizes="56px" className="object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400"><Store className="h-6 w-6" /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-950">{merchant.name}</h3>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">{merchant.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">/{merchant.slug}</p>
                  </div>
                </div>
                <dl className="mt-5 grid grid-cols-3 divide-x divide-slate-100 rounded-xl bg-slate-50 py-3 text-center">
                  <div><dt className="text-[10px] uppercase tracking-wide text-slate-400">Frames</dt><dd className="mt-1 font-semibold text-slate-900">{merchant._count.frames}</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-wide text-slate-400">Sessions</dt><dd className="mt-1 font-semibold text-slate-900">{merchant._count.sessions}</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-wide text-slate-400">Intent</dt><dd className="mt-1 font-semibold text-slate-900">{merchant._count.intents}</dd></div>
                </dl>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">Updated {merchant.updatedAt.toLocaleDateString('en-US')}</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <Link href={`/admin/store/merchants/${merchant.id}/experiences`} className="text-sm font-semibold text-violet-700 transition hover:text-violet-900">Experiences</Link>
                    <Link href={`/admin/store/merchants/${merchant.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition group-hover:gap-3">
                      Open intelligence <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
