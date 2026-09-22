'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowUpRight, ExternalLink, Eye, LockKeyhole, Save, X } from 'lucide-react'
import type { CampaignReadModel } from '@/modules/store/application/campaign-service'
import type { CampaignGate, CampaignObjective } from '@/modules/store/domain/campaign-policy'
import type { PresentationMode } from '@/modules/store/domain/presentation-mode'
import { merchantCampaignIssueCopy, resolveMerchantCampaignPresentation, merchantCampaignPolicyLabel } from '@/modules/merchant/domain/merchant-campaign-presentation'
import { merchantWorkspaceHref } from '@/modules/merchant/application/merchant-workspace-routes'
import { MerchantCampaignPrivatePreview } from './MerchantCampaignPrivatePreview'

type CampaignDate = Date | string | null
type Campaign = Omit<CampaignReadModel, 'startAt' | 'endAt'> & { startAt: CampaignDate; endAt: CampaignDate }
type CatalogProduct = {
  id: string
  name: string
  brand: string | null
  imageUrl: string | null
  presentation: { state: string; label: string; issueSummary: string | null }
}
type DetailDraft = {
  name: string
  headline: string
  description: string
  objective: CampaignObjective
  gate: CampaignGate
  presentationMode: PresentationMode
  startAt: string
  endAt: string
  primaryCtaType: string
  primaryCtaLabel: string
  primaryCtaUrl: string
  secondaryCtaType: string
  secondaryCtaLabel: string
  secondaryCtaUrl: string
}

