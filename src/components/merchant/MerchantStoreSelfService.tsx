"use client";
/* Merchant images are arbitrary customer-provided URLs; next/image cannot safely optimize unknown hosts. */
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Check, Copy, ExternalLink, Eye, Loader2, Save, Store } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { AnalyticsEvent } from "@/lib/analytics-events";
import { ExperiencePresentationShell, type ExperiencePresentationCopy, type PresentationMerchant } from "@/components/store/ExperiencePresentationShell";
import type { MerchantStorePreviewFrame } from "@/modules/merchant/application/merchant-store-workspace";

type Readiness = {
  storeEligible: boolean;
  issues: string[];
};

type CatalogFrame = {
  id: string;
  sku: string | null;
  externalId: string | null;
  productUrl: string | null;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  price: number | null;
  currency: string | null;
  shape: string;
  status: string;
  enrichmentStatus: string;
  validation: { recommendationReady: boolean; recommendationIssues: string[] };
  storeReadiness: Readiness;
};

type StoreWorkspace = {
  store: {
    id: string;
    slug: string;
    name: string;
    status: string;
    headline: string | null;
    description: string | null;
    publicPath: string;
    selectedFrameIds: string[];
  } | null;
  catalog: CatalogFrame[];
};

type Preview = {
  store: { id: string; name: string; status: string; headline: string | null; description: string | null; publicPath: string };
  frameCount: number;
  frames: MerchantStorePreviewFrame[];
  readiness: {
    ready: boolean;
    readyFrameCount: number;
    blockingIssues: Array<{ frameId: string; issues: string[] }>;
  };
  preview: { sideEffectFree: boolean; publicPath: string };
};

const EMPTY_CATALOG: CatalogFrame[] = [];

const buttonClass = "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";

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

function normalizedOptionalText(value: string) {
  return value.trim() || null;
}

function sameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

function MerchantStoreDraftPreview({ preview }: { preview: Preview }) {
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
      heroAssetUrl: null,
    },
  };

  return (
    <div data-testid="store-draft-preview" className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-[#f7f8fb]">
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
    </div>
  );
}

function friendlyIssue(code: string) {
  const labels: Record<string, string> = {
    MISSING_STABLE_IDENTITY: "A merchant SKU, product URL, or external ID is required",
    MISSING_NAME: "Add a product name before displaying it",
    MISSING_IMAGE_URL: "Add a usable product image before displaying it",
    INVALID_IMAGE_URL: "The product image URL is not usable",
    MISSING_PRODUCT_URL: "Add a product link for this imported item",
    INVALID_PRODUCT_URL: "The product link is not valid",
    FRAME_NOT_ACTIVE: "This catalog item is no longer active",
  };
  return labels[code] ?? code.replace(/_/g, " ").toLowerCase();
}

function priceLabel(price: number | null, currency: string | null) {
  if (price == null) return null;
  return `${currency?.toUpperCase() ?? "USD"} ${(price / 100).toFixed(2)}`;
}

function safeImageUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === "http:" || url.protocol === "https:" ? value : null;
  } catch {
    return value.startsWith("/") ? value : null;
  }
}

async function readResponse<T>(response: Response): Promise<T> {
  const body = await response.json() as { success?: boolean; data?: T; message?: string };
  if (!response.ok || body.success === false || body.data === undefined) throw new Error(body.message ?? "Something went wrong. Please try again.");
  return body.data;
}

