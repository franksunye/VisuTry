import { render, screen } from '@testing-library/react'
import { StoreFitProfile, type StoreFitProfileCopy } from '@/components/store/StoreFitProfile'
import type { FaceLandmarkDetectionResult } from '@/lib/face-landmark-client'
import type { FaceGeometryAnalysis } from '@/types/face-analysis'

const copy: StoreFitProfileCopy = {
  eyebrow: 'Lightweight fit guidance',
  title: 'Your fit profile',
  detected: '✓ Fit profile detected',
  analyzing: 'Building your fit profile…',
  unavailableTitle: 'Fit profile not available yet',
  unavailableBody: 'Recommendations use the collection’s available frame details.',
  profileLabel: 'Face / fit summary',
  whyTitle: 'Why these frames',
  mapAlt: 'Your photo with a sparse fit map',
  mapFallback: 'Fit map unavailable',
}

const geometry: FaceGeometryAnalysis = {
  version: 'landmark-v1',
  status: 'measured',
  source: 'mediapipe-face-landmarker',
  faceDetected: true,
  faceCount: 1,
  qualityScore: 91,
  measuredShape: 'oval',
  measuredConfidence: 0.84,
  signals: [],
  warnings: [],
  ratios: {
    faceAspectRatio: 1.34,
    cheekToFaceWidth: 0.84,
    jawToCheekWidth: 0.82,
    foreheadToCheekWidth: 0.9,
    eyeLineTiltDeg: 0,
    symmetryOffset: 0.02,
    noseBridgeToFaceWidth: 0.1,
  },
}

const detection: FaceLandmarkDetectionResult = {
  landmarks: Array.from({ length: 455 }, (_, index) => ({ x: 0.2 + (index % 20) / 100, y: 0.2 + (index % 30) / 100 })),
  faceCount: 1,
  delegate: 'CPU',
  fallbackUsed: false,
  connections: { tesselation: [], contours: [], irises: [] },
}

describe('StoreFitProfile', () => {
  it('renders a shopper-readable profile, three signals, explanation, and sparse overlay', () => {
    render(<StoreFitProfile photoPreview="data:image/png;base64,preview" geometry={geometry} detection={detection} analyzing={false} copy={copy} />)

    expect(screen.getByRole('heading', { name: 'Your fit profile' })).toBeInTheDocument()
    expect(screen.getByText('Oval profile')).toBeInTheDocument()
    expect(screen.getByText('Medium width')).toBeInTheDocument()
    expect(screen.getByText('Balanced length')).toBeInTheDocument()
    expect(screen.getByText('Balanced jawline')).toBeInTheDocument()
    expect(screen.getByText('Why these frames')).toBeInTheDocument()
    expect(screen.getByTestId('store-fit-map-overlay')).toBeInTheDocument()
    expect(screen.getAllByTestId('store-fit-map-point')).toHaveLength(20)
  })

  it('degrades safely when fit analysis or landmarks are unavailable', () => {
    render(<StoreFitProfile photoPreview="data:image/png;base64,preview" geometry={null} detection={null} analyzing={false} copy={copy} />)

    expect(screen.getByText('Fit profile not available yet')).toBeInTheDocument()
    expect(screen.getByTestId('store-fit-map')).toHaveAttribute('data-fit-map-overlay', 'suppressed')
    expect(screen.queryByTestId('store-fit-map-overlay')).not.toBeInTheDocument()
  })
})
