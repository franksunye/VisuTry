"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProfileFeedback = {
  kind: "success" | "error";
  message: string;
  field?: "name" | "website";
};

type MerchantWorkspaceDetailsFormProps = {
  merchantId: string;
  initialName: string;
  initialWebsiteUrl?: string | null;
  variant?: "settings" | "compact";
  id?: string;
  hidden?: boolean;
  canEdit?: boolean;
};

const PROFILE_ERROR_COPY: Record<string, { message: string; field: "name" | "website" }> = {
  INVALID_MERCHANT_NAME: {
    message: "Enter a workspace name between 2 and 120 characters.",
    field: "name",
  },
  INVALID_WEBSITE_URL: {
    message: "Enter a valid website URL starting with http:// or https://.",
    field: "website",
  },
};

export function MerchantWorkspaceDetailsForm({
  merchantId,
  initialName,
  initialWebsiteUrl,
  variant = "settings",
  id,
  hidden = false,
  canEdit = true,
}: MerchantWorkspaceDetailsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<ProfileFeedback | null>(null);
  const compact = variant === "compact";
  const feedbackId = `workspace-details-feedback-${merchantId}`;

  const save = async () => {
    if (!canEdit) return;
    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/merchant/${merchantId}/profile`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, websiteUrl: websiteUrl || null }),
      });
      const body = (await response.json()) as { data?: unknown; error?: string };
      if (!response.ok) {
        const knownError = body.error ? PROFILE_ERROR_COPY[body.error] : undefined;
        throw Object.assign(new Error(knownError?.message || body.error || "Unable to save workspace details."), {
          field: knownError?.field,
        });
      }
      setFeedback({ kind: "success", message: "Saved" });
      router.refresh();
    } catch (requestError) {
      const error = requestError instanceof Error ? requestError : new Error("Unable to save workspace details.");
      setFeedback({
        kind: "error",
        message: error.message || "Unable to save workspace details.",
        field: "field" in error && (error.field === "name" || error.field === "website") ? error.field : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const inputClass = compact
    ? "mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
    : "mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  const saveButtonClass = compact
    ? "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-slate-950 text-white hover:bg-slate-800 disabled:opacity-50"
    : "inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <form
      id={id}
      aria-label="Workspace details"
      hidden={hidden}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <div className={compact ? "grid gap-4 sm:grid-cols-2" : "grid gap-5"}>
        <div>
          <label
            className={compact ? "text-xs font-semibold text-slate-700" : "text-sm font-semibold text-slate-800"}
            htmlFor={`workspace-name-${merchantId}`}
          >
            Brand or store name
          </label>
          <input
            id={`workspace-name-${merchantId}`}
            type="text"
            value={name}
            disabled={!canEdit || busy}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={feedback?.kind === "error" && feedback.field === "name" ? true : undefined}
            aria-describedby={feedback?.kind === "error" && feedback.field === "name" ? feedbackId : undefined}
            className={inputClass}
          />
        </div>
        <div>
          <label
            className={compact ? "text-xs font-semibold text-slate-700" : "text-sm font-semibold text-slate-800"}
            htmlFor={`workspace-website-${merchantId}`}
          >
            Website <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id={`workspace-website-${merchantId}`}
            type="url"
            value={websiteUrl}
            disabled={!canEdit || busy}
            onChange={(event) => setWebsiteUrl(event.target.value)}
            aria-invalid={feedback?.kind === "error" && feedback.field === "website" ? true : undefined}
            aria-describedby={feedback?.kind === "error" && feedback.field === "website" ? feedbackId : undefined}
            className={inputClass}
            placeholder="https://your-store.example"
          />
        </div>
      </div>

      {!canEdit ? <p className="mt-4 text-xs text-slate-600">Only the Merchant Owner can edit public workspace identity.</p> : null}
      <div className={compact ? "mt-4 flex flex-wrap items-center gap-3" : "mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center"}>
        <button
          type="submit"
          disabled={!canEdit || busy || name.trim().length < 2}
          className={saveButtonClass}
        >
          {busy ? "Saving…" : "Save details"}
        </button>
        {feedback ? (
          <p
            id={feedbackId}
            role={feedback.kind === "success" ? "status" : "alert"}
            aria-live={feedback.kind === "success" ? "polite" : "assertive"}
            aria-atomic="true"
            className={`text-sm ${feedback.kind === "success" ? "font-medium text-emerald-700" : "text-red-700"}`}
          >
            {feedback.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
