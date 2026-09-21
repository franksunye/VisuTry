import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { MerchantControlExperience } from '@/modules/merchant/application/merchant-control-center'
import { merchantWorkspaceHref } from '@/modules/merchant/application/merchant-workspace-routes'

function statusLabel(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

export function MerchantCampaignsWorkspace({
  locale,
  merchantId,
  experiences,
}: {
  locale: string
  merchantId: string
  experiences: MerchantControlExperience[]
}) {
  const campaigns = experiences.filter((experience) => experience.type === 'CAMPAIGN')
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="campaigns-heading">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Merchant workspace</p><h1 id="campaigns-heading" className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Campaigns</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Review the campaigns already connected to this workspace. Campaign creation and editing remain available through the existing Agent workflow.</p></div>
      <Link href={merchantWorkspaceHref({ locale, section: 'integrations', merchantId })} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 hover:border-blue-300">Open Integrations<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
    </div>
    {campaigns.length === 0 ? <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-8 text-center"><p className="text-sm font-semibold text-slate-800">No campaigns yet</p><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">Your Store can operate without a campaign. When you are ready, use the Agent connection to prepare one for review.</p></div> : <div className="mt-6 grid gap-3">{campaigns.map((campaign) => <article key={campaign.id} className="rounded-xl border border-slate-200 p-4 sm:p-5"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">Campaign</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{statusLabel(campaign.status)}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${campaign.readiness.status === 'VALID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{campaign.readiness.status === 'VALID' ? 'Ready' : 'Needs attention'}</span></div><h2 className="mt-3 text-lg font-semibold text-slate-950">{campaign.name}</h2><p className="mt-1 text-sm text-slate-500">{campaign.selectedFrames.length} selected product{campaign.selectedFrames.length === 1 ? '' : 's'} · {campaign.status === 'ACTIVE' ? 'Live' : 'Private draft'}</p>{campaign.headline ? <p className="mt-3 text-sm leading-6 text-slate-700">{campaign.headline}</p> : null}</article>)}</div>}
  </section>
}
