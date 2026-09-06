"use client";

import { ArrowRight, Check } from "lucide-react";
import type { MerchantControlCenter } from "@/modules/merchant/application/merchant-control-center";

type Props = {
  control: MerchantControlCenter;
};

type Step = {
  number: string;
  title: string;
  body: string;
  complete: boolean;
};

/**
 * A small first-run continuation surface. The state is derived from the
 * server-provided Catalog and Store facts; it is intentionally not a second
 * checklist data model.
 */
export function MerchantActivationChecklist({ control }: Props) {
  if (control.store?.status === "ACTIVE") return null;

  const hasAnyCatalog = control.catalog.total > 0;
  const hasReadyCatalog = control.catalog.valid > 0;
  const hasCatalog = hasReadyCatalog;
  const hasStore = Boolean(control.store);
  const hasPreviewableStore = hasStore && control.store?.frameCount
    ? control.store.frameCount > 0
    : false;

  const steps: Step[] = [
    {
      number: "1",
      title: "Add your first product",
      body: hasCatalog
        ? "Your catalog has a usable product."
        : hasAnyCatalog
          ? "Your product is in the Catalog and is still being prepared."
          : "Start with one eyewear product to see the activation path.",
      complete: hasCatalog,
    },
    {
      number: "2",
      title: "Preview your Store",
      body: hasPreviewableStore
        ? "Review the Store presentation before it is public."
        : "Choose the product you want shoppers to see.",
      complete: false,
    },
    {
      number: "3",
      title: "Publish when ready",
      body: "You stay in control of when the Store becomes public.",
      complete: false,
    },
  ];

  const target = !hasReadyCatalog ? "catalog" : "store";
  const actionLabel = !hasAnyCatalog
    ? "Add your first product"
    : hasReadyCatalog
      ? "Preview your Store"
      : "Open Catalog";

  return (
    <section
      id="activation-checklist"
      data-testid="merchant-activation-checklist"
      className="rounded-[2rem] border border-blue-200 bg-[linear-gradient(135deg,#eff6ff,#ffffff)] p-6 shadow-sm sm:p-8"
      aria-labelledby="merchant-activation-heading"
    >
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">First Store success</p>
          <h2 id="merchant-activation-heading" className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Get your Store ready
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Start with one real product, review the Store, then publish when it looks right.
          </p>
        </div>
        <a
          href={`#${target}`}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
      <ol className="mt-6 grid gap-3 md:grid-cols-3">
        {steps.map((step) => (
          <li key={step.number} className="rounded-2xl border border-slate-200 bg-white/85 p-4">
            <div className="flex items-start gap-3">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${step.complete ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                {step.complete ? <Check className="h-4 w-4" aria-hidden="true" /> : step.number}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{step.body}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
