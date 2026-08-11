'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { AlertCircle, Camera, CheckCircle2, Loader2, RotateCcw, Upload } from 'lucide-react'
import { FreeFaceShapeResult } from '@/components/face-shape/FreeFaceShapeResult'
import { analyzeFaceLandmarkFile } from '@/lib/face-landmark-client'
import { analytics } from '@/lib/analytics'
import { compressImage } from '@/utils/image'
import type { FaceShapeFailureReason } from '@/config/face-analysis'
import type { FaceLandmarkDetectionResult } from '@/lib/face-landmark-client'
import type { FaceGeometryAnalysis } from '@/types/face-analysis'
import { getFaceShapeDetectorUiCopy } from '@/config/face-shape-detector-ui-locales'

interface FreeFaceShapeDetectorProps {
  locale: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024
const DETECTOR_MAX_DIMENSION = 1280
const DETECTOR_QUALITY = 0.88
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

interface DetectionDiagnostics {
  sourceFileType: string
  sourceFileSize: number
  detectorFileType: string
  detectorFileSize: number
  detectedFileFormat?: string
  compressionFailed?: boolean
  compressionErrorName?: string
  compressionErrorMessage?: string
  bitmapDecodeErrorName?: string
  bitmapDecodeErrorMessage?: string
  htmlImageDecodeErrorName?: string
  htmlImageDecodeErrorMessage?: string
}

function normalizeImageError(error: unknown) {
  const name = error instanceof Error && error.name ? error.name.slice(0, 64) : 'UnknownError'
  const rawMessage = error instanceof Error ? error.message.toLowerCase() : ''

  let message = 'other'
  if (rawMessage.includes('unsupported')) message = 'unsupported_image'
  else if (rawMessage.includes('decode')) message = 'decode_failed'
  else if (rawMessage.includes('invalid')) message = 'invalid_image'
  else if (rawMessage.includes('load')) message = 'image_load_failed'
  else if (rawMessage.includes('dimension')) message = 'invalid_dimensions'
  else if (rawMessage.includes('abort')) message = 'aborted'
  else if (rawMessage.includes('memory')) message = 'memory_error'

  return { name, message }
}

function recordDetection(
  status: 'COMPLETED' | 'FAILED',
  failureReason?: FaceShapeFailureReason,
  diagnostics?: DetectionDiagnostics,
) {
  const payload = {
    status,
    ...(failureReason ? { failureReason } : {}),
    ...(diagnostics ? { diagnostics } : {}),
  }

  void fetch('/api/face-shape-detector/usage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Business telemetry must never interrupt the on-device detector experience.
  })
}

