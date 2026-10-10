"use client";

import { useState } from "react";
import { FileUp, Loader2 } from "lucide-react";

const MAX_BYTES = 4 * 1024 * 1024;

/** Explicit image upload, with NO implicit Catalog item write. */
export function MerchantCatalogImageUpload({
  merchantId, onUploaded, disabled = false,
}: {
  merchantId: string;
  onUploaded: (url: string) => void;
  disabled?: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function upload() {
    if (!file || busy || disabled) return;
    setError(null);
    setSuccess(false);
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > MAX_BYTES || file.size < 30) {
      setError("Choose a PNG, JPEG or WebP image up to 4 MB.");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/merchant/" + encodeURIComponent(merchantId) + "/catalog/media", {
        method: "POST", body: form,
      });
      const result = await response.json() as { success?: boolean; data?: { url?: string }; message?: string };
      if (!response.ok || !result.success || !result.data?.url) {
        throw new Error(result.message || "Unable to upload product image.");
      }
      onUploaded(result.data.url);
      setSuccess(true);
      setFile(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to upload product image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3">
      <label className="block text-xs font-semibold text-slate-700">
        Or upload a product photo
        <input type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled || busy}
          aria-label="Choose product photo"
          onChange={(event) => { setFile(event.target.files?.[0] ?? null); setError(null); setSuccess(false); }}
          className="mt-2 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:font-semibold file:text-blue-800" />
      </label>
      <button type="button" disabled={disabled || busy || !file} onClick={() => void upload()}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 disabled:opacity-50">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
        {busy ? "Uploading image…" : "Upload photo"}
      </button>
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
      {success ? <p role="status" className="text-xs text-emerald-800">Image uploaded. Check its URL above, then review and approve your product separately.</p> : null}
      <p className="text-xs leading-5 text-slate-500">Uploading creates a public image. If it is not attached to a saved product, it is eligible for cleanup after 7 days.</p>
    </div>
  );
}
