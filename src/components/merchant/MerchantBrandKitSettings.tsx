'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { brandAccentForDisplay, MERCHANT_BRAND_PALETTE } from '@/modules/merchant/domain/merchant-brand-kit'

export function MerchantBrandKitSettings({
  merchantId, merchantName, initialLogoUrl, initialAccentColor, liveExperiences, canEdit,
}: {
  merchantId: string; merchantName: string; initialLogoUrl: string | null
  initialAccentColor: string | null; liveExperiences: number; canEdit: boolean
}) {
  const router = useRouter()
  const [accent, setAccent] = useState<string | null>(initialAccentColor)
  const [savedAccent, setSavedAccent] = useState<string | null>(initialAccentColor)
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pending, setPending] = useState<'accent' | 'logo' | 'reset-logo' | null>(null)
  const api = `/api/merchant/${encodeURIComponent(merchantId)}/brand`
  const hasLive = liveExperiences > 0

  useEffect(() => {
    if (!logoFile) { setLocalPreview(null); return }
    const url = URL.createObjectURL(logoFile)
    setLocalPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [logoFile])

  async function request(path: string, init: RequestInit) {
    const response = await fetch(path, init)
    const result = await response.json() as { success?: boolean; error?: string; message?: string; data?: { logoUrl?: string | null; accentColor?: string | null; url?: string; result?: { logoUrl?: string | null } } }
    if (!response.ok || !result.success) throw new Error(result.message || result.error || 'Unable to save brand changes.')
    return result
  }
  async function apply(which: 'accent' | 'logo' | 'reset-logo', confirmed = false) {
    if (!canEdit || busy) return
    if (hasLive && !confirmed) { setPending(which); return }
    setPending(null); setBusy(true); setMessage(null)
    try {
      if (which === 'accent') {
        await request(api, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accentColor: accent, approvedLiveChange: confirmed }) })
        setSavedAccent(accent)
      } else if (which === 'reset-logo') {
        await request(api, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ logoUrl: null, approvedLiveChange: confirmed }) })
        setLogoUrl(null); setLogoFile(null)
      } else {
        if (!logoFile) throw new Error('Choose an image first.')
        const form = new FormData()
        form.append('file', logoFile)
        form.append('kind', 'logo')
        form.append('approvedLiveChange', String(confirmed))
        const saved = await request(`${api}/media`, { method: 'POST', body: form })
        setLogoUrl(saved.data?.url ?? null); setLogoFile(null)
      }
      setMessage({ type: 'success', text: hasLive ? 'Brand saved. Live Experiences will use these values.' : 'Brand saved to your workspace.' })
      router.refresh()
    } catch (error) { setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to save changes.' }) }
    finally { setBusy(false) }
  }

  const currentLogo = localPreview || logoUrl
  const displayAccent = brandAccentForDisplay(accent)
  return <section aria-label="Merchant Brand Kit" className="min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" data-testid="merchant-brand-kit">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">Brand Kit</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-950">Your eyewear brand</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">One merchant identity across Store, Campaign, Try-On, Result and Kiosk. Colors are pre-approved for readable controls.</p>
      </div>
      {!canEdit ? <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">Owner only</span> : null}
    </div>
    <div className="mt-5 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.8fr)]">
      <div className="min-w-0 space-y-5">
        <fieldset disabled={!canEdit || busy} className="min-w-0 space-y-3">
          <legend className="text-sm font-semibold text-slate-900">Brand color</legend>
          <div className="grid min-w-0 grid-cols-1 gap-2 min-[360px]:grid-cols-2 xl:grid-cols-3">
            {MERCHANT_BRAND_PALETTE.map(option => <label key={option.hex} className={`flex min-h-12 min-w-0 cursor-pointer items-center gap-2 rounded-xl border p-2 text-sm ${accent === option.hex ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'}`}>
              <input type="radio" name={`brand-accent-${merchantId}`} checked={accent === option.hex} onChange={() => setAccent(option.hex)} aria-label={option.name} />
              <span className="h-6 w-6 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: option.hex }} aria-hidden="true" />
              <span className="min-w-0 break-words leading-5">{option.name}</span>
            </label>)}
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => void apply('accent')} disabled={busy || accent === savedAccent} className="min-h-10 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save color</button>
            <button type="button" onClick={() => setAccent(null)} disabled={accent === null} className="min-h-10 rounded-lg border px-4 py-2 text-sm font-medium">Use default color</button>
          </div>
        </fieldset>
        <fieldset disabled={!canEdit || busy} className="min-w-0 space-y-3 border-t border-slate-100 pt-5">
          <legend className="text-sm font-semibold text-slate-900">Logo or wordmark</legend>
          <p className="text-xs leading-5 text-slate-600">PNG, JPEG or static WebP, up to 4 MB. Transparent square or horizontal logo recommended. Images are made public only after you save.</p>
          <input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Choose brand logo" onChange={event => setLogoFile(event.target.files?.[0] ?? null)} className="block w-full min-w-0 max-w-full overflow-hidden text-ellipsis text-sm" />
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => void apply('logo')} disabled={!logoFile || busy} className="min-h-10 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Upload and save logo</button>
            <button type="button" onClick={() => void apply('reset-logo')} disabled={logoUrl === null || busy} className="min-h-10 rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50">Remove logo</button>
          </div>
        </fieldset>
      </div>
      <div className="min-w-0 max-w-full rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unsaved brand preview</p>
        <div className="mt-3 min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white">
              {currentLogo ? <img src={currentLogo} alt={`${merchantName} logo preview`} className="h-full w-full object-contain p-1" /> : <span className="font-serif text-xl font-bold" style={{ color: displayAccent }} aria-label="Default merchant mark">{merchantName.slice(0,1)}</span>}
            </div>
            <div className="min-w-0"><p className="truncate font-semibold text-slate-900">{merchantName}</p><p className="text-xs text-slate-500">Shopper Store / Campaign</p></div>
          </div>
          <div className="mt-4 rounded-xl p-4 text-white" style={{ backgroundColor: displayAccent }}><p className="text-sm font-semibold">Discover your next pair</p><p className="mt-1 text-xs text-white/90">Preview of an accessible branded action.</p></div>
        </div>
        {hasLive ? <p className="mt-3 text-xs font-medium leading-5 text-amber-800">Live impact: changes to this identity will update {liveExperiences} active Store/Campaign Experience(s) immediately after approval.</p>
          : <p className="mt-3 text-xs text-slate-600">Saving does not publish a Draft Store or Campaign.</p>}
      </div>
    </div>
    {pending ? <div role="alertdialog" aria-label="Confirm live brand change" className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4">
      <p className="font-semibold text-amber-950">Apply this brand change to live Experiences?</p>
      <p className="mt-1 text-sm text-amber-900">This changes the identity shoppers see on all active Store and Campaign pages. This does not publish a Draft.</p>
      <div className="mt-3 flex flex-wrap gap-2"><button type="button" className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm" onClick={() => setPending(null)}>Keep editing</button>
      <button type="button" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white" onClick={() => void apply(pending,true)}>Apply to live Experiences</button></div>
    </div> : null}
    {message ? <p role={message.type === 'error' ? 'alert' : 'status'} className={`mt-4 text-sm ${message.type === 'error' ? 'text-red-700' : 'text-emerald-700'}`}>{message.text}</p> : null}
  </section>
}
