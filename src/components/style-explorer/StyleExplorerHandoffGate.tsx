'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { StyleExplorerGate } from './StyleExplorerGate'

/** Keep URL-derived Face Analysis context out of static server rendering. */
export function StyleExplorerHandoffGate({ locale }: { locale: string }) {
  const searchParams = useSearchParams()
  const [browserSearch, setBrowserSearch] = useState<string | null>(null)

  useEffect(() => {
    // Next.js 14 `force-static` can hydrate the router's search params as
    // empty even for a query-bearing URL. Read the browser's actual location
    // after hydration, without invoking any server-rendered dynamic API.
    const sync = () => setBrowserSearch(window.location.search)
    sync()
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [searchParams])

  const query = browserSearch === null ? searchParams : new URLSearchParams(browserSearch)
  // Reject ambiguous duplicate keys, matching the former server parser.
  const source = query.getAll('source')
  const taskIds = query.getAll('taskId')
  const taskId = source.length === 1 && source[0] === 'face-analysis' && taskIds.length === 1
    ? taskIds[0]
    : null

  const callbackParams = new URLSearchParams()
  if (taskId) {
    callbackParams.set('source', 'face-analysis')
    callbackParams.set('taskId', taskId)
  }
  const callbackQuery = callbackParams.toString()
  const callbackUrl = `/${locale}/style-explorer${callbackQuery ? `?${callbackQuery}` : ''}`
  const signInHref = `/${locale}/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`

  return <StyleExplorerGate locale={locale} signInHref={signInHref} faceAnalysisTaskId={taskId} />
}
