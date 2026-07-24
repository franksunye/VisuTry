'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Glasses, Info, Sparkles } from 'lucide-react'
import { getFaceShapeIcon } from '@/config/face-analysis'
import { getFaceShapeContent } from '@/config/face-shape-content'
import { FaceLandmarkMeshOverlay } from '@/components/face-analysis/FaceLandmarkMeshOverlay'
import { FaceLandmarkMetricVisual } from '@/components/face-analysis/FaceLandmarkMetricVisual'
import { buildMeasuredFaceMetrics } from '@/lib/face-landmark-metrics'
import { analytics } from '@/lib/analytics'
import type { FaceLandmarkDetectionResult } from '@/lib/face-landmark-client'
import type { FaceAnalysisMetric, FaceGeometryAnalysis } from '@/types/face-analysis'

interface FreeFaceShapeResultProps {
  locale: string
  imageUrl: string
  geometry: FaceGeometryAnalysis
  detection: FaceLandmarkDetectionResult
}

export function FreeFaceShapeResult({
  locale,
  imageUrl,
  geometry,
  detection,
}: FreeFaceShapeResultProps) {
  if (geometry.status !== 'measured' || !geometry.measuredShape || !geometry.ratios) return null

  const guide = getFaceShapeContent(geometry.measuredShape)
  if (!guide) return null

  const ShapeIcon = getFaceShapeIcon(geometry.measuredShape)
  const metrics = buildMeasuredFaceMetrics(
    geometry.measuredShape,
    geometry.measuredConfidence ?? 0.6,
    geometry,
    { interpretation: 'landmark-only' },
  ) ?? []
  const summaryMetrics = metrics.filter((metric) => metric.id !== 'faceShape' && metric.id !== 'symmetry').slice(0, 4)
  const matchLabel = getGeometryMatchLabel(geometry.measuredConfidence)
  const closestAlternative = geometry.alternativeShapes?.[0]

  return (
    <div className="flex flex-col gap-y-5" aria-live="polite">
      <div className="grid gap-4 lg:grid-cols-[minmax(260px,0.78fr)_minmax(0,1.22fr)]">
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[360px] overflow-hidden rounded-lg bg-gray-100">
            <Image
              src={imageUrl}
              alt="Photo measured for the free face-shape result"
              fill
              unoptimized
              sizes="(max-width: 1024px) 100vw, 360px"
              className="object-cover"
            />
            <FaceLandmarkMeshOverlay
              imageUrl={imageUrl}
              detection={detection}
              className="pointer-events-none absolute inset-0 h-full w-full"
            />
          </div>
          <p className="mt-2 text-center text-xs text-gray-500">
            Live landmark mesh · processed on your device
          </p>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Your likely face shape</p>
          <div className="mt-3 flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <ShapeIcon className="h-7 w-7" />
            </span>
            <div>
              <h3 className="text-3xl font-bold text-gray-950">{guide.name}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                  {matchLabel}
                </span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {geometry.qualityScore}% photo quality
                </span>
              </div>
              {closestAlternative && (
                <p className="mt-2 text-xs text-gray-500">
                  Closest alternative: <span className="font-semibold capitalize text-gray-700">{closestAlternative}</span>
                </p>
              )}
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-gray-600">{guide.shortDefinition}</p>

          <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-gray-100 pt-5">
            {summaryMetrics.map((metric) => (
              <div key={metric.id}>
                <p className="text-xs text-gray-500">{metric.label}</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-950">{metric.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-gray-100 pt-5">
            <p className="text-sm font-semibold text-gray-950">Why this result</p>
            <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {geometry.signals.slice(0, 4).map((signal) => (
                <li key={signal} className="flex items-start gap-2 text-sm leading-5 text-gray-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-5">
        <div>
          <p className="text-sm font-semibold text-blue-950">See how frames look on your {guide.name.toLowerCase()} face</p>
          <p className="mt-1 text-sm leading-6 text-blue-800">Use your own glasses image as the visual check before deciding.</p>
        </div>
        <Link
          href={`/${locale}/try-on/glasses?source=free-face-shape-detector`}
          onClick={() => analytics.trackFaceShapeDetectorCta(guide.slug, 'virtual_try_on')}
          className="mt-3 inline-flex w-full shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 sm:mt-0 sm:w-auto"
        >
          <Glasses className="me-2 h-4 w-4" />
          Open virtual try-on
        </Link>
      </section>

      <MeasurementDetails metrics={metrics} detection={detection} warnings={geometry.warnings} />

      <section className="rounded-lg border border-violet-200 bg-gradient-to-r from-violet-50 to-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-violet-800">
            <Sparkles className="h-4 w-4" />
            AI Glasses Advisor
          </div>
          <h3 className="mt-2 text-lg font-bold text-gray-950">Turn these measurements into a frame shortlist</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
            Add AI styling review for recommended frames, avoid-first styles, reasons, and try-on suggestions.
          </p>
        </div>
        <div className="mt-4 flex shrink-0 flex-col gap-2 sm:mt-0 sm:items-end">
          <Link
            href={`/${locale}/face-analysis`}
            onClick={() => analytics.trackFaceShapeDetectorCta(guide.slug, 'glasses_advisor')}
            className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Get personalized advice <ArrowRight className="ms-2 h-4 w-4" />
          </Link>
          <Link
            href={`/${locale}/face-shapes/${guide.slug}`}
            onClick={() => analytics.trackFaceShapeDetectorCta(guide.slug, 'face_shape_guide')}
            className="text-center text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            Read the {guide.name.toLowerCase()} face guide
          </Link>
        </div>
      </section>

      <div className="flex items-start gap-2 text-xs leading-5 text-gray-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          Ratios are estimated from this photo, not physical dimensions. Camera angle, expression, hair, and lighting can change the result. Raw landmarks remain in browser memory and are not uploaded by this tool.
        </p>
      </div>
    </div>
  )
}

function MeasurementDetails({
  metrics,
  detection,
  warnings,
}: {
  metrics: FaceAnalysisMetric[]
  detection: FaceLandmarkDetectionResult
  warnings: string[]
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <h3 className="text-sm font-semibold text-gray-950">Measured face details</h3>
        </div>
        <div className="mt-1 flex items-start gap-1.5 text-xs leading-5 text-gray-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Calculated on your device from image-based landmark ratios. These are styling estimates, not physical measurements.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className="rounded-lg border border-gray-200 bg-white p-3 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-4"
            title={metric.detail}
          >
            <p className="text-xs font-semibold text-gray-950">{metric.label}</p>
            <FaceLandmarkMetricVisual metric={metric} landmarks={detection.landmarks} />
            <p className="mt-2 text-xs font-semibold text-blue-700 sm:mt-3 sm:text-sm">{metric.value}</p>
            <p className={`mt-1 text-[11px] font-semibold sm:text-xs ${metric.id === 'faceShape' ? 'text-green-600' : 'text-gray-950'}`}>
              {metric.id === 'faceShape' ? `${metric.score}% geometry match` : metric.caption}
            </p>
          </div>
        ))}
      </div>

      {warnings.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
          {warnings.join(' ')}
        </div>
      )}

      <details className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-gray-800">
          What each measurement means
        </summary>
        <dl className="mt-3 grid gap-3 text-xs leading-5 text-gray-600 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.id}>
              <dt className="font-semibold text-gray-900">{metric.label}</dt>
              <dd>{metric.detail}</dd>
            </div>
          ))}
        </dl>
      </details>
    </section>
  )
}

function getGeometryMatchLabel(confidence?: number) {
  if ((confidence ?? 0) >= 0.82) return 'Strong geometry match'
  if ((confidence ?? 0) >= 0.7) return 'Likely geometry match'
  return 'Close geometry match'
}
