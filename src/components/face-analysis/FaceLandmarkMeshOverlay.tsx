'use client'

import { useEffect, useRef, useState } from 'react'
import {
  detectFaceLandmarksFromImage,
  FaceLandmarkDetectionResult,
} from '@/lib/face-landmark-client'
import { FaceLandmarkPoint } from '@/types/face-analysis'
import {
  createCoverMapper,
  FACE_ANALYSIS_HIGHLIGHT_POINT_INDICES,
  selectFaceLandmarkOverlayConnections,
  type FaceLandmarkOverlayVariant,
} from '@/lib/face-landmark-visualization'

interface FaceLandmarkMeshOverlayProps {
  imageUrl: string
  detection?: FaceLandmarkDetectionResult | null
  className?: string
  onStatusChange?: (status: 'measured' | 'fallback') => void
  variant?: FaceLandmarkOverlayVariant
  testId?: string
  showStatus?: boolean
}

export function FaceLandmarkMeshOverlay({
  imageUrl,
  detection: precomputedDetection,
  className,
  onStatusChange,
  variant = 'full',
  testId,
  showStatus = true,
}: FaceLandmarkMeshOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const detectionRef = useRef<FaceLandmarkDetectionResult | null>(null)
  const [status, setStatus] = useState<'loading' | 'measured' | 'fallback'>('loading')

  useEffect(() => {
    let cancelled = false
    const image = new Image()
    if (isCrossOriginUrl(imageUrl)) {
      image.crossOrigin = 'anonymous'
    }
    image.decoding = 'async'
    image.src = imageUrl
    imageRef.current = image

    async function detect() {
      try {
        await image.decode()
        if (cancelled) return
        const detection = precomputedDetection === undefined
          ? await detectFaceLandmarksFromImage(image)
          : precomputedDetection
        if (cancelled) return
        detectionRef.current = detection
        const nextStatus = detection ? 'measured' : 'fallback'
        setStatus(nextStatus)
        onStatusChange?.(nextStatus)
        drawOverlay()
      } catch {
        if (cancelled) return
        detectionRef.current = null
        setStatus('fallback')
        onStatusChange?.('fallback')
        drawOverlay()
      }
    }

    void detect()

    return () => {
      cancelled = true
    }
  }, [imageUrl, onStatusChange, precomputedDetection, variant])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (typeof ResizeObserver === 'undefined') {
      drawOverlay()
      window.addEventListener('resize', drawOverlay)
      return () => window.removeEventListener('resize', drawOverlay)
    }

    const resizeObserver = new ResizeObserver(() => drawOverlay())
    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    const redrawForPrint = () => {
      drawOverlay()
      window.requestAnimationFrame(() => drawOverlay())
      window.setTimeout(drawOverlay, 120)
    }

    window.addEventListener('beforeprint', redrawForPrint)
    window.addEventListener('afterprint', redrawForPrint)

    return () => {
      window.removeEventListener('beforeprint', redrawForPrint)
      window.removeEventListener('afterprint', redrawForPrint)
    }
  }, [])

  function drawOverlay() {
    const canvas = canvasRef.current
    const container = containerRef.current
    const image = imageRef.current
    if (!canvas || !container || !image?.naturalWidth || !image?.naturalHeight) return

    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.max(1, Math.round(rect.width * dpr))
    canvas.height = Math.max(1, Math.round(rect.height * dpr))
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, rect.width, rect.height)

    const detection = detectionRef.current
    // Never draw a generic face ellipse for a completed report. A guessed guide
    // can look like measured geometry and undermines trust when detection fails.
    if (!detection) return

    const mapper = createCoverMapper(
      image.naturalWidth,
      image.naturalHeight,
      rect.width,
      rect.height
    )

    const isCompact = rect.width < 260
    const overlayConnections = selectFaceLandmarkOverlayConnections(detection.connections, variant)

    drawConnections(ctx, detection.landmarks, overlayConnections.tesselation, mapper, {
      color: isCompact ? 'rgba(56, 189, 248, 0.28)' : 'rgba(56, 189, 248, 0.34)',
      width: isCompact ? 0.55 : 0.65,
      step: isCompact ? 2 : 1,
    })
    drawConnections(ctx, detection.landmarks, overlayConnections.contours, mapper, {
      color: 'rgba(37, 99, 235, 0.9)',
      width: isCompact ? 1.05 : 1.2,
    })
    drawConnections(ctx, detection.landmarks, overlayConnections.irises, mapper, {
      color: 'rgba(124, 58, 237, 0.72)',
      width: isCompact ? 0.9 : 1,
    })
    drawHighlightPoints(ctx, detection.landmarks, mapper, isCompact)
  }

  return (
    <div
      ref={containerRef}
      className={className}
      aria-hidden
      data-testid={testId}
      data-face-landmark-overlay-variant={variant}
      data-face-landmark-highlight-count={FACE_ANALYSIS_HIGHLIGHT_POINT_INDICES.length}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
      {showStatus && status === 'loading' && (
        <div className="absolute bottom-2 right-2 rounded-full bg-white/85 px-2 py-1 text-[10px] font-semibold text-blue-700 shadow-sm">
          Detecting landmarks
        </div>
      )}
      {showStatus && status === 'fallback' && (
        <div className="absolute bottom-2 right-2 rounded-full bg-white/85 px-2 py-1 text-[10px] font-semibold text-gray-600 shadow-sm">
          Landmark visualization unavailable
        </div>
      )}
    </div>
  )
}

function isCrossOriginUrl(url: string) {
  if (typeof window === 'undefined') return false
  try {
    return new URL(url, window.location.href).origin !== window.location.origin
  } catch {
    return false
  }
}

function drawConnections(
  ctx: CanvasRenderingContext2D,
  landmarks: FaceLandmarkPoint[],
  connections: Array<{ start: number; end: number }>,
  mapPoint: (point: FaceLandmarkPoint) => { x: number; y: number },
  style: { color: string; width: number; step?: number }
) {
  if (connections.length === 0) return
  ctx.save()
  ctx.strokeStyle = style.color
  ctx.lineWidth = style.width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  const step = style.step ?? 1
  for (let index = 0; index < connections.length; index += step) {
    const connection = connections[index]
    const start = landmarks[connection.start]
    const end = landmarks[connection.end]
    if (!start || !end) continue
    const a = mapPoint(start)
    const b = mapPoint(end)
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
  }
  ctx.stroke()
  ctx.restore()
}

function drawHighlightPoints(
  ctx: CanvasRenderingContext2D,
  landmarks: FaceLandmarkPoint[],
  mapPoint: (point: FaceLandmarkPoint) => { x: number; y: number },
  isCompact: boolean
) {
  ctx.save()
  const radius = isCompact ? 2.15 : 2.5
  for (const index of FACE_ANALYSIS_HIGHLIGHT_POINT_INDICES) {
    const point = landmarks[index]
    if (!point) continue
    const { x, y } = mapPoint(point)
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = '#2563eb'
    ctx.fill()
    ctx.lineWidth = isCompact ? 1.15 : 1.35
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'
    ctx.stroke()
  }
  ctx.restore()
}