export function FreeFaceShapeDetector({ locale }: FreeFaceShapeDetectorProps) {
  const copy = getFaceShapeDetectorUiCopy(locale)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
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
    setPhotoFile(null)

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

    analytics.trackFaceShapeDetectorStart()
    analytics.trackFaceShapeDetectorUpload(file.type, file.size)
    const startedAt = performance.now()
    const nextPreviewUrl = URL.createObjectURL(file)
    setPhotoFile(file)
    setPreviewUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl)
      return nextPreviewUrl
    })
    setIsAnalyzing(true)

    try {
      // Preserve the original file for preview/commercial handoff, while giving
      // MediaPipe a bounded working image to reduce mobile decode/GPU memory cost.
      let detectorFile = file
      let compressionErrorName: string | undefined
      let compressionErrorMessage: string | undefined
      try {
        detectorFile = await compressImage(
          file,
          DETECTOR_MAX_DIMENSION,
          DETECTOR_QUALITY,
          { profile: 'user-photo' },
        )
      } catch (compressionError) {
        // The raw file is still a valid compatibility fallback. The decoder
        // itself has a second HTMLImageElement path for browsers where canvas
        // conversion or createImageBitmap is unavailable for this file.
        const normalized = normalizeImageError(compressionError)
        compressionErrorName = normalized.name
        compressionErrorMessage = normalized.message
      }

      const analysis = await analyzeFaceLandmarkFile(detectorFile)
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
        recordDetection('FAILED', analysis.geometry.failureReason ?? 'unknown', {
          sourceFileType: file.type,
          sourceFileSize: file.size,
          detectorFileType: detectorFile.type,
          detectorFileSize: detectorFile.size,
          ...(compressionErrorName
            ? {
                compressionFailed: true,
                compressionErrorName,
                ...(compressionErrorMessage ? { compressionErrorMessage } : {}),
              }
            : {}),
          ...(analysis.decodeDiagnostics ?? {}),
        })
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
    setPhotoFile(null)
    setResult(null)
    setDetection(null)
    setError(null)
    setIsAnalyzing(false)
  }

  const hasMeasuredResult = Boolean(
    previewUrl &&
    photoFile &&
    detection &&
    result?.status === 'measured' &&
    result.measuredShape &&
    result.ratios,
  )

  const hasMobileDualActions = Boolean(copy.takeSelfie && copy.chooseFromPhotos)

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg sm:p-5 md:p-7" aria-labelledby="detector-title">
      <div className="mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-normal text-blue-600 sm:mb-2 sm:text-sm">{copy.toolLabel}</p>
          <h2 id="detector-title" className="text-xl font-bold text-gray-950 sm:text-2xl">
            {hasMeasuredResult ? copy.resultTitle : copy.uploadTitle}
          </h2>
          <p className="mt-1.5 max-w-2xl text-xs leading-5 text-gray-600 sm:mt-2 sm:text-sm sm:leading-6">
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

      {hasMeasuredResult && photoFile && previewUrl && detection && result ? (
        <FreeFaceShapeResult
          locale={locale}
          photoFile={photoFile}
          imageUrl={previewUrl}
          geometry={result}
          detection={detection}
        />
      ) : (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            {!previewUrl && (
              <div className="sm:hidden">
                {hasMobileDualActions ? (
                  <div className="grid gap-2.5">
                    <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm active:bg-blue-700">
                      <Camera className="h-4 w-4" />
                      {copy.takeSelfie}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        capture="user"
                        className="sr-only"
                        onChange={handleFileChange}
                        disabled={isAnalyzing}
                        aria-label={copy.takeSelfie}
                      />
                    </label>
                    <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm active:bg-gray-50">
                      <Upload className="h-4 w-4" />
                      {copy.chooseFromPhotos}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={handleFileChange}
                        disabled={isAnalyzing}
                        aria-label={copy.choosePhoto}
                      />
                    </label>
                  </div>
                ) : (
                  <label className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm active:bg-blue-700">
                    <Upload className="h-4 w-4" />
                    {copy.choosePhoto}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={handleFileChange}
                      disabled={isAnalyzing}
                      aria-label={copy.choosePhoto}
                    />
                  </label>
                )}
                <p className="mt-2 text-center text-[11px] leading-4 text-gray-500">{copy.fileHint}</p>
                <div className="mt-3 rounded-lg border border-green-100 bg-green-50/60 px-3 py-2.5 text-xs leading-5 text-gray-700">
                  <p className="font-semibold text-gray-900">For the clearest result</p>
                  <p className="mt-0.5">{copy.errorHint}</p>
                </div>
              </div>
            )}

            <label className={`${previewUrl ? 'flex' : 'hidden sm:flex'} group min-h-[220px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center hover:border-blue-400 hover:bg-blue-50/40 sm:min-h-[280px] sm:p-5`}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleFileChange}
                disabled={isAnalyzing}
                aria-label={copy.choosePhoto}
              />
              {previewUrl ? (
                <span className="relative block h-[220px] w-full overflow-hidden rounded-lg bg-gray-100 sm:h-[250px]">
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

          <div className={`${!isAnalyzing && !error ? 'hidden sm:block' : 'block'} min-h-[180px] rounded-lg border border-gray-200 bg-gray-50 p-4 sm:min-h-[280px] sm:p-5`} aria-live="polite">
            {isAnalyzing ? (
              <div className="flex h-full min-h-[160px] flex-col items-center justify-center text-center sm:min-h-[240px]">
                <Loader2 className="mb-3 h-7 w-7 animate-spin text-blue-600 sm:mb-4 sm:h-8 sm:w-8" />
                <h3 className="font-semibold text-gray-950">{copy.analyzingTitle}</h3>
                <p className="mt-2 text-sm text-gray-600">{copy.analyzingText}</p>
              </div>
            ) : error ? (
              <div className="flex h-full min-h-[160px] flex-col items-center justify-center text-center sm:min-h-[240px]">
                <AlertCircle className="mb-3 h-7 w-7 text-amber-600 sm:mb-4 sm:h-8 sm:w-8" />
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
        <p className="mt-4 text-[11px] leading-4 text-gray-500 sm:mt-5 sm:text-xs sm:leading-5">
          {copy.disclaimer}
        </p>
      )}
    </section>
  )
}
