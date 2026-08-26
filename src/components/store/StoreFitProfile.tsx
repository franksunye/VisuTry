'use client'

import { CheckCircle2, Loader2 } from 'lucide-react'
import { classifyJawProfile } from '@/lib/face-landmark-metrics'
import type { FaceLandmarkDetectionResult } from '@/lib/face-landmark-client'
import type { FaceGeometryAnalysis } from '@/types/face-analysis'
import { StoreFitMapOverlay } from '@/components/store/StoreFitMapOverlay'

export type StoreFitProfileCopy = {
  eyebrow: string
  title: string
  detected: string
  analyzing: string
  unavailableTitle: string
  unavailableBody: string
  profileLabel: string
  whyTitle: string
  mapAlt: string
  mapFallback: string
}

export type StoreFitProfileData = {
  summary: string
  tags: string[]
  explanation: string
}

function titleCase(value: string): string {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value
}

function widthTag(value: number | undefined): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (value >= 0.88) return 'Broad width'
  if (value < 0.8) return 'Narrow width'
  return 'Medium width'
}

function lengthTag(value: number | undefined): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (value >= 1.42) return 'Longer length'
  if (value < 1.2) return 'Compact length'
  return 'Balanced length'
}

function jawTag(value: number | undefined): string | null {
  const profile = classifyJawProfile(value)
  if (profile === 'strong') return 'Defined jawline'
  if (profile === 'tapered') return 'Soft jawline'
  if (profile === 'balanced') return 'Balanced jawline'
  return null
}

export function buildStoreFitProfile(geometry: FaceGeometryAnalysis | null | undefined): StoreFitProfileData | null {
  if (!geometry || geometry.status !== 'measured' || !geometry.measuredShape) return null

  const shape = titleCase(geometry.measuredShape)
  const tags = [
    widthTag(geometry.ratios?.cheekToFaceWidth),
    lengthTag(geometry.ratios?.faceAspectRatio),
    jawTag(geometry.ratios?.jawToCheekWidth),
  ].filter((tag): tag is string => Boolean(tag))
  const width = tags.find((tag) => tag.endsWith('width'))
  const explanation = width
    ? `We prioritized frames to complement your ${shape.toLowerCase()} profile with a ${width.toLowerCase().replace(' ', '-')} fit.`
    : `We prioritized frames that complement your ${shape.toLowerCase()} profile and keep the fit balanced.`

  return {
    summary: `${shape} profile`,
    tags,
    explanation,
  }
}

type StoreFitProfileProps = {
  photoPreview: string
  geometry: FaceGeometryAnalysis | null
  detection: FaceLandmarkDetectionResult | null
  analyzing: boolean
  copy: StoreFitProfileCopy
}

export function StoreFitProfile({ photoPreview, geometry, detection, analyzing, copy }: StoreFitProfileProps) {
  const profile = buildStoreFitProfile(geometry)
  const profileDetected = Boolean(profile)

  return (
    <section
      className="rounded-[2rem] border border-blue-100 bg-white p-5 shadow-[0_18px_55px_rgba(37,99,235,0.08)] sm:p-7"
      aria-labelledby="store-fit-profile-title"
      data-testid="store-fit-profile"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{copy.eyebrow}</p>
          <h2 id="store-fit-profile-title" className="mt-2 font-serif text-2xl font-semibold text-slate-950 sm:text-3xl">{copy.title}</h2>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${profileDetected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>
          {profileDetected ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : null}
          {analyzing && !profile ? copy.analyzing : profileDetected ? copy.detected : copy.mapFallback}
        </span>
      </div>

      <div className="grid gap-5 sm:grid-cols-[minmax(170px,0.42fr)_minmax(0,1fr)] sm:items-start sm:gap-7">
        <StoreFitMapOverlay
          imageUrl={photoPreview}
          detection={profileDetected ? detection : null}
          imageAlt={copy.mapAlt}
          detectedLabel={copy.detected}
          fallbackLabel={copy.mapFallback}
        />

        {profile ? (
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{copy.profileLabel}</p>
            <h3 className="mt-2 font-serif text-2xl font-semibold text-slate-950">{profile.summary}</h3>
            {profile.tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2" aria-label="Fit signals">
                {profile.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">{tag}</span>
                ))}
              </div>
            ) : null}
            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{copy.whyTitle}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{profile.explanation}</p>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[150px] min-w-0 flex-col justify-center rounded-2xl bg-slate-50 p-5">
            {analyzing ? <Loader2 className="h-5 w-5 animate-spin text-blue-600" aria-hidden="true" /> : null}
            <h3 className="mt-3 font-serif text-xl font-semibold text-slate-950">{analyzing ? copy.analyzing : copy.unavailableTitle}</h3>
            {!analyzing ? <p className="mt-2 text-sm leading-6 text-slate-600">{copy.unavailableBody}</p> : null}
          </div>
        )}
      </div>
    </section>
  )
}
