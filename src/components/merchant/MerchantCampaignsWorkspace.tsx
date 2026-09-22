'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, CalendarDays, Plus } from 'lucide-react'
import type { CampaignReadModel } from '@/modules/store/application/campaign-service'
import { resolveMerchantCampaignPresentation } from '@/modules/merchant/domain/merchant-campaign-presentation'

type Filter = 'ALL' | 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

function campaignHref(locale: string, merchantId: string, campaignId: string) {
  return `/${locale}/merchant/campaigns/${encodeURIComponent(campaignId)}?merchantId=${encodeURIComponent(merchantId)}`
}

function lifecycleLabel(status: string) {
  return status === 'ACTIVE' ? 'Live' : status === 'ARCHIVED' ? 'Archived' : 'Draft'
}

function dateWindow(campaign: CampaignReadModel) {
  if (!campaign.startAt && !campaign.endAt) return null
  const format = (value: Date | null) => value ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : null
  return [format(campaign.startAt), format(campaign.endAt)].filter(Boolean).join(' – ')
}

export function MerchantCampaignsWorkspace({
  locale,
  merchantId,
  campaigns: initialCampaigns,
}: {
  locale: string
  merchantId: string
  campaigns: CampaignReadModel[]
}) {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [filter, setFilter] = useState<Filter>('ALL')
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const visible = useMemo(() => filter === 'ALL' ? campaigns : campaigns.filter((campaign) => campaign.status === filter), [campaigns, filter])
  const counts = useMemo(() => ({
    ALL: campaigns.length,
    DRAFT: campaigns.filter((item) => item.status === 'DRAFT').length,
    ACTIVE: campaigns.filter((item) => item.status === 'ACTIVE').length,
    ARCHIVED: campaigns.filter((item) => item.status === 'ARCHIVED').length,
  }), [campaigns])

  async function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch(`/api/merchant/${encodeURIComponent(merchantId)}/campaigns`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: String(form.get('name') ?? '').trim(), headline: String(form.get('headline') ?? '').trim() || null }),
      })
      const result = await response.json() as { success?: boolean; data?: CampaignReadModel; message?: string }
      if (!response.ok || !result.data) throw new Error(result.message || 'Campaign could not be created. Try again.')
      router.push(campaignHref(locale, merchantId, result.data.id))
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Campaign could not be created. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return <section data-testid="merchant-campaign-workspace" className="space-y-5" aria-labelledby="campaigns-heading">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Merchant workspace</p>
        <h1 id="campaigns-heading" className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Campaigns</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">Create focused product experiences, review them privately, then choose when to make them live.</p>
      </div>
      <button type="button" onClick={() => { setCreating(true); setError(null) }} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
        <Plus className="h-4 w-4" aria-hidden="true" /> Create Campaign
      </button>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
      <p className="text-sm text-slate-600"><span className="font-semibold text-slate-950">{campaigns.length}</span> Campaign{campaigns.length === 1 ? '' : 's'} · {counts.ACTIVE} live</p>
      <div className="flex max-w-full gap-1 overflow-x-auto" role="group" aria-label="Filter Campaigns">
        {(['ALL', 'DRAFT', 'ACTIVE', 'ARCHIVED'] as const).map((key) => {
          const label = key === 'ALL' ? 'All' : key === 'ACTIVE' ? 'Live' : key === 'DRAFT' ? 'Draft' : 'Archived'
          return <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${filter === key ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{label}<span className="ml-1.5 text-xs opacity-75">{counts[key]}</span></button>
        })}
      </div>
    </div>

    {creating ? <form onSubmit={createDraft} className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 sm:p-5" aria-label="Create a Campaign draft">
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="text-base font-semibold text-slate-950">Start a Campaign draft</h2><p className="mt-1 text-sm text-slate-600">You can add products and details before previewing or publishing.</p></div>
        <button type="button" onClick={() => setCreating(false)} className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-white">Cancel</button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-800">Campaign name *<input autoFocus name="name" required maxLength={120} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Summer collection" /></label>
        <label className="text-sm font-medium text-slate-800">Shopper-facing headline<input name="headline" maxLength={240} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Find your next favorite frame" /></label>
      </div>
      {error ? <p role="alert" className="mt-3 text-sm font-medium text-rose-700">{error}</p> : null}
      <div className="mt-4 flex justify-end"><button type="submit" disabled={busy} className="min-h-10 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">{busy ? 'Creating…' : 'Create draft'}</button></div>
    </form> : null}

    {visible.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
      <h2 className="text-base font-semibold text-slate-950">{campaigns.length === 0 ? 'No Campaigns yet' : `No ${filter === 'ACTIVE' ? 'live' : filter.toLowerCase()} Campaigns`}</h2>
      <p className="mx-auto mt-1.5 max-w-lg text-sm leading-6 text-slate-600">Campaigns are optional. Use one to bring a focused selection of products together for shoppers.</p>
      {campaigns.length === 0 ? <button type="button" onClick={() => setCreating(true)} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Create Campaign <ArrowRight className="h-4 w-4" aria-hidden="true" /></button> : null}
    </div> : <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
      {visible.map((campaign) => {
        const presentation = resolveMerchantCampaignPresentation(campaign)
        const window = dateWindow(campaign)
        return <li key={campaign.id}>
          <Link href={campaignHref(locale, merchantId, campaign.id)} className="group flex flex-col gap-3 p-4 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${campaign.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800' : campaign.status === 'ARCHIVED' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-800'}`}>{lifecycleLabel(campaign.status)}</span>
                {campaign.status !== 'ARCHIVED' ? <span className={`text-xs font-medium ${campaign.readiness.ready ? 'text-emerald-700' : 'text-amber-800'}`}>{campaign.readiness.ready ? 'Ready' : 'Needs attention'}</span> : null}
              </div>
              <h2 className="mt-2 truncate text-base font-semibold text-slate-950">{campaign.name}</h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600"><span>{campaign.frameCount} product{campaign.frameCount === 1 ? '' : 's'}</span>{window ? <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />{window}</span> : null}<span>{presentation.visibility}</span></p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-700 group-hover:text-blue-900">Open <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
          </Link>
        </li>
      })}
    </ul>}
  </section>
}
