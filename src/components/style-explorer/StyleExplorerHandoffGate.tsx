'use client'

import { useEffect, useState } from 'react'
import { StyleExplorerGate } from './StyleExplorerGate'

/** Keep URL-derived Face Analysis context out of static server rendering. */
export function StyleExplorerHandoffGate({ locale }: { locale: string }) {
  const [browserSearch, setBrowserSearch] = useState('')

  useEffect(() => {
    // No Next.js searchParams/Suspense bailout is necessary. Read only after
    // hydration, and update on browser history navigation.
    const sync = () => setBrowserSearch(window.location.search)
    sync()
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  const query = new URLSearchParams(browserSearch)
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
