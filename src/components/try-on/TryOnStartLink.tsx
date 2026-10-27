'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

const HANDOFF_QUERY_KEYS = ['source', 'faceShape', 'photoHandoff'] as const
const START_LINK_CLASS = 'inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700'

export function buildTryOnSignInHref(locale: string, type: string, searchParams?: Pick<URLSearchParams, 'get'> | null): string {
  const callbackQuery = new URLSearchParams()
  for (const key of HANDOFF_QUERY_KEYS) {
    const value = searchParams?.get(key)
    if (value) callbackQuery.set(key, value)
  }
  const callbackPath = `/${locale}/try-on/${type}${callbackQuery.size ? `?${callbackQuery.toString()}` : ''}`
  return `/${locale}/auth/signin?callbackUrl=${encodeURIComponent(callbackPath)}`
}

function QueryAwareStartLink({ locale, type, label }: { locale: string; type: string; label: string }) {
  const searchParams = useSearchParams()
  return <StartLink href={buildTryOnSignInHref(locale, type, searchParams)} label={label} />
}

function StartLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={START_LINK_CLASS}>
      {label}
      <ArrowRight className="ms-2 h-4 w-4" />
    </Link>
  )
}

/** Keep the marketing page prerenderable; resolve login handoff only in the client island. */
export function TryOnStartLink({ locale, type, label }: { locale: string; type: string; label: string }) {
  return (
    <Suspense fallback={<StartLink href={buildTryOnSignInHref(locale, type)} label={label} />}>
      <QueryAwareStartLink locale={locale} type={type} label={label} />
    </Suspense>
  )
}
