'use client'

import type { FaceLandmarkDetectionResult } from '@/lib/face-landmark-client'
import type { FaceLandmarkPoint } from '@/types/face-analysis'

type StoreFitMapOverlayProps = {
  imageUrl: string
  detection: FaceLandmarkDetectionResult | null
  imageAlt: string
  detectedLabel: string
  fallbackLabel: string
}

// A small, intentional set of landmarks keeps the photo primary and makes the
// visual read as a fit map rather than a full face mesh.
export const STORE_FIT_MAP_POINT_INDICES = [
  10, 103, 332, 33, 263, 133, 362, 168, 98, 327, 234, 454, 123, 61, 352, 291, 172, 397, 1, 152,
] as const

const STORE_FIT_MAP_CONNECTIONS = [
  [103, 33],
  [33, 133],
  [332, 263],
  [263, 362],
  [168, 1],
  [98, 168],
  [327, 168],
  [234, 123],
  [123, 61],
  [454, 352],
  [352, 291],
  [172, 152],
  [397, 152],
] as const

function safePoint(point: FaceLandmarkPoint | undefined): FaceLandmarkPoint | null {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return null
  return {
    ...point,
    x: Math.min(1, Math.max(0, point.x)),
    y: Math.min(1, Math.max(0, point.y)),
  }
}

export function StoreFitMapOverlay({
  imageUrl,
  detection,
  imageAlt,
  detectedLabel,
  fallbackLabel,
}: StoreFitMapOverlayProps) {
  const points = detection
    ? STORE_FIT_MAP_POINT_INDICES
        .map((index) => safePoint(detection.landmarks[index]))
        .filter((point): point is FaceLandmarkPoint => point !== null)
    : []
  const pointByIndex = new Map<number, FaceLandmarkPoint>()

  if (detection) {
    for (const index of STORE_FIT_MAP_POINT_INDICES) {
      const point = safePoint(detection.landmarks[index])
      if (point) pointByIndex.set(index, point)
    }
  }

  return (
    <div
      className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-slate-100 shadow-inner sm:mx-0 sm:max-w-[260px]"
      data-fit-map="store"
      data-testid="store-fit-map"
      data-fit-map-overlay={detection ? 'visible' : 'suppressed'}
      data-fit-map-point-count={points.length}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover" />
      {detection ? (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-75 transition-opacity duration-500"
          data-testid="store-fit-map-overlay"
          viewBox="0 0 1 1"
          preserveAspectRatio="xMidYMid slice"
        >
          <g fill="none" stroke="rgba(96, 165, 250, 0.68)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.006">
            {STORE_FIT_MAP_CONNECTIONS.map(([start, end]) => {
              const from = pointByIndex.get(start)
              const to = pointByIndex.get(end)
              if (!from || !to) return null
              return <line key={`${start}-${end}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
            })}
          </g>
          <g fill="#60a5fa" stroke="rgba(255,255,255,0.92)" strokeWidth="0.004">
            {STORE_FIT_MAP_POINT_INDICES.map((index) => {
              const point = pointByIndex.get(index)
              if (!point) return null
              return <circle key={index} data-fit-map-point="true" data-testid="store-fit-map-point" cx={point.x} cy={point.y} r="0.012" />
            })}
          </g>
        </svg>
      ) : null}
      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/88 px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 shadow-sm backdrop-blur">
        <span className={`h-1.5 w-1.5 rounded-full ${detection ? 'bg-blue-500' : 'bg-slate-300'}`} aria-hidden="true" />
        {detection ? detectedLabel : fallbackLabel}
      </span>
    </div>
  )
}
