'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, RotateCcw, Upload } from 'lucide-react'
import { getFaceShapeContent } from '@/config/face-shape-content'
import { analyzeFaceGeometryFromFile } from '@/lib/face-landmark-client'
import { analytics } from '@/lib/analytics'
import type { FaceGeometryAnalysis } from '@/types/face-analysis'

interface FreeFaceShapeDetectorProps {
  locale: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const DETECTOR_FEATURES = [
  'A likely face-shape estimate from seven styling categories',
  'Input quality checks for multiple faces, tilt, and face size',
  'Measured geometry signals and a length-to-width ratio',
  'Direct links to glasses, hairstyle, and comparison guides',
] as const

export function FreeFaceShapeDetector({ locale }: FreeFaceShapeDetectorProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<FaceGeometryAnalysis | null>(null)
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
    setPreviewUrl(null)

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
    setPreviewUrl(nextPreviewUrl)
    setIsAnalyzing(true)

    try {
      const analysis = await analyzeFaceGeometryFromFile(file)
      setResult(analysis)
      if (analysis.status === 'measured' && analysis.measuredShape) {
        analytics.trackFaceShapeDetectorComplete(
          analysis.measuredShape,
          analysis.qualityScore,
          Math.round(performance.now() - startedAt),
        )
      } else {
        const message = analysis.warnings[0] ?? 'This photo could not be measured. Try a clear, straight-on image.'
        setError(message)
        analytics.trackFaceShapeDetectorFailed(message)
      }
    } catch {
      const message = 'Face analysis could not start in this browser. Try a recent version of Chrome, Edge, or Safari.'
      setError(message)
      analytics.trackFaceShapeDetectorFailed(message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  function reset() {
    setPreviewUrl(null)
    setResult(null)
    setError(null)
    setIsAnalyzing(false)
  }

  const measuredGuide = result?.status === 'measured' && result.measuredShape
    ? getFaceShapeContent(result.measuredShape)
    : null

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-lg md:p-7" aria-labelledby="detector-title">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-normal text-blue-600">Free on-device tool</p>
          <h2 id="detector-title" className="text-2xl font-bold text-gray-950">Upload one straight-on photo</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Your photo is processed in this browser. It is not sent to VisuTry&apos;s server or stored by this tool.
          </p>
        </div>
        {(previewUrl || result || error) && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4" />
            Start over
          </button>
        )}
      </div>

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
                  alt="Photo selected for local face-shape analysis"
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
                <span className="font-semibold text-gray-950">Choose a face photo</span>
                <span className="mt-2 text-sm text-gray-600">JPG, PNG, or WebP · up to 10 MB</span>
                <span className="mt-1 text-xs text-gray-500">One face, neutral expression, hair away from the outline</span>
              </>
            )}
          </label>
        </div>

        <div className="min-h-[280px] rounded-lg border border-gray-200 bg-gray-50 p-5" aria-live="polite">
          {isAnalyzing ? (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
              <Loader2 className="mb-4 h-8 w-8 animate-spin text-blue-600" />
              <h3 className="font-semibold text-gray-950">Mapping facial landmarks on your device</h3>
              <p className="mt-2 text-sm text-gray-600">The first run may take a moment while the browser loads the model.</p>
            </div>
          ) : measuredGuide && result?.ratios ? (
            <div>
              <div className="mb-5 flex items-start gap-3">
                <span className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-green-700">Likely face shape</p>
                  <h3 className="text-3xl font-bold text-gray-950">{measuredGuide.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{measuredGuide.shortDefinition}</p>
                </div>
              </div>

              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-normal text-gray-500">Analysis quality</p>
                  <p className="mt-1 text-xl font-bold text-gray-950">{result.qualityScore}/100</p>
                  <p className="mt-1 text-xs text-gray-500">Photo suitability, not classification accuracy</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-normal text-gray-500">Length-to-width</p>
                  <p className="mt-1 text-xl font-bold text-gray-950">{result.ratios.faceAspectRatio}:1</p>
                  <p className="mt-1 text-xs text-gray-500">Measured after image aspect correction</p>
                </div>
              </div>

              <ul className="mb-5 grid gap-2 text-sm leading-6 text-gray-700">
                {result.signals.slice(0, 4).map((signal) => (
                  <li key={signal} className="flex gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-blue-600" />
                    <span>{signal}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/${locale}/face-analysis`}
                  onClick={() => analytics.trackFaceShapeDetectorCta(measuredGuide.slug, 'glasses_advisor')}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Get personalized advice <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/${locale}/try-on/glasses`}
                  onClick={() => analytics.trackFaceShapeDetectorCta(measuredGuide.slug, 'virtual_try_on')}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-white"
                >
                  Try on glasses
                </Link>
              </div>
              <Link
                href={`/${locale}/face-shapes/${measuredGuide.slug}`}
                onClick={() => analytics.trackFaceShapeDetectorCta(measuredGuide.slug, 'face_shape_guide')}
                className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900"
              >
                Understand this face shape
              </Link>
            </div>
          ) : error ? (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
              <AlertCircle className="mb-4 h-8 w-8 text-amber-600" />
              <h3 className="font-semibold text-gray-950">Try another photo</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-gray-600">{error}</p>
              <p className="mt-4 text-xs leading-5 text-gray-500">Use one centered face, level eyes, even lighting, and a visible forehead and jaw.</p>
            </div>
          ) : (
            <div className="flex h-full min-h-[240px] flex-col justify-center">
              <h3 className="mb-4 text-lg font-semibold text-gray-950">What this free result includes</h3>
              <ul className="grid gap-3 text-sm leading-6 text-gray-700">
                {DETECTOR_FEATURES.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-green-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <p className="mt-5 text-xs leading-5 text-gray-500">
        This is a styling estimate, not identity recognition, a medical assessment, or a physical frame-size measurement. The MediaPipe model files are downloaded from a public CDN; your selected image remains in browser memory.
      </p>
    </section>
  )
}
