'use client'

import { useSearchParams } from 'next/navigation'
import { StyleExplorerGate } from './StyleExplorerGate'

/** Keep URL-derived Face Analysis context out of static server rendering. */
export function StyleExplorerHandoffGate({ locale }: { locale: string }) {
  const searchParams = useSearchParams()
  // Reject ambiguous duplicate keys, matching the former server parser.
  const source = searchParams.getAll('source')
  const taskIds = searchParams.getAll('taskId')
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
