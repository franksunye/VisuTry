import type { FaceAnalysisMetric, FaceLandmarkPoint } from '@/types/face-analysis'

interface FaceLandmarkMetricVisualProps {
  metric: FaceAnalysisMetric
  landmarks: FaceLandmarkPoint[]
}

const FACE_OVAL_INDICES = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109, 10,
]

const JAWLINE_INDICES = [172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397]
const LEFT_EYE_INDICES = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7, 33]
const RIGHT_EYE_INDICES = [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249, 263]
const LEFT_BROW_INDICES = [70, 63, 105, 66, 107]
const RIGHT_BROW_INDICES = [336, 296, 334, 293, 300]
const NOSE_BRIDGE_INDICES = [168, 6, 197, 195, 5, 4, 1]
const NOSE_BASE_INDICES = [98, 97, 2, 326, 327]
const UPPER_LIP_INDICES = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291]
const LOWER_LIP_INDICES = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291]

export function FaceLandmarkMetricVisual({
  metric,
  landmarks,
}: FaceLandmarkMetricVisualProps) {
  const mapPoint = createLandmarkMiniMapper(landmarks)
  const outlinePath = buildPath(FACE_OVAL_INDICES, landmarks, mapPoint)
  const jawPath = buildPath(JAWLINE_INDICES, landmarks, mapPoint)
  const top = landmarks[10]
  const chin = landmarks[152]
  const leftFace = landmarks[234]
  const rightFace = landmarks[454]
  const leftCheek = landmarks[123]
  const rightCheek = landmarks[352]
  const noseBridge = landmarks[168]
  const eyeLeft = landmarks[33]
  const eyeRight = landmarks[263]

  return (
    <div className="relative mx-auto mt-2 h-[74px] w-[74px] sm:mt-3 sm:h-[108px] sm:w-[108px]">
      <svg viewBox="0 0 120 120" className="h-full w-full" fill="none" aria-hidden>
        <LandmarkSketch landmarks={landmarks} mapPoint={mapPoint} outlinePath={outlinePath} />
        {eyeLeft && eyeRight && (
          <line
            {...lineProps(mapPoint(eyeLeft), mapPoint(eyeRight))}
            stroke="#94A3B8"
            strokeWidth="1"
            opacity="0.24"
            strokeDasharray="2.5 5"
          />
        )}

        {metric.id === 'faceShape' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            <path d={outlinePath} stroke="rgba(37,99,235,0.18)" strokeWidth="7" />
            <path d={outlinePath} stroke="#2563EB" strokeWidth="3" />
          </g>
        )}

        {metric.id === 'faceLength' && top && chin && (
          <g strokeLinecap="round">
            <line {...lineProps(mapPoint(top), mapPoint(chin))} stroke="rgba(37,99,235,0.18)" strokeWidth="7" />
            <line {...lineProps(mapPoint(top), mapPoint(chin))} stroke="#2563EB" strokeWidth="2.8" />
            <MetricPoint point={mapPoint(top)} />
            <MetricPoint point={mapPoint(chin)} />
          </g>
        )}

        {metric.id === 'faceWidth' && leftFace && rightFace && (
          <g strokeLinecap="round">
            <line {...lineProps(mapPoint(leftFace), mapPoint(rightFace))} stroke="rgba(37,99,235,0.18)" strokeWidth="7" />
            <line
              {...lineProps(mapPoint(leftFace), mapPoint(rightFace))}
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeDasharray="3 4.5"
            />
            <MetricPoint point={mapPoint(leftFace)} fill="#60A5FA" />
            <MetricPoint point={mapPoint(rightFace)} fill="#60A5FA" />
          </g>
        )}

        {metric.id === 'jawline' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            <path d={jawPath} stroke="rgba(37,99,235,0.18)" strokeWidth="8" />
            <path d={jawPath} stroke="#2563EB" strokeWidth="4" />
          </g>
        )}

        {metric.id === 'cheekbones' && leftCheek && rightCheek && (
          <g>
            <line
              {...lineProps(mapPoint(leftCheek), mapPoint(rightCheek))}
              stroke="#2563EB"
              strokeWidth="1.8"
              strokeDasharray="3 5"
              opacity="0.6"
            />
            <MetricCheek point={mapPoint(leftCheek)} />
            <MetricCheek point={mapPoint(rightCheek)} />
          </g>
        )}

        {metric.id === 'symmetry' && top && chin && noseBridge && (
          <g strokeLinecap="round">
            <line
              x1={mapPoint(noseBridge).x}
              y1={mapPoint(top).y}
              x2={mapPoint(noseBridge).x}
              y2={mapPoint(chin).y}
              stroke="rgba(37,99,235,0.18)"
              strokeWidth="7"
            />
            <line
              x1={mapPoint(noseBridge).x}
              y1={mapPoint(top).y}
              x2={mapPoint(noseBridge).x}
              y2={mapPoint(chin).y}
              stroke="#2563EB"
              strokeWidth="3"
            />
          </g>
        )}
      </svg>
    </div>
  )
}

