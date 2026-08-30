'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Loader2, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { analytics } from '@/lib/analytics'
import { AnalyticsEvent } from '@/lib/analytics-events'
import type { MerchantPlanDefinition } from '@/modules/merchant/domain/merchant-commercial-plans'
import type { MerchantBillingState } from '@/modules/merchant/domain/merchant-billing-state'
import type { MerchantPurchaseAction, MerchantPurchaseIntent } from '@/modules/merchant/domain/merchant-purchase-intent'

type Props = {
  locale: string
  merchantId: string
  merchantName: string
  intent: Exclude<MerchantPurchaseIntent, 'FREE'>
  plan: MerchantPlanDefinition
  action: MerchantPurchaseAction
  currentPlanName: string | null
  billingState: MerchantBillingState
}

function planHighlights(plan: MerchantPlanDefinition) {
  if (plan.code === 'FOUNDING_PILOT') return [
    '1,500 AI-assisted shoppers',
    '3,500 standard Try-On generations',
    '8–50 catalog frames',
    'Recommendation + Try-On + Compare',
  ]
  return [
    `${plan.aiCommerceSessions?.toLocaleString('en-US') ?? 'Custom'} AI Commerce Sessions`,
    `${plan.catalogItems?.toLocaleString('en-US') ?? 'Custom'} catalog items`,
    `${plan.activeCampaigns ?? 'Custom'} active Campaign${plan.activeCampaigns === 1 ? '' : 's'}`,
    'Generative Try-On included',
  ]
}

function actionCopy(action: MerchantPurchaseAction, plan: MerchantPlanDefinition) {
  if (action === 'CHANGE_PLAN') return `Continue with ${plan.name}`
  if (action === 'MANAGE_BILLING') return 'Manage billing'
  if (action === 'CURRENT') return 'Current plan'
  if (action === 'DUPLICATE_PILOT') return 'Pilot already active'
  if (action === 'CHECKOUT') return 'Start secure checkout'
  return 'Back to Merchant workspace'
}

function recoveryCopy(state: MerchantBillingState) {
  if (state.kind === 'PROVIDER_UNAVAILABLE') {
    return {
      title: 'We could not reach the billing provider.',
      body: 'No charge was made. Your current plan is unchanged.',
      detail: 'Try again in a moment. If the issue continues, contact support.',
    }
  }
  return {
    title: 'We could not verify your current billing subscription.',
    body: 'No charge was made. Your current plan is unchanged.',
    detail: 'This workspace has a billing reference that is not valid in the current payment environment.',
  }
}

export function MerchantPurchaseSummary({ locale, merchantId, merchantName, intent, plan, action, currentPlanName, billingState }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isCheckout = action === 'CHECKOUT'
  const isChangePlan = action === 'CHANGE_PLAN'
  const isManageBilling = action === 'MANAGE_BILLING'
  const isBlocked = action === 'CURRENT' || action === 'DUPLICATE_PILOT' || action === 'BILLING_DISABLED' || action === 'BILLING_RECOVERY'
  const recovery = action === 'BILLING_RECOVERY' ? recoveryCopy(billingState) : null

  async function continuePurchase() {
    setBusy(true)
    setError(null)
    analytics.trackCustomEvent(AnalyticsEvent.MerchantCheckoutStarted, {
      plan_code: intent,
      source: 'business_pricing',
      merchant_flow: action.toLowerCase(),
    })
    const path = isCheckout
      ? `/api/merchant/${encodeURIComponent(merchantId)}/billing/checkout`
      : isChangePlan
        ? `/api/merchant/${encodeURIComponent(merchantId)}/billing/change-plan`
        : `/api/merchant/${encodeURIComponent(merchantId)}/billing/portal`
    const body = isCheckout ? { planCode: intent, locale } : isChangePlan ? { planCode: intent } : undefined
    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: body ? { 'content-type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      const payload = await response.json().catch(() => ({})) as { success?: boolean; data?: { url?: string }; message?: string }
      if (!response.ok || !payload.success) throw new Error(payload.message || 'We could not continue with this plan.')
      if (payload.data?.url) {
        window.location.assign(payload.data.url)
        return
      }
      router.push(`/${locale}/merchant?merchantId=${encodeURIComponent(merchantId)}&billing=processing&plan=${intent}`)
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not continue with this plan.')
      setBusy(false)
    }
  }

  function retryBillingState() {
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] px-4 py-10 text-slate-950 sm:px-6 sm:py-16 lg:px-8" data-purchase-intent={intent} data-purchase-action={action}>
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_25px_80px_-55px_rgba(15,23,42,0.55)] sm:p-10">
        <a href={`/${locale}/business/pricing`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to pricing
        </a>
        <div className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Secure plan selection
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Order summary</p>
        <p className="mt-5 text-sm font-semibold text-slate-500">{merchantName}</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl">{plan.name}</h1>
            {action === 'CHECKOUT' ? <p className="mt-2 text-sm text-slate-600">Current plan: {currentPlanName ?? 'No active billing plan'}</p> : currentPlanName && action !== 'CURRENT' ? <p className="mt-2 text-sm text-slate-600">Current plan: {currentPlanName}</p> : null}
          </div>
          <p className="text-2xl font-semibold text-slate-950">{plan.priceLabel}</p>
        </div>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">What is included</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {planHighlights(plan).map((highlight) => <li key={highlight} className="flex items-start gap-2 text-sm leading-6 text-slate-700"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />{highlight}</li>)}
          </ul>
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-600">
          {plan.code === 'FOUNDING_PILOT' ? 'One-time payment for 30 days. No auto-renewal.' : 'Monthly plan. No automatic usage overage charges.'}
        </p>
        {action === 'DUPLICATE_PILOT' ? <p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900" role="status">Your Founding Pilot has already been used for this Merchant. A second $149 Pilot checkout is not available. Continue with Launch, Growth, or Scale.</p> : null}
        {action === 'CURRENT' ? <p className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900" role="status">This is your current plan. No new checkout is needed.</p> : null}
        {action === 'BILLING_DISABLED' ? <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900" role="status"><p className="font-semibold">{billingState.kind === 'BILLING_DISABLED' ? 'Test or internal workspace' : 'Billing is disabled'}</p><p>Live billing is disabled for this workspace.</p></div> : null}
        {recovery ? <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950" role="alert"><p className="font-semibold">{recovery.title}</p><p>{recovery.body}</p><p className="mt-1">{recovery.detail}</p></div> : null}
        {error ? <p className="mt-4 text-sm text-red-700" role="alert">{error}</p> : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          {isBlocked ? <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {action === 'BILLING_RECOVERY' && billingState.kind === 'PROVIDER_UNAVAILABLE' ? <button type="button" onClick={retryBillingState} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white hover:bg-slate-800">Try again <ArrowRight className="h-4 w-4" aria-hidden="true" /></button> : null}
            <a href={`/${locale}/merchant?merchantId=${encodeURIComponent(merchantId)}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white hover:bg-slate-800">Go to Merchant workspace <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
            {action === 'DUPLICATE_PILOT' || action === 'BILLING_RECOVERY' ? <a href={`/${locale}/business/pricing`} className="text-sm font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-950">View plan options</a> : null}
          </div> : <button type="button" disabled={busy} onClick={() => void continuePurchase()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}{actionCopy(action, plan)}{!busy ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}</button>}
          {isManageBilling ? <p className="text-sm text-slate-500">Your current billing state requires a secure billing portal.</p> : null}
        </div>
      </section>
    </main>
  )
}
