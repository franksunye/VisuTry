"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import type { MerchantCommercialPresentation } from "@/modules/merchant/application/merchant-control-center";
import type { MerchantBillablePlanCode } from "@/modules/merchant/domain/merchant-billing";
import { analytics } from "@/lib/analytics";
import { AnalyticsEvent } from "@/lib/analytics-events";

type Props = {
  merchantId: string;
  commercial: MerchantCommercialPresentation;
  targetPlan?: MerchantBillablePlanCode;
};

const ACTIVE_STATUSES = new Set(["PAID_ACTIVE", "PILOT_ACTIVE", "USAGE_WARNING", "USAGE_EXHAUSTED", "CANCEL_AT_PERIOD_END"]);

export function MerchantBillingProcessingNotice({ merchantId, commercial, targetPlan }: Props) {
  const router = useRouter();
  const returnedTracked = useRef(false);
  const activatedTracked = useRef(false);
  const [timedOut, setTimedOut] = useState(false);
  const isActive = Boolean(targetPlan && commercial.planCode === targetPlan && ACTIVE_STATUSES.has(commercial.status));

  useEffect(() => {
    if (!returnedTracked.current) {
      returnedTracked.current = true;
      analytics.trackCustomEvent(AnalyticsEvent.MerchantCheckoutReturned, { merchant_id: merchantId, plan_code: targetPlan ?? "unknown" });
    }
  }, [merchantId, targetPlan]);

  useEffect(() => {
    if (isActive) {
      if (!activatedTracked.current) {
        activatedTracked.current = true;
        analytics.trackCustomEvent(AnalyticsEvent.MerchantBillingActivated, { merchant_id: merchantId, plan_code: targetPlan ?? commercial.planCode ?? "unknown" });
      }
      return;
    }
    if (timedOut) return;
    const interval = window.setInterval(() => router.refresh(), 2500);
    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      setTimedOut(true);
    }, 30_000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [commercial.planCode, commercial.status, isActive, merchantId, router, targetPlan, timedOut]);

  if (isActive) {
    return <section role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-950 sm:px-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Plan active</p><p className="mt-2 text-sm leading-6">Your payment is confirmed. {commercial.planName} features are now available.</p></section>;
  }

  return <section role="status" className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-blue-950 sm:px-6"><div className="flex items-start gap-3"><RefreshCw className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-blue-700" aria-hidden="true" /><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Plan update in progress</p><p className="mt-2 text-sm leading-6 text-blue-900">Your payment is being confirmed. Your plan and feature access will update after confirmation.</p>{timedOut ? <p className="mt-2 text-xs leading-5 text-blue-800">This is taking longer than usual. Refresh this page shortly or contact support if your plan does not update.</p> : null}</div></div></section>;
}
