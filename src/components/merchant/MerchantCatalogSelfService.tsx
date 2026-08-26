"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Edit3, FileUp, Globe2, Loader2, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { AnalyticsEvent } from "@/lib/analytics-events";

type SourceType = "url" | "csv" | "manual";
type Candidate = {
  sku: string | null;
  name: string | null;
  brand: string | null;
  imageUrl: string | null;
  productUrl: string | null;
  price: number | null;
  currency: string | null;
  shape: string | null;
  material: string | null;
  color: string | null;
  widthClass: string | null;
  styleTags: string[];
  collectionTags: string[];
  source: "MANUAL" | "CSV" | "EXTERNAL";
  externalId: string | null;
  status: "READY" | "NEEDS_REVIEW" | "INVALID";
  dedupeStatus: "NEW" | "ALREADY_EXISTS" | "POSSIBLE_DUPLICATE";
  issues: string[];
  sourceLabel?: string;
};
type Proposal = {
  requiresApproval: boolean;
  sourceSummary: {
    sourceUrls: string[];
    sourceHostnames: string[];
    platforms?: string[];
    fetchedPageCount: number;
    foundCount: number;
    readyToImport: number;
    needsReview: number;
    invalid: number;
    sourceIssues: Array<{ sourceUrl: string; code: string; message: string }>;
  };
  candidates: Candidate[];
  importReady: Array<Record<string, unknown>>;
};
type CatalogItem = {
  id: string;
  sku: string | null;
  name: string;
  brand: string | null;
  variant?: string | null;
  imageUrl: string | null;
  productUrl?: string | null;
  price?: number | null;
  currency?: string | null;
  shape?: string;
  material?: string | null;
  color?: string | null;
  widthClass?: string | null;
  styleTags?: string[];
  collectionTags?: string[];
  source: string;
  status: string;
  validation: { valid: boolean; issues: string[]; warnings: string[] };
};
type ManualRow = { sku: string; name: string; shape: string; imageUrl: string; brand: string; price: string; productUrl: string };

const buttonClass = "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";
const emptyManualRow = (): ManualRow => ({ sku: "", name: "", shape: "", imageUrl: "", brand: "", price: "", productUrl: "" });
function maxLengthForField(key: keyof ManualRow) {
  if (key === "sku") return 120;
  if (key === "name") return 240;
  if (key === "shape") return 80;
  if (key === "brand") return 120;
  if (key.endsWith("Url")) return 2000;
  return undefined;
}

function priceLabel(price?: number | null, currency?: string | null) {
  if (price == null) return null;
  return `${currency?.toUpperCase() ?? "USD"} ${(price / 100).toFixed(2)}`;
}

function friendlyIssue(code: string) {
  const labels: Record<string, string> = {
    MISSING_SKU: "SKU is missing",
    MISSING_NAME: "Product name is missing",
    MISSING_IMAGE_URL: "A usable image URL is missing",
    INVALID_IMAGE_URL: "Image URL is not http(s)",
    MISSING_SHAPE: "Frame shape is missing",
    MISSING_PRODUCT_URL: "Product URL is missing",
    ALREADY_EXISTS: "Already in this catalog",
    POSSIBLE_DUPLICATE: "Possible duplicate in this review",
    CSV_COLUMN_MISMATCH: "CSV columns do not match the header",
    INVALID_PRICE: "Price is not a valid amount",
  };
  return labels[code] ?? code.replace(/_/g, " ").toLowerCase();
}

function statusClass(status: Candidate["status"]) {
  if (status === "READY") return "bg-emerald-50 text-emerald-700";
  if (status === "INVALID") return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-800";
}

function emptyInput(item: CatalogItem): ManualRow {
  return {
    sku: item.sku ?? "",
    name: item.name,
    shape: item.shape ?? "",
    imageUrl: item.imageUrl ?? "",
    brand: item.brand ?? "",
    price: item.price == null ? "" : (item.price / 100).toFixed(2),
    productUrl: item.productUrl ?? "",
  };
}

