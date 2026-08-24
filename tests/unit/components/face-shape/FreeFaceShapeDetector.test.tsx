import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FreeFaceShapeDetector } from '@/components/face-shape/FreeFaceShapeDetector'
import { analytics } from '@/lib/analytics'
import type { FaceGeometryAnalysis, FaceLandmarkPoint } from '@/types/face-analysis'

const mockAnalyzeFaceLandmarkFile = jest.fn()
const mockCompressImage = jest.fn()
const mockSavePhotoHandoff = jest.fn()
const mockRouterPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

jest.mock('@/lib/face-landmark-client', () => ({
  analyzeFaceLandmarkFile: (...args: unknown[]) => mockAnalyzeFaceLandmarkFile(...args),
}))

jest.mock('@/utils/image', () => ({
  compressImage: (...args: unknown[]) => mockCompressImage(...args),
}))

jest.mock('@/lib/face-analysis-photo-handoff', () => ({
  saveFaceAnalysisPhotoHandoff: (...args: unknown[]) => mockSavePhotoHandoff(...args),
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

function getPhotoLibraryInput() {
  return screen.getAllByLabelText(/choose a face photo/i)[0]
}

describe('FreeFaceShapeDetector', () => {
  const mockFetch = jest.fn(() => Promise.resolve({ ok: true }))

  beforeEach(() => {
    mockAnalyzeFaceLandmarkFile.mockClear()
    mockAnalyzeFaceLandmarkFile.mockResolvedValue(measuredFileResult)
    mockCompressImage.mockImplementation((file: File) => Promise.resolve(file))
    mockSavePhotoHandoff.mockResolvedValue('handoff-1')
    mockRouterPush.mockClear()
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

    const input = getPhotoLibraryInput()
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
    expect(mockCompressImage).toHaveBeenCalledWith(file, 1280, 0.88, { profile: 'user-photo' })
    expect(trackComplete).toHaveBeenCalledWith('oval', 92, expect.any(Number))

    expect(screen.queryByRole('link', { name: /open virtual try-on/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /compare frames side by side/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /get personalized frame recommendations/i }))

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith(
        '/en/face-analysis?source=free-face-shape-detector&faceShape=oval&photoHandoff=handoff-1',
      )
    })
    expect(mockCompressImage).toHaveBeenCalledWith(file, undefined, undefined, { profile: 'user-photo' })
    expect(mockSavePhotoHandoff).toHaveBeenCalledWith(file)
    expect(trackCta).toHaveBeenCalledWith('oval', 'face_analysis')
  })

  it('continues to Face Analysis when local photo handoff is unavailable', async () => {
    const trackHandoff = jest.spyOn(analytics, 'trackFaceShapeDetectorPhotoHandoff')
    mockSavePhotoHandoff.mockRejectedValue(new Error('storage blocked'))

    render(<FreeFaceShapeDetector locale="en" />)

    const file = new File(['portrait'], 'portrait.jpg', { type: 'image/jpeg' })
    fireEvent.change(getPhotoLibraryInput(), { target: { files: [file] } })
    await screen.findByRole('heading', { name: 'Oval' })
    fireEvent.click(screen.getByRole('button', { name: /get personalized frame recommendations/i }))

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith(
        '/en/face-analysis?source=free-face-shape-detector&faceShape=oval',
      )
    })
    expect(trackHandoff).toHaveBeenCalledWith('oval', 'fallback')
  })

  it('tracks invalid input without starting analysis', async () => {
    const trackFailed = jest.spyOn(analytics, 'trackFaceShapeDetectorFailed')

    render(<FreeFaceShapeDetector locale="en" />)

    const input = getPhotoLibraryInput()
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

    const input = getPhotoLibraryInput()
    const file = new File(['portrait'], 'portrait.jpg', { type: 'image/jpeg' })
    fireEvent.change(input, { target: { files: [file] } })

    expect(await screen.findByText('Try a well-lit, straight-on photo with your full face visible.')).toBeInTheDocument()
    expect(screen.queryByText(/face landmarks were not available/i)).not.toBeInTheDocument()

    const usageCalls = mockFetch.mock.calls as unknown as Array<[string, RequestInit]>
    const usageCall = usageCalls.find(([url]) => url === '/api/face-shape-detector/usage')
    expect(usageCall).toBeDefined()
    if (!usageCall) throw new Error('Usage request was not recorded')
    const usageRequest = usageCall[1]
    expect(JSON.parse(String(usageRequest.body))).toEqual({
      status: 'FAILED',
      failureReason: 'no_face',
      siteLocale: 'en',
      diagnostics: {
        sourceFileType: 'image/jpeg',
        sourceFileSize: 8,
        detectorFileType: 'image/jpeg',
        detectorFileSize: 8,
      },
    })
  })

  it.each([
    ['too_small', 'Your face is too small in the image for an accurate measurement.'],
    ['multiple_faces', 'We found more than one face. Choose a photo that shows only you.'],
    ['tilted', 'Keep your head upright and your eyes level with the camera.'],
  ] as const)('shows actionable copy for %s', async (failureReason, expectedMessage) => {
    mockAnalyzeFaceLandmarkFile.mockResolvedValue({
      geometry: {
        version: 'landmark-v1',
        status: 'unavailable',
        source: 'ai-fallback',
        faceDetected: false,
        faceCount: 0,
        qualityScore: 0,
        signals: [],
        warnings: ['internal detector warning'],
        failureReason,
      } satisfies FaceGeometryAnalysis,
      detection: null,
    })

    render(<FreeFaceShapeDetector locale="en" />)
    const file = new File(['portrait'], 'portrait.jpg', { type: 'image/jpeg' })
    fireEvent.change(getPhotoLibraryInput(), { target: { files: [file] } })

    expect(await screen.findByText(expectedMessage)).toBeInTheDocument()
    expect(screen.queryByText('internal detector warning')).not.toBeInTheDocument()
  })

  it('continues with the original file when preprocessing fails', async () => {
    const compressionError = new Error('Image loading failed')
    mockCompressImage.mockRejectedValue(compressionError)

    render(<FreeFaceShapeDetector locale="en" />)

    const file = new File(['portrait'], 'portrait.jpg', { type: 'image/jpeg' })
    fireEvent.change(getPhotoLibraryInput(), { target: { files: [file] } })

    expect(await screen.findByRole('heading', { name: 'Oval' })).toBeInTheDocument()
    expect(mockAnalyzeFaceLandmarkFile).toHaveBeenCalledWith(file)
  })

  it('records normalized compression and decoder diagnostics without image content', async () => {
    mockCompressImage.mockRejectedValue(new Error('Image loading failed for local blob'))
    const unavailableResult: FaceGeometryAnalysis = {
      version: 'landmark-v1',
      status: 'unavailable',
      source: 'ai-fallback',
      faceDetected: false,
      faceCount: 0,
      qualityScore: 0,
      signals: [],
      warnings: ['Image could not be decoded.'],
      failureReason: 'image_decode_failed',
    }
    mockAnalyzeFaceLandmarkFile.mockResolvedValue({
      geometry: unavailableResult,
      detection: null,
      decodeDiagnostics: {
        detectedFileFormat: 'heic',
        bitmapDecodeErrorName: 'EncodingError',
        bitmapDecodeErrorMessage: 'unsupported_image',
        htmlImageDecodeErrorName: 'EncodingError',
        htmlImageDecodeErrorMessage: 'decode_failed',
      },
    })

    render(<FreeFaceShapeDetector locale="en" />)

    const file = new File(['portrait'], 'portrait.jpg', { type: 'image/jpeg' })
    fireEvent.change(getPhotoLibraryInput(), { target: { files: [file] } })

    expect(await screen.findByText('Try another JPG, PNG, or WebP photo. Re-saving the image can also help.')).toBeInTheDocument()
    expect(screen.queryByText('Image could not be decoded.')).not.toBeInTheDocument()

    const usageCalls = mockFetch.mock.calls as unknown as Array<[string, RequestInit]>
    const usageCall = usageCalls.find(([url]) => url === '/api/face-shape-detector/usage')
    expect(usageCall).toBeDefined()
    if (!usageCall) throw new Error('Usage request was not recorded')
    const payload = JSON.parse(String(usageCall[1].body))

    expect(payload).toEqual({
      status: 'FAILED',
      failureReason: 'image_decode_failed',
      siteLocale: 'en',
      diagnostics: {
        sourceFileType: 'image/jpeg',
        sourceFileSize: 8,
        detectorFileType: 'image/jpeg',
        detectorFileSize: 8,
        compressionFailed: true,
        compressionErrorName: 'Error',
        compressionErrorMessage: 'image_load_failed',
        detectedFileFormat: 'heic',
        bitmapDecodeErrorName: 'EncodingError',
        bitmapDecodeErrorMessage: 'unsupported_image',
        htmlImageDecodeErrorName: 'EncodingError',
        htmlImageDecodeErrorMessage: 'decode_failed',
      },
    })
    expect(JSON.stringify(payload)).not.toContain('local blob')
  })
})