function inputDate(value: CampaignDate) {
  if (!value) return ''
  const date = new Date(value)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function initialDraft(campaign: Campaign): DetailDraft {
  return {
    name: campaign.name,
    headline: campaign.headline ?? '',
    description: campaign.description ?? '',
    objective: campaign.objective,
    gate: campaign.gate,
    presentationMode: campaign.presentationMode,
    startAt: inputDate(campaign.startAt),
    endAt: inputDate(campaign.endAt),
    primaryCtaType: campaign.primaryCtaType ?? '',
    primaryCtaLabel: campaign.primaryCtaLabel ?? '',
    primaryCtaUrl: campaign.primaryCtaUrl ?? '',
    secondaryCtaType: campaign.secondaryCtaType ?? '',
    secondaryCtaLabel: campaign.secondaryCtaLabel ?? '',
    secondaryCtaUrl: campaign.secondaryCtaUrl ?? '',
  }
}

function isoOrNull(value: string) { return value ? new Date(value).toISOString() : null }

async function responseData<T>(response: Response): Promise<T> {
  const result = await response.json() as { success?: boolean; data?: T; error?: string; message?: string; decision?: { current?: number; limit?: number | null; recommendedPlan?: string | null } }
  if (!response.ok || !result.success || result.data === undefined) {
    const error = new Error(result.message || 'Your change could not be saved. Please try again.') as Error & { code?: string; decision?: typeof result.decision }
    error.code = result.error
    error.decision = result.decision
    throw error
  }
  return result.data
}

function publicHref(locale: string, campaign: Campaign) {
  return `/${locale}/c/${campaign.publicPath.split('/').slice(-2).join('/')}`
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="block text-sm font-medium text-slate-800">{label}{children}{hint ? <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span> : null}</label>
}

function inputClass() { return 'mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500' }

export function MerchantCampaignDetailWorkspace({
  locale,
  merchantId,
  merchantName,
  initialCampaign,
}: {
  locale: string
  merchantId: string
  merchantName: string
  initialCampaign: Campaign
}) {
  const router = useRouter()
  const [campaign, setCampaign] = useState(initialCampaign)
  const [draft, setDraft] = useState(() => initialDraft(initialCampaign))
  const [selectedIds, setSelectedIds] = useState(initialCampaign.frameIds)
  const [savedDraft, setSavedDraft] = useState(() => initialDraft(initialCampaign))
  const [savedSelectedIds, setSavedSelectedIds] = useState(initialCampaign.frameIds)
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [productCursor, setProductCursor] = useState<string | null>(null)
  const [productsBusy, setProductsBusy] = useState(false)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string; code?: string } | null>(null)
  const [preview, setPreview] = useState<Campaign | null>(null)
  const [approved, setApproved] = useState(false)
  const [archiveConfirm, setArchiveConfirm] = useState(false)

  const presentation = resolveMerchantCampaignPresentation(campaign)
  const readOnly = campaign.status === 'ARCHIVED'
  const detailsDirty = JSON.stringify(draft) !== JSON.stringify(savedDraft)
  const productsDirty = JSON.stringify(selectedIds) !== JSON.stringify(savedSelectedIds)
  const dirty = detailsDirty || productsDirty
  const previewSaveInstruction = detailsDirty && productsDirty
    ? 'Save campaign details and product selection before previewing.'
    : detailsDirty
      ? 'Save campaign details before previewing.'
      : 'Save product selection before previewing.'
  const productIds = useMemo(() => new Set(selectedIds), [selectedIds])
  const campaignEndpoint = `/api/merchant/${encodeURIComponent(merchantId)}/campaigns/${encodeURIComponent(campaign.id)}`
  const campaignUrl = publicHref(locale, campaign)

  const loadProducts = useCallback(async (search: string, cursor?: string | null, append = false) => {
    setProductsBusy(true)
    try {
      const query = new URLSearchParams({ readiness: 'READY', limit: '100' })
      if (search.trim()) query.set('search', search.trim())
      if (cursor) query.set('cursor', cursor)
      const response = await fetch(`/api/merchant/${encodeURIComponent(merchantId)}/catalog?${query}`)
      const data = await responseData<{ items: CatalogProduct[]; nextCursor: string | null }>(response)
      setProducts((current) => append ? [...current, ...data.items.filter((item) => !current.some((existing) => existing.id === item.id))] : data.items)
      setProductCursor(data.nextCursor)
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Catalog products could not be loaded.' })
    } finally {
      setProductsBusy(false)
    }
  }, [merchantId])

  useEffect(() => { void loadProducts('') }, [loadProducts]) // The picker starts with ready, tenant-owned Catalog products only.

  function update<K extends keyof DetailDraft>(key: K, value: DetailDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
    setPreview(null)
  }

  function toggleProduct(productId: string) {
    setSelectedIds((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId])
    setPreview(null)
  }

  async function saveDetails() {
    if (busyAction || readOnly || !detailsDirty || !draft.name.trim()) return
    setBusyAction('save-details')
    setMessage(null)
    setPreview(null)
    try {
      const payload = {
        name: draft.name,
        headline: draft.headline || null,
        description: draft.description || null,
        objective: draft.objective,
        gate: draft.gate,
        presentationMode: draft.presentationMode,
        startAt: isoOrNull(draft.startAt),
        endAt: isoOrNull(draft.endAt),
        primaryCtaType: draft.primaryCtaLabel || draft.primaryCtaUrl ? draft.primaryCtaType || 'LINK' : null,
        primaryCtaLabel: draft.primaryCtaLabel || null,
        primaryCtaUrl: draft.primaryCtaUrl || null,
        secondaryCtaType: draft.secondaryCtaLabel || draft.secondaryCtaUrl ? draft.secondaryCtaType || 'LINK' : null,
        secondaryCtaLabel: draft.secondaryCtaLabel || null,
        secondaryCtaUrl: draft.secondaryCtaUrl || null,
      }
      const saved = await responseData<Campaign>(await fetch(campaignEndpoint, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }))
      const savedDraft = initialDraft(saved)
      setCampaign(saved)
      setDraft(savedDraft)
      setSavedDraft(savedDraft)
      setMessage({ kind: 'success', text: saved.status === 'ACTIVE' ? 'Campaign details saved. These changes are now visible in your live Campaign.' : 'Campaign details saved.' })
    } catch (error) {
      const typed = error as Error & { code?: string }
      setMessage({ kind: 'error', text: typed.message || 'Campaign details could not be saved. Please try again.', code: typed.code })
    } finally {
      setBusyAction(null)
    }
  }

  async function saveProducts() {
    if (busyAction || readOnly || !productsDirty) return
    setBusyAction('save-products')
    setMessage(null)
    setPreview(null)
    try {
      const saved = await responseData<Campaign>(await fetch(`${campaignEndpoint}/products`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ frameIds: selectedIds }) }))
      setCampaign(saved)
      setSelectedIds(saved.frameIds)
      setSavedSelectedIds(saved.frameIds)
      setMessage({ kind: 'success', text: saved.status === 'ACTIVE' ? 'Product selection saved. These changes are now visible in your live Campaign.' : 'Product selection saved.' })
    } catch (error) {
      const typed = error as Error & { code?: string }
      setMessage({ kind: 'error', text: typed.message || 'Product selection could not be saved. Please try again.', code: typed.code })
    } finally {
      setBusyAction(null)
    }
  }

  async function previewDraft() {
    if (dirty || campaign.status !== 'DRAFT' || busyAction) return
    setBusyAction('preview')
    setMessage(null)
    try {
      const saved = await responseData<Campaign>(await fetch(`${campaignEndpoint}/preview`, { method: 'POST' }))
      setPreview(saved)
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Preview could not be opened.' })
    } finally {
      setBusyAction(null)
    }
  }

  async function publish() {
    if (!approved || !presentation.canPublish || dirty || busyAction) return
    setBusyAction('publish')
    setMessage(null)
    try {
      const published = await responseData<Campaign>(await fetch(`${campaignEndpoint}/publish`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ approved: true }) }))
      const publishedDraft = initialDraft(published)
      setCampaign(published)
      setDraft(publishedDraft)
      setSavedDraft(publishedDraft)
      setSelectedIds(published.frameIds)
      setSavedSelectedIds(published.frameIds)
      setPreview(null)
      setApproved(false)
      setMessage({ kind: 'success', text: 'Campaign is live. Its public link is ready to share.' })
      router.refresh()
    } catch (error) {
      const typed = error as Error & { code?: string }
      setMessage({ kind: 'error', text: typed.message || 'Campaign could not be published.', code: typed.code })
    } finally {
      setBusyAction(null)
    }
  }

  async function archive() {
    if (busyAction || dirty) return
    setBusyAction('archive')
    setMessage(null)
    try {
      const archived = await responseData<Campaign>(await fetch(`${campaignEndpoint}/archive`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ confirmed: true }) }))
      const archivedDraft = initialDraft(archived)
      setCampaign(archived)
      setDraft(archivedDraft)
      setSavedDraft(archivedDraft)
      setSelectedIds(archived.frameIds)
      setSavedSelectedIds(archived.frameIds)
      setArchiveConfirm(false)
      setMessage({ kind: 'success', text: 'Campaign archived. Existing public links may remain accessible under the archive policy.' })
      router.refresh()
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Campaign could not be archived.' })
    } finally {
      setBusyAction(null)
    }
  }

  const policyLabels = merchantCampaignPolicyLabel({ objective: draft.objective, gate: draft.gate, presentationMode: draft.presentationMode })
  const selectedMissing = campaign.selectedFrames.filter((frame) => !frame.valid && selectedIds.includes(frame.id))
  const liveUrl = `${typeof window === 'undefined' ? '' : window.location.origin}${campaignUrl}`

  return <section data-testid="merchant-campaign-detail" className="mx-auto max-w-5xl space-y-5" aria-labelledby="campaign-detail-heading">
    <Link href={merchantWorkspaceHref({ locale, section: 'campaigns', merchantId })} className="inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Campaigns</Link>

    <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${campaign.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800' : campaign.status === 'ARCHIVED' ? 'bg-slate-100 text-slate-700' : 'bg-blue-50 text-blue-800'}`}>{presentation.lifecycle}</span><span className={`text-sm font-medium ${campaign.readiness.ready ? 'text-emerald-700' : 'text-amber-800'}`}>{campaign.status === 'ARCHIVED' ? 'Archived' : campaign.readiness.ready ? 'Ready' : 'Needs attention'}</span></div>
        <h1 id="campaign-detail-heading" className="mt-2 break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{campaign.name}</h1>
        <p className="mt-1 text-sm text-slate-600">{campaign.frameCount} selected product{campaign.frameCount === 1 ? '' : 's'} · {presentation.visibility}</p>
      </div>
      {campaign.status === 'ACTIVE' ? <a href={campaignUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"><ExternalLink className="h-4 w-4" aria-hidden="true" />View live Campaign</a> : null}
    </header>

    {message ? <div role={message.kind === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${message.kind === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
      <p>{message.text}</p>
      {message.code === 'CAMPAIGN_LIMIT_REACHED' ? <Link href={merchantWorkspaceHref({ locale, section: 'plan', merchantId })} className="mt-2 inline-flex items-center gap-1 font-semibold underline">Review Plan &amp; Usage <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></Link> : null}
    </div> : null}

    {presentation.liveSaveWarning ? <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">{presentation.liveSaveWarning}</p> : null}
    {readOnly ? <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">This Campaign is archived and is read-only here. Existing public links may remain accessible under VisuTry’s archive and discovery policy.</p> : null}

    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
      <div className="space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5" aria-labelledby="campaign-core-heading">
          <div className="flex items-start justify-between gap-4"><div><h2 id="campaign-core-heading" className="text-base font-semibold text-slate-950">Campaign details</h2><p className="mt-1 text-sm text-slate-600">Start with a clear name and headline.</p></div>{detailsDirty ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">Unsaved detail changes</span> : null}</div>
          <div className="mt-4 grid gap-4">
            <Field label="Campaign name *"><input className={inputClass()} value={draft.name} maxLength={120} disabled={readOnly || busyAction !== null} onChange={(event) => update('name', event.target.value)} /></Field>
            <Field label="Shopper-facing headline" hint="A concise message shoppers see first."><input className={inputClass()} value={draft.headline} maxLength={240} disabled={readOnly || busyAction !== null} onChange={(event) => update('headline', event.target.value)} placeholder="Find a frame for every day" /></Field>
          {!readOnly ? <div className="mt-4 border-t border-slate-100 pt-3"><button type="button" onClick={saveDetails} disabled={!detailsDirty || busyAction !== null || !draft.name.trim()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-4 w-4" aria-hidden="true" />{busyAction === 'save-details' ? 'Saving details…' : 'Save campaign details'}</button>{campaign.status === 'ACTIVE' && detailsDirty ? <p className="mt-2 text-xs text-amber-800">Saving campaign details updates the live Campaign immediately.</p> : null}</div> : null}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5" aria-labelledby="campaign-products-heading">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id="campaign-products-heading" className="text-base font-semibold text-slate-950">Products</h2><p className="mt-1 text-sm text-slate-600">Choose active, ready products from this Merchant’s Catalog.</p></div><div className="flex items-center gap-2">{productsDirty ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">Unsaved product changes</span> : null}<span className="text-sm font-semibold text-slate-700">{selectedIds.length} selected</span></div></div>
          {selectedMissing.length > 0 ? <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><p className="font-semibold">Some saved products need attention</p><ul className="mt-1 list-inside list-disc">{selectedMissing.map((frame) => <li key={frame.id}>{frame.name || 'A selected product'} — {frame.issues.map(merchantCampaignIssueCopy).join(' ')}</li>)}</ul><Link href={merchantWorkspaceHref({ locale, section: 'catalog', merchantId })} className="mt-2 inline-flex items-center gap-1 font-semibold underline">Review Catalog <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></Link></div> : null}
          {campaign.selectedFrames.length > 0 ? <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200" aria-label="Selected Campaign products">{campaign.selectedFrames.filter((frame) => selectedIds.includes(frame.id)).map((frame) => <li key={frame.id} className="flex items-center gap-3 p-3">
            <div className="relative h-12 w-14 shrink-0 overflow-hidden rounded-md bg-slate-100">{frame.imageUrl ? <Image src={frame.imageUrl} alt="" fill sizes="56px" className="object-contain p-1" /> : <span className="absolute inset-0 grid place-items-center text-[10px] text-slate-400">No image</span>}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{frame.name || 'Catalog product unavailable'}</p><p className="text-xs text-slate-500">{frame.valid ? 'Ready' : 'Needs Catalog attention'}</p></div>
            {!readOnly ? <button type="button" aria-label={`Remove ${frame.name || 'selected product'}`} onClick={() => toggleProduct(frame.id)} disabled={busyAction !== null} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"><X className="h-4 w-4" aria-hidden="true" /></button> : null}
          </li>)}</ul> : null}
          {!readOnly ? <div className="mt-4">
            <label htmlFor="campaign-product-search" className="text-sm font-medium text-slate-800">Add a ready Catalog product</label>
            <div className="mt-1.5 flex gap-2"><input id="campaign-product-search" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void loadProducts(productSearch) } }} className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Search the full Catalog" /><button type="button" onClick={() => void loadProducts(productSearch)} disabled={productsBusy} className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 disabled:opacity-60">Search</button></div>
            <ul className="mt-2 max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200" aria-label="Available Catalog products">
              {products.map((product) => <li key={product.id} className="flex items-center gap-3 px-3 py-2.5">
                <input type="checkbox" checked={productIds.has(product.id)} onChange={() => toggleProduct(product.id)} disabled={readOnly || busyAction !== null} aria-label={`Select ${product.name}`} className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500" />
                <div className="relative h-10 w-12 shrink-0 overflow-hidden rounded bg-slate-100">{product.imageUrl ? <Image src={product.imageUrl} alt="" fill sizes="48px" className="object-contain p-1" /> : null}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-900">{product.name}</p><p className="truncate text-xs text-slate-500">{product.brand || 'Catalog product'}</p></div>
                <span className="text-xs font-medium text-emerald-700">Ready</span>
              </li>)}
              {products.length === 0 && !productsBusy ? <li className="px-3 py-4 text-sm text-slate-500">No ready products found. Add or correct products in Catalog first.</li> : null}
            </ul>
            {productCursor ? <button type="button" disabled={productsBusy} onClick={() => void loadProducts(productSearch, productCursor, true)} className="mt-2 text-sm font-semibold text-blue-700 hover:underline">{productsBusy ? 'Loading…' : 'Load more products'}</button> : null}
          </div> : null}
          {!readOnly ? <div className="mt-4 border-t border-slate-100 pt-3"><button type="button" onClick={saveProducts} disabled={!productsDirty || busyAction !== null} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-4 w-4" aria-hidden="true" />{busyAction === 'save-products' ? 'Saving product selection…' : 'Save product selection'}</button>{campaign.status === 'ACTIVE' && productsDirty ? <p className="mt-2 text-xs text-amber-800">Saving product selection updates the live Campaign immediately.</p> : null}</div> : null}
        </section>

        {!readOnly ? <details className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <summary className="cursor-pointer text-sm font-semibold text-slate-900">Advanced settings <span className="ml-1 font-normal text-slate-500">Optional</span></summary>
          <fieldset disabled={busyAction !== null} className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Campaign goal"><select className={inputClass()} value={draft.objective} onChange={(event) => update('objective', event.target.value as CampaignObjective)}><option value="TRAFFIC">Bring shoppers to products</option><option value="INTENT">Encourage shopper interest</option><option value="LEAD">Invite shoppers to get in touch</option></select></Field>
            <Field label="Shopper sign-in timing"><select className={inputClass()} value={draft.gate} onChange={(event) => update('gate', event.target.value as CampaignGate)}><option value="NONE">No sign-in prompt before exploring</option><option value="OPT_IN_AFTER_VALUE">Ask after shoppers see value</option><option value="OPT_IN_BEFORE_AI">Ask before AI-assisted features</option></select></Field>
            <Field label="Presentation style"><select className={inputClass()} value={draft.presentationMode} onChange={(event) => update('presentationMode', event.target.value as PresentationMode)}><option value="EDITORIAL_FIRST">Story first</option><option value="PRODUCT_FIRST">Products first</option><option value="ACTION_FIRST">Action first</option></select></Field>
            <Field label="Starts"><input type="datetime-local" className={inputClass()} value={draft.startAt} onChange={(event) => update('startAt', event.target.value)} /></Field>
            <Field label="Ends"><input type="datetime-local" className={inputClass()} value={draft.endAt} onChange={(event) => update('endAt', event.target.value)} /></Field>
            <Field label="Description"><textarea className={`${inputClass()} min-h-24 py-2.5`} value={draft.description} maxLength={5000} onChange={(event) => update('description', event.target.value)} /></Field>
            <Field label="Primary button label"><input className={inputClass()} value={draft.primaryCtaLabel} maxLength={120} onChange={(event) => update('primaryCtaLabel', event.target.value)} placeholder="Visit the collection" /></Field>
            <Field label="Primary button destination" hint="Use an https link or an internal path."><input className={inputClass()} value={draft.primaryCtaUrl} maxLength={2000} onChange={(event) => update('primaryCtaUrl', event.target.value)} placeholder="https://… or /…" /></Field>
            <Field label="Secondary button label"><input className={inputClass()} value={draft.secondaryCtaLabel} maxLength={120} onChange={(event) => update('secondaryCtaLabel', event.target.value)} /></Field>
            <Field label="Secondary button destination"><input className={inputClass()} value={draft.secondaryCtaUrl} maxLength={2000} onChange={(event) => update('secondaryCtaUrl', event.target.value)} placeholder="https://… or /…" /></Field>
            <p className="text-xs text-slate-500 sm:col-span-2">Current behavior: {policyLabels.objective}; {policyLabels.gate.toLowerCase()}; {policyLabels.presentationMode.toLowerCase()}.</p>
          </fieldset>
        </details> : <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"><h2 className="text-sm font-semibold text-slate-900">Campaign setup</h2><p className="mt-2 text-sm text-slate-600">{policyLabels.objective} · {policyLabels.gate} · {policyLabels.presentationMode}</p>{campaign.description ? <p className="mt-3 text-sm leading-6 text-slate-700">{campaign.description}</p> : null}</section>}
      </div>

      <aside className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5" aria-labelledby="campaign-readiness-heading">
          <div className="flex items-center justify-between gap-3"><h2 id="campaign-readiness-heading" className="text-base font-semibold text-slate-950">Readiness</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${campaign.readiness.ready ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{campaign.status === 'ARCHIVED' ? 'Archived' : campaign.readiness.ready ? 'Ready' : 'Needs attention'}</span></div>
          {campaign.readiness.blockingIssues.length ? <ul className="mt-3 space-y-2 text-sm text-slate-700">{presentation.issues.map((issue) => <li key={issue} className="flex gap-2"><span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />{issue}</li>)}</ul> : <p className="mt-3 text-sm text-slate-600">The saved Campaign meets the current publish checks.</p>}
          {campaign.selectedFrames.some((frame) => !frame.valid) ? <Link href={merchantWorkspaceHref({ locale, section: 'catalog', merchantId })} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline">Fix products in Catalog <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></Link> : null}
        </section>

        {!readOnly ? <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5" aria-label="Campaign actions">
          {campaign.status === 'DRAFT' ? <>
            {dirty ? <p className="mb-2 text-xs text-amber-800">{previewSaveInstruction}</p> : null}
            <button type="button" onClick={previewDraft} disabled={dirty || busyAction !== null || !campaign.frameCount} className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"><Eye className="h-4 w-4" aria-hidden="true" />{busyAction === 'preview' ? 'Opening preview…' : 'Private Preview'}</button>
            {!campaign.frameCount ? <p className="mt-2 text-xs text-slate-500">Select and save at least one ready product to preview.</p> : null}
            <div className="mt-4 border-t border-slate-200 pt-4">
              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-700"><input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)} disabled={!campaign.readiness.ready || dirty || busyAction !== null} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500" /><span>I approve publishing this Campaign publicly.</span></label>
              <button type="button" onClick={publish} disabled={!approved || !campaign.readiness.ready || dirty || busyAction !== null} className="mt-3 min-h-11 w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{busyAction === 'publish' ? 'Publishing…' : 'Publish Campaign'}</button>
              {!campaign.readiness.ready ? <p className="mt-2 text-xs text-slate-500">Complete the listed readiness items before publishing.</p> : null}
            </div>
          </> : <>
            <a href={campaignUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"><ExternalLink className="h-4 w-4" aria-hidden="true" />View live Campaign</a>
            <div className="mt-3 rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Public link</p><a href={campaignUrl} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm font-medium text-blue-700 underline">{campaignUrl}</a><button type="button" onClick={() => navigator.clipboard?.writeText(liveUrl)} className="mt-2 text-xs font-semibold text-slate-700 underline">Copy link</button></div>
          </>}
        </section> : null}

        {campaign.status === 'ARCHIVED' ? <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">Archived Campaigns are retained. They do not count toward your active Campaign allowance.</p> : null}
      </aside>
    </div>

    {preview ? <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800"><LockKeyhole className="h-4 w-4 text-blue-700" aria-hidden="true" />Private Preview uses saved Campaign details only.</p><button type="button" onClick={() => setPreview(null)} className="text-sm font-semibold text-slate-600 hover:text-slate-950">Close Preview</button></div><MerchantCampaignPrivatePreview campaign={preview} merchantName={merchantName} /></div> : null}

    {!readOnly ? <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
      <div><button type="button" onClick={() => setArchiveConfirm(true)} disabled={dirty || busyAction !== null} aria-describedby={dirty ? 'campaign-archive-unsaved-help' : undefined} className="text-sm font-semibold text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-45">Archive Campaign</button>{dirty ? <p id="campaign-archive-unsaved-help" className="mt-1 text-xs text-amber-800">Save your changes before archiving.</p> : null}</div>
    </div> : null}

    {archiveConfirm ? <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4" role="presentation"><section role="alertdialog" aria-modal="true" aria-labelledby="archive-title" aria-describedby="archive-description" className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
      <h2 id="archive-title" className="text-lg font-semibold text-slate-950">Archive this Campaign?</h2>
      <p id="archive-description" className="mt-2 text-sm leading-6 text-slate-600">It will no longer be active. Existing public links may remain accessible under VisuTry’s archive and discovery policy. This does not delete the Campaign.</p>
      <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setArchiveConfirm(false)} className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700">Keep Campaign</button><button type="button" onClick={archive} disabled={busyAction !== null} className="min-h-10 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white disabled:opacity-60">{busyAction === 'archive' ? 'Archiving…' : 'Archive Campaign'}</button></div>
    </section></div> : null}
  </section>
}
