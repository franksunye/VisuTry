"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronDown, Edit3, FilePlus2, Loader2, Search, Save, X } from "lucide-react";
import { MerchantCatalogSelfService } from "@/components/merchant/MerchantCatalogSelfService";

type PresentationState = "READY" | "NEEDS_REVIEW" | "NEEDS_ATTENTION";
type CatalogItem = {
  id: string;
  sku: string | null;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  productUrl: string | null;
  externalId: string | null;
  price: number | null;
  currency: string | null;
  shape: string | null;
  source: string | null;
  status: string;
  presentation: { state: PresentationState; label: string; issueSummary: string | null };
};
type CatalogSummary = { total: number; ready: number; needsReview: number; needsAttention: number };
type WorkspaceData = { items: CatalogItem[]; nextCursor: string | null; summary: CatalogSummary };
type Filter = "all" | PresentationState;
type EditValues = { sku: string; name: string; imageUrl: string; productUrl: string; shape: string; brand: string; price: string };

const buttonClass = "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";

function priceLabel(item: CatalogItem) {
  return item.price == null ? null : `${item.currency?.toUpperCase() ?? "USD"} ${(item.price / 100).toFixed(2)}`;
}

function editValues(item: CatalogItem): EditValues {
  return {
    sku: item.sku ?? "",
    name: item.name,
    imageUrl: item.imageUrl ?? "",
    productUrl: item.productUrl ?? "",
    shape: item.shape ?? "",
    brand: item.brand ?? "",
    price: item.price == null ? "" : (item.price / 100).toFixed(2),
  };
}

function stateClass(state: PresentationState) {
  if (state === "READY") return "bg-emerald-50 text-emerald-700";
  if (state === "NEEDS_REVIEW") return "bg-blue-50 text-blue-700";
  return "bg-amber-50 text-amber-800";
}

