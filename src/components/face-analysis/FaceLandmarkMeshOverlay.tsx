'use client'

import { useEffect, useRef, useState } from 'react'
import {
  detectFaceLandmarksFromImage,
  FaceLandmarkDetectionResult,
} from '@/lib/face-landmark-client'
import { FaceLandmarkPoint } from '@/types/face-analysis'

interface FaceLandmarkMeshOverlayProps {
  imageUrl: string
  className?: string
  onStatusChange?: (status: 'measured' | 'fallback') => void
}

const HIGHLIGHT_POINTS = [
  10, 152, 234, 454, 33, 263, 61, 291, 1, 199,
]

export function FaceLandmarkMeshOverlay({
  imageUrl,
  className,
  onStatusChange,
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
        const detection = await detectFaceLandmarksFromImage(image)
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
  }, [imageUrl, onStatusChange])

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
    if (!detection) {
      drawFallback(ctx, rect.width, rect.height)
      return
    }

    const mapper = createCoverMapper(
      image.naturalWidth,
      image.naturalHeight,
      rect.width,
      rect.height
    )

    const isCompact = rect.width < 260

    drawConnections(ctx, detection.landmarks, detection.connections.tesselation, mapper, {
      color: isCompact ? 'rgba(56, 189, 248, 0.28)' : 'rgba(56, 189, 248, 0.34)',
      width: isCompact ? 0.55 : 0.65,
      step: isCompact ? 2 : 1,
    })
    drawConnections(ctx, detection.landmarks, detection.connections.contours, mapper, {
      color: 'rgba(37, 99, 235, 0.9)',
      width: isCompact ? 1.05 : 1.2,
    })
    drawConnections(ctx, detection.landmarks, detection.connections.irises, mapper, {
      color: 'rgba(124, 58, 237, 0.72)',
      width: isCompact ? 0.9 : 1,
    })
    drawHighlightPoints(ctx, detection.landmarks, mapper, isCompact)
  }

  return (
    <div ref={containerRef} className={className} aria-hidden>
      <canvas ref={canvasRef} className="h-full w-full" />
      {status === 'loading' && (
        <div className="absolute bottom-2 right-2 rounded-full bg-white/85 px-2 py-1 text-[10px] font-semibold text-blue-700 shadow-sm">
          Detecting landmarks
        </div>
      )}
      {status === 'fallback' && (
        <div className="absolute bottom-2 right-2 rounded-full bg-white/85 px-2 py-1 text-[10px] font-semibold text-gray-600 shadow-sm">
          Guide overlay
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

function createCoverMapper(
  naturalWidth: number,
  naturalHeight: number,
  containerWidth: number,
  containerHeight: number
) {
  const scale = Math.max(containerWidth / naturalWidth, containerHeight / naturalHeight)
  const renderedWidth = naturalWidth * scale
  const renderedHeight = naturalHeight * scale
  const offsetX = (containerWidth - renderedWidth) / 2
  const offsetY = (containerHeight - renderedHeight) / 2

  return (point: FaceLandmarkPoint) => ({
    x: offsetX + point.x * renderedWidth,
    y: offsetY + point.y * renderedHeight,
  })
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
  for (const index of HIGHLIGHT_POINTS) {
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

function drawFallback(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save()
  ctx.strokeStyle = 'rgba(37, 99, 235, 0.5)'
  ctx.lineWidth = 1.25
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.ellipse(width / 2, height * 0.48, width * 0.28, height * 0.34, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.strokeStyle = 'rgba(255,255,255,0.72)'
  ctx.beginPath()
  ctx.moveTo(width / 2, height * 0.17)
  ctx.lineTo(width / 2, height * 0.82)
  ctx.moveTo(width * 0.32, height * 0.42)
  ctx.lineTo(width * 0.68, height * 0.42)
  ctx.moveTo(width * 0.37, height * 0.62)
  ctx.lineTo(width * 0.63, height * 0.62)
  ctx.stroke()
  ctx.restore()
}
