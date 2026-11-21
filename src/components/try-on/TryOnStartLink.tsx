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

type TryOnStartLinkProps = {
  locale: string
  type: string
  label: string
  /** Optional hero styles; existing callers retain the original button appearance. */
  className?: string
  /** Public entry points can disable speculative prefetch of authentication. */
  prefetch?: boolean
}
function QueryAwareStartLink({ locale, type, label, className, prefetch }: TryOnStartLinkProps) {
  const searchParams = useSearchParams()
  return <StartLink href={buildTryOnSignInHref(locale, type, searchParams)} label={label} className={className} prefetch={prefetch} />
}

function StartLink({ href, label, className = START_LINK_CLASS, prefetch }: Pick<TryOnStartLinkProps, 'label' | 'className' | 'prefetch'> & { href: string }) {
  return (
    <Link href={href} className={className} prefetch={prefetch}>
      {label}
      <ArrowRight className="ms-2 h-4 w-4" />
    </Link>
  )
}

/** Keep the marketing page prerenderable; resolve login handoff only in the client island. */
export function TryOnStartLink({ locale, type, label, className, prefetch }: TryOnStartLinkProps) {
  return (
    <Suspense fallback={<StartLink href={buildTryOnSignInHref(locale, type)} label={label} className={className} prefetch={prefetch} />}>
      <QueryAwareStartLink locale={locale} type={type} label={label} className={className} prefetch={prefetch} />
    </Suspense>
  )
}
