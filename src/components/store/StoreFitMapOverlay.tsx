'use client'

import type { FaceLandmarkDetectionResult } from '@/lib/face-landmark-client'
import { FACE_ANALYSIS_HIGHLIGHT_POINT_INDICES } from '@/lib/face-landmark-visualization'
import { FaceLandmarkMeshOverlay } from '@/components/face-analysis/FaceLandmarkMeshOverlay'

type StoreFitMapOverlayProps = {
  imageUrl: string
  detection: FaceLandmarkDetectionResult | null
  imageAlt: string
  detectedLabel: string
  fallbackLabel: string
}

export function StoreFitMapOverlay({
  imageUrl,
  detection,
  imageAlt,
  detectedLabel,
  fallbackLabel,
}: StoreFitMapOverlayProps) {
  const pointCount = detection
    ? FACE_ANALYSIS_HIGHLIGHT_POINT_INDICES.filter((index) => {
        const point = detection.landmarks[index]
        return Boolean(point && Number.isFinite(point.x) && Number.isFinite(point.y))
      }).length
    : 0

  return (
    <div
      className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-slate-100 shadow-inner sm:mx-0 sm:max-w-[260px]"
      data-fit-map="store"
      data-testid="store-fit-map"
      data-fit-map-overlay={detection ? 'visible' : 'suppressed'}
      data-fit-map-point-count={pointCount}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover" />
      {detection ? (
        <FaceLandmarkMeshOverlay
          imageUrl={imageUrl}
          detection={detection}
          variant="lightweight"
          testId="store-fit-map-overlay"
          showStatus={false}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-75 transition-opacity duration-500"
        />
      ) : null}
      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/88 px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 shadow-sm backdrop-blur">
        <span className={`h-1.5 w-1.5 rounded-full ${detection ? 'bg-blue-500' : 'bg-slate-300'}`} aria-hidden="true" />
        {detection ? detectedLabel : fallbackLabel}
      </span>
    </div>
  )
}
