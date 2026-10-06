import Link from 'next/link'
import { Activity, ArrowRight, AlertCircle, Boxes, CheckCircle2, MessageCircle, Megaphone, MousePointerClick, Sparkles, Store, User, type LucideIcon } from 'lucide-react'
import { merchantWorkspaceHref, type MerchantWorkspaceSection } from '@/modules/merchant/application/merchant-workspace-routes'
import { resolveMerchantHomePresentation, type MerchantOperatingHomeReadModel } from '@/modules/merchant/domain/merchant-operating-home'
import { MerchantLivePulse } from './MerchantLivePulse'
import { MerchantMiniTrend } from './MerchantCommerceCharts'

function number(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

const WORK_ICONS = { store: Store, catalog: Boxes, campaigns: Megaphone } as const
const OUTCOME_VISUALS: Record<string, { Icon: LucideIcon; tone: string }> = {
  Visitors: { Icon: User, tone: 'bg-blue-50 text-blue-600' },
  'Engaged shoppers': { Icon: MessageCircle, tone: 'bg-violet-50 text-violet-600' },
  'High-intent shoppers': { Icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600' },
  'Product clicks': { Icon: MousePointerClick, tone: 'bg-sky-50 text-sky-600' },
}

export function MerchantOperatingHome({
  locale,
  merchantId,
  home,
}: {
  locale: string
  merchantId: string
  home: MerchantOperatingHomeReadModel
}) {
  const presentation = resolveMerchantHomePresentation(home)
  const href = (section: MerchantWorkspaceSection) => merchantWorkspaceHref({ locale, section, merchantId })
  const catalogIssueHref = home.catalog.primaryIssueFrameId
    ? merchantWorkspaceHref({ locale, section: 'catalog', merchantId, frameId: home.catalog.primaryIssueFrameId })
    : href('catalog')
  const workItems = [presentation.currentWork.store, presentation.currentWork.catalog, presentation.currentWork.campaigns]

  return (
    <div className="space-y-6" data-testid="merchant-operating-home">
      <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(430px,0.9fr)] lg:items-center lg:gap-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Operating workspace</p>
          <h1 className="mt-1.5 text-[32px] font-semibold leading-none tracking-[-0.045em] text-slate-950 sm:text-[36px]">Home</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">Your store at a glance. See how shoppers are engaging and keep your setup on track.</p>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/90 to-indigo-50/70 p-3.5 sm:grid-cols-[40px_minmax(0,1fr)_auto] sm:gap-4 sm:p-4">
          <span aria-hidden="true" className="col-start-1 row-span-2 hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-blue-600 shadow-sm sm:col-start-1 sm:row-start-1 sm:flex"><Sparkles className="h-5 w-5" /></span>
          <p className="col-span-2 row-start-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-blue-700/75 sm:col-span-1 sm:col-start-2 sm:row-start-1">Recommended next step</p>
          <p className="col-start-1 row-start-2 min-w-0 text-sm leading-5 text-slate-800 sm:col-start-2 sm:row-start-2">{presentation.recommendedAction.reason}</p>
          <Link href={presentation.recommendedAction.section === 'catalog' ? catalogIssueHref : href(presentation.recommendedAction.section)} className="col-start-2 row-start-2 inline-flex min-h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-slate-950 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:min-h-11 sm:px-4">
            {presentation.recommendedAction.label}<ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      {presentation.attention.length > 0 ? (
        <section aria-labelledby="merchant-home-attention" className="border-l-2 border-amber-500 pl-4">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <h2 id="merchant-home-attention" className="text-sm font-semibold">Needs attention</h2>
          </div>
          <ul className="mt-2 divide-y divide-amber-200/70">
            {presentation.attention.map((item) => (
              <li key={item.title} className="flex flex-col gap-2 py-2 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{item.body}</p>
                </div>
                {item.label ? <Link href={item.section === 'catalog' ? catalogIssueHref : href(item.section)} className="inline-flex min-h-11 w-fit shrink-0 items-center gap-1 rounded-sm px-1 text-sm font-semibold text-amber-900 hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2">{item.label}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="merchant-home-performance" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5 sm:mb-5 sm:pb-4">
          <div>
            <h2 id="merchant-home-performance" className="text-base font-semibold tracking-tight text-slate-950">Shopper outcomes</h2>
            <p className="mt-1 text-xs text-slate-500">{presentation.outcome.periodLabel} · UTC</p>
          </div>
          {presentation.outcome.kind === 'ACTIVITY' ? <Link href={href('analytics')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900">Analytics<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link> : null}
        </div>
        {presentation.outcome.kind === 'ACTIVITY' ? (
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
            <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
              {presentation.outcome.metrics.map((metric) => {
                const visual = OUTCOME_VISUALS[metric.label] ?? { Icon: Activity, tone: 'bg-blue-50 text-blue-600' }
                const Icon = visual.Icon
                return <div key={metric.label} className="grid min-h-[88px] min-w-0 grid-cols-[36px_minmax(0,1fr)] grid-rows-[1fr_1fr] items-center gap-x-2.5 rounded-xl border border-slate-100 bg-slate-50/75 px-3 py-3 sm:gap-x-3 sm:px-3.5">
                  <span aria-hidden="true" className={`col-start-1 row-span-2 row-start-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${visual.tone}`}><Icon className="h-[17px] w-[17px]" /></span>
                  <dt className="col-start-2 row-start-1 min-w-0 self-end text-[11px] font-medium leading-4 text-slate-500">{metric.label}</dt>
                  <dd className="col-start-2 row-start-2 mt-0.5 self-start text-[25px] font-semibold leading-none tracking-[-0.045em] tabular-nums text-slate-950">{number(metric.value)}</dd>
                </div>
              })}
            </dl>
            <div className="flex min-h-[88px] min-w-0 items-center rounded-xl bg-slate-50/75 px-3.5 py-3 sm:px-4 lg:rounded-none lg:bg-transparent lg:pl-5">
              <MerchantMiniTrend trend={home.shopper.decisionTrend} />
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50/80 px-4 py-4 sm:px-5 sm:py-5">
            <p className="text-sm font-semibold text-slate-800">No shopper activity yet</p>
            <p className="mt-1 text-sm leading-5 text-slate-500">Shopper signals will appear after people interact with your Store or Campaigns.</p>
          </div>
        )}
      </section>

      <section aria-labelledby="merchant-home-business-status" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-end justify-between gap-3 border-b border-slate-100 px-4 pb-3.5 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Setup and publishing</p>
            <h2 id="merchant-home-business-status" className="mt-1 text-xl font-semibold tracking-[-0.035em] text-slate-950">Business status</h2>
          </div>
          <span className="hidden pb-0.5 text-xs text-slate-500 sm:block">Store · Catalog · Campaigns</span>
        </div>
        <ul className="divide-y divide-slate-200 px-4 sm:px-6">
          {workItems.map((item) => {
            const Icon = WORK_ICONS[item.section]
            return <li key={item.section} className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 py-3.5 sm:grid-cols-[28px_minmax(140px,0.65fr)_minmax(0,1fr)_auto] sm:gap-x-5 sm:py-4">
              <Icon className="col-start-1 row-start-1 h-[18px] w-[18px] text-slate-700 sm:h-5 sm:w-5" aria-hidden="true" />
              <div className="col-start-2 row-start-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{item.section}</p>
                <p className="mt-0.5 truncate text-sm font-semibold text-slate-950">{item.status}</p>
              </div>
              <p className="col-start-2 row-start-2 min-w-0 text-[13px] leading-5 text-slate-600 sm:col-start-3 sm:row-start-1 sm:text-sm">{item.detail}</p>
              <Link href={href(item.section)} className="col-start-3 row-start-1 inline-flex min-h-9 shrink-0 items-center gap-1 whitespace-nowrap text-xs font-semibold text-blue-700 hover:text-blue-900 sm:col-start-4 sm:text-sm">{item.label}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
            </li>
          })}
        </ul>
      </section>

      <MerchantLivePulse key={merchantId} merchantId={merchantId} />
    </div>
  )
}
