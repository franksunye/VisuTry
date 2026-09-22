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

function safeImageUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value, "https://visutry.invalid");
    return url.protocol === "http:" || url.protocol === "https:" ? value : null;
  } catch {
    return value.startsWith("/") ? value : null;
  }
}

export function MerchantStorePrivatePreview({ preview, compact = false }: { preview: MerchantStorePreview; compact?: boolean }) {
  const featuredFramesRef = useRef<HTMLElement>(null);
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
    <section data-testid="store-draft-preview" className={`overflow-hidden rounded-2xl border border-slate-200 bg-[#f7f8fb] ${compact ? "" : "mt-5"}`} aria-label="Private draft preview">
      <div className="flex flex-col gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Private draft preview</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{preview.store.name}</p>
        </div>
        <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">DRAFT · not public</span>
      </div>
      <div className="px-4 sm:px-6">
        <ExperiencePresentationShell
          mode="PRODUCT_FIRST"
          merchant={merchant}
          accent="#1d4ed8"
          featuredFrames={preview.frames}
          copy={PREVIEW_COPY}
          publicPocStorage={false}
          sessionStarting={false}
          errorMessage={null}
          onStartRuntime={() => undefined}
          onShoppingCta={() => featuredFramesRef.current?.scrollIntoView({ behavior: "smooth" })}
          featuredFramesRef={featuredFramesRef}
          showRuntimeCta={false}
          featuredFrameLimit={null}
        />
      </div>
    </section>
  );
}
