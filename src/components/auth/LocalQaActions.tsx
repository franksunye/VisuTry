'use client'

import { signIn } from 'next-auth/react'

type Props = { callbackUrl: string }

const LOCAL_QA_OPTIONS = [
  { label: 'Clean Merchant', qaIdentity: 'clean' },
  { label: 'Existing Merchant', qaIdentity: 'existing' },
  { label: 'Consumer', qaIdentity: 'consumer' },
  { label: 'Admin', qaIdentity: 'admin' },
] as const

export function LocalQaActions({ callbackUrl }: Props) {
  const login = (qaIdentity: (typeof LOCAL_QA_OPTIONS)[number]['qaIdentity']) => {
    void signIn('mock-credentials', {
      callbackUrl,
      email: `${qaIdentity}@local.test`,
      qaIdentity,
      redirect: true,
    })
  }

  return (
    <section aria-label="Local QA" className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800">Local QA</p>
      <p className="mt-1 text-xs leading-5 text-amber-900">Local-only test identities. Never shown in Preview or Production.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {LOCAL_QA_OPTIONS.map((option) => (
          <button
            key={option.qaIdentity}
            type="button"
            onClick={() => login(option.qaIdentity)}
            className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  )
}
