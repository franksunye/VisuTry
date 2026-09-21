import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { merchantWorkspaceHref } from '@/modules/merchant/application/merchant-workspace-routes'
import { resolveMerchantHomePresentation, type MerchantOperatingHomeReadModel } from '@/modules/merchant/domain/merchant-operating-home'

function number(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
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
  const href = (section: Parameters<typeof merchantWorkspaceHref>[0]['section']) => merchantWorkspaceHref({ locale, section, merchantId })

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Merchant workspace</p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-3xl">Workspace overview</h1>
            <p className="mt-1.5 text-sm text-slate-600">A focused view of what needs attention and how your Store is performing.</p>
          </div>
          <Link href={href(presentation.recommendedAction.section)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            {presentation.recommendedAction.label}<ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <p className="mt-3 text-xs text-slate-500">{presentation.recommendedAction.reason}</p>
      </section>

      {presentation.attention.length > 0 && (
        <section aria-labelledby="merchant-home-attention" className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 id="merchant-home-attention" className="text-sm font-semibold text-amber-950">Attention</h2>
            <span className="text-xs font-medium text-amber-800">{presentation.attention.length} item{presentation.attention.length === 1 ? '' : 's'}</span>
          </div>
          <div className="mt-3 divide-y divide-amber-200/80">
            {presentation.attention.map((item) => (
              <div key={item.title} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-0.5 text-sm text-slate-700">{item.body}</p>
                </div>
                <Link href={href(item.section)} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-amber-950 hover:text-amber-700">{item.label}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="merchant-home-outcomes" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="merchant-home-outcomes" className="text-sm font-semibold text-slate-950">Shopper outcomes</h2>
            <p className="mt-0.5 text-xs text-slate-500">{presentation.outcome.periodLabel}</p>
          </div>
          {presentation.outcome.kind === 'ACTIVITY' && <Link href={href('analytics')} className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900">View Analytics<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>}
        </div>
        {presentation.outcome.kind === 'ACTIVITY' ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {presentation.outcome.metrics.map((metric) => <div key={metric.label} className="rounded-lg bg-slate-50 px-3 py-3"><p className="text-xl font-semibold tracking-tight text-slate-950">{number(metric.value)}</p><p className="mt-1 text-xs text-slate-500">{metric.label}</p></div>)}
          </div>
        ) : (
          <div className="mt-3 rounded-lg bg-slate-50 px-4 py-3"><p className="text-sm font-semibold text-slate-900">No shopper activity yet</p><p className="mt-1 text-sm text-slate-600">Shopper signals will appear after people interact with your Store or Campaigns.</p></div>
        )}
      </section>

      <section aria-labelledby="merchant-home-current-work">
        <div className="flex items-center justify-between gap-3"><h2 id="merchant-home-current-work" className="text-sm font-semibold text-slate-950">Current work</h2><span className="text-xs text-slate-500">Store, Catalog, Campaigns</span></div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {[presentation.currentWork.store, presentation.currentWork.catalog, presentation.currentWork.campaigns].map((item) => (
            <article key={item.section} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{item.section === 'store' ? 'Store' : item.section === 'catalog' ? 'Catalog' : 'Campaigns'}</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{item.status}</p>
              <p className="mt-1 min-h-5 text-sm text-slate-600">{item.detail}</p>
              <Link href={href(item.section)} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900">{item.label}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
