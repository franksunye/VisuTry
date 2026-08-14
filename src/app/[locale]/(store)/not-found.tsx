import Link from 'next/link'

export default function StoreNotFound() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Store unavailable</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">This Store is not available yet.</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          The Store may still be a private draft, or it may have been removed. Please return to VisuTry and try another experience.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Return to VisuTry
        </Link>
      </div>
    </main>
  )
}
