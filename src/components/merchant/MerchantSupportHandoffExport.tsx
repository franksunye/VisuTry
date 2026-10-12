'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

/**
 * Explicit Human-only local export. A database snapshot is never an external
 * public-page, identity, charge, or G4 certification.
 */
export function MerchantSupportHandoffExport({ merchantId }: { merchantId: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function exportHandoff() {
    if (busy) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch(
        `/api/merchant/${encodeURIComponent(merchantId)}/delivery-factory/handoff`,
        { cache: 'no-store' },
      )
      const body = await response.json() as {
        success?: boolean
        data?: { version: number; releaseReady: boolean; merchant?: { slug?: string } }
      }
      if (!response.ok || !body.success || !body.data || body.data.releaseReady !== false) {
        throw new Error('Could not verify the read-only support snapshot. Please retry.')
      }
      const file = new Blob([JSON.stringify(body.data, null, 2) + '\n'], { type: 'application/json' })
      const url = URL.createObjectURL(file)
      try {
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = 'merchant-support-snapshot-v1.json'
        anchor.click()
      } finally {
        URL.revokeObjectURL(url)
      }
      setNotice('Support snapshot exported. Public Store, image, authentication and billing still require separate verification.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to export support snapshot.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby="merchant-support-handoff-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02] sm:p-6">
      <h2 id="merchant-support-handoff-title" className="text-lg font-semibold text-slate-950">Support handoff</h2>
      <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
        Export a private snapshot of your Catalog, Store, Campaign and brand readiness, with next actions.
        This is not proof that shoppers can see the public experience or that billing is live.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void exportHandoff()}
        className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
        {busy ? 'Preparing snapshot…' : 'Export support snapshot'}
      </button>
      {error ? <p className="mt-3 text-sm text-red-700" role="alert">{error}</p> : null}
      {notice ? <p className="mt-3 text-sm text-emerald-800" role="status">{notice}</p> : null}
    </section>
  )
}
