"use client";

import { AlertTriangle, ArrowRight, BarChart3, Boxes, Check, CheckCircle2, Info, Megaphone, Sparkles } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import type { MerchantCommercialPresentation } from "@/modules/merchant/application/merchant-control-center";
import { merchantCommercialActionLabel, merchantCommercialStatusCopy } from "@/modules/merchant/domain/merchant-commercial-copy";
import { MerchantBillingActions } from "@/components/merchant/MerchantBillingActions";
import { analytics } from "@/lib/analytics";
import { AnalyticsEvent } from "@/lib/analytics-events";

type Props = { commercial: MerchantCommercialPresentation; merchantId?: string; locale?: string; storeStatus?: string | null };

const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";

function dateLabel(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

function statusTone(status: string, threshold: string | null) {
  if (["USAGE_EXHAUSTED", "PAYMENT_ACTION_REQUIRED", "PAST_DUE"].includes(status)) return "border-red-200 bg-red-50 text-red-800";
  if (status === "LEGACY_UNMIGRATED") return "border-slate-200 bg-slate-50 text-slate-700";
  if (status === "USAGE_WARNING" && threshold === "NOTICE") return "border-blue-200 bg-blue-50 text-blue-800";
  if (["USAGE_WARNING", "PILOT_EXPIRED", "EXPIRED", "CANCEL_AT_PERIOD_END"].includes(status)) return "border-amber-200 bg-amber-50 text-amber-900";
  if (status === "FREE") return "border-blue-200 bg-blue-50 text-blue-800";
  if (status === "DEMO_ACTIVE") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function StatusIcon({ status }: { status: string }) {
  if (["USAGE_EXHAUSTED", "PAYMENT_ACTION_REQUIRED", "PAST_DUE", "USAGE_WARNING", "PILOT_EXPIRED", "EXPIRED", "CANCEL_AT_PERIOD_END"].includes(status)) {
    return <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />;
  }
  if (["DEMO_ACTIVE", "PILOT_ACTIVE"].includes(status)) return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />;
  return <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />;
}

function allowance(value: number, limit: number | null) {
  if (limit === 0) return { value: "Not included", detail: null };
  if (limit === null) return { value: value.toLocaleString(), detail: "Not metered" };
  return { value: `${value.toLocaleString()} / ${limit.toLocaleString()}`, detail: "Plan limit" };
}

export function MerchantPlanUsage({ commercial, merchantId, locale = "en", storeStatus = null }: Props) {
  const isDemo = commercial.commercialState === "DEMO";
  useEffect(() => {
    if (commercial.commercialState === "DEMO") return;
    analytics.trackCustomEvent(AnalyticsEvent.MerchantCommercialOfferViewed, {
      merchant_id: merchantId,
      plan_code: commercial.planCode ?? "LEGACY_UNMIGRATED",
      commercial_status: commercial.status,
      locale,
    });
  }, [commercial.commercialState, commercial.planCode, commercial.status, locale, merchantId]);

  const periodText = isDemo
    ? "Demo access · no subscription or billing period"
    : commercial.status === "LEGACY_UNMIGRATED"
      ? "Not enrolled in a current plan"
      : commercial.status === "PILOT_ACTIVE" || commercial.planCode === "FOUNDING_PILOT"
        ? commercial.periodEnd ? `Ends ${dateLabel(commercial.periodEnd)}` : "30-day pilot"
        : commercial.periodStart && commercial.periodEnd
          ? `${dateLabel(commercial.periodStart)} – ${dateLabel(commercial.periodEnd)}`
          : commercial.planCode === "FREE" ? "No billing period" : "Current period";

  const aiUsage = commercial.aiCommerceSessionLimit === 0
    ? { value: "Not included", detail: null }
    : commercial.aiCommerceSessionLimit === null
    ? commercial.status === "LEGACY_UNMIGRATED"
      ? { value: "Existing activity", detail: "Not on a current plan" }
      : isDemo
        ? { value: "Demo access", detail: "Bounded usage safety applies" }
        : commercial.planCode === "FREE"
          ? { value: "Not included on Free", detail: null }
          : { value: commercial.usage.aiCommerceSessions.toLocaleString(), detail: "Included by custom plan" }
    : {
        value: `${commercial.usage.aiCommerceSessions.toLocaleString()} / ${commercial.aiCommerceSessionLimit.toLocaleString()}`,
        detail: commercial.aiCommerceSessionPercentage === null
          ? "Plan limit"
          : `${commercial.aiCommerceSessionPercentage}% used${commercial.aiCommerceSessionRemaining === null ? "" : ` · ${commercial.aiCommerceSessionRemaining.toLocaleString()} remaining`}`,
      };

  const showPilot = commercial.planCode === "FOUNDING_PILOT";

  return (
    <section id="commercial" className="scroll-mt-32 space-y-6" aria-labelledby="plan-usage-heading">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Plan &amp; Usage</p>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <h1 id="plan-usage-heading" className="text-3xl font-semibold tracking-tight text-slate-950">{commercial.planName}</h1>
            <span className="inline-flex min-h-7 items-center rounded-full bg-slate-100 px-2.5 text-xs font-semibold text-slate-700">{commercial.priceLabel}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{periodText}</p>
        </div>
        <div role="status" className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-5 lg:mt-1 lg:max-w-[25rem] ${statusTone(commercial.status, commercial.threshold)}`}>
          <StatusIcon status={commercial.status} />
          <p>{merchantCommercialStatusCopy(commercial, storeStatus)}</p>
        </div>
      </header>

      <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${showPilot ? "xl:grid-cols-4" : "lg:grid-cols-3"}`} aria-label="Plan usage summary">
        <Metric icon={<BarChart3 className="h-4 w-4" aria-hidden="true" />} label="AI Commerce Sessions" value={aiUsage.value} detail={aiUsage.detail} percentage={commercial.aiCommerceSessionPercentage} threshold={commercial.threshold} />
        <Metric icon={<Megaphone className="h-4 w-4" aria-hidden="true" />} label="Active Campaigns" {...allowance(commercial.usage.activeCampaigns, commercial.limits.activeCampaigns)} />
        <Metric icon={<Boxes className="h-4 w-4" aria-hidden="true" />} label="Catalog Items" {...allowance(commercial.usage.catalogItems, commercial.limits.catalogItems)} />
        {showPilot ? <Metric icon={<Sparkles className="h-4 w-4" aria-hidden="true" />} label="Standard Try-On" {...allowance(commercial.usage.standardTryOnGenerations, commercial.limits.standardTryOnGenerations)} /> : null}
      </div>

      {showPilot ? (
        <section className="rounded-2xl border border-violet-200/80 bg-violet-50/50 p-4 sm:p-5" aria-labelledby="pilot-details-heading">
          <div className="mb-4 flex items-center gap-2 text-violet-950">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <h3 id="pilot-details-heading" className="text-sm font-semibold">Founding Pilot details</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Included catalog range</p><p className="mt-1 text-sm font-medium text-violet-950">{commercial.pilotCatalogRange ? `${commercial.pilotCatalogRange.min}–${commercial.pilotCatalogRange.max} frames` : "8–50 frames"}</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Pilot support</p><p className="mt-1 text-sm font-medium text-violet-950">{commercial.setupLabel ?? "Assisted setup + weekly review"}</p></div>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="plan-capabilities-heading">
        <header className="px-5 pt-5 sm:px-6 sm:pt-6">
          <h3 id="plan-capabilities-heading" className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Available capabilities</h3>
        </header>
        <div className="grid gap-0 divide-y divide-slate-100 px-5 pb-2 pt-2 md:grid-cols-2 md:divide-y-0 md:px-6 lg:grid-cols-4 lg:divide-x">
          <Feature icon={<Sparkles className="h-4 w-4" aria-hidden="true" />} label="Virtual Try-On" available={commercial.features.GENERATIVE_TRY_ON} detail={commercial.status === "USAGE_EXHAUSTED" ? "Paused until capacity is restored" : commercial.features.GENERATIVE_TRY_ON ? "Available" : "Not included"} />
          <Feature icon={<BarChart3 className="h-4 w-4" aria-hidden="true" />} label="Recommendation" available={commercial.features.RECOMMENDATION} detail={commercial.features.RECOMMENDATION ? "Available" : "Not available"} />
          <Feature icon={<Check className="h-4 w-4" aria-hidden="true" />} label="Compare" available={commercial.features.COMPARE} detail={commercial.features.COMPARE ? "Available" : "Paid plan feature"} />
          <Feature icon={<BarChart3 className="h-4 w-4" aria-hidden="true" />} label="Analytics" available={commercial.features.ADVANCED_ANALYTICS || commercial.features.BASIC_ANALYTICS} detail={commercial.features.ADVANCED_ANALYTICS ? "Advanced" : commercial.features.BASIC_ANALYTICS ? "Basic" : "Not included"} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Plan actions">
        {isDemo ? (
          <p className="text-sm text-slate-600">This is a dedicated product-demo workspace, not a customer subscription.</p>
        ) : (
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-start sm:gap-4">
            {merchantId ? <MerchantBillingActions merchantId={merchantId} locale={locale} commercial={commercial} /> : <a className={`${buttonClass} w-full bg-slate-950 text-white hover:bg-slate-800 sm:w-auto`} href="/en/business#plans">{merchantCommercialActionLabel(commercial.primaryAction)} <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>}
            <a className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:w-auto" href="/en/business#plans">Compare plans</a>
          </div>
        )}
      </section>
    </section>
  );
}

function Metric({ icon, label, value, detail, percentage, threshold }: { icon: ReactNode; label: string; value: string; detail: string | null; percentage?: number | null; threshold?: string | null }) {
  const barColor = threshold === "LIMIT_REACHED" ? "bg-red-500" : threshold === "WARNING" ? "bg-amber-400" : threshold === "NOTICE" ? "bg-blue-500" : "bg-emerald-500";
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">{icon}</span>
        <div className="min-w-0 pt-0.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-semibold leading-6 tracking-tight text-slate-950">{value}</p>
          {detail ? <p className="mt-1 text-sm leading-5 text-slate-500">{detail}</p> : null}
        </div>
      </div>
      {percentage !== undefined && percentage !== null ? (
        <div className="mt-4" role="progressbar" aria-label={`${percentage}% of ${label} used`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${barColor}`} style={{ width: `${percentage}%` }} /></div>
        </div>
      ) : null}
    </article>
  );
}

function Feature({ icon, label, available, detail }: { icon: ReactNode; label: string; available: boolean; detail: string }) {
  return (
    <div className="flex min-h-[72px] items-center gap-3 py-3 lg:px-4 lg:first:pl-0">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${available ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  );
}