export function MerchantCatalogWorkspace({ merchantId, locale }: { merchantId: string; locale: string }) {
  const apiBase = `/api/merchant/${encodeURIComponent(merchantId)}/catalog`;
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [edit, setEdit] = useState<EditValues | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const cursorRef = useRef<string | null>(null);

  const load = useCallback(async ({ append = false, query = "", readiness = "all" }: { append?: boolean; query?: string; readiness?: Filter } = {}) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50", readiness });
      if (query) params.set("search", query);
      if (append && cursorRef.current) params.set("cursor", cursorRef.current);
      const response = await fetch(`${apiBase}?${params.toString()}`, { cache: "no-store" });
      const body = await response.json() as { success?: boolean; data?: WorkspaceData; message?: string };
      if (!response.ok || !body.success || !body.data) throw new Error(body.message || "Unable to load Catalog.");
      cursorRef.current = body.data.nextCursor;
      setWorkspace((current) => append && current ? { ...body.data!, items: [...current.items, ...body.data!.items] } : body.data!);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load Catalog.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [apiBase]);

  useEffect(() => { void load(); }, [load]);

  const summary = workspace?.summary ?? { total: 0, ready: 0, needsReview: 0, needsAttention: 0 };
  const hasNoProducts = !loading && summary.total === 0;
  const updateSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    setAppliedSearch(query);
    void load({ query, readiness: filter });
  };

  function changeFilter(value: Filter) {
    setFilter(value);
    void load({ query: appliedSearch, readiness: value });
  }

  function startEditing(item: CatalogItem) {
    setEditing(item);
    setEdit(editValues(item));
    setSaveError(null);
  }

  async function saveCorrection() {
    if (!editing || !edit || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(`${apiBase}/${encodeURIComponent(editing.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          frame: {
            sku: edit.sku.trim() || null,
            name: edit.name.trim(),
            imageUrl: edit.imageUrl.trim() || null,
            productUrl: edit.productUrl.trim() || null,
            shape: edit.shape.trim() || null,
            brand: edit.brand.trim() || null,
            price: edit.price.trim() ? Math.round(Number(edit.price) * 100) : null,
            currency: editing.currency ?? "USD",
            externalId: editing.externalId,
          },
        }),
      });
      const body = await response.json() as { success?: boolean; message?: string };
      if (!response.ok || !body.success) throw new Error(body.message || "Unable to save this product.");
      setEditing(null);
      setEdit(null);
      await load({ query: appliedSearch, readiness: filter });
    } catch (requestError) {
      setSaveError(requestError instanceof Error ? requestError.message : "Unable to save this product.");
    } finally {
      setSaving(false);
    }
  }

  return <section className="space-y-6" aria-labelledby="merchant-catalog-heading">
    <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Catalog workspace</p>
        <h1 id="merchant-catalog-heading" className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Catalog</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Manage the products available to your Store and review anything that needs attention.</p>
      </div>
      <button type="button" onClick={() => setIntakeOpen((value) => !value)} className={`${buttonClass} bg-slate-950 text-white hover:bg-slate-800`} aria-expanded={intakeOpen}>
        <FilePlus2 className="h-4 w-4" aria-hidden="true" /> Add products
      </button>
    </header>

    <div className="grid gap-3 sm:grid-cols-4" aria-label="Catalog health">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Total</p><p className="mt-1 text-2xl font-semibold text-slate-950">{summary.total}</p></div>
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Ready</p><p className="mt-1 text-2xl font-semibold text-emerald-950">{summary.ready}</p></div>
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">Needs enrichment</p><p className="mt-1 text-2xl font-semibold text-blue-950">{summary.needsReview}</p></div>
      <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-800">Needs attention</p><p className="mt-1 text-2xl font-semibold text-amber-950">{summary.needsAttention}</p></div>
    </div>

    {intakeOpen ? <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-slate-950">Add products</p><p className="mt-1 text-xs text-slate-600">Inspect first. Nothing is written until you approve the import.</p></div><button type="button" onClick={() => setIntakeOpen(false)} aria-label="Close add products" className="rounded-lg p-2 text-slate-500 hover:bg-white"><X className="h-4 w-4" aria-hidden="true" /></button></div>
      {workspace ? <MerchantCatalogSelfService merchantId={merchantId} initialTotal={summary.total} showResourceList={false} onCatalogChanged={() => void load({ query: appliedSearch, readiness: filter })} /> : null}
    </div> : null}

    <form onSubmit={updateSearch} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row">
      <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input aria-label="Search full catalog" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the full catalog" className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" /></div>
      <select aria-label="Filter catalog readiness" value={filter} onChange={(event) => changeFilter(event.target.value as Filter)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"><option value="all">All products</option><option value="READY">Ready</option><option value="NEEDS_REVIEW">Needs enrichment</option><option value="NEEDS_ATTENTION">Needs attention</option></select>
      <button type="submit" className={`${buttonClass} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}>Search</button>
    </form>

    {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p> : null}
    {loading ? <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-8 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Loading Catalog…</div> : null}
    {hasNoProducts ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center"><h2 className="text-lg font-semibold text-slate-950">Your Catalog is empty</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Add one product to make it available for your Store.</p><button type="button" onClick={() => setIntakeOpen(true)} className={`${buttonClass} mt-5 bg-slate-950 text-white hover:bg-slate-800`}><FilePlus2 className="h-4 w-4" aria-hidden="true" /> Add your first product</button></div> : null}
    {!loading && !hasNoProducts && workspace?.items.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center"><h2 className="text-lg font-semibold text-slate-950">No products match this view</h2><p className="mt-2 text-sm text-slate-600">Try another search or readiness filter.</p></div> : null}

    {workspace && workspace.items.length > 0 ? <div className="space-y-3">
      {workspace.items.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : null}</div>
        <div className="min-w-0 flex-1"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><div><h2 className="text-base font-semibold text-slate-950">{item.name}</h2><p className="mt-1 text-sm text-slate-600">{item.sku || item.productUrl || "Stable product identity"}{item.brand ? ` · ${item.brand}` : ""}{priceLabel(item) ? ` · ${priceLabel(item)}` : ""}</p></div><button type="button" onClick={() => startEditing(item)} className={`${buttonClass} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}><Edit3 className="h-4 w-4" aria-hidden="true" /> Edit</button></div><div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span className={`rounded-full px-2.5 py-1 font-semibold ${stateClass(item.presentation.state)}`}>{item.presentation.label}</span>{item.source ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{item.source === "EXTERNAL" ? "Website" : item.source}</span> : null}{item.presentation.issueSummary ? <span className="text-amber-800">{item.presentation.issueSummary}</span> : null}</div></div>
      </div>
      {editing?.id === item.id && edit ? (
        <div className="mt-5 border-t border-slate-200 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700">Product name<input value={edit.name} onChange={(event) => setEdit({ ...edit, name: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal" /></label>
            <label className="text-xs font-semibold text-slate-700">Image URL<input value={edit.imageUrl} onChange={(event) => setEdit({ ...edit, imageUrl: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal" /></label>
            <label className="text-xs font-semibold text-slate-700">Merchant SKU <span className="font-normal text-slate-500">optional</span><input value={edit.sku} onChange={(event) => setEdit({ ...edit, sku: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal" /></label>
            <label className="text-xs font-semibold text-slate-700">Product URL <span className="font-normal text-slate-500">optional if identity exists</span><input value={edit.productUrl} onChange={(event) => setEdit({ ...edit, productUrl: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal" /></label>
            <label className="text-xs font-semibold text-slate-700">Frame shape<input value={edit.shape} onChange={(event) => setEdit({ ...edit, shape: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal" /></label>
            <label className="text-xs font-semibold text-slate-700">Brand<input value={edit.brand} onChange={(event) => setEdit({ ...edit, brand: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal" /></label>
            <label className="text-xs font-semibold text-slate-700">Price<input aria-label="Price" type="number" min="0" step="0.01" inputMode="decimal" value={edit.price} onChange={(event) => setEdit({ ...edit, price: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal" /></label>
          </div>
          {saveError ? <p className="mt-3 text-sm text-red-700" role="alert">{saveError}</p> : null}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => { setEditing(null); setEdit(null); }} className={`${buttonClass} border border-slate-200 bg-white text-slate-700`}>Cancel</button>
            <button type="button" disabled={saving} onClick={() => void saveCorrection()} className={`${buttonClass} bg-slate-950 text-white disabled:opacity-50`}>{saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}Save changes</button>
          </div>
        </div>
      ) : null}
      </article>)}
      {workspace.nextCursor ? <button type="button" disabled={loadingMore} onClick={() => void load({ append: true, query: appliedSearch, readiness: filter })} className={`${buttonClass} w-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50`}>{loadingMore ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />} Load more products</button> : null}
    </div> : null}
  </section>;
}
