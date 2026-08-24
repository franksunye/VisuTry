'use client'

import { FormEvent, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { analytics, getAcquisitionContext } from '@/lib/analytics'

type FormState = {
  contactName: string
  email: string
  businessName: string
  businessType: string
  websiteUrl: string
  frameCountRange: string
  trafficSource: string
  goal: string
  message: string
  consentToContact: boolean
  companyFax: string
}

const initialForm: FormState = {
  contactName: '', email: '', businessName: '', businessType: 'optical-store', websiteUrl: '',
  frameCountRange: '8-20', trafficSource: '', goal: 'store', message: '', consentToContact: false, companyFax: '',
}

export function BusinessPilotLeadForm({ locale }: { locale: string }) {
  const [form, setForm] = useState(initialForm)
  const [state, setState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const requestId = useRef<string>()
  const trackedStart = useRef(false)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function trackStart() {
    if (trackedStart.current) return
    trackedStart.current = true
    analytics.trackStoreLeadFormStarted({ locale })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState('submitting')
    setError('')
    requestId.current ||= crypto.randomUUID()
    const acquisition = getAcquisitionContext()
    const search = new URLSearchParams(window.location.search)
    let referrerHost: string | undefined
    try { referrerHost = document.referrer ? new URL(document.referrer).hostname : undefined } catch { referrerHost = undefined }

    try {
      const response = await fetch('/api/business/pilot-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          requestId: requestId.current,
          websiteUrl: form.websiteUrl || undefined,
          trafficSource: form.trafficSource || undefined,
          message: form.message || undefined,
          locale,
          acquisitionSource: acquisition.acquisition_source,
          acquisitionMedium: acquisition.acquisition_medium,
          campaignName: search.get('utm_campaign') || undefined,
          landingPath: acquisition.landing_page,
          referrerHost,
        }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.message || 'We could not send your request.')
      }
      analytics.trackStoreLeadCreated({
        locale,
        businessType: form.businessType,
        intent: form.goal === 'partnership' ? 'partnership' : form.goal === 'demo' ? 'demo' : 'catalog',
        leadType: form.goal === 'partnership' ? 'partnership' : form.goal === 'demo' ? 'demo' : 'catalog',
        frameCount: form.frameCountRange,
      })
      setState('success')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not send your request.')
      setState('error')
    }
  }

  const inputClass = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

  if (state === 'success') {
    return (
      <section id="pilot-request" className="border-b border-slate-200 bg-white scroll-mt-20">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden="true" />
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">Your Pilot request is in.</h2>
          <p className="mt-3 text-slate-600">We will review your catalog, use case, and timing, then reply to {form.email}.</p>
        </div>
      </section>
    )
  }

  return (
    <section id="pilot-request" className="border-b border-slate-200 bg-white scroll-mt-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Pilot request</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Tell us what you want to test.</h2>
          <p className="mt-5 text-base leading-7 text-slate-600">A real catalog, a clear first traffic source, and one focused goal are enough to start the review.</p>
          <p className="mt-5 text-sm leading-6 text-slate-500">We normally reply within two business days. Submitting this form does not start billing or commit you to a Pilot.</p>
        </div>

        <form onSubmit={submit} onFocus={trackStart} className="grid gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm sm:grid-cols-2 sm:p-7">
          <label className="text-sm font-semibold text-slate-800">Your name<input required minLength={2} maxLength={120} autoComplete="name" className={inputClass} value={form.contactName} onChange={(e) => update('contactName', e.target.value)} /></label>
          <label className="text-sm font-semibold text-slate-800">Work email<input required type="email" maxLength={254} autoComplete="email" className={inputClass} value={form.email} onChange={(e) => update('email', e.target.value)} /></label>
          <label className="text-sm font-semibold text-slate-800">Business name<input required minLength={2} maxLength={160} autoComplete="organization" className={inputClass} value={form.businessName} onChange={(e) => update('businessName', e.target.value)} /></label>
          <label className="text-sm font-semibold text-slate-800">Business type<select className={inputClass} value={form.businessType} onChange={(e) => update('businessType', e.target.value)}><option value="optical-store">Optical store</option><option value="eyewear-brand">Eyewear brand</option><option value="ecommerce">Ecommerce retailer</option><option value="agency">Agency</option><option value="other">Other</option></select></label>
          <label className="text-sm font-semibold text-slate-800 sm:col-span-2">Website or store URL<input type="url" maxLength={500} placeholder="https://" className={inputClass} value={form.websiteUrl} onChange={(e) => update('websiteUrl', e.target.value)} /></label>
          <label className="text-sm font-semibold text-slate-800">Approximate frame count<select className={inputClass} value={form.frameCountRange} onChange={(e) => update('frameCountRange', e.target.value)}><option value="8-20">8–20</option><option value="21-50">21–50</option><option value="51-200">51–200</option><option value="200+">200+</option><option value="not-sure">Not sure yet</option></select></label>
          <label className="text-sm font-semibold text-slate-800">First traffic source<input maxLength={120} placeholder="Website, paid social, email…" className={inputClass} value={form.trafficSource} onChange={(e) => update('trafficSource', e.target.value)} /></label>
          <label className="text-sm font-semibold text-slate-800 sm:col-span-2">What do you want to start with?<select className={inputClass} value={form.goal} onChange={(e) => update('goal', e.target.value)}><option value="store">Hosted Store</option><option value="campaign">Campaign Experience</option><option value="demo">Product demo first</option><option value="partnership">Agency / partnership</option><option value="not-sure">Help me choose</option></select></label>
          <label className="text-sm font-semibold text-slate-800 sm:col-span-2">Anything else we should know?<textarea rows={4} maxLength={2000} className={inputClass} value={form.message} onChange={(e) => update('message', e.target.value)} /></label>
          <label className="sr-only" aria-hidden="true">Company fax<input tabIndex={-1} autoComplete="off" value={form.companyFax} onChange={(e) => update('companyFax', e.target.value)} /></label>
          <label className="flex items-start gap-3 text-sm leading-6 text-slate-600 sm:col-span-2"><input required type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300" checked={form.consentToContact} onChange={(e) => update('consentToContact', e.target.checked)} /><span>I agree that VisuTry may contact me about this Pilot request.</span></label>
          <div className="sm:col-span-2">
            <button disabled={state === 'submitting'} type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60">{state === 'submitting' ? 'Sending…' : 'Request Pilot review'}<ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
            {state === 'error' ? <p role="alert" className="mt-3 text-sm text-red-700">{error} You can also email <a className="underline" href="mailto:support@visutry.com?subject=Founding%20Merchant%20Pilot">support@visutry.com</a>.</p> : null}
          </div>
        </form>
      </div>
    </section>
  )
}
