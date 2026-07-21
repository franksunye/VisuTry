'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { AlertCircle, CheckCircle2, Loader2, RotateCcw, Upload } from 'lucide-react'
import { FreeFaceShapeResult } from '@/components/face-shape/FreeFaceShapeResult'
import { analyzeFaceLandmarkFile } from '@/lib/face-landmark-client'
import { analytics } from '@/lib/analytics'
import type { FaceShapeFailureReason } from '@/config/face-analysis'
import type { FaceLandmarkDetectionResult } from '@/lib/face-landmark-client'
import type { FaceGeometryAnalysis } from '@/types/face-analysis'
import { getFaceShapeDetectorUiCopy } from '@/config/face-shape-detector-ui-locales'

interface FreeFaceShapeDetectorProps {
  locale: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
function recordDetection(status: 'COMPLETED' | 'FAILED', failureReason?: FaceShapeFailureReason) {
  void fetch('/api/face-shape-detector/usage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, failureReason }),
    keepalive: true,
  }).catch(() => {
    // Business telemetry must never interrupt the on-device detector experience.
  })
}

export function FreeFaceShapeDetector({ locale }: FreeFaceShapeDetectorProps) {
  const copy = getFaceShapeDetectorUiCopy(locale)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<FaceGeometryAnalysis | null>(null)
  const [detection, setDetection] = useState<FaceLandmarkDetectionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return

    setError(null)
    setResult(null)
    setDetection(null)

    if (!ACCEPTED_TYPES.has(file.type)) {
      const message = 'Choose a JPG, PNG, or WebP image.'
      setError(message)
      analytics.trackFaceShapeDetectorFailed(message)
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      const message = 'Choose an image smaller than 10 MB.'
      setError(message)
      analytics.trackFaceShapeDetectorFailed(message)
      return
    }

    analytics.trackFaceShapeDetectorUpload(file.type, file.size)
    const startedAt = performance.now()
    const nextPreviewUrl = URL.createObjectURL(file)
    setPreviewUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl)
      return nextPreviewUrl
    })
    setIsAnalyzing(true)

    try {
      const analysis = await analyzeFaceLandmarkFile(file)
      setResult(analysis.geometry)
      setDetection(analysis.detection)

      if (
        analysis.geometry.status === 'measured' &&
        analysis.geometry.measuredShape &&
        analysis.detection
      ) {
        analytics.trackFaceShapeDetectorComplete(
          analysis.geometry.measuredShape,
          analysis.geometry.qualityScore,
          Math.round(performance.now() - startedAt),
        )
        recordDetection('COMPLETED')
      } else {
        const message = analysis.geometry.warnings[0] ?? 'This photo could not be measured. Try a clear, straight-on image.'
        setError(message)
        analytics.trackFaceShapeDetectorFailed(message)
        recordDetection('FAILED', analysis.geometry.failureReason ?? 'unknown')
      }
    } catch {
      const message = 'Face analysis could not start in this browser. Try a recent version of Chrome, Edge, or Safari.'
      setError(message)
      analytics.trackFaceShapeDetectorFailed(message)
      recordDetection('FAILED', 'unknown')
    } finally {
      setIsAnalyzing(false)
    }
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setResult(null)
    setDetection(null)
    setError(null)
    setIsAnalyzing(false)
  }

  const hasMeasuredResult = Boolean(
    previewUrl &&
    detection &&
    result?.status === 'measured' &&
    result.measuredShape &&
    result.ratios,
  )

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-lg md:p-7" aria-labelledby="detector-title">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-normal text-blue-600">{copy.toolLabel}</p>
          <h2 id="detector-title" className="text-2xl font-bold text-gray-950">
            {hasMeasuredResult ? copy.resultTitle : copy.uploadTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            {copy.privacyText}
          </p>
        </div>
        {(previewUrl || result || error) && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4" />
            {copy.startOver}
          </button>
        )}
      </div>

      {hasMeasuredResult && previewUrl && detection && result ? (
        <FreeFaceShapeResult
          locale={locale}
          imageUrl={previewUrl}
          geometry={result}
          detection={detection}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <label className="group flex min-h-[280px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-5 text-center hover:border-blue-400 hover:bg-blue-50/40">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleFileChange}
                disabled={isAnalyzing}
              />
              {previewUrl ? (
                <span className="relative block h-[250px] w-full overflow-hidden rounded-lg bg-gray-100">
                  <Image
                    src={previewUrl}
                    alt={copy.uploadTitle}
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-contain"
                  />
                </span>
              ) : (
                <>
                  <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <Upload className="h-6 w-6" />
                  </span>
                  <span className="font-semibold text-gray-950">{copy.choosePhoto}</span>
                  <span className="mt-2 text-sm text-gray-600">{copy.fileHint}</span>
                  <span className="mt-1 text-xs text-gray-500">{copy.photoHint}</span>
                </>
              )}
            </label>
          </div>

          <div className="min-h-[280px] rounded-lg border border-gray-200 bg-gray-50 p-5" aria-live="polite">
            {isAnalyzing ? (
              <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
                <Loader2 className="mb-4 h-8 w-8 animate-spin text-blue-600" />
                <h3 className="font-semibold text-gray-950">{copy.analyzingTitle}</h3>
                <p className="mt-2 text-sm text-gray-600">{copy.analyzingText}</p>
              </div>
            ) : error ? (
              <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
                <AlertCircle className="mb-4 h-8 w-8 text-amber-600" />
                <h3 className="font-semibold text-gray-950">{copy.errorTitle}</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-gray-600">{error}</p>
                <p className="mt-4 text-xs leading-5 text-gray-500">{copy.errorHint}</p>
              </div>
            ) : (
              <div className="flex h-full min-h-[240px] flex-col justify-center">
                <h3 className="mb-4 text-lg font-semibold text-gray-950">{copy.featuresTitle}</h3>
                <ul className="grid gap-3 text-sm leading-6 text-gray-700">
                  {copy.features.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-green-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {!hasMeasuredResult && (
        <p className="mt-5 text-xs leading-5 text-gray-500">
          {copy.disclaimer}
        </p>
      )}
    </section>
  )
}
