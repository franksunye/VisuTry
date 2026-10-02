"use client";

import { useRef } from "react";
import { ExperiencePresentationShell, type ExperiencePresentationCopy, type PresentationMerchant } from "@/components/store/ExperiencePresentationShell";
import type { MerchantStorePreview } from "@/modules/merchant/application/merchant-store-workspace";

const PREVIEW_COPY: ExperiencePresentationCopy = {
  storeLabel: "Store preview",
  campaignLabel: "Store preview",
  storeSubhead: "A private preview of the Store your shoppers will see.",
  storeHero: "Explore this Store",
  heroBody: "Selected eyewear from this Store.",
  referenceCatalog: "Catalog",
  liveCatalog: "Store",
  featuredEyebrow: "Selected products",
  featuredTitle: "Explore the collection",
  featuredDescription: "Products selected for this Store.",
  storeCta: "Explore the collection",
  campaignCta: "Explore the collection",
  actionCta: "Start shopping",
  ctaSupport: "Private draft preview — no shopper session is started.",
  privacyTitle: "Private Store preview",
  privacyBody: "This preview is only visible to you until you publish.",
  privacyPoint1: "No shopper photo is requested.",
  privacyPoint2: "Publishing is still required.",
  privacyPoint3: "Selected products are shown below.",
  privacyPublicNoticeLabel: "Draft visibility",
  privacyPublicNotice: "Anonymous shoppers cannot access this draft.",
  privacyAccept: "Continue",
  privacyStarting: "Starting…",
  privacyHint: "Private draft preview",
  poweredBy: "Powered by VisuTry",
  uploadTitle: "Shopper photo",
  recommendTitle: "Recommendations",
  tryOnTitle: "Try on",
};

const LIVE_PREVIEW_COPY: ExperiencePresentationCopy = {
  ...PREVIEW_COPY,
  storeSubhead: "The saved Store content shoppers can currently browse.",
  ctaSupport: "Saved presentation only · shopper interactions are not started here.",
  privacyTitle: "Saved Store presentation",
  privacyBody: "This view uses the current saved Store content. Open the live Store to verify the full shopper experience.",
  privacyPoint1: "No shopper session is started in this view.",
  privacyPoint2: "Open the live Store for interactive shopping.",
  privacyPoint3: "The selected products below are saved for this Store.",
  privacyHint: "Saved Store presentation",
};

function safeImageUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value, "https://visutry.invalid");
    return url.protocol === "http:" || url.protocol === "https:" ? value : null;
  } catch {
    return value.startsWith("/") ? value : null;
  }
}

export function MerchantStorePrivatePreview({
  preview,
  compact = false,
  variant = "DRAFT",
  hasUnsavedChanges = false,
}: {
  preview: MerchantStorePreview;
  compact?: boolean;
  variant?: "DRAFT" | "LIVE";
  hasUnsavedChanges?: boolean;
}) {
  const featuredFramesRef = useRef<HTMLElement>(null);
  const live = variant === "LIVE";
  const merchant: PresentationMerchant = {
    name: preview.store.name,
    logoUrl: null,
    referenceData: false,
    activeFrameCount: preview.frames.length,
    experience: {
      type: "STORE",
      name: preview.store.name,
      headline: preview.store.headline,
      description: preview.store.description,
      heroAssetUrl: safeImageUrl(preview.frames[0]?.imageUrl ?? null),
    },
  };

  return (
    <section data-testid={live ? "store-saved-preview" : "store-draft-preview"} className={`overflow-hidden rounded-2xl border border-slate-200 bg-[#f7f8fb] ${compact ? "" : "mt-5"}`} aria-label={live ? "Saved shopper-facing Store presentation" : "Private draft preview"}>
      <div className="flex flex-col gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={`text-xs font-bold uppercase tracking-[0.16em] ${live ? "text-emerald-700" : "text-blue-700"}`}>{live ? "Shopper-facing Store" : "Private draft preview"}</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{preview.store.name}</p>
        </div>
        <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${live ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{live ? "LIVE · saved state" : "DRAFT · not public"}</span>
      </div>
      {live && hasUnsavedChanges ? <p role="status" className="border-b border-amber-100 bg-amber-50/70 px-4 py-2 text-xs text-amber-900">This preview shows the saved Store only. Unsaved changes are not shown.</p> : null}
      <div className="px-4 sm:px-6">
        <ExperiencePresentationShell
          mode="PRODUCT_FIRST"
          merchant={merchant}
          accent="#1d4ed8"
          featuredFrames={preview.frames}
          copy={live ? LIVE_PREVIEW_COPY : PREVIEW_COPY}
          publicPocStorage={false}
          sessionStarting={false}
          errorMessage={null}
          onStartRuntime={() => undefined}
          onShoppingCta={() => featuredFramesRef.current?.scrollIntoView({ behavior: "smooth" })}
          featuredFramesRef={featuredFramesRef}
          showRuntimeCta={false}
          featuredFrameLimit={live ? 4 : null}
          compact={compact}
        />
      </div>
    </section>
  );
}
