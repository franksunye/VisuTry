'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, ChevronDown, Store } from 'lucide-react'
import { analytics, getAcquisitionContext } from '@/lib/analytics'
import { AnalyticsEvent } from '@/lib/analytics-events'
import { getCampaignAnalyticsContext } from '@/lib/analytics-v2'

type Props = { locale: string }

export function MerchantWorkspaceOnboarding({ locale }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const onboardingStarted = useRef(false)
  const submitInFlight = useRef(false)

  useEffect(() => {
    if (onboardingStarted.current) return
    onboardingStarted.current = true
    analytics.trackCustomEvent(AnalyticsEvent.MerchantOnboardingStarted, {
      entry_point: 'b2b',
      actor_type: 'merchant_prospect',
      journey_type: 'visutry_b2b_acquisition',
      source_journey: 'business_merchant_entry',
      landing_surface: 'merchant_onboarding',
    })
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitInFlight.current) return
    submitInFlight.current = true
    setBusy(true)
    setError(null)
    try {
      const acquisition = getAcquisitionContext()
      const campaign = getCampaignAnalyticsContext()
      const source = [acquisition.acquisition_source, acquisition.acquisition_medium]
        .filter(Boolean)
        .join('/') || undefined
      const response = await fetch('/api/merchant/workspaces', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          websiteUrl: websiteUrl || undefined,
          source,
          campaign: campaign.campaign_name,
        }),
      })
      const body = await response.json() as { data?: { created?: boolean; merchant?: { id?: string } }; error?: string }
      if (!response.ok || !body.data?.merchant?.id) {
        throw new Error(body.error || 'Unable to create your Merchant Workspace.')
      }
      const created = body.data.created !== false
      const onboardingState = created ? 'created' : 'existing'
      if (created) {
        analytics.trackCustomEvent(AnalyticsEvent.MerchantWorkspaceCreated, {
          merchant_id: body.data.merchant.id,
          created: true,
          entry_point: 'b2b',
          actor_type: 'merchant_prospect',
          journey_type: 'visutry_b2b_acquisition',
          source_journey: 'business_merchant_entry',
          landing_surface: 'merchant_onboarding',
        })
      }
      router.push(`/${locale}/merchant?merchantId=${encodeURIComponent(body.data.merchant.id)}&onboarding=${onboardingState}`)
      router.refresh()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create your Merchant Workspace.')
      setBusy(false)
    } finally {
      submitInFlight.current = false
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] px-4 py-10 text-slate-950 sm:px-6 sm:py-16 lg:px-8">
      <section className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_25px_80px_-55px_rgba(15,23,42,0.55)] sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <Store className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white"><Check className="h-3 w-3" aria-hidden="true" /></span>
          Merchant setup · 1 of 1
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Create your merchant workspace</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">Create a workspace in one click. You do not need a brand name or website to get started — both can be added later.</p>

        <form className="mt-8 space-y-5" onSubmit={submit}>
          <details className="group rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-700 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2"><Store className="h-4 w-4 text-slate-400" aria-hidden="true" />Add workspace details <span className="font-normal text-slate-400">(optional)</span></span>
              <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700" htmlFor="merchant-name">Brand or store name</label>
                <input id="merchant-name" name="name" minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" placeholder="e.g. North Star Eyewear" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700" htmlFor="merchant-website">Website</label>
                <input id="merchant-website" name="websiteUrl" type="url" maxLength={2000} value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" placeholder="https://your-store.example" />
              </div>
            </div>
          </details>
          {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
          <button type="submit" aria-label="Create workspace" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? 'Creating workspace…' : 'Create workspace'}
            {!busy ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
          </button>
        </form>
      </section>
    </main>
  )
}
