"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AlertCircle, Boxes, CheckCircle2, ChevronDown, Edit3, FilePlus2, Loader2, Search, Save, Sparkles, X, type LucideIcon } from "lucide-react";
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
type WorkspaceData = { items: CatalogItem[]; nextCursor: string | null; summary: CatalogSummary; focusedFrame?: CatalogItem | null };
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

export function MerchantCatalogWorkspace({ merchantId, locale, initialFrameId }: { merchantId: string; locale: string; initialFrameId?: string }) {
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
  const focusedFrameRef = useRef<HTMLElement | null>(null);

  const load = useCallback(async ({ append = false, query = "", readiness = "all" }: { append?: boolean; query?: string; readiness?: Filter } = {}) => {
    const requestFocusId = !append && !query && readiness === "all" ? initialFrameId : undefined;
    if (append) setLoadingMore(true);
    else {
      setLoading(true);
      setWorkspace((current) => current && current.focusedFrame?.id !== requestFocusId
        ? { ...current, focusedFrame: null }
        : current);
    }
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50", readiness });
      if (query) params.set("search", query);
      if (append && cursorRef.current) params.set("cursor", cursorRef.current);
      if (requestFocusId) params.set("frameId", requestFocusId);
      const response = await fetch(`${apiBase}?${params.toString()}`, { cache: "no-store" });
      const body = await response.json() as { success?: boolean; data?: WorkspaceData; message?: string };
      if (!response.ok || !body.success || !body.data) throw new Error(body.message || "Unable to load Catalog.");
      cursorRef.current = body.data.nextCursor;
      setWorkspace((current) => append && current
        ? {
            ...body.data!,
            items: [...current.items, ...body.data!.items.filter((item) => !current.items.some((existing) => existing.id === item.id))],
            focusedFrame: body.data!.focusedFrame ?? current.focusedFrame ?? null,
          }
        : body.data!);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load Catalog.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [apiBase, initialFrameId]);

  useEffect(() => { void load(); }, [load]);

  const focusedFrameId = workspace?.focusedFrame?.id
  useEffect(() => {
    if (!loading && focusedFrameId) {
      focusedFrameRef.current?.scrollIntoView?.({ block: "center" });
    }
  }, [loading, focusedFrameId]);

  const summary = workspace?.summary ?? { total: 0, ready: 0, needsReview: 0, needsAttention: 0 };
  const healthMetrics: Array<{ label: string; value: number; Icon: LucideIcon; cardTone: string; iconTone: string }> = [
    { label: "Total", value: summary.total, Icon: Boxes, cardTone: "border-slate-100 bg-slate-50/70", iconTone: "bg-blue-50 text-blue-600" },
    { label: "Ready", value: summary.ready, Icon: CheckCircle2, cardTone: "border-emerald-100 bg-emerald-50/40", iconTone: "bg-emerald-50 text-emerald-600" },
    { label: "Needs enrichment", value: summary.needsReview, Icon: Sparkles, cardTone: "border-blue-100 bg-blue-50/40", iconTone: "bg-blue-50 text-blue-600" },
    { label: "Needs attention", value: summary.needsAttention, Icon: AlertCircle, cardTone: "border-amber-100 bg-amber-50/40", iconTone: "bg-amber-50 text-amber-700" },
  ];
  const hasNoProducts = !loading && summary.total === 0;
  const resourceItems = workspace
    ? workspace.focusedFrame
      ? [workspace.focusedFrame, ...workspace.items.filter((item) => item.id !== workspace.focusedFrame?.id)]
      : workspace.items
    : [];
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

  return <section className="space-y-4 sm:space-y-5" aria-labelledby="merchant-catalog-heading">
    <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:pb-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Catalog workspace</p>
        <h1 id="merchant-catalog-heading" className="mt-2 text-[32px] font-semibold leading-none tracking-[-0.045em] text-slate-950">Catalog</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Manage the products available to your Store and review anything that needs attention.</p>
      </div>
      <button type="button" onClick={() => setIntakeOpen((value) => !value)} className={`${buttonClass} min-h-11 w-full bg-slate-950 text-white hover:bg-slate-800 sm:w-auto`} aria-expanded={intakeOpen}>
        <FilePlus2 className="h-4 w-4" aria-hidden="true" /> Add products
      </button>
    </header>

    <dl aria-label="Catalog health" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
      {healthMetrics.map(({ label, value, Icon, cardTone, iconTone }) => <div key={label} className={`grid min-h-[76px] min-w-0 grid-cols-[32px_minmax(0,1fr)] items-center gap-2.5 rounded-xl border px-3 py-2.5 sm:grid-cols-[36px_minmax(0,1fr)] sm:gap-3 sm:px-3.5 ${cardTone}`}>
        <span aria-hidden="true" className={`flex h-8 w-8 items-center justify-center rounded-full sm:h-9 sm:w-9 ${iconTone}`}><Icon className="h-4 w-4" /></span>
        <div className="min-w-0"><dt className="break-words text-[11px] font-medium leading-4 tracking-normal text-slate-500 sm:truncate sm:text-[10px] sm:font-semibold sm:uppercase sm:tracking-[0.1em]">{label}</dt><dd className="mt-0.5 text-[23px] font-semibold leading-none tracking-[-0.04em] tabular-nums text-slate-950">{value}</dd></div>
      </div>)}
    </dl>

    {intakeOpen ? <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-slate-950">Add products</p><p className="mt-1 text-xs text-slate-600">Inspect first. Nothing is written until you approve the import.</p></div><button type="button" onClick={() => setIntakeOpen(false)} aria-label="Close add products" className="rounded-lg p-2 text-slate-500 hover:bg-white"><X className="h-4 w-4" aria-hidden="true" /></button></div>
      {workspace ? <MerchantCatalogSelfService merchantId={merchantId} initialTotal={summary.total} showResourceList={false} onCatalogChanged={() => void load({ query: appliedSearch, readiness: filter })} /> : null}
    </div> : null}

    <form onSubmit={updateSearch} className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-2.5 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-center sm:p-3">
      <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input aria-label="Search full catalog" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the full catalog" className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" /></div>
      <select aria-label="Filter catalog readiness" value={filter} onChange={(event) => changeFilter(event.target.value as Filter)} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"><option value="all">All products</option><option value="READY">Ready</option><option value="NEEDS_REVIEW">Needs enrichment</option><option value="NEEDS_ATTENTION">Needs attention</option></select>
      <button type="submit" className={`${buttonClass} min-h-10 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}>Search</button>
    </form>

    {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p> : null}
    {loading ? <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-8 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Loading Catalog…</div> : null}
    {hasNoProducts ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center"><h2 className="text-lg font-semibold text-slate-950">Your Catalog is empty</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Add one product to make it available for your Store.</p><button type="button" onClick={() => setIntakeOpen(true)} className={`${buttonClass} mt-5 bg-slate-950 text-white hover:bg-slate-800`}><FilePlus2 className="h-4 w-4" aria-hidden="true" /> Add your first product</button></div> : null}
    {!loading && !hasNoProducts && workspace?.items.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center"><h2 className="text-lg font-semibold text-slate-950">No products match this view</h2><p className="mt-2 text-sm text-slate-600">Try another search or readiness filter.</p></div> : null}

      {workspace && resourceItems.length > 0 ? <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="divide-y divide-slate-100">
      {resourceItems.map((item) => {
        const focused = item.id === workspace.focusedFrame?.id
        return <article
          key={item.id}
          id={`merchant-catalog-frame-${item.id}`}
          ref={focused ? focusedFrameRef : undefined}
          data-focused-frame={focused ? "true" : undefined}
          aria-label={focused ? `Focused product ${item.name}` : undefined}
          className={`grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3 py-3.5 sm:grid-cols-[56px_minmax(0,1.4fr)_minmax(190px,0.9fr)_auto] sm:gap-x-4 sm:px-4 sm:py-3 ${focused ? "bg-blue-50/50 ring-1 ring-inset ring-blue-200" : ""}`}
        >
        <div className="col-start-1 row-span-2 row-start-1 h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/80 p-1.5 sm:row-span-1 sm:h-14 sm:w-14">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-contain" /> : null}</div>
        <div className="col-start-2 row-start-1 min-w-0"><h2 title={item.name} className="truncate text-sm font-semibold tracking-tight text-slate-950">{focused ? <><span className="sr-only">Focused product: </span>{item.name}</> : item.name}</h2><p title={`${item.sku || item.productUrl || "Stable product identity"}${item.brand ? ` · ${item.brand}` : ""}${priceLabel(item) ? ` · ${priceLabel(item)}` : ""}`} className="mt-0.5 truncate text-xs text-slate-500">{item.sku || item.productUrl || "Stable product identity"}{item.brand ? ` · ${item.brand}` : ""}{priceLabel(item) ? ` · ${priceLabel(item)}` : ""}</p></div>
        <div className="col-start-2 row-start-2 flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] sm:col-start-3 sm:row-start-1"><span className={`rounded-full px-2 py-1 font-semibold ${stateClass(item.presentation.state)}`}>{item.presentation.label}</span>{item.source ? <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{item.source === "EXTERNAL" ? "Website" : item.source}</span> : null}{item.presentation.issueSummary ? <span className="text-amber-800">{item.presentation.issueSummary}</span> : null}</div>
        <button type="button" onClick={() => startEditing(item)} className={`${buttonClass} col-start-3 row-start-1 ${focused ? "min-h-11" : "min-h-9"} rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 hover:bg-slate-50 sm:col-start-4 sm:px-3 sm:text-sm`}><Edit3 className="h-3.5 w-3.5" aria-hidden="true" /> Edit</button>
      {editing?.id === item.id && edit ? (
        <div className="col-span-full border-t border-slate-100 pt-4">
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
      </article>
      })}
      </div>
      {workspace.nextCursor ? <div className="border-t border-slate-100 px-3 py-2"><button type="button" disabled={loadingMore} onClick={() => void load({ append: true, query: appliedSearch, readiness: filter })} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50">{loadingMore ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />} Load more products</button></div> : null}
    </div> : null}
  </section>;
}