export function MerchantStoreSelfService({ merchantId, initialCatalogCount, catalogAvailable = false }: { merchantId: string; initialCatalogCount: number; catalogAvailable?: boolean }) {
  const hasCatalog = initialCatalogCount > 0 || catalogAvailable;
  const apiBase = `/api/merchant/${encodeURIComponent(merchantId)}/store`;
  const [workspace, setWorkspace] = useState<StoreWorkspace | null>(null);
  const [loading, setLoading] = useState(hasCatalog);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFrameIds, setSelectedFrameIds] = useState<string[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [publishApproved, setPublishApproved] = useState(false);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await readResponse<StoreWorkspace>(await fetch(apiBase, { cache: "no-store" }));
      setWorkspace(next);
      setName(next.store?.name ?? "");
      setHeadline(next.store?.headline ?? "");
      setDescription(next.store?.description ?? "");
      setSelectedFrameIds(next.store?.selectedFrameIds ?? []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load Store setup.");
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    if (hasCatalog) void loadWorkspace();
  }, [hasCatalog, loadWorkspace]);

  const catalog = workspace?.catalog ?? EMPTY_CATALOG;
  const eligibleCount = catalog.filter((frame) => frame.storeReadiness.storeEligible).length;
  const recommendationReadyCount = catalog.filter((frame) => frame.validation.recommendationReady).length;
  const selectedCount = selectedFrameIds.length;
  const publicUrl = workspace?.store ? `${window.location.origin}${workspace.store.publicPath}` : "";
  const detailsDirty = workspace?.store
    ? name.trim() !== workspace.store.name
      || normalizedOptionalText(headline) !== workspace.store.headline
      || normalizedOptionalText(description) !== workspace.store.description
    : false;
  const productsDirty = workspace?.store ? !sameIds(selectedFrameIds, workspace.store.selectedFrameIds) : false;
  const hasUnsavedChanges = detailsDirty || productsDirty;

  function clearPreview() {
    setPreview(null);
    setPublishApproved(false);
  }

  function toggleFrame(frame: CatalogFrame) {
    setSelectedFrameIds((current) => current.includes(frame.id) ? current.filter((id) => id !== frame.id) : [...current, frame.id]);
    clearPreview();
  }

  async function createStore() {
    if (busy) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      const response = await fetch(apiBase, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: name.trim() || undefined, headline: headline.trim() || undefined, description: description.trim() || undefined }) });
      const data = await readResponse<{ created: boolean }>(response);
      if (data.created) analytics.trackCustomEvent(AnalyticsEvent.MerchantStoreCreated, { merchant_id: merchantId, source_journey: "merchant_workspace_store" });
      setNotice("Your Store draft is ready. Select the products you want to display.");
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create your Store.");
    } finally { setBusy(false); }
  }

  async function saveDetails() {
    if (!workspace?.store || busy) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      await readResponse(await fetch(apiBase, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ storeId: workspace.store.id, name, headline: headline || null, description: description || null }) }));
      setNotice("Store details saved.");
      await loadWorkspace();
      clearPreview();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save Store details.");
    } finally { setBusy(false); }
  }

  async function saveProducts() {
    if (!workspace?.store || busy) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      await readResponse(await fetch(apiBase, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ storeId: workspace.store.id, frameIds: selectedFrameIds }) }));
      setNotice("Store products saved.");
      await loadWorkspace();
      clearPreview();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save Store products.");
    } finally { setBusy(false); }
  }

  async function previewStore() {
    if (!workspace?.store || busy) return;
    if (hasUnsavedChanges) {
      setNotice("Save your changes before previewing.");
      return;
    }
    setBusy(true); setError(null); setNotice(null);
    try {
      const next = await readResponse<Preview>(await fetch(`${apiBase}/preview`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ storeId: workspace.store.id }) }));
      setPreview(next);
      setPublishApproved(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to preview your Store.");
    } finally { setBusy(false); }
  }

  async function publishStore() {
    if (!workspace?.store || hasUnsavedChanges || !preview?.readiness.ready || !publishApproved || busy) return;
    setBusy(true); setError(null); setNotice(null);
    const wasLive = workspace.store.status === "ACTIVE";
    try {
      await readResponse(await fetch(`${apiBase}/publish`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ storeId: workspace.store.id, approved: true }) }));
      if (!wasLive) analytics.trackCustomEvent(AnalyticsEvent.MerchantStorePublished, { merchant_id: merchantId, source_journey: "merchant_workspace_store" });
      setNotice("Your Store is live. Share the public link with shoppers.");
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to publish your Store.");
    } finally { setBusy(false); }
  }

  async function copyStoreLink() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setNotice("Store link copied.");
    } catch {
      setError("Unable to copy the Store link. You can copy it from the address above.");
    }
  }

  if (!hasCatalog) {
    return (
      <section id="store" className="scroll-mt-44 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Store</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Add your eyewear catalog first</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Once your catalog has products, you can select what shoppers see in your Store.</p>
        <a href="#catalog" className={`${buttonClass} mt-5 bg-slate-950 text-white hover:bg-slate-800`}><ArrowRight className="h-4 w-4" aria-hidden="true" /> Add eyewear catalog</a>
      </section>
    );
  }

  return (
    <section id="store" className="scroll-mt-44 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700"><Store className="h-4 w-4" aria-hidden="true" /> Store</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{workspace?.store?.status === "ACTIVE" ? "Store — Live" : workspace?.store ? "Set up your Store" : "Create your Store"}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Choose the products shoppers can browse, preview the result, and publish when it is ready.</p>
        </div>
        {workspace?.store?.status === "ACTIVE" ? <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700"><Check className="h-4 w-4" aria-hidden="true" /> Live</span> : null}
      </div>

      {error ? <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
      {notice ? <div role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div> : null}
      {loading ? <div className="mt-8 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading Store setup…</div> : null}

      {!loading && !workspace?.store ? (
        <div className="mt-7 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
          <h3 className="font-semibold text-slate-900">1. Create a Store draft</h3>
          <p className="mt-1 text-sm text-slate-600">Store name is optional. You can use the default name and add details later.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input aria-label="Store name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} placeholder="Store name (optional)" className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
            <input aria-label="Store headline" value={headline} onChange={(event) => setHeadline(event.target.value)} maxLength={240} placeholder="Headline (optional)" className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
          </div>
          <textarea aria-label="Store description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} placeholder="Description (optional)" rows={3} className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
          <button type="button" onClick={createStore} disabled={busy} className={`${buttonClass} mt-4 bg-slate-950 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50`}>{busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Store className="h-4 w-4" aria-hidden="true" />} Create Store</button>
        </div>
      ) : null}

      {!loading && workspace?.store ? (
        <>
          <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div className="rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900">1. Store details</h3>
              <div className="mt-4 space-y-3">
                <input aria-label="Store name" value={name} onChange={(event) => { setName(event.target.value); clearPreview(); }} maxLength={120} placeholder="Store name" className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
                <input aria-label="Store headline" value={headline} onChange={(event) => { setHeadline(event.target.value); clearPreview(); }} maxLength={240} placeholder="Headline (optional)" className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
                <textarea aria-label="Store description" value={description} onChange={(event) => { setDescription(event.target.value); clearPreview(); }} maxLength={5000} placeholder="Description (optional)" rows={5} className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
                <button type="button" onClick={saveDetails} disabled={busy} className={`${buttonClass} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-50`}><Save className="h-4 w-4" aria-hidden="true" /> Save details</button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between gap-3">
                <div><h3 className="font-semibold text-slate-900">2. Products</h3><p className="mt-1 text-sm text-slate-500">{selectedCount} selected · {eligibleCount} available · {recommendationReadyCount} recommendation-ready</p></div>
                <button type="button" onClick={saveProducts} disabled={busy} className={`${buttonClass} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-50`}><Save className="h-4 w-4" aria-hidden="true" /> Save products</button>
              </div>
              <div className="mt-4 grid max-h-[34rem] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                {catalog.map((frame) => {
                  const isSelected = selectedFrameIds.includes(frame.id);
                  const isEligible = frame.storeReadiness.storeEligible;
                  const recommendationPending = !frame.validation.recommendationReady;
                  return <label key={frame.id} className={`relative rounded-2xl border p-3 transition ${isSelected ? "border-blue-500 bg-blue-50/50" : "border-slate-200 bg-white"} ${!isEligible && !isSelected ? "opacity-60" : ""}`}>
                    <input type="checkbox" className="absolute right-3 top-3 h-4 w-4 accent-blue-600" checked={isSelected} disabled={!isEligible && !isSelected} onChange={() => toggleFrame(frame)} />
                    <div className="flex gap-3 pr-6">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">{safeImageUrl(frame.imageUrl) ? <img src={safeImageUrl(frame.imageUrl) ?? undefined} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[10px] text-slate-400">No image</div>}</div>
                      <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{frame.name || "Unnamed product"}</p>{frame.brand ? <p className="truncate text-xs text-slate-500">{frame.brand}</p> : null}{priceLabel(frame.price, frame.currency) ? <p className="mt-1 text-xs font-medium text-slate-700">{priceLabel(frame.price, frame.currency)}</p> : null}</div>
                    </div>
                    {isEligible && recommendationPending ? <p className="mt-3 text-xs font-medium text-amber-700">Available in Store · Recommendation enrichment pending</p> : null}
                    {!isEligible ? <p className="mt-3 flex gap-1.5 text-xs font-medium text-red-700"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />{frame.storeReadiness.issues.map(friendlyIssue).join(" · ")}</p> : null}
                  </label>;
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h3 className="font-semibold text-slate-900">3. Preview & publish</h3><p className="mt-1 text-sm text-slate-600">Preview is private. Publishing is the explicit step that makes this Store public.</p></div><button type="button" onClick={previewStore} disabled={busy || selectedCount === 0 || hasUnsavedChanges} className={`${buttonClass} bg-slate-950 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50`}><Eye className="h-4 w-4" aria-hidden="true" /> Preview Store</button></div>
            {hasUnsavedChanges ? <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm font-medium text-amber-800">Save your changes before previewing.</p> : null}
            {preview ? <MerchantStoreDraftPreview preview={preview} /> : null}
            {preview ? <div className="rounded-2xl border border-white bg-white p-4"><p className={`font-semibold ${preview.readiness.ready ? "text-emerald-700" : "text-amber-700"}`}>{preview.readiness.ready ? "Ready to publish" : "A few products need attention"}</p><p className="mt-1 text-sm text-slate-600">{preview.readiness.ready ? `${preview.frameCount} product${preview.frameCount === 1 ? "" : "s"} will appear in your Store.` : preview.readiness.blockingIssues.map((issue) => `${issue.frameId === "unknown" ? "Some products" : "A product"}: ${issue.issues.map(friendlyIssue).join(", ")}`).join(" · ")}</p>{preview.readiness.ready ? <><label className="mt-5 flex items-start gap-2 text-sm text-slate-700"><input aria-label="I confirm this Store is ready to publish publicly" type="checkbox" checked={publishApproved} onChange={(event) => setPublishApproved(event.target.checked)} className="mt-0.5 h-4 w-4 accent-blue-600" /> <span>I confirm this Store is ready to publish publicly.</span></label><button type="button" onClick={publishStore} disabled={busy || hasUnsavedChanges || !publishApproved} className={`${buttonClass} mt-4 bg-emerald-700 text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50`}>{busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ExternalLink className="h-4 w-4" aria-hidden="true" />} {workspace.store.status === "ACTIVE" ? "Keep Store live" : "Publish Store"}</button></> : null}</div> : null}
          </div>

          {workspace.store.status === "ACTIVE" ? <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-emerald-900">Your Store is live</p><p className="mt-1 break-all text-sm text-emerald-800">{publicUrl}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void copyStoreLink()} className={`${buttonClass} border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100`}><Copy className="h-4 w-4" aria-hidden="true" /> Copy Store link</button><a href={workspace.store.publicPath} target="_blank" rel="noreferrer" className={`${buttonClass} bg-emerald-700 text-white hover:bg-emerald-800`}><ExternalLink className="h-4 w-4" aria-hidden="true" /> View Store</a></div></div> : null}
        </>
      ) : null}
    </section>
  );
}
