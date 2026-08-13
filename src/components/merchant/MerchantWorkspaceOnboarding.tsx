'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Globe2, Store } from 'lucide-react'

type Props = { locale: string }

export function MerchantWorkspaceOnboarding({ locale }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/merchant/workspaces', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, websiteUrl: websiteUrl || undefined }),
      })
      const body = await response.json() as { data?: { merchant?: { id?: string } }; error?: string }
      if (!response.ok || !body.data?.merchant?.id) {
        throw new Error(body.error || 'Unable to create your Merchant Workspace.')
      }
      router.push(`/${locale}/merchant?merchantId=${encodeURIComponent(body.data.merchant.id)}`)
      router.refresh()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create your Merchant Workspace.')
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] px-4 py-10 text-slate-950 sm:px-6 sm:py-16 lg:px-8">
      <section className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_25px_80px_-55px_rgba(15,23,42,0.55)] sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <Store className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Merchant workspace</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Create your Merchant Workspace</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">Connect your eyewear business to VisuTry and let your AI agent set up Stores, Campaigns, and analyze shopper intent.</p>

        <form className="mt-8 space-y-5" onSubmit={submit}>
          <div>
            <label className="text-sm font-semibold text-slate-800" htmlFor="merchant-name">Merchant name <span className="text-red-600">*</span></label>
            <input id="merchant-name" name="name" required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" placeholder="Your store or brand name" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-800" htmlFor="merchant-website">Website URL <span className="font-normal text-slate-400">(optional)</span></label>
            <div className="relative mt-2">
              <Globe2 className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
              <input id="merchant-website" name="websiteUrl" type="url" maxLength={2000} value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" placeholder="https://your-store.example" />
            </div>
          </div>
          {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
          <button type="submit" disabled={busy || !name.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? 'Creating workspace…' : 'Create Workspace'}
            {!busy ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
          </button>
        </form>
      </section>
    </main>
  )
}
