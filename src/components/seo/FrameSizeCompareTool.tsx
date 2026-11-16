'use client'

import { useEffect, useState } from 'react'
import { trackCampaignEvent } from '@/lib/analytics-v2'
import { AnalyticsEvent } from '@/lib/analytics-events'
import { compareFrameMarks, parseFrameMark, type FrameDifference } from '@/lib/frame-size-compare'

const SOURCE_PAGE = '/en/glasses-guide/how-wide-should-glasses-be-for-my-face'

function describeDifference(delta: number): string {
  if (delta === 0) return 'Same listed measurement'
  return (delta > 0 ? '+' : '−') + Math.abs(delta) + ' mm'
}

/**
 * No face image, login, network sizing API or persisted measurements.
 * Analytics contains the event/entry only, never the two entered frame markings.
 */
export function FrameSizeCompareTool() {
  const [current, setCurrent] = useState('')
  const [candidate, setCandidate] = useState('')
  const [difference, setDifference] = useState<FrameDifference | null>(null)
  const [error, setError] = useState('')
  // An SSR button with no hydrated handler silently ignores a fast first tap.
  // Leave it disabled until React has attached the input and click handlers.
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])

  function compare() {
    const oldMark = parseFrameMark(current)
    const newMark = parseFrameMark(candidate)
    if (!oldMark || !newMark) {
      setError('Enter two valid markings such as 52-18-145 (lens, bridge, temple).')
      setDifference(null)
      return
    }
    setError('')
    setDifference(compareFrameMarks(oldMark, newMark))
    trackCampaignEvent(AnalyticsEvent.FrameSizeCompared, {
      entry_point: 'consumer',
      source_page: SOURCE_PAGE,
      query_cluster: 'frame-width-fit',
      content_cluster: 'new-entry-size',
    })
  }

  function changeCurrent(value: string) {
    setCurrent(value)
    setDifference(null)
    setError('')
  }

  function changeCandidate(value: string) {
    setCandidate(value)
    setDifference(null)
    setError('')
  }

  return (
    <section aria-labelledby="frame-marking-compare" className="mt-8 rounded-xl border border-blue-200 bg-blue-50/60 p-5 md:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Optional free comparison</p>
      <h3 id="frame-marking-compare" className="mt-2 text-xl font-semibold text-slate-950">
        Compare the markings on two frames
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        Enter the three numbers printed inside a comfortable pair and a pair you are considering.
        Both are lens width, bridge width, and temple length in millimetres.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="current-frame-mark" className="block text-sm font-semibold text-slate-800">
            Your current pair
          </label>
          <input id="current-frame-mark" type="text" inputMode="text" autoComplete="off"
            value={current} onChange={(event) => changeCurrent(event.target.value)}
            placeholder="e.g. 52-18-145" aria-invalid={Boolean(error)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
          />
        </div>
        <div>
          <label htmlFor="candidate-frame-mark" className="block text-sm font-semibold text-slate-800">
            Frame you are considering
          </label>
          <input id="candidate-frame-mark" type="text" inputMode="text" autoComplete="off"
            value={candidate} onChange={(event) => changeCandidate(event.target.value)}
            placeholder="e.g. 54-18-145" aria-invalid={Boolean(error)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
          />
        </div>
      </div>
      <button type="button" onClick={compare} disabled={!ready}
        className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-wait disabled:opacity-60">
        Compare markings
      </button>
      {error ? <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}
      {difference && (
        <div aria-live="polite" className="mt-5 rounded-lg border border-blue-100 bg-white p-4">
          <h4 className="font-semibold text-slate-950">Candidate compared with your current pair</h4>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            {[
              { name: 'Each lens width', amount: difference.lensWidth },
              { name: 'Bridge width', amount: difference.bridgeWidth },
              { name: 'Temple length', amount: difference.templeLength },
            ].map((item) => (
              <div key={item.name}>
                <dt className="text-sm text-slate-600">{item.name}</dt>
                <dd className="font-semibold text-slate-950">{describeDifference(item.amount)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            These are listed component differences, not an overall width or a fit score.
            Rim and hinge construction, bridge shape, lens positioning and adjustments still matter.
            Check the actual outer width and try the frame with an optician when possible.
          </p>
        </div>
      )}
      <p className="mt-4 text-xs leading-5 text-slate-600">
        Calculated locally in your browser. We do not upload your entries.
        No photo is analyzed and no prescription or comfort judgment is made.
      </p>
    </section>
  )
}
