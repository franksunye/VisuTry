import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { FreeFaceShapeDetector } from '@/components/face-shape/FreeFaceShapeDetector'
import { analytics } from '@/lib/analytics'
import type { FaceGeometryAnalysis, FaceLandmarkPoint } from '@/types/face-analysis'

const mockAnalyzeFaceLandmarkFile = jest.fn()

jest.mock('@/lib/face-landmark-client', () => ({
  analyzeFaceLandmarkFile: (...args: unknown[]) => mockAnalyzeFaceLandmarkFile(...args),
}))

jest.mock('@/components/face-analysis/FaceLandmarkMeshOverlay', () => ({
  FaceLandmarkMeshOverlay: () => <div data-testid="landmark-mesh" />,
}))

const measuredResult: FaceGeometryAnalysis = {
  version: 'landmark-v1',
  status: 'measured',
  source: 'mediapipe-face-landmarker',
  faceDetected: true,
  faceCount: 1,
  qualityScore: 92,
  measuredShape: 'oval',
  alternativeShapes: ['oblong'],
  measuredConfidence: 0.78,
  ratios: {
    faceAspectRatio: 1.45,
    cheekToFaceWidth: 0.8,
    jawToCheekWidth: 0.82,
    foreheadToCheekWidth: 0.9,
    eyeLineTiltDeg: 1,
    symmetryOffset: 0.01,
    noseBridgeToFaceWidth: 0.2,
  },
  signals: [
    'Oval shape supported by measured proportions',
    'Balanced face length-to-width ratio',
    'Jawline has moderate taper',
  ],
  warnings: [],
}

const landmarks: FaceLandmarkPoint[] = Array.from({ length: 455 }, (_, index) => ({
  x: 0.3 + (index % 20) * 0.02,
  y: 0.2 + (index % 25) * 0.02,
  z: 0,
}))

const measuredFileResult = {
  geometry: measuredResult,
  detection: {
    landmarks,
    faceCount: 1,
    connections: { tesselation: [], contours: [], irises: [] },
  },
}

describe('FreeFaceShapeDetector', () => {
  const mockFetch = jest.fn(() => Promise.resolve({ ok: true }))

  beforeEach(() => {
    mockAnalyzeFaceLandmarkFile.mockClear()
    mockAnalyzeFaceLandmarkFile.mockResolvedValue(measuredFileResult)
    mockFetch.mockClear()
    global.fetch = mockFetch as unknown as typeof global.fetch
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: jest.fn(() => 'blob:face-photo'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: jest.fn(),
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('tracks a measured result and its commercial continuation', async () => {
    const trackUpload = jest.spyOn(analytics, 'trackFaceShapeDetectorUpload')
    const trackComplete = jest.spyOn(analytics, 'trackFaceShapeDetectorComplete')
    const trackCta = jest.spyOn(analytics, 'trackFaceShapeDetectorCta')

    render(<FreeFaceShapeDetector locale="en" />)

    const input = screen.getByLabelText(/choose a face photo/i)
    const file = new File(['portrait'], 'portrait.jpg', { type: 'image/jpeg' })
    fireEvent.change(input, { target: { files: [file] } })

    expect(trackUpload).toHaveBeenCalledWith('image/jpeg', file.size)
    expect(await screen.findByRole('heading', { name: 'Oval' })).toBeInTheDocument()
    expect(screen.getByText('Likely geometry match')).toBeInTheDocument()
    expect(screen.getByText('oblong')).toBeInTheDocument()
    expect(screen.getByText('92% photo quality')).toBeInTheDocument()
    expect(screen.getByText('Measured face details')).toBeInTheDocument()
    expect(screen.getAllByText('Photo Alignment')).toHaveLength(2)
    expect(screen.getByTestId('landmark-mesh')).toBeInTheDocument()
    expect(mockAnalyzeFaceLandmarkFile).toHaveBeenCalledTimes(1)
    expect(trackComplete).toHaveBeenCalledWith('oval', 92, expect.any(Number))

    const advisorLink = screen.getByRole('link', { name: /get personalized advice/i })
    expect(advisorLink).toHaveAttribute('href', '/en/face-analysis')
    advisorLink.addEventListener('click', (event) => event.preventDefault())
    fireEvent.click(advisorLink)

    expect(trackCta).toHaveBeenCalledWith('oval', 'glasses_advisor')
  })

  it('tracks invalid input without starting analysis', async () => {
    const trackFailed = jest.spyOn(analytics, 'trackFaceShapeDetectorFailed')

    render(<FreeFaceShapeDetector locale="en" />)

    const input = screen.getByLabelText(/choose a face photo/i)
    const file = new File(['portrait'], 'portrait.gif', { type: 'image/gif' })
    fireEvent.change(input, { target: { files: [file] } })

    expect(await screen.findByText('Choose a JPG, PNG, or WebP image.')).toBeInTheDocument()
    expect(trackFailed).toHaveBeenCalledWith('Choose a JPG, PNG, or WebP image.')
    expect(mockAnalyzeFaceLandmarkFile).not.toHaveBeenCalled()
  })

  it('records FAILED with failure reason when measurement is unavailable', async () => {
    const unavailableResult: FaceGeometryAnalysis = {
      version: 'landmark-v1',
      status: 'unavailable',
      source: 'ai-fallback',
      faceDetected: false,
      faceCount: 0,
      qualityScore: 0,
      signals: [],
      warnings: ['Face landmarks were not available for this photo.'],
      failureReason: 'no_face',
    }
    mockAnalyzeFaceLandmarkFile.mockResolvedValue({
      geometry: unavailableResult,
      detection: null,
    })

    render(<FreeFaceShapeDetector locale="en" />)

    const input = screen.getByLabelText(/choose a face photo/i)
    const file = new File(['portrait'], 'portrait.jpg', { type: 'image/jpeg' })
    fireEvent.change(input, { target: { files: [file] } })

    expect(await screen.findByText(/face landmarks were not available/i)).toBeInTheDocument()

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/face-shape-detector/usage',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ status: 'FAILED', failureReason: 'no_face' }),
      }),
    )
  })
})