export function MerchantCatalogSelfService({ merchantId, initialTotal }: { merchantId: string; initialTotal: number }) {
  const [sourceType, setSourceType] = useState<SourceType>("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [manualRows, setManualRows] = useState<ManualRow[]>([emptyManualRow()]);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [catalogCursor, setCatalogCursor] = useState<string | null>(null);
  const catalogCursorRef = useRef<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<ManualRow | null>(null);
  const entered = useRef(false);

  const apiBase = `/api/merchant/${encodeURIComponent(merchantId)}/catalog`;
  const loadCatalog = useCallback(async (append = false) => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (append && catalogCursorRef.current) params.set("cursor", catalogCursorRef.current);
      const response = await fetch(`${apiBase}?${params.toString()}`, { cache: "no-store" });
      const body = await response.json() as { success?: boolean; data?: { items?: CatalogItem[]; nextCursor?: string | null }; message?: string };
      if (!response.ok || !body.success || !body.data) throw new Error(body.message || "Unable to load catalog.");
      setCatalogItems((current) => append ? [...current, ...(body.data?.items ?? [])] : (body.data?.items ?? []));
      const nextCursor = body.data.nextCursor ?? null;
      catalogCursorRef.current = nextCursor;
      setCatalogCursor(nextCursor);
    } catch (requestError) {
      setCatalogError(requestError instanceof Error ? requestError.message : "Unable to load catalog.");
    } finally {
      setCatalogLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    if (!entered.current) {
      entered.current = true;
      analytics.trackCustomEvent(AnalyticsEvent.MerchantCatalogWorkspaceEntered, { merchant_id: merchantId, source_journey: "merchant_workspace_catalog" });
    }
    void loadCatalog(false);
  }, [loadCatalog, merchantId]);

  const visibleItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return catalogItems;
    return catalogItems.filter((item) => [item.sku, item.name, item.brand, item.shape].filter(Boolean).join(" ").toLowerCase().includes(needle));
  }, [catalogItems, query]);

  function updateManualRow(index: number, key: keyof ManualRow, value: string) {
    setManualRows((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  }

  async function inspect() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setProposal(null);
    try {
      let response: Response;
      if (sourceType === "csv") {
        if (!file) throw new Error("Choose a CSV file first.");
        const form = new FormData();
        form.set("sourceType", "csv");
        form.set("file", file);
        response = await fetch(`${apiBase}/inspect`, { method: "POST", body: form });
      } else if (sourceType === "url") {
        if (!url.trim()) throw new Error("Paste your store or product URL first.");
        response = await fetch(`${apiBase}/inspect`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sourceType: "url", sourceUrls: [url.trim()] }) });
      } else {
        const products = manualRows.map((row) => ({
          sku: row.sku.trim(), name: row.name.trim(), shape: row.shape.trim(), imageUrl: row.imageUrl.trim() || null,
          brand: row.brand.trim() || null, productUrl: row.productUrl.trim() || null,
          price: row.price.trim() ? Math.round(Number(row.price) * 100) : null, currency: "USD", source: "MANUAL" as const,
        }));
        response = await fetch(`${apiBase}/inspect`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sourceType: "manual", manualProducts: products }) });
      }
      const body = await response.json() as { success?: boolean; data?: Proposal; message?: string };
      if (!response.ok || !body.success || !body.data) throw new Error(body.message || "Unable to inspect this source.");
      setProposal(body.data);
      analytics.trackCustomEvent(AnalyticsEvent.MerchantCatalogSourceInspected, {
        merchant_id: merchantId, source_type: sourceType, found_count: body.data.sourceSummary.foundCount,
        ready_count: body.data.sourceSummary.readyToImport, needs_review_count: body.data.sourceSummary.needsReview,
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to inspect this source.");
    } finally {
      setBusy(false);
    }
  }

  async function approveImport() {
    if (busy || !proposal || proposal.importReady.length === 0) return;
    setBusy(true);
    setError(null);
    analytics.trackCustomEvent(AnalyticsEvent.MerchantCatalogImportApproved, { merchant_id: merchantId, source_type: sourceType, approved_count: proposal.importReady.length });
    try {
      const response = await fetch(apiBase, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ approved: true, sourceType, frames: proposal.importReady }) });
      const body = await response.json() as { success?: boolean; data?: { imported?: number; created?: number; updated?: number }; message?: string };
      if (!response.ok || !body.success || !body.data) throw new Error(body.message || "Unable to import catalog.");
      analytics.trackCustomEvent(AnalyticsEvent.MerchantCatalogImportCompleted, {
        merchant_id: merchantId, source_type: sourceType, imported_count: body.data.imported ?? 0,
        created_count: body.data.created ?? 0, updated_count: body.data.updated ?? 0,
      });
      setProposal(null);
      setFile(null);
      await loadCatalog(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to import catalog.");
    } finally {
      setBusy(false);
    }
  }

  async function saveCorrection(item: CatalogItem) {
    if (!editingRow || busy || !editingRow.sku.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const frame = {
        sku: editingRow.sku.trim(), name: editingRow.name.trim(), shape: editingRow.shape.trim(), imageUrl: editingRow.imageUrl.trim() || null,
        brand: editingRow.brand.trim() || null, productUrl: editingRow.productUrl.trim() || null,
        price: editingRow.price.trim() ? Math.round(Number(editingRow.price) * 100) : null, currency: item.currency ?? "USD",
        variant: item.variant ?? null, material: item.material ?? null, color: item.color ?? null, widthClass: item.widthClass ?? null,
        styleTags: item.styleTags ?? [], collectionTags: item.collectionTags ?? [], source: "MANUAL" as const, externalId: item.id, sourceNotes: "Human catalog correction",
      };
      const response = await fetch(apiBase, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ approved: true, sourceType: "manual", frames: [frame] }) });
      const body = await response.json() as { success?: boolean; message?: string };
      if (!response.ok || !body.success) throw new Error(body.message || "Unable to save correction.");
      analytics.trackCustomEvent(AnalyticsEvent.MerchantCatalogCorrectionSaved, { merchant_id: merchantId, correction_type: "catalog_frame" });
      setEditingId(null);
      setEditingRow(null);
      await loadCatalog(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save correction.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="catalog" className="scroll-mt-44 rounded-[2rem] border border-blue-100 bg-white p-6 shadow-sm sm:scroll-mt-24 sm:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Human catalog</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Add your eyewear catalog</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">URL First means you usually only need your store URL. We inspect product facts progressively, show a reviewable preview, and write nothing until you approve.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right text-xs text-slate-600"><span className="font-semibold text-slate-900">Catalog</span> {catalogItems.length || initialTotal} loaded{catalogCursor ? "+" : ""}</div>
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-3" role="tablist" aria-label="Catalog source">
        {(["url", "csv", "manual"] as SourceType[]).map((type) => (
          <button key={type} type="button" role="tab" aria-selected={sourceType === type} onClick={() => { setSourceType(type); setProposal(null); setError(null); }} className={`${buttonClass} justify-start border ${sourceType === type ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            {type === "url" ? <Globe2 className="h-4 w-4" aria-hidden="true" /> : type === "csv" ? <FileUp className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            {type === "url" ? "Store URL" : type === "csv" ? "Upload CSV" : "Add manually"}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
        {sourceType === "url" ? <>
          <label htmlFor="merchant-catalog-url" className="text-sm font-semibold text-slate-800">Store or product URL</label>
          <input id="merchant-catalog-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://your-store.example" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
          <p className="mt-2 text-xs leading-5 text-slate-500">We try Shopify, structured ecommerce data, sitemap links, then standard product pages. JS-heavy stores may need CSV or manual review.</p>
        </> : null}
        {sourceType === "csv" ? <>
          <label htmlFor="merchant-catalog-csv" className="text-sm font-semibold text-slate-800">Product CSV</label>
          <input id="merchant-catalog-csv" type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-800" />
          <p className="mt-2 text-xs leading-5 text-slate-500">Required columns: <code>sku</code>, <code>name</code>. Recommended: <code>shape</code>, <code>imageUrl</code>, <code>productUrl</code>, <code>price</code>, <code>brand</code>.</p>
        </> : null}
        {sourceType === "manual" ? <div className="space-y-3">
          {manualRows.map((row, index) => <div key={index} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Product {index + 1}</span>{manualRows.length > 1 ? <button type="button" aria-label={`Remove product ${index + 1}`} onClick={() => setManualRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index))} className="text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" aria-hidden="true" /></button> : null}</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(["sku", "name", "shape", "imageUrl", "brand", "price", "productUrl"] as (keyof ManualRow)[]).map((key) => <input key={key} aria-label={`${key} for product ${index + 1}`} value={row[key]} onChange={(event) => updateManualRow(index, key, event.target.value)} placeholder={key === "imageUrl" ? "Image URL" : key === "productUrl" ? "Product URL" : key === "price" ? "Price (USD)" : key[0].toUpperCase() + key.slice(1)} type={key === "price" ? "number" : key.endsWith("Url") ? "url" : "text"} maxLength={maxLengthForField(key)} step={key === "price" ? "0.01" : undefined} className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />)}
            </div>
          </div>)}
          <button type="button" onClick={() => setManualRows((rows) => [...rows, emptyManualRow()])} className={`${buttonClass} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}><Plus className="h-4 w-4" aria-hidden="true" />Add another product</button>
        </div> : null}
        {error ? <p className="mt-3 text-sm text-red-700" role="alert">{error}</p> : null}
        <button type="button" onClick={() => void inspect()} disabled={busy} className={`${buttonClass} mt-4 w-full bg-slate-950 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50`}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
          {busy ? "Inspecting…" : "Inspect and preview"}
        </button>
      </div>

      {proposal ? <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Review before import</p><h3 className="mt-1 text-lg font-semibold text-emerald-950">{proposal.sourceSummary.readyToImport} ready · {proposal.sourceSummary.needsReview} need review · {proposal.sourceSummary.invalid} invalid</h3><p className="mt-1 text-sm text-emerald-900/80">{proposal.sourceSummary.foundCount} found across {proposal.sourceSummary.fetchedPageCount} inspected page{proposal.sourceSummary.fetchedPageCount === 1 ? "" : "s"}. Existing or questionable rows stay out of the approved subset.</p></div>
          {proposal.sourceSummary.platforms?.length ? <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800">Detected: {proposal.sourceSummary.platforms.join(", ")}</span> : null}
        </div>
        {proposal.sourceSummary.sourceIssues.length > 0 ? <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900"><p className="font-semibold">Some source data needs attention</p><ul className="mt-1 list-disc space-y-1 pl-5 text-xs">{proposal.sourceSummary.sourceIssues.slice(0, 5).map((item, index) => <li key={`${item.code}-${index}`}>{item.message}</li>)}</ul><p className="mt-2 text-xs font-semibold">You can still import the valid subset. If this is a JavaScript-heavy store, switch to one of the fallback paths:</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => { setSourceType("csv"); setProposal(null); setError(null); }} className={`${buttonClass} border border-amber-300 bg-white text-amber-900 hover:bg-amber-100`}><FileUp className="h-4 w-4" aria-hidden="true" />Upload CSV</button><button type="button" onClick={() => { setSourceType("manual"); setProposal(null); setError(null); }} className={`${buttonClass} border border-amber-300 bg-white text-amber-900 hover:bg-amber-100`}><Plus className="h-4 w-4" aria-hidden="true" />Add manually</button></div></div> : null}
        <div className="mt-4 grid gap-2">{proposal.candidates.map((candidate, index) => <article key={`${candidate.sku ?? "row"}-${index}`} className="rounded-xl border border-white bg-white p-3"><div className="flex items-start gap-3"><div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">{candidate.imageUrl ? <img src={candidate.imageUrl} alt="" className="h-full w-full object-cover" /> : null}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="truncate text-sm font-semibold text-slate-950">{candidate.name || "Unnamed product"}</h4><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${statusClass(candidate.status)}`}>{candidate.status.replace("_", " ")}</span>{candidate.dedupeStatus !== "NEW" ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{candidate.dedupeStatus.replace(/_/g, " ")}</span> : null}</div><p className="mt-1 text-xs text-slate-500">{candidate.sku || "No SKU"}{candidate.brand ? ` · ${candidate.brand}` : ""}{candidate.shape ? ` · ${candidate.shape}` : ""}{priceLabel(candidate.price, candidate.currency) ? ` · ${priceLabel(candidate.price, candidate.currency)}` : ""}</p>{candidate.issues.length > 0 ? <p className="mt-1 text-xs text-amber-800">{candidate.issues.map(friendlyIssue).join(" · ")}</p> : null}</div></div></article>)}</div>
        <div className="mt-4 flex flex-col justify-between gap-3 border-t border-emerald-200 pt-4 sm:flex-row sm:items-center"><p className="text-xs text-emerald-900/75">Nothing has been written yet. Approval imports only the {proposal.importReady.length} ready, non-duplicate row{proposal.importReady.length === 1 ? "" : "s"}.</p><button type="button" disabled={busy || proposal.importReady.length === 0} onClick={() => void approveImport()} className={`${buttonClass} bg-emerald-700 text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50`}><Check className="h-4 w-4" aria-hidden="true" />Approve and import {proposal.importReady.length}</button></div>
      </div> : null}

      <div className="mt-8 border-t border-slate-200 pt-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Catalog review</p><h3 className="mt-1 text-lg font-semibold text-slate-950">Review and correct products</h3></div><div className="flex gap-2"><input aria-label="Search catalog" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search SKU or name" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:w-56" /><button type="button" onClick={() => void loadCatalog(false)} aria-label="Refresh catalog" className={`${buttonClass} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}><RefreshCw className="h-4 w-4" aria-hidden="true" /></button></div></div>
        {catalogError ? <p className="mt-3 text-sm text-red-700" role="alert">{catalogError}</p> : null}
        {visibleItems.length === 0 && !catalogLoading ? <p className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">{query ? "No matching products in the loaded catalog." : "No products yet. Start with your store URL, a CSV, or one manual row above."}</p> : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{visibleItems.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex gap-3"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : null}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h4 className="truncate text-sm font-semibold text-slate-950">{item.name}</h4><p className="mt-1 text-xs text-slate-500">{item.sku || "No SKU"}{item.brand ? ` · ${item.brand}` : ""}{priceLabel(item.price, item.currency) ? ` · ${priceLabel(item.price, item.currency)}` : ""}</p></div>{item.sku ? <button type="button" aria-label={`Edit ${item.name}`} onClick={() => { setEditingId(item.id); setEditingRow(emptyInput(item)); }} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-700"><Edit3 className="h-4 w-4" aria-hidden="true" /></button> : null}</div><div className="mt-2 flex flex-wrap gap-1.5 text-[11px]"><span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{item.source}</span><span className={`rounded-full px-2 py-1 ${item.validation.valid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{item.validation.valid ? "Ready" : "Needs attention"}</span></div></div></div>{editingId === item.id && editingRow ? <div className="mt-3 space-y-2 border-t border-slate-100 pt-3"><div className="grid gap-2 sm:grid-cols-2">{(["sku", "name", "shape", "imageUrl", "brand", "price", "productUrl"] as (keyof ManualRow)[]).map((key) => <input key={key} aria-label={`Edit ${key}`} value={editingRow[key]} onChange={(event) => setEditingRow((row) => row ? { ...row, [key]: event.target.value } : row)} placeholder={key === "price" ? "Price (USD)" : key} type={key === "price" ? "number" : key.endsWith("Url") ? "url" : "text"} maxLength={maxLengthForField(key)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />)}</div><div className="flex justify-end gap-2"><button type="button" onClick={() => { setEditingId(null); setEditingRow(null); }} className={`${buttonClass} border border-slate-200 bg-white text-slate-600`}>Cancel</button><button type="button" disabled={busy} onClick={() => void saveCorrection(item)} className={`${buttonClass} bg-slate-950 text-white disabled:opacity-50`}><Save className="h-4 w-4" aria-hidden="true" />Save correction</button></div></div> : null}</article>)}</div>
        {catalogCursor ? <button type="button" disabled={catalogLoading} onClick={() => void loadCatalog(true)} className={`${buttonClass} mt-4 w-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50`}>{catalogLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}Load more products</button> : null}
      </div>
    </section>
  );
}