function LandmarkSketch({
  landmarks,
  mapPoint,
  outlinePath,
}: {
  landmarks: FaceLandmarkPoint[]
  mapPoint: (point: FaceLandmarkPoint) => { x: number; y: number }
  outlinePath: string
}) {
  const sketchPaths = [
    { d: outlinePath, width: 1.25, opacity: 0.34 },
    { d: buildPath(LEFT_EYE_INDICES, landmarks, mapPoint), width: 1, opacity: 0.3 },
    { d: buildPath(RIGHT_EYE_INDICES, landmarks, mapPoint), width: 1, opacity: 0.3 },
    { d: buildPath(LEFT_BROW_INDICES, landmarks, mapPoint), width: 1, opacity: 0.24 },
    { d: buildPath(RIGHT_BROW_INDICES, landmarks, mapPoint), width: 1, opacity: 0.24 },
    { d: buildPath(NOSE_BRIDGE_INDICES, landmarks, mapPoint), width: 1, opacity: 0.25 },
    { d: buildPath(NOSE_BASE_INDICES, landmarks, mapPoint), width: 1, opacity: 0.22 },
    { d: buildPath(UPPER_LIP_INDICES, landmarks, mapPoint), width: 1, opacity: 0.27 },
    { d: buildPath(LOWER_LIP_INDICES, landmarks, mapPoint), width: 1, opacity: 0.23 },
  ]

  return (
    <g stroke="#64748B" strokeLinecap="round" strokeLinejoin="round">
      {sketchPaths.map((path) => path.d ? (
        <path
          key={`${path.d}-${path.width}`}
          d={path.d}
          strokeWidth={path.width}
          opacity={path.opacity}
        />
      ) : null)}
    </g>
  )
}

function MetricPoint({
  point,
  fill = '#2563EB',
}: {
  point: { x: number; y: number }
  fill?: string
}) {
  return <circle cx={point.x} cy={point.y} r="3" fill={fill} stroke="white" strokeWidth="1.2" />
}

function MetricCheek({ point }: { point: { x: number; y: number } }) {
  return (
    <>
      <ellipse cx={point.x} cy={point.y} rx="9.5" ry="11.5" fill="rgba(37,99,235,0.14)" />
      <ellipse cx={point.x} cy={point.y} rx="7.5" ry="9.8" fill="#60A5FA" opacity="0.86" />
    </>
  )
}

function createLandmarkMiniMapper(landmarks: FaceLandmarkPoint[]) {
  const facePoints = FACE_OVAL_INDICES
    .map((index) => landmarks[index])
    .filter((point): point is FaceLandmarkPoint => Boolean(point))
  const xs = facePoints.map((point) => point.x)
  const ys = facePoints.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const width = Math.max(maxX - minX, 0.001)
  const height = Math.max(maxY - minY, 0.001)
  const scale = 82 / Math.max(width, height)
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  return (point: FaceLandmarkPoint) => ({
    x: 60 + (point.x - centerX) * scale,
    y: 60 + (point.y - centerY) * scale,
  })
}

function buildPath(
  indices: number[],
  landmarks: FaceLandmarkPoint[],
  mapPoint: (point: FaceLandmarkPoint) => { x: number; y: number }
) {
  const points = indices
    .map((index) => landmarks[index])
    .filter((point): point is FaceLandmarkPoint => Boolean(point))
    .map(mapPoint)

  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${roundSvg(point.x)} ${roundSvg(point.y)}`)
    .join(' ')
}

function lineProps(start: { x: number; y: number }, end: { x: number; y: number }) {
  return {
    x1: start.x,
    y1: start.y,
    x2: end.x,
    y2: end.y,
  }
}

function roundSvg(value: number) {
  return Math.round(value * 10) / 10
}
