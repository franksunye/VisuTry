import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Heart,
  ImageIcon,
  MessageCircle,
  MousePointerClick,
  ScanFace,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import {
  createStoreRuntime,
  getMerchantInsights,
} from '@/modules/store/application'
import type { MerchantInsightsDto } from '@/modules/store/application/get-merchant-insights'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { id: string }
}

type CatalogFrame = MerchantInsightsDto['catalog']['frames'][number]

function formatPrice(price: number | null, currency: string | null) {
  if (price === null || !currency) return 'Price pending'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(price / 100)
}

function rate(value: number, total: number) {
  if (total <= 0) return 0
  return Math.min(100, Math.round((value / total) * 100))
}

function trendCopy(delta: number | null) {
  if (delta === null) return 'New vs last 7 days'
  if (delta === 0) return 'No change vs last 7 days'
  return `${delta > 0 ? '↑' : '↓'} ${Math.abs(delta)}% vs last 7 days`
}

function journeyAvatar(session: MerchantInsightsDto['recentSessions'][number]) {
  if (session.shopperName) {
    const parts = session.shopperName.trim().split(/\s+/).filter(Boolean)
    return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'SH'
  }
  return session.sessionId.slice(-2).toUpperCase()
}

function TrendChart({ series }: { series: MerchantInsightsDto['trends']['series'] }) {
  const width = 640
  const height = 210
  const chartBottom = 170
  const max = Math.max(...series.map((point) => point.interest), 1)
  const points = series.map((point, index) => {
    const x = series.length <= 1 ? 0 : (index / (series.length - 1)) * width
    const y = chartBottom - (point.interest / max) * 130
    return { ...point, x, y }
  })
  const line = points.map((point) => `${point.x},${point.y}`).join(' ')
  const area = points.length > 0
    ? `M ${points[0].x} ${chartBottom} L ${points.map((point) => `${point.x} ${point.y}`).join(' L ')} L ${points[points.length - 1].x} ${chartBottom} Z`
    : ''

  return (
    <div className="mt-6">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Seven-day shopper interest trend" className="h-56 w-full overflow-visible">
        <defs>
          <linearGradient id="interest-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[40, 83, 126, 170].map((y) => <line key={y} x1="0" y1={y} x2={width} y2={y} stroke="#e2e8f0" strokeWidth="1" />)}
        <path d={area} fill="url(#interest-fill)" />
        <polyline points={line} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => <circle key={point.date} cx={point.x} cy={point.y} r="5" fill="#2563eb" stroke="white" strokeWidth="3" />)}
        {points.map((point) => <text key={`${point.date}-label`} x={point.x} y="202" textAnchor="middle" className="fill-slate-400 text-[12px]">{point.label}</text>)}
      </svg>
    </div>
  )
}

function CatalogImage({ frame, sizes }: { frame: CatalogFrame; sizes: string }) {
  return frame.imageUrl ? (
    <Image
      src={frame.imageUrl}
      alt={frame.name}
      fill
      sizes={sizes}
      className="object-contain p-3 transition duration-300 group-hover:scale-[1.03]"
    />
  ) : (
    <div className="flex h-full items-center justify-center text-slate-300">
      <ImageIcon className="h-8 w-8" aria-hidden="true" />
    </div>
  )
}

