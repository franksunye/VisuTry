"use client";
/* Merchant Catalog images can use merchant-controlled hosts; render them without image optimization. */
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Copy, ExternalLink, Eye, Loader2, Save, Search, Store } from "lucide-react";
import { MerchantStorePrivatePreview } from "@/components/merchant/MerchantStorePrivatePreview";
import type { MerchantStorePreview, MerchantStoreWorkspace as MerchantStoreWorkspaceData } from "@/modules/merchant/application/merchant-store-workspace";
import { merchantStoreEligibilityMessage, resolveMerchantStoreWorkspacePresentation } from "@/modules/merchant/application/merchant-store-workspace-presentation";

const buttonClass = "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";
const EMPTY_CATALOG: MerchantStoreWorkspaceData["catalog"] = [];

function sameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

function safeImageUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value, "https://visutry.invalid");
    return url.protocol === "http:" || url.protocol === "https:" ? value : null;
  } catch {
    return value.startsWith("/") ? value : null;
  }
}

function priceLabel(price: number | null, currency: string | null) {
  if (price == null) return null;
  return `${currency?.toUpperCase() ?? "USD"} ${(price / 100).toFixed(2)}`;
}

async function readResponse<T>(response: Response): Promise<T> {
  const body = await response.json() as { success?: boolean; data?: T; message?: string };
  if (!response.ok || body.success === false || body.data === undefined) throw new Error(body.message ?? "Something went wrong. Please try again.");
  return body.data;
}

function localizePath(path: string, locale: string) {
  return path.replace(/^\/[^/]+(?=\/)/, `/${locale}`);
}

