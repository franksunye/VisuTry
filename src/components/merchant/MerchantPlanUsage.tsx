"use client";

import { ArrowRight, BarChart3, Check, Sparkles, Store } from "lucide-react";
import type { ReactNode } from "react";
import type { MerchantCommercialPresentation } from "@/modules/merchant/application/merchant-control-center";

type Props = { commercial: MerchantCommercialPresentation };

const buttonClass = "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";

function dateLabel(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function statusCopy(commercial: MerchantCommercialPresentation) {
  if (commercial.status === "FREE") return "Your Store is live on the Free plan.";
  if (commercial.status === "PILOT_ACTIVE") {
    const days = commercial.daysRemaining;
    if (days !== null && days <= 3) return `Your Founding Pilot ends in ${days} day${days === 1 ? "" : "s"}. Choose how to continue.`;
    if (days !== null && days <= 7) return `Your Founding Pilot ends in ${days} days.`;
    return days === null ? "Your Founding Pilot is active." : `${days} day${days === 1 ? "" : "s"} remaining in your Founding Pilot.`;
  }
  if (commercial.status === "PILOT_EXPIRED") return "Your Founding Pilot has ended. Your Store and catalog remain available.";
  if (commercial.status === "USAGE_WARNING") return commercial.threshold === "WARNING" ? "You’re close to your monthly AI Commerce Session limit." : "You’ve used most of this period’s AI Commerce Sessions.";
  if (commercial.status === "USAGE_EXHAUSTED") return "AI Try-On is paused. Your Store remains live.";
  if (commercial.status === "PAYMENT_ACTION_REQUIRED" || commercial.status === "PAST_DUE") return "Action is needed to restore paid features.";
  if (commercial.status === "CANCEL_AT_PERIOD_END") return "Your current plan remains active through the end of this period.";
  if (commercial.status === "EXPIRED") return "This commercial period has ended. Your Store and catalog remain available.";
  return "Your commercial plan is active.";
}

function statusTone(status: string, threshold: string | null) {
  if (["USAGE_EXHAUSTED", "PAYMENT_ACTION_REQUIRED", "PAST_DUE"].includes(status)) return "border-red-200 bg-red-50 text-red-800";
  if (status === "USAGE_WARNING" && threshold === "NOTICE") return "border-blue-200 bg-blue-50 text-blue-800";
  if (["USAGE_WARNING", "PILOT_EXPIRED", "EXPIRED", "CANCEL_AT_PERIOD_END"].includes(status)) return "border-amber-200 bg-amber-50 text-amber-900";
  if (status === "FREE") return "border-blue-200 bg-blue-50 text-blue-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function allowance(value: number, limit: number | null) {
  if (limit === 0) return "Not included";
  return limit === null ? `${value} · Not metered` : `${value.toLocaleString()} / ${limit.toLocaleString()}`;
}

function actionLabel(action: MerchantCommercialPresentation["primaryAction"]) {
  switch (action) {
    case "UNLOCK_AI_TRY_ON": return "Unlock AI Try-On";
    case "UPGRADE_CAPACITY": return "Upgrade capacity";
    case "RESTORE_AI_CAPACITY": return "Restore AI capacity";
    case "CONTINUE_AFTER_PILOT": return "Continue after Pilot";
    case "RESOLVE_PAYMENT": return "Review payment status";
    case "MANAGE_PLAN": return "Manage plan";
    default: return "View plan options";
  }
}

export function MerchantPlanUsage({ commercial }: Props) {
  const periodText = commercial.status === "PILOT_ACTIVE" || commercial.planCode === "FOUNDING_PILOT"
    ? commercial.periodEnd ? `Ends ${dateLabel(commercial.periodEnd)}` : "30-day pilot"
    : commercial.periodStart && commercial.periodEnd
      ? `${dateLabel(commercial.periodStart)} – ${dateLabel(commercial.periodEnd)}`
      : commercial.planCode === "FREE" ? "No billing period" : "Current period";
  const aiLabel = commercial.aiCommerceSessionLimit === null ? "AI Commerce Sessions" : "AI Commerce Sessions";
  const aiDetail = commercial.aiCommerceSessionLimit === null
    ? commercial.planCode === "FREE" ? "Not included on Free" : "Included by custom plan"
    : `${allowance(commercial.usage.aiCommerceSessions, commercial.aiCommerceSessionLimit)}${commercial.aiCommerceSessionPercentage === null ? "" : ` · ${commercial.aiCommerceSessionPercentage}%`}`;
  const primaryHref = commercial.primaryAction === "UNLOCK_AI_TRY_ON" || commercial.primaryAction === "CONTINUE_AFTER_PILOT"
    ? "/en/business"
    : "/en/business#plans";

  return (
    <section id="commercial" className="scroll-mt-44 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="plan-usage-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Plan &amp; Usage</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 id="plan-usage-heading" className="text-2xl font-semibold tracking-tight text-slate-950">{commercial.planName}</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{commercial.priceLabel}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{periodText}</p>
        </div>
        <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${statusTone(commercial.status, commercial.threshold)}`}>{statusCopy(commercial)}</span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Metric icon={<BarChart3 className="h-4 w-4" aria-hidden="true" />} label={aiLabel} detail={aiDetail} />
        <Metric icon={<Store className="h-4 w-4" aria-hidden="true" />} label="Active Campaigns" detail={allowance(commercial.usage.activeCampaigns, commercial.limits.activeCampaigns)} />
        <Metric icon={<Store className="h-4 w-4" aria-hidden="true" />} label="Catalog Items" detail={allowance(commercial.usage.catalogItems, commercial.limits.catalogItems)} />
        {commercial.planCode === "FOUNDING_PILOT" ? <Metric icon={<Sparkles className="h-4 w-4" aria-hidden="true" />} label="Standard Try-On" detail={allowance(commercial.usage.standardTryOnGenerations, commercial.limits.standardTryOnGenerations)} /> : null}
      </div>

      {commercial.aiCommerceSessionPercentage !== null ? (
        <div className="mt-5" aria-label={`${commercial.aiCommerceSessionPercentage}% of AI Commerce Sessions used`}>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${commercial.threshold === "LIMIT_REACHED" ? "bg-red-500" : commercial.threshold === "WARNING" ? "bg-amber-400" : commercial.threshold === "NOTICE" ? "bg-blue-500" : "bg-emerald-500"}`} style={{ width: `${commercial.aiCommerceSessionPercentage}%` }} /></div>
        </div>
      ) : null}

      {commercial.planCode === "FOUNDING_PILOT" ? (
        <div className="mt-5 grid gap-3 rounded-xl border border-violet-100 bg-violet-50/60 p-4 text-sm text-violet-950 sm:grid-cols-2">
          <div><p className="font-semibold">Included catalog range</p><p className="mt-1 text-violet-800">{commercial.pilotCatalogRange ? `${commercial.pilotCatalogRange.min}–${commercial.pilotCatalogRange.max} frames` : "8–50 frames"}</p></div>
          <div><p className="font-semibold">Pilot support</p><p className="mt-1 text-violet-800">{commercial.setupLabel ?? "Assisted setup + weekly review"}</p></div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
        <Feature icon={<Sparkles className="h-4 w-4" aria-hidden="true" />} label="Virtual Try-On" available={commercial.features.GENERATIVE_TRY_ON} detail={commercial.status === "USAGE_EXHAUSTED" ? "Paused until capacity is restored" : commercial.features.GENERATIVE_TRY_ON ? "Available" : "Not included"} />
        <Feature icon={<BarChart3 className="h-4 w-4" aria-hidden="true" />} label="Recommendation" available={commercial.features.RECOMMENDATION} detail={commercial.features.RECOMMENDATION ? "Available" : "Not available"} />
        <Feature icon={<Check className="h-4 w-4" aria-hidden="true" />} label="Compare" available={commercial.features.COMPARE} detail={commercial.features.COMPARE ? "Available" : "Paid plan feature"} />
        <Feature icon={<BarChart3 className="h-4 w-4" aria-hidden="true" />} label="Analytics" available={commercial.features.ADVANCED_ANALYTICS || commercial.features.BASIC_ANALYTICS} detail={commercial.features.ADVANCED_ANALYTICS ? "Advanced" : commercial.features.BASIC_ANALYTICS ? "Basic" : "Not included"} />
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
        <a className={`${buttonClass} bg-slate-950 text-white hover:bg-slate-800`} href={primaryHref}>{actionLabel(commercial.primaryAction)} <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
        <a className="text-sm font-semibold text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-950" href="/en/business#plans">Compare plans</a>
      </div>
    </section>
  );
}

function Metric({ icon, label, detail }: { icon: ReactNode; label: string; detail: string }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"><div className="flex items-center gap-2 text-slate-500">{icon}<span className="text-xs font-semibold uppercase tracking-[0.12em]">{label}</span></div><p className="mt-2 text-lg font-semibold tracking-tight text-slate-950">{detail}</p></div>;
}

function Feature({ icon, label, available, detail }: { icon: ReactNode; label: string; available: boolean; detail: string }) {
  return <div className="flex items-start gap-3"><span className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg ${available ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>{icon}</span><div><p className="text-sm font-semibold text-slate-900">{label}</p><p className="mt-0.5 text-xs text-slate-500">{detail}</p></div></div>;
}
