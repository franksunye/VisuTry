'use client'

import { useEffect, useState } from 'react'
import { publicMerchantImageUrl } from '@/lib/is-loopback-image-url'

export function MerchantExperienceHeroSettings({
  merchantId, experienceId, title, summary,
}: {
  merchantId: string; experienceId: string; title: string; summary: string | null
}) {
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE' | 'READ_ONLY' | 'LOADING'>('LOADING')
  const [canEdit, setCanEdit] = useState(false)
  const [savedUrl, setSavedUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pending, setPending] = useState<'upload' | 'remove' | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const endpoint = `/api/merchant/${encodeURIComponent(merchantId)}/brand`

  useEffect(() => {
    let cancelled = false
    fetch(`${endpoint}/hero?experienceId=${encodeURIComponent(experienceId)}`, { cache: 'no-store' })
      .then(async r => { if (!r.ok) throw Error('Unable to read Experience hero.'); return r.json() as Promise<{ data: { status: string; heroAssetUrl: string | null; canEdit: boolean } }> })
      .then(({ data }) => {
        if (cancelled) return
        setStatus(data.status === 'DRAFT' || data.status === 'ACTIVE' ? data.status : 'READ_ONLY')
        setSavedUrl(publicMerchantImageUrl(data.heroAssetUrl))
        setCanEdit(data.canEdit)
      })
      .catch(() => { if (!cancelled) { setStatus('READ_ONLY'); setFeedback({kind:'error',message:'Unable to read Experience hero.'}) } })
    return () => { cancelled = true }
  }, [endpoint, experienceId])

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  async function save(action: 'upload' | 'remove', liveApproved = false) {
    if (!canEdit || busy) return
    if (status === 'ACTIVE' && !liveApproved) { setPending(action); return }
    setPending(null); setBusy(true); setFeedback(null)
    try {
      let next: string | null
      if (action === 'upload') {
        if (!file) throw Error('Select an image before saving.')
        const form = new FormData()
        form.append('file', file)
        form.append('kind', 'hero')
        form.append('experienceId', experienceId)
        form.append('approvedLiveChange', String(liveApproved))
        const res = await fetch(`${endpoint}/media`, { method: 'POST', body: form })
        const body = await res.json() as { success?: boolean; error?: string; message?: string; data?: { url?: string } }
        if (!res.ok || !body.success || !body.data?.url) throw Error(body.message || body.error || 'Unable to upload hero.')
        next = body.data.url
      } else {
        const res = await fetch(`${endpoint}/hero`, {
          method: 'PATCH', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ experienceId, heroAssetUrl: null, approvedLiveChange: liveApproved }),
        })
        const body = await res.json() as { success?: boolean; error?: string; message?: string }
        if (!res.ok || !body.success) throw Error(body.message || body.error || 'Unable to reset hero.')
        next = null
      }
      setSavedUrl(publicMerchantImageUrl(next)); setFile(null)
      setFeedback({ kind: 'success', message: status === 'ACTIVE' ? 'Live hero updated.' : 'Draft hero saved. Your Experience is not published.' })
    } catch (error) {
      setFeedback({kind:'error',message:error instanceof Error?error.message:'Unable to save hero.'})
    } finally { setBusy(false) }
  }

  const imageUrl = previewUrl || savedUrl
  return <section aria-label="Experience hero media" data-testid="experience-hero-settings" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="font-semibold text-slate-950">Hero image</h3><p className="mt-1 text-xs leading-5 text-slate-600">This image belongs only to this Store or Campaign. Recommended: landscape 16:9, PNG/JPEG/static WebP, max 4 MB. Uploading replaces the visible hero after approval.</p></div>
      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{status === 'ACTIVE' ? 'Live' : status === 'DRAFT' ? 'Private Draft' : status === 'LOADING' ? 'Loading' : 'Read only'}</span>
    </div>
    <div className="mt-3 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(200px,0.8fr)]">
      <div className="space-y-3">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-slate-300 to-slate-700" data-testid="hero-unsaved-visual-preview">
          {imageUrl ? <img src={imageUrl} alt={`${title} hero preview`} className="absolute inset-0 h-full w-full object-cover" /> : null}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" aria-hidden="true" />
          <div className="absolute bottom-3 left-4 right-4 text-white"><p className="break-words font-serif text-lg font-semibold">{title}</p><p className="mt-1 line-clamp-2 text-xs text-white/90">{summary || 'Discover selected eyewear.'}</p></div>
        </div>
        <p className="text-xs text-slate-500">Visual preview of the current selection. Choosing a file does not publish or write anything until Save.</p>
      </div>
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-800">Upload your hero
          <input type="file" accept="image/png,image/jpeg,image/webp" disabled={!canEdit || busy} onChange={event => setFile(event.target.files?.[0] ?? null)} className="mt-2 block w-full text-xs font-normal" />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void save('upload')} disabled={!canEdit || !file || busy} className="min-h-10 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Save hero</button>
          <button type="button" onClick={() => void save('remove')} disabled={!canEdit || !savedUrl || busy} className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-40">Use default</button>
        </div>
        {status === 'ACTIVE' ? <p className="text-xs text-amber-800">An approved change becomes visible to shoppers immediately. There is no automatic publish.</p> : null}
        {!canEdit && status !== 'LOADING' ? <p className="text-xs text-slate-500">An Owner can edit this Experience hero.</p> : null}
      </div>
    </div>
    {pending ? <div role="alertdialog" aria-label="Confirm live hero update" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
      <p className="font-semibold text-amber-950">Update live Experience hero?</p><p className="mt-1 text-sm text-amber-900">This image will change on the public page immediately, without publishing anything else.</p>
      <div className="mt-3 flex flex-wrap gap-2"><button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setPending(null)}>Keep editing</button>
      <button type="button" className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white" onClick={() => void save(pending, true)}>Apply to live Experience</button></div>
    </div> : null}
    {feedback ? <p role={feedback.kind === 'error' ? 'alert' : 'status'} className={`mt-3 text-sm ${feedback.kind === 'error' ? 'text-red-700' : 'text-emerald-700'}`}>{feedback.message}</p> : null}
  </section>
}