export function MerchantStoreWorkspace({ merchantId, locale }: { merchantId: string; locale: string }) {
  const apiBase = `/api/merchant/${encodeURIComponent(merchantId)}/store`;
  const catalogHref = `/${locale}/merchant/catalog?merchantId=${encodeURIComponent(merchantId)}`;
  const [workspace, setWorkspace] = useState<MerchantStoreWorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFrameIds, setSelectedFrameIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<MerchantStorePreview | null>(null);
  const [publishApproved, setPublishApproved] = useState(false);

  const applyWorkspace = useCallback((next: MerchantStoreWorkspaceData) => {
    setWorkspace(next);
    setName(next.store?.name ?? "");
    setHeadline(next.store?.headline ?? "");
    setDescription(next.store?.description ?? "");
    setSelectedFrameIds(next.store?.selectedFrameIds ?? []);
  }, []);

  const loadWorkspace = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      applyWorkspace(await readResponse<MerchantStoreWorkspaceData>(await fetch(apiBase, { cache: "no-store" })));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load your Store.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [apiBase, applyWorkspace]);

  useEffect(() => { void loadWorkspace(true); }, [loadWorkspace]);

  const catalog = workspace?.catalog ?? EMPTY_CATALOG;
  const presentation = useMemo(() => workspace ? resolveMerchantStoreWorkspacePresentation(workspace) : null, [workspace]);
  const store = workspace?.store ?? null;
  const publicPath = store ? localizePath(store.publicPath, locale) : "";
  const detailsDirty = Boolean(store && (
    name.trim() !== store.name
      || (headline.trim() || null) !== store.headline
      || (description.trim() || null) !== store.description
  ));
  const productsDirty = Boolean(store && !sameIds(selectedFrameIds, store.selectedFrameIds));
  const hasUnsavedChanges = detailsDirty || productsDirty;
  const filteredCatalog = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    if (!needle) return catalog;
    return catalog.filter((frame) => [frame.name, frame.brand, frame.sku, frame.externalId, frame.productUrl]
      .filter(Boolean).join(" ").toLocaleLowerCase().includes(needle));
  }, [catalog, search]);
  const live = store?.status === "ACTIVE";
  const availableCount = catalog.filter((frame) => frame.storeReadiness.storeEligible).length;
  const statusSummary = !store
    ? "Create a private draft, choose products, and preview your shopper experience."
    : live
      ? `Live · ${presentation?.selectedCount ?? 0} product${presentation?.selectedCount === 1 ? "" : "s"} selected${presentation?.attention.length ? " · needs attention" : ""}`
      : `Draft · ${presentation?.selectedCount ?? 0} product${presentation?.selectedCount === 1 ? "" : "s"} selected${presentation?.attention.length ? " · needs attention" : " · ready to preview"}`;

  function clearPreview() {
    setPreview(null);
    setPublishApproved(false);
  }

  async function createStore() {
    if (busy) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      await readResponse(await fetch(apiBase, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({}) }));
      setNotice("Your Store draft is ready. Choose the products you want to display.");
      await loadWorkspace();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create your Store.");
    } finally { setBusy(false); }
  }

  async function saveDetails() {
    if (!store || busy || !detailsDirty) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      await readResponse(await fetch(apiBase, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ storeId: store.id, name, headline: headline.trim() || null, description: description.trim() || null }),
      }));
      setNotice(live ? "Saved. These changes are now visible in your live Store." : "Store details saved to your private draft.");
      clearPreview();
      await loadWorkspace();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save Store details.");
    } finally { setBusy(false); }
  }

  async function saveProducts() {
    if (!store || busy || !productsDirty) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      await readResponse(await fetch(apiBase, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ storeId: store.id, frameIds: selectedFrameIds }),
      }));
      setNotice(live ? "Saved. This product selection is now visible in your live Store." : "Store products saved to your private draft.");
      clearPreview();
      await loadWorkspace();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save Store products.");
    } finally { setBusy(false); }
  }

  async function previewStore() {
    if (!store || busy || !presentation?.canPreview) return;
    if (hasUnsavedChanges) {
      setNotice("Save your changes before previewing the saved Store.");
      return;
    }
    setBusy(true); setError(null); setNotice(null);
    try {
      const next = await readResponse<MerchantStorePreview>(await fetch(`${apiBase}/preview`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ storeId: store.id }),
      }));
      setPreview(next);
      setPublishApproved(false);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Unable to preview your Store.");
    } finally { setBusy(false); }
  }

  async function publishStore() {
    if (!store || live || busy || hasUnsavedChanges || !preview?.readiness.ready || !publishApproved || !presentation?.canPublish) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      await readResponse(await fetch(`${apiBase}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ storeId: store.id, approved: true }),
      }));
      clearPreview();
      setNotice("Your Store is live. Share the public link with shoppers.");
      await loadWorkspace();
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "Unable to publish your Store.");
    } finally { setBusy(false); }
  }

  async function copyStoreLink() {
    if (!publicPath) return;
    try {
      await navigator.clipboard.writeText(new URL(publicPath, window.location.origin).toString());
      setNotice("Store link copied.");
    } catch {
      setError("Unable to copy the Store link. You can copy it from the address above.");
    }
  }

  function toggleProduct(id: string) {
    setSelectedFrameIds((current) => current.includes(id) ? current.filter((currentId) => currentId !== id) : [...current, id]);
    clearPreview();
  }

  function primaryAction() {
    if (!presentation || busy) return;
    if (presentation.primaryAction === "VIEW_LIVE_STORE" && publicPath) {
      window.open(publicPath, "_blank", "noopener,noreferrer");
      return;
    }
    if (presentation.primaryAction === "PREVIEW_STORE") void previewStore();
    else if (presentation.primaryAction === "CREATE_STORE") void createStore();
    else if (presentation.primaryAction === "REVIEW_CATALOG") window.location.assign(catalogHref);
    else document.getElementById("store-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const primaryLabel = presentation?.primaryAction === "VIEW_LIVE_STORE"
    ? "View live Store"
    : presentation?.primaryAction === "PREVIEW_STORE"
      ? "Preview Store"
      : presentation?.primaryAction === "CREATE_STORE"
        ? "Create your Store"
        : presentation?.primaryAction === "REVIEW_CATALOG"
          ? "Review Catalog products"
          : "Choose products";
  const primaryIcon = presentation?.primaryAction === "VIEW_LIVE_STORE" ? <ExternalLink className="h-4 w-4" aria-hidden="true" />
    : presentation?.primaryAction === "PREVIEW_STORE" ? <Eye className="h-4 w-4" aria-hidden="true" />
      : presentation?.primaryAction === "CREATE_STORE" ? <Store className="h-4 w-4" aria-hidden="true" /> : null;

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600" role="status"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden="true" />Loading Store…</div>;
  if (!workspace || !presentation) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error ?? "Unable to load your Store."}</div>;

  return (
    <div data-testid="merchant-operating-store" data-public-path={publicPath || undefined} className="space-y-5">
      <header className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Store</h1>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${live ? "bg-emerald-50 text-emerald-800" : store ? "bg-blue-50 text-blue-800" : "bg-slate-100 text-slate-600"}`}>{live ? "LIVE" : store ? "DRAFT" : "NOT CREATED"}</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">{statusSummary}</p>
          {live && publicPath ? <a href={publicPath} target="_blank" rel="noreferrer" className="mt-2 inline-flex max-w-full items-center gap-1.5 break-all text-sm font-medium text-blue-700 underline underline-offset-2">{publicPath}<ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /></a> : null}
        </div>
        {presentation.primaryAction === "VIEW_LIVE_STORE" && publicPath ? (
          <a href={publicPath} target="_blank" rel="noreferrer" className={`${buttonClass} shrink-0 bg-slate-950 text-white hover:bg-slate-800`}>{primaryIcon}{primaryLabel}</a>
        ) : (
          <button type="button" onClick={primaryAction} disabled={busy || (presentation.primaryAction === "PREVIEW_STORE" && hasUnsavedChanges)} className={`${buttonClass} shrink-0 bg-slate-950 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50`}>{busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : primaryIcon}{primaryLabel}</button>
        )}
      </header>

      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
      {notice ? <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div> : null}
      {live ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"><strong>Live Store changes:</strong> changes to this live Store become visible to shoppers after saving.</div> : null}

      {presentation.attention.length > 0 ? (
        <section aria-labelledby="store-attention-heading" className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <h2 id="store-attention-heading" className="text-sm font-semibold text-amber-950">Attention</h2>
          <ul className="mt-2 space-y-3">
            {presentation.attention.map((item, index) => <li key={`${item.code}-${item.productId ?? index}`} className="flex gap-2 text-sm text-amber-950">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div><p className="font-semibold">{item.title}</p><p className="mt-0.5 text-amber-900">{item.message}</p>{item.productId ? <Link href={catalogHref} className="mt-1 inline-block font-semibold underline underline-offset-2">Open Catalog</Link> : null}</div>
            </li>)}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div className="min-w-0">
          {preview && !live ? <MerchantStorePrivatePreview preview={preview} compact /> : live ? (
            <section className="rounded-2xl border border-emerald-200 bg-white p-5 sm:p-6" aria-label="Live Store status">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">Shopper-facing Store</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">Your Store is live</h2>
              <p className="mt-1 text-sm text-slate-600">The public link above opens the current version shoppers can see.</p>
              <button type="button" onClick={() => void copyStoreLink()} className={`${buttonClass} mt-4 border border-slate-300 bg-white text-slate-800 hover:bg-slate-50`}><Copy className="h-4 w-4" aria-hidden="true" />Copy Store link</button>
            </section>
          ) : (
            <section className="flex min-h-52 flex-col items-start justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">Shopper-facing view</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">Private preview</h2>
              <p className="mt-1 max-w-xl text-sm text-slate-600">Preview shows the saved Draft Store and its selected products. It stays private and does not start a shopper session.</p>
              {hasUnsavedChanges ? <p role="status" className="mt-3 text-sm font-medium text-amber-800">Save your changes before previewing the saved Store.</p> : null}
            </section>
          )}
        </div>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="store-selected-heading">
          <div className="flex items-start justify-between gap-3">
            <div><h2 id="store-selected-heading" className="text-lg font-semibold text-slate-950">Products in Store</h2><p className="mt-1 text-sm text-slate-600">{presentation.selectedCount} selected · {presentation.eligibleSelectedCount} ready to display</p></div>
            <Link href={catalogHref} className="shrink-0 text-sm font-semibold text-blue-700 underline underline-offset-2">Catalog</Link>
          </div>
          {presentation.selectedProducts.length ? <ul className="mt-4 divide-y divide-slate-100">
            {presentation.selectedProducts.map(({ id, frame, eligible, issues }) => <li key={id} className="flex gap-3 py-3 first:pt-0">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">{frame && safeImageUrl(frame.imageUrl) ? <img src={safeImageUrl(frame.imageUrl) ?? undefined} alt="" loading="lazy" className="h-full w-full object-contain" /> : null}</div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{frame?.name ?? "Product missing from Catalog"}</p><p className={`mt-1 text-xs font-medium ${eligible ? "text-emerald-700" : "text-amber-800"}`}>{eligible ? "Ready for Store" : "Needs attention"}</p>{!eligible && issues.length ? <p className="mt-1 text-xs text-amber-900">{merchantStoreEligibilityMessage(issues)}</p> : null}{frame?.price != null ? <p className="mt-1 text-xs text-slate-600">{priceLabel(frame.price, frame.currency)}</p> : null}</div>
            </li>)}
          </ul> : <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">No products are selected yet.</p>}
          {store?.status === "DRAFT" && preview?.readiness.ready ? <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700"><Check className="h-3.5 w-3.5" aria-hidden="true" />Ready to publish after your explicit approval</p> : null}
        </section>
      </section>

      {preview && !live ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5" aria-labelledby="store-publish-heading">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div><h2 id="store-publish-heading" className="font-semibold text-slate-950">Publish approval</h2><p className="mt-1 text-sm text-slate-600">Preview and publishing are separate. Nothing becomes public until you approve and publish.</p></div>
            <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${preview.readiness.ready ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{preview.readiness.ready ? "Ready to publish" : "Not ready to publish"}</span>
          </div>
          {!preview.readiness.ready ? <p className="mt-3 text-sm text-amber-900">{preview.readiness.blockingIssues.map((item) => item.issues.join(", ")).join(" · ") || "Review selected products in Catalog."}</p> : <>
            <label className="mt-4 flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" aria-label="I approve publishing this Store publicly" checked={publishApproved} onChange={(event) => setPublishApproved(event.target.checked)} className="mt-0.5 h-4 w-4 accent-blue-600" /><span>I approve making this Store public for shoppers.</span></label>
            <button type="button" onClick={() => void publishStore()} disabled={busy || hasUnsavedChanges || !publishApproved || !presentation.canPublish} className={`${buttonClass} mt-4 bg-emerald-700 text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50`}>{busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ExternalLink className="h-4 w-4" aria-hidden="true" />}Publish Store</button>
          </>}
        </section>
      ) : null}

      {store ? <section id="store-products" className="scroll-mt-32 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="store-products-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><h2 id="store-products-heading" className="text-lg font-semibold text-slate-950">Manage products</h2><p className="mt-1 text-sm text-slate-600">Choose which Store-ready Catalog products shoppers can browse.</p></div>
          <div className="flex flex-wrap items-center gap-2"><Link href={catalogHref} className="text-sm font-semibold text-blue-700 underline underline-offset-2">Add or fix products in Catalog</Link>{productsDirty ? <button type="button" onClick={() => void saveProducts()} disabled={busy} className={`${buttonClass} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-50`}><Save className="h-4 w-4" aria-hidden="true" />Save products</button> : <span className="text-xs font-medium text-slate-500">Selection saved</span>}</div>
        </div>
        {live && productsDirty ? <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">Saving this selection updates the live Store immediately.</p> : null}
        <label className="relative mt-4 block max-w-md"><span className="sr-only">Search Catalog products</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search all Catalog products" className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
        <div className="mt-4 max-h-[32rem] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200" data-testid="store-catalog-selection">
          {filteredCatalog.map((frame) => {
            const selected = selectedFrameIds.includes(frame.id);
            const eligible = frame.storeReadiness.storeEligible;
            return <label key={frame.id} className={`flex items-center gap-3 p-3 sm:p-4 ${eligible || selected ? "cursor-pointer" : "cursor-not-allowed bg-slate-50"}`}>
              <input type="checkbox" checked={selected} disabled={!eligible && !selected} onChange={() => toggleProduct(frame.id)} aria-label={`${selected ? "Remove" : "Add"} ${frame.name} ${selected ? "from" : "to"} Store`} className="h-4 w-4 shrink-0 accent-blue-600" />
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">{safeImageUrl(frame.imageUrl) ? <img src={safeImageUrl(frame.imageUrl) ?? undefined} alt="" loading="lazy" className="h-full w-full object-contain" /> : null}</div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{frame.name}</p><p className={`mt-0.5 text-xs ${eligible ? "text-emerald-700" : "text-amber-800"}`}>{eligible ? "Ready for Store" : merchantStoreEligibilityMessage(frame.storeReadiness.issues)}</p></div>
              {priceLabel(frame.price, frame.currency) ? <span className="shrink-0 text-xs font-medium text-slate-700">{priceLabel(frame.price, frame.currency)}</span> : null}
            </label>
          })}
          {filteredCatalog.length === 0 ? <p className="p-4 text-sm text-slate-600">{catalog.length === 0 ? "Your Catalog is empty." : "No products match this search."}</p> : null}
        </div>
        {productsDirty ? <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-amber-800" role="status">Unsaved product selection</p><button type="button" onClick={() => void saveProducts()} disabled={busy} className={`${buttonClass} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-50`}><Save className="h-4 w-4" aria-hidden="true" />Save products</button></div> : null}
      </section> : null}

      {store ? <details className="group rounded-2xl border border-slate-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold text-slate-950 [&::-webkit-details-marker]:hidden"><span>Store details</span><span className="text-xs font-medium text-slate-500 group-open:hidden">Edit</span><span className="hidden text-xs font-medium text-slate-500 group-open:inline">Close</span></summary>
        <div className="border-t border-slate-100 p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Store name<input value={name} onChange={(event) => { setName(event.target.value); clearPreview(); }} maxLength={120} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
            <label className="text-sm font-medium text-slate-700">Headline <span className="font-normal text-slate-500">(optional)</span><input value={headline} onChange={(event) => { setHeadline(event.target.value); clearPreview(); }} maxLength={240} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
          </div>
          <label className="mt-4 block text-sm font-medium text-slate-700">Description <span className="font-normal text-slate-500">(optional)</span><textarea value={description} onChange={(event) => { setDescription(event.target.value); clearPreview(); }} maxLength={5000} rows={4} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
          {detailsDirty ? <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-amber-800" role="status">Unsaved Store details</p><button type="button" onClick={() => void saveDetails()} disabled={busy} className={`${buttonClass} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-50`}><Save className="h-4 w-4" aria-hidden="true" />Save details</button></div> : <p className="mt-4 text-xs text-slate-500">Details saved</p>}
          {live && detailsDirty ? <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">Saving these details updates the live Store immediately.</p> : null}
        </div>
      </details> : null}
    </div>
  );
}
