import Link from 'next/link'
import { ArrowRight, KeyRound } from 'lucide-react'
import type { MerchantControlCenter } from '@/modules/merchant/application/merchant-control-center'
import { merchantWorkspaceHref } from '@/modules/merchant/application/merchant-workspace-routes'

function statusLabel(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

export function MerchantOperatingHome({
  locale,
  merchantId,
  control,
}: {
  locale: string
  merchantId: string
  control: MerchantControlCenter
}) {
  const nextSection = !control.catalog.total ? 'catalog' : 'store'
  const nextLabel = !control.catalog.total ? 'Open Catalog' : control.store?.status === 'DRAFT' ? 'Open Store' : 'Review Store'
  const href = (section: 'catalog' | 'store' | 'integrations') => merchantWorkspaceHref({ locale, section, merchantId })
  const campaignCount = control.experiences.filter((experience) => experience.type === 'CAMPAIGN').length
  const activeCampaignCount = control.activeCampaignCount
  const draftCampaignCount = Math.max(0, campaignCount - activeCampaignCount)
  const campaignBody = campaignCount === 0
    ? 'No campaigns yet'
    : `${activeCampaignCount} active${draftCampaignCount ? ` · ${draftCampaignCount} draft` : ''}`
  const summary = [
    ['Store', control.store ? statusLabel(control.store.status) : 'Not created'],
    ['Catalog', String(control.catalog.total)],
    ['Campaigns', String(campaignCount)],
    ['Shopper activity', control.shopperActivityAvailable ? 'Available' : 'No activity yet'],
  ]
  const cards = [
    { title: 'Store', value: control.store ? statusLabel(control.store.status) : 'Not created', body: control.store ? `${control.store.frameCount} selected product${control.store.frameCount === 1 ? '' : 's'}` : 'Create a draft Store when your catalog is ready.', href: href('store'), label: 'Open Store' },
    { title: 'Catalog', value: `${control.catalog.total} product${control.catalog.total === 1 ? '' : 's'}`, body: `${control.catalog.valid} ready for Store use`, href: href('catalog'), label: 'Manage Catalog' },
    { title: 'Campaigns', value: String(campaignCount), body: campaignBody, href: merchantWorkspaceHref({ locale, section: 'campaigns', merchantId }), label: 'View Campaigns' },
    { title: 'Shopper activity', value: control.shopperActivityAvailable ? 'Available' : 'No data yet', body: control.shopperActivityAvailable ? 'Review performance in Analytics.' : 'Activity appears after shoppers interact.', href: merchantWorkspaceHref({ locale, section: 'analytics', merchantId }), label: 'Open Analytics' },
  ]
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Merchant workspace</p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-3xl">Workspace overview</h1>
            <p className="mt-1.5 text-sm text-slate-600">A concise view of your Store, catalog, campaigns, and shopper activity.</p>
          </div>
          <Link href={merchantWorkspaceHref({ locale, section: nextSection, merchantId })} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            <ArrowRight className="h-4 w-4" aria-hidden="true" />{nextLabel}
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
          {summary.map(([label, value]) => <span key={label} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">{label} · {value}</span>)}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={href('catalog')} className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 hover:border-blue-300">Manage Catalog</Link>
          <Link href={href('integrations')} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-blue-800 hover:border-blue-400"><KeyRound className="h-4 w-4" aria-hidden="true" />{control.credentialUsage.active ? 'Open Integrations' : 'Connect your Agent'}</Link>
        </div>
      </section>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => <article key={card.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm font-medium text-slate-500">{card.title}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{card.value}</p><p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">{card.body}</p><Link href={card.href} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900">{card.label}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link></article>)}
      </div>
    </div>
  )
}