export default async function AdminMerchantInsightsPage({ params }: PageProps) {
  const runtime = createStoreRuntime()
  let insights: MerchantInsightsDto
  try {
    insights = await getMerchantInsights({
      merchants: runtime.merchants,
      events: runtime.events,
      merchantId: params.id,
      recordInsightsViewed: true,
    })
  } catch {
    notFound()
  }

  const { dataProvenance, merchant, metrics, trends, topFrames, recentSessions, recentInquiries, catalog } = insights
  const accent = merchant.accentColor || '#173F4B'
  const intentTotal = metrics.favorites + metrics.productClicks + metrics.inquiries
  const activeRate = rate(catalog.active, catalog.total)

  const metricCards = [
    {
      label: 'Try-on sessions',
      value: metrics.tryOnSessions,
      detail: trendCopy(trends.deltas.tryOnSessions),
      icon: Users,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Inquiries',
      value: metrics.inquiries,
      detail: trendCopy(trends.deltas.inquiries),
      icon: MessageCircle,
      color: 'bg-indigo-50 text-indigo-700',
    },
    {
      label: 'Favorites',
      value: metrics.favorites,
      detail: trendCopy(trends.deltas.favorites),
      icon: Heart,
      color: 'bg-rose-50 text-rose-700',
    },
    {
      label: 'Top frame',
      value: topFrames[0]?.name ?? 'Building data',
      detail: topFrames[0] ? `${topFrames[0].tryOns} try-ons · ${topFrames[0].favorites} favorites` : 'Appears after shopper activity',
      icon: Trophy,
      color: 'bg-amber-50 text-amber-700',
    },
  ]

  const funnel = [
    { label: 'Store sessions', value: metrics.sessions, icon: Users },
    { label: 'Photos uploaded', value: metrics.photosUploaded, icon: ImageIcon },
    { label: 'Recommendations', value: metrics.recommendations, icon: Sparkles },
    { label: 'Try-ons', value: metrics.tryOns, icon: ScanFace },
    { label: 'Purchase signals', value: intentTotal, icon: ShoppingBag },
  ]
  const funnelMax = Math.max(...funnel.map((item) => item.value), 1)
  const shopperJourneys = recentSessions
    .filter((session) => session.fitScore !== null || session.shortlist.length > 0 || session.inquired)
    .slice(0, 5)

  return (
    <div className="space-y-8 pb-12">
      <section
        className="relative overflow-hidden rounded-3xl px-6 py-7 text-white shadow-xl sm:px-8 sm:py-8"
        style={{ background: `linear-gradient(125deg, ${accent} 0%, #0f2731 68%, #091920 100%)` }}
      >
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <Link href="/admin/store" className="text-sm font-medium text-white/70 transition hover:text-white">
              ← Store portfolio
            </Link>
            <div className="mt-5 flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white/95 shadow-lg ring-1 ring-white/30">
                {merchant.logoUrl ? (
                  <Image src={merchant.logoUrl} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-700">
                    <Store className="h-7 w-7" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{merchant.name}</h1>
                  <span className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-100 ring-1 ring-emerald-300/30">
                    {merchant.status}
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                  Merchant intelligence · catalog performance · anonymous shopper intent
                </p>
                {dataProvenance.includesSyntheticActivity ? (
                  <p className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/75 ring-1 ring-white/15">
                    Sales demo workspace · includes synthetic sample activity
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/en/store/${merchant.slug}`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
            >
              Open live Store
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {merchant.websiteUrl && !merchant.websiteUrl.includes('example.com') ? (
              <Link
                href={merchant.websiteUrl}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/15"
              >
                Merchant website
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Store performance summary">
        {metricCards.map((card) => {
          const Icon = card.icon
          return (
            <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <p className={`mt-2 font-semibold tracking-tight text-slate-950 ${typeof card.value === 'string' ? 'text-xl' : 'text-3xl'}`}>{card.value}</p>
                </div>
                <span className={`rounded-xl p-2.5 ${card.color}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-4 text-xs font-medium text-slate-500">{card.detail}</p>
            </article>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Merchandising</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">Top frames</h2>
              <p className="mt-1 text-sm text-slate-500">The products creating the strongest shopper response.</p>
            </div>
            <span className="text-xs font-medium text-slate-400">Live Store data</span>
          </div>
          {topFrames.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {topFrames.slice(0, 4).map((frame, index) => (
                <article key={frame.frameId} className="group min-w-0">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-100">
                    {frame.imageUrl ? <Image src={frame.imageUrl} alt={frame.name} fill sizes="(max-width: 640px) 50vw, 180px" className="object-contain p-3 transition duration-300 group-hover:scale-[1.04]" /> : null}
                    <span className="absolute left-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">{index + 1}</span>
                  </div>
                  <h3 className="mt-3 truncate text-sm font-semibold text-slate-900">{frame.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">{frame.tryOns} try-ons · {frame.favorites} saved</p>
                  {index === 0 ? <span className="mt-2 inline-flex rounded-md bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">Best seller signal</span> : null}
                </article>
              ))}
            </div>
          ) : <p className="mt-6 rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">Top frames appear after shopper activity.</p>}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Sales follow-up</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">Recent inquiries</h2>
            </div>
            <MessageCircle className="h-5 w-5 text-slate-300" aria-hidden="true" />
          </div>
          {recentInquiries.length > 0 ? (
            <div className="mt-5 divide-y divide-slate-100">
              {recentInquiries.slice(0, 4).map((inquiry, index) => (
                <div key={inquiry.intentId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${['bg-blue-100 text-blue-700', 'bg-violet-100 text-violet-700', 'bg-rose-100 text-rose-700', 'bg-amber-100 text-amber-700'][index % 4]}`}>{inquiry.initials}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{inquiry.name}</p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">{inquiry.email}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">Asked about {inquiry.frameName}</p>
                  </div>
                  <time className="shrink-0 text-[10px] text-slate-400" dateTime={inquiry.createdAt}>{new Date(inquiry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</time>
                </div>
              ))}
            </div>
          ) : <p className="mt-5 rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">Inquiries will appear here with shopper-provided contact details.</p>}
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Last 7 days</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">Shopper interest</h2>
              <p className="mt-1 text-sm text-slate-500">Selections, favorites, product clicks, and inquiries.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"><TrendingUp className="h-3.5 w-3.5" />{trendCopy(trends.deltas.sessions)}</span>
          </div>
          <TrendChart series={trends.series} />
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">High-intent shoppers</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">Recent journeys</h2>
              <p className="mt-1 text-sm text-slate-500">Shortlists and recommendation fit at a glance.</p>
            </div>
            <ShoppingBag className="h-5 w-5 text-slate-300" aria-hidden="true" />
          </div>
          {shopperJourneys.length > 0 ? (
            <div className="mt-5 space-y-3">
              {shopperJourneys.slice(0, 4).map((session, index) => (
                <div key={session.sessionId} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${['bg-cyan-100 text-cyan-800', 'bg-fuchsia-100 text-fuchsia-800', 'bg-emerald-100 text-emerald-800', 'bg-orange-100 text-orange-800'][index % 4]}`}>{journeyAvatar(session)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{session.shopperName || session.shortLabel}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{session.shortlist.length || session.recommendedCount}-frame shortlist · {session.triedCount} tried</p>
                    </div>
                    {session.fitScore !== null ? <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">{session.fitScore}% fit</span> : null}
                  </div>
                  {session.shortlist.length > 0 ? <div className="mt-3 flex gap-1.5">{session.shortlist.map((frame) => <div key={frame.frameId} className="relative h-8 w-11 overflow-hidden rounded-lg bg-white ring-1 ring-slate-200">{frame.imageUrl ? <Image src={frame.imageUrl} alt={frame.name} fill sizes="44px" className="object-contain p-1" /> : null}</div>)}</div> : null}
                </div>
              ))}
            </div>
          ) : <p className="mt-5 rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">High-intent journeys appear after recommendations and shortlists.</p>}
          <p className="mt-4 text-[10px] leading-4 text-slate-400">Fit score reflects recommendation alignment from face-shape, visual-width, and style signals. It is not a physical-fit or prescription measurement.</p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Conversion story</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">Shopper decision funnel</h2>
              <p className="mt-1 text-sm text-slate-500">From Store visit to measurable purchase intent.</p>
            </div>
            <BarChart3 className="h-6 w-6 text-slate-300" aria-hidden="true" />
          </div>
          <div className="mt-7 space-y-5">
            {funnel.map((item) => {
              const Icon = item.icon
              const width = item.value === 0 ? 0 : Math.max(4, Math.round((item.value / funnelMax) * 100))
              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 font-medium text-slate-700">
                      <Icon className="h-4 w-4 text-teal-700" aria-hidden="true" />
                      {item.label}
                    </span>
                    <span className="font-semibold tabular-nums text-slate-950">{item.value}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-700 to-cyan-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Catalog health</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">Ready to sell</h2>
          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-4xl font-semibold tracking-tight text-slate-950">{activeRate}%</p>
              <p className="mt-1 text-sm text-slate-500">active inventory</p>
            </div>
            <span className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${activeRate}%` }} />
          </div>
          <dl className="mt-6 divide-y divide-slate-100 text-sm">
            <div className="flex items-center justify-between py-3">
              <dt className="text-slate-500">Catalog items</dt>
              <dd className="font-semibold text-slate-900">{catalog.total}</dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-slate-500">AI-enriched</dt>
              <dd className="font-semibold text-slate-900">{catalog.approved}</dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-slate-500">Average price</dt>
              <dd className="font-semibold text-slate-900">{formatPrice(catalog.averagePrice, catalog.currency)}</dd>
            </div>
            <div className="flex items-center justify-between pt-3">
              <dt className="text-slate-500">Try-on failures</dt>
              <dd className={metrics.tryOnFailures > 0 ? 'font-semibold text-amber-700' : 'font-semibold text-emerald-700'}>
                {metrics.tryOnFailures}
              </dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Inventory</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Frame catalog</h2>
            <p className="mt-1 text-sm text-slate-500">Product data, merchandising status, and engagement in one view.</p>
          </div>
          <div className="flex gap-2 text-xs font-medium">
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">{catalog.active} active</span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{catalog.total} total</span>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {catalog.frames.map((frame) => (
            <article key={frame.frameId} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-b from-white to-slate-50">
                <CatalogImage frame={frame} sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw" />
                <span className="absolute left-3 top-3 rounded-full bg-emerald-50/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
                  {frame.status}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-950">{frame.name}</h3>
                    <p className="mt-1 text-xs font-medium text-slate-400">{frame.sku || 'No SKU'}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-slate-950">{formatPrice(frame.price, frame.currency)}</p>
                </div>
                <p className="mt-3 text-xs capitalize text-slate-500">
                  {[frame.shape, frame.material, frame.color, frame.widthClass].filter(Boolean).join(' · ')}
                </p>
                <div className="mt-3 flex min-h-6 flex-wrap gap-1.5">
                  {frame.styleTags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium capitalize text-slate-600">{tag}</span>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-4 border-t border-slate-100 pt-3 text-center">
                  <div><p className="text-sm font-semibold text-slate-900">{frame.recommendations}</p><p className="text-[10px] text-slate-400">Selected</p></div>
                  <div><p className="text-sm font-semibold text-slate-900">{frame.tryOns}</p><p className="text-[10px] text-slate-400">Try-ons</p></div>
                  <div><p className="text-sm font-semibold text-slate-900">{frame.favorites}</p><p className="text-[10px] text-slate-400">Saved</p></div>
                  <div><p className="text-sm font-semibold text-slate-900">{frame.productClicks}</p><p className="text-[10px] text-slate-400">Clicks</p></div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Live activity</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Recent shopper sessions</h2>
            <p className="mt-1 text-sm text-slate-500">Anonymous behavior only; shopper images remain private.</p>
          </div>
          <MousePointerClick className="h-6 w-6 text-slate-300" aria-hidden="true" />
        </div>
        {recentSessions.length === 0 ? (
          <p className="mt-6 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No sessions yet.</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-3 pr-4 font-semibold">Session</th>
                  <th className="pb-3 pr-4 font-semibold">Created</th>
                  <th className="pb-3 pr-4 text-center font-semibold">Selected</th>
                  <th className="pb-3 pr-4 text-center font-semibold">Tried</th>
                  <th className="pb-3 pr-4 text-center font-semibold">Compared</th>
                  <th className="pb-3 pr-4 text-center font-semibold">Saved</th>
                  <th className="pb-3 text-center font-semibold">Intent</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((session) => (
                  <tr key={session.sessionId} className="border-b border-slate-100 last:border-0">
                    <td className="py-4 pr-4 font-semibold text-slate-900">{session.shortLabel}</td>
                    <td className="py-4 pr-4 text-slate-500">{new Date(session.createdAt).toLocaleString('en-US')}</td>
                    <td className="py-4 pr-4 text-center font-medium text-slate-700">{session.recommendedCount}</td>
                    <td className="py-4 pr-4 text-center font-medium text-slate-700">{session.triedCount}</td>
                    <td className="py-4 pr-4 text-center">{session.compared ? <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600" /> : <span className="text-slate-300">—</span>}</td>
                    <td className="py-4 pr-4 text-center">{session.favorited ? <Heart className="mx-auto h-4 w-4 fill-rose-500 text-rose-500" /> : <span className="text-slate-300">—</span>}</td>
                    <td className="py-4 text-center">{session.productClicked || session.inquired ? <CheckCircle2 className="mx-auto h-4 w-4 text-teal-700" /> : <span className="text-slate-300">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
