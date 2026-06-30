import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { FreeFaceShapeDetector } from '@/components/face-shape/FreeFaceShapeDetector'
import { analytics } from '@/lib/analytics'
import type { FaceGeometryAnalysis } from '@/types/face-analysis'

const mockAnalyzeFaceGeometryFromFile = jest.fn()

jest.mock('@/lib/face-landmark-client', () => ({
  analyzeFaceGeometryFromFile: (...args: unknown[]) => mockAnalyzeFaceGeometryFromFile(...args),
}))

const measuredResult: FaceGeometryAnalysis = {
  version: 'landmark-v1',
  status: 'measured',
  source: 'mediapipe-face-landmarker',
  faceDetected: true,
  faceCount: 1,
  qualityScore: 92,
  measuredShape: 'oval',
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
  signals: ['Face length is moderately greater than width.'],
  warnings: [],
}

describe('FreeFaceShapeDetector', () => {
  beforeEach(() => {
    mockAnalyzeFaceGeometryFromFile.mockClear()
    mockAnalyzeFaceGeometryFromFile.mockResolvedValue(measuredResult)
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
    expect(await screen.findByText('Oval')).toBeInTheDocument()
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
    expect(mockAnalyzeFaceGeometryFromFile).not.toHaveBeenCalled()
  })
})
