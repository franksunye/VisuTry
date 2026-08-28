"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import type { MerchantCommercialPresentation } from "@/modules/merchant/application/merchant-control-center";
import { analytics } from "@/lib/analytics";
import { AnalyticsEvent } from "@/lib/analytics-events";

type Props = { merchantId: string; locale: string; commercial: MerchantCommercialPresentation };
type PlanCode = "LAUNCH" | "GROWTH" | "SCALE" | "FOUNDING_PILOT";

const plans: Array<{ code: PlanCode; label: string }> = [
  { code: "LAUNCH", label: "Launch · $199/month" },
  { code: "GROWTH", label: "Growth · $499/month" },
  { code: "SCALE", label: "Scale · $999/month" },
  { code: "FOUNDING_PILOT", label: "Founding Pilot · $149 / 30 days" },
];

function nextPlan(commercial: MerchantCommercialPresentation): PlanCode {
  if (commercial.planCode === "LAUNCH") return "GROWTH";
  if (commercial.planCode === "GROWTH") return "SCALE";
  return "LAUNCH";
}

export function MerchantBillingActions({ merchantId, locale, commercial }: Props) {
  const [busy, setBusy] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const action = commercial.primaryAction;
  const targetPlan = action === "UPGRADE_CAPACITY" || action === "RESTORE_AI_CAPACITY" ? nextPlan(commercial) : "LAUNCH";

  async function call(path: string, body?: Record<string, string>) {
    setBusy(true); setError(null);
    try {
      const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.message || "Billing is temporarily unavailable. Please try again later.");
      if (payload.data?.url) window.location.assign(payload.data.url);
      else window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Billing is temporarily unavailable. Please try again later.");
      setBusy(false);
    }
  }

  function checkout(planCode: PlanCode) {
    analytics.trackCustomEvent(AnalyticsEvent.MerchantCheckoutStarted, { merchant_id: merchantId, plan_code: planCode });
    void call(`/api/merchant/${encodeURIComponent(merchantId)}/billing/checkout`, { planCode, locale });
  }

  if (action === "NONE") return null;
  if (action === "MANAGE_PLAN" || action === "RESOLVE_PAYMENT") {
    return <div className="flex flex-col gap-2"><button type="button" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60" onClick={() => void call(`/api/merchant/${encodeURIComponent(merchantId)}/billing/portal`)}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{action === "RESOLVE_PAYMENT" ? "Review payment status" : "Manage plan"} {!busy ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}</button>{error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}</div>;
  }

  return <div className="flex flex-col gap-3"><div className="flex flex-wrap gap-2"><button type="button" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60" onClick={() => checkout(targetPlan)}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{action === "CONTINUE_AFTER_PILOT" ? "Continue after Pilot" : action === "RESTORE_AI_CAPACITY" ? "Restore AI capacity" : action === "UPGRADE_CAPACITY" ? "Upgrade capacity" : action === "UNLOCK_AI_TRY_ON" ? "Unlock AI Try-On" : "Choose a plan"}{!busy ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}</button>{action === "UNLOCK_AI_TRY_ON" ? <button type="button" disabled={busy} className="inline-flex items-center justify-center rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2.5 text-sm font-semibold text-violet-900 hover:border-violet-400 disabled:opacity-60" onClick={() => checkout("FOUNDING_PILOT")}>Start Founding Pilot</button> : null}<button type="button" className="text-sm font-semibold text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-950" onClick={() => setShowPlans((value) => !value)}>{showPlans ? "Hide plan options" : "View plan options"}</button></div>{showPlans ? <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">{plans.map((plan) => <button key={plan.code} type="button" disabled={busy} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:border-slate-400 disabled:opacity-60" onClick={() => checkout(plan.code)}>{plan.label}</button>)}</div> : null}{error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}</div>;
}
