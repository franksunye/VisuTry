'use client'

import { ArrowRight, LogIn, UserPlus } from 'lucide-react'
import { signIn } from 'next-auth/react'

type Props = { callbackUrl: string }

export function MerchantAuthActions({ callbackUrl }: Props) {
  const startAuth = (intent: 'login' | 'signup') => {
    void signIn(
      'auth0',
      { callbackUrl },
      intent === 'signup' ? { screen_hint: 'signup' } : undefined,
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => startAuth('signup')}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        Create merchant account
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => startAuth('login')}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <LogIn className="h-4 w-4" aria-hidden="true" />
        I already have an account
      </button>
    </div>
  )
}
