import Link from 'next/link'
import { ArrowRight, AlertCircle, Boxes, Megaphone, Store } from 'lucide-react'
import { merchantWorkspaceHref } from '@/modules/merchant/application/merchant-workspace-routes'
import { resolveMerchantHomePresentation, type MerchantOperatingHomeReadModel } from '@/modules/merchant/domain/merchant-operating-home'
import { MerchantLivePulse } from './MerchantLivePulse'
import { MerchantMiniTrend } from './MerchantCommerceCharts'

function number(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

const WORK_ICONS = { store: Store, catalog: Boxes, campaigns: Megaphone } as const

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
  const href = (section: Parameters<typeof merchantWorkspaceHref>[0]['section']) => merchantWorkspaceHref({ locale, section, merchantId })
  const workItems = [presentation.currentWork.store, presentation.currentWork.catalog, presentation.currentWork.campaigns]

  return (
    <div className="space-y-8" data-testid="merchant-operating-home">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">Operating workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-[28px]">Home</h1>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:flex sm:items-center sm:justify-end sm:gap-4">
          <div className="min-w-0 sm:max-w-64">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Recommended next step</p>
            <p className="mt-0.5 text-sm leading-5 text-slate-600 sm:whitespace-normal">{presentation.recommendedAction.reason}</p>
          </div>
          <Link href={href(presentation.recommendedAction.section)} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:px-3.5">
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
                <Link href={href(item.section)} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-amber-900 hover:text-amber-700">{item.label}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="merchant-home-performance" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-6">
          <div>
            <h2 id="merchant-home-performance" className="text-sm font-semibold text-slate-950">Shopper outcomes</h2>
            <p className="mt-0.5 text-xs text-slate-500">{presentation.outcome.periodLabel} · UTC</p>
          </div>
          {presentation.outcome.kind === 'ACTIVITY' ? <Link href={href('analytics')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900">Analytics<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link> : null}
        </div>
        {presentation.outcome.kind === 'ACTIVITY' ? (
          <div className="grid lg:grid-cols-[minmax(0,1fr)_228px]">
            <dl className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-4 sm:divide-y-0">
              {presentation.outcome.metrics.map((metric) => <div key={metric.label} className="min-w-0 px-4 py-4 sm:px-5 sm:py-5">
                <dt className="truncate text-xs font-medium text-slate-500">{metric.label}</dt>
                <dd className="mt-1.5 text-[26px] font-semibold leading-none tracking-[-0.04em] tabular-nums text-slate-950">{number(metric.value)}</dd>
              </div>)}
            </dl>
            <div className="flex items-center border-t border-slate-100 px-4 py-4 sm:px-5 lg:border-l lg:border-t-0">
              <MerchantMiniTrend trend={home.shopper.decisionTrend} />
            </div>
          </div>
        ) : (
          <div className="px-4 py-5 sm:px-6">
            <p className="text-sm font-medium text-slate-800">No shopper activity yet</p>
            <p className="mt-1 text-sm text-slate-500">Shopper signals will appear after people interact with your Store or Campaigns.</p>
          </div>
        )}
      </section>

      <section aria-labelledby="merchant-home-business-status">
        <div className="flex items-end justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Setup and publishing</p>
            <h2 id="merchant-home-business-status" className="mt-0.5 text-lg font-semibold tracking-tight text-slate-950">Business status</h2>
          </div>
          <span className="hidden text-xs text-slate-500 sm:block">Store · Catalog · Campaigns</span>
        </div>
        <ul className="divide-y divide-slate-200">
          {workItems.map((item) => {
            const Icon = WORK_ICONS[item.section]
            return <li key={item.section} className="flex flex-wrap items-center gap-x-5 gap-y-1.5 py-3 sm:gap-6 sm:py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{item.section}</span>
                  <span className="mt-0.5 block truncate text-sm font-semibold text-slate-900">{item.status}</span>
                </span>
              </div>
              <p className="order-3 basis-full pl-11 text-sm text-slate-500 sm:order-none sm:basis-auto sm:flex-1 sm:pl-0">{item.detail}</p>
              <Link href={href(item.section)} className="ml-auto inline-flex min-h-9 shrink-0 items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900">{item.label}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
            </li>
          })}
        </ul>
      </section>

      <MerchantLivePulse key={merchantId} merchantId={merchantId} />
    </div>
  )
}
