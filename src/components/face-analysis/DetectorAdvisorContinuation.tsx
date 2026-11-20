'use client'

import { useSearchParams } from 'next/navigation'
import { ReactNode } from 'react'
import { ArrowRight, CheckCircle2, Glasses, LockKeyhole, ShieldCheck } from 'lucide-react'
import { LoginButton } from '@/components/auth/LoginButton'
import { getFaceShapeIcon, isCanonicalFaceShape } from '@/config/face-analysis'

/**
 * Contextual guest handoff, not a second marketing landing.
 *
 * Only the English Detector continuation opts in; ordinary /face-analysis,
 * invalid source/shape, and other locales keep the existing SEO landing.
 * The photo remains in the Detector's 30-minute IndexedDB handoff. Do NOT
 * consume or upload it before an authenticated user explicitly starts Advisor.
 */
export function DetectorAdvisorContinuation({
  locale,
  fallback,
}: {
  locale: string
  fallback: ReactNode
}) {
  const searchParams = useSearchParams()
  const faceShape = searchParams.get('faceShape')
  if (locale !== 'en' || searchParams.get('source') !== 'free-face-shape-detector' || !faceShape || !isCanonicalFaceShape(faceShape)) {
    return <>{fallback}</>
  }

  const ShapeIcon = getFaceShapeIcon(faceShape)
  const shapeName = faceShape.charAt(0).toUpperCase() + faceShape.slice(1)
  const hasHandoff = Boolean(searchParams.get('photoHandoff'))

  return (
    <main className="bg-gradient-to-b from-blue-50 via-white to-white px-4 py-6 sm:py-12">
      <section
        data-testid="detector-advisor-continuation"
        className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-8"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          Your free face-shape check is complete
        </div>

        <h1 className="mt-5 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
          Continue with your face result
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-600 sm:text-base">
          You already checked your face shape. There is no need to start over or read another product introduction.
        </p>

        <div className="mt-5 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700">
            <ShapeIcon className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">From your free check</p>
            <p className="text-xl font-bold text-gray-950">{shapeName} face <span className="text-xs font-normal text-gray-600">(likely)</span></p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl border border-gray-200 p-3.5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-gray-950">Done: free face-shape check</p>
              <p className="mt-1 text-xs leading-5 text-gray-600">Your approximate shape and proportions are already known.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/40 p-3.5">
            <Glasses className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            <div>
              <p className="text-sm font-semibold text-gray-950">Next: frame decision support</p>
              <p className="mt-1 text-xs leading-5 text-gray-600">Explore an Advisor preview, then choose whether to unlock full recommendations and Try-On.</p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-700">
          <p className="flex items-start gap-2">
            <LockKeyhole className="mt-1 h-4 w-4 shrink-0 text-blue-700" />
            <span>Sign in to continue with your available analysis credit. A full personalized report is a separate optional purchase.</span>
          </p>
          <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-gray-600">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            <span>
              {hasHandoff
                ? 'A copy of your photo is held temporarily in this browser. It is uploaded only when you choose to run Advisor; you can reselect it if needed.'
                : 'Your photo has not been carried over. You can select it again after sign-in.'}
            </span>
          </p>
        </div>

        <div className="mt-5">
          <LoginButton
            preserveCurrentUrl
            eventName="face_analysis_signin_click"
            eventParameters={{ source: 'detector_continuation' }}
            label="Sign in and continue with my result"
            className="w-full justify-center py-3.5 text-base shadow-sm sm:w-auto sm:min-w-[300px]"
          />
          <p className="mt-2 text-center text-xs text-gray-500 sm:text-start">
            Signing in keeps your progress connected to your account. <ArrowRight className="inline h-3.5 w-3.5" aria-hidden="true" />
          </p>
        </div>
      </section>
    </main>
  )
}
