const mockGpuDetect = jest.fn()
const mockCpuDetect = jest.fn()
const mockCreateFromOptions = jest.fn(async (_fileset: unknown, options: { baseOptions?: { delegate?: string } }) => {
  return options.baseOptions?.delegate === 'CPU'
    ? { detect: mockCpuDetect }
    : { detect: mockGpuDetect }
})

jest.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: {
    forVisionTasks: jest.fn(async () => ({})),
  },
  FaceLandmarker: {
    createFromOptions: mockCreateFromOptions,
    FACE_LANDMARKS_TESSELATION: [],
    FACE_LANDMARKS_CONTOURS: [],
    FACE_LANDMARKS_IRISES: [],
  },
}))

import {
  analyzeFaceLandmarkFile,
  detectFaceLandmarksFromImage,
} from '@/lib/face-landmark-client'
import type { FaceLandmarkPoint } from '@/types/face-analysis'

const landmarks: FaceLandmarkPoint[] = Array.from({ length: 455 }, (_, index) => ({
  x: 0.2 + (index % 20) * 0.02,
  y: 0.2 + (index % 25) * 0.02,
  z: 0,
}))

describe('face-landmark-client detector fallback', () => {
  const originalCreateImageBitmap = globalThis.createImageBitmap
  const originalImage = globalThis.Image
  const originalCreateObjectURL = URL.createObjectURL
  const originalRevokeObjectURL = URL.revokeObjectURL

  beforeEach(() => {
    mockGpuDetect.mockReset()
    mockCpuDetect.mockReset()
    mockCreateFromOptions.mockClear()
    Object.defineProperty(globalThis, 'createImageBitmap', {
      configurable: true,
      value: jest.fn(),
    })
    URL.createObjectURL = jest.fn(() => 'blob:face-input')
    URL.revokeObjectURL = jest.fn()
  })

  afterEach(() => {
    if (originalCreateImageBitmap) {
      Object.defineProperty(globalThis, 'createImageBitmap', {
        configurable: true,
        value: originalCreateImageBitmap,
      })
    } else {
      Reflect.deleteProperty(globalThis, 'createImageBitmap')
    }
    Object.defineProperty(globalThis, 'Image', {
      configurable: true,
      value: originalImage,
    })
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
  })

  it('retries on CPU when GPU returns zero faces', async () => {
    mockGpuDetect.mockReturnValue({ faceLandmarks: [] })
    mockCpuDetect.mockReturnValue({ faceLandmarks: [landmarks] })

    const result = await detectFaceLandmarksFromImage({} as HTMLCanvasElement)

    expect(mockGpuDetect).toHaveBeenCalledTimes(1)
    expect(mockCpuDetect).toHaveBeenCalledTimes(1)
    expect(result).not.toBeNull()
    expect(result?.faceCount).toBe(1)
    expect(result?.delegate).toBe('CPU')
    expect(result?.fallbackUsed).toBe(true)
  })

  it('falls back to HTMLImageElement when createImageBitmap rejects', async () => {
    const createImageBitmap = globalThis.createImageBitmap as jest.Mock
    createImageBitmap.mockRejectedValue(new DOMException('Unsupported image', 'EncodingError'))
    mockGpuDetect.mockImplementation((image: HTMLImageElement) => {
      // Object URL must stay alive through MediaPipe inference.
      expect(URL.revokeObjectURL).not.toHaveBeenCalled()
      expect(image.src).toBe('blob:face-input')
      return { faceLandmarks: [landmarks] }
    })

    class MockImage {
      decoding = 'async'
      naturalWidth = 640
      naturalHeight = 480
      width = 640
      height = 480
      src = ''
      onload: ((event: Event) => void) | null = null
      onerror: ((event: Event) => void) | null = null
      decode = jest.fn().mockResolvedValue(undefined)
    }
    Object.defineProperty(globalThis, 'Image', { configurable: true, value: MockImage })

    const file = new File(['portrait'], 'portrait.jpg', { type: 'image/jpeg' })
    const result = await analyzeFaceLandmarkFile(file)

    expect(result.detection).not.toBeNull()
    expect(result.geometry.failureReason).not.toBe('image_decode_failed')
    expect(createImageBitmap).toHaveBeenCalledWith(file)
    expect(URL.createObjectURL).toHaveBeenCalledWith(file)
    // Revoke happens in DecodedImageSource.close(), after inference.
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:face-input')
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
  })

  it('uses HTMLImageElement when createImageBitmap is unavailable', async () => {
    Reflect.deleteProperty(globalThis, 'createImageBitmap')
    mockGpuDetect.mockImplementation((image: HTMLImageElement) => {
      expect(URL.revokeObjectURL).not.toHaveBeenCalled()
      expect(image.src).toBe('blob:face-input')
      return { faceLandmarks: [landmarks] }
    })

    class MockImage {
      decoding = 'async'
      naturalWidth = 640
      naturalHeight = 480
      width = 640
      height = 480
      src = ''
      onload: ((event: Event) => void) | null = null
      onerror: ((event: Event) => void) | null = null
      decode = jest.fn().mockResolvedValue(undefined)
    }
    Object.defineProperty(globalThis, 'Image', { configurable: true, value: MockImage })

    const file = new File(['portrait'], 'portrait.jpg', { type: 'image/jpeg' })
    const result = await analyzeFaceLandmarkFile(file)

    expect(result.detection).not.toBeNull()
    expect(result.geometry.failureReason).not.toBe('image_decode_failed')
    expect(URL.createObjectURL).toHaveBeenCalledWith(file)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:face-input')
  })

  it('keeps ImageBitmap path free of object URLs', async () => {
    const bitmap = {
      width: 640,
      height: 480,
      close: jest.fn(),
    }
    const createImageBitmap = globalThis.createImageBitmap as jest.Mock
    createImageBitmap.mockResolvedValue(bitmap)
    mockGpuDetect.mockReturnValue({ faceLandmarks: [landmarks] })

    const file = new File(['portrait'], 'portrait.jpg', { type: 'image/jpeg' })
    const result = await analyzeFaceLandmarkFile(file)

    expect(result.detection).not.toBeNull()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    expect(bitmap.close).toHaveBeenCalledTimes(1)
  })

  it('reports image_decode_failed only after both decoders reject', async () => {
    const createImageBitmap = globalThis.createImageBitmap as jest.Mock
    createImageBitmap.mockRejectedValue(new DOMException('Invalid image', 'EncodingError'))

    class MockImage {
      decoding = 'async'
      naturalWidth = 0
      naturalHeight = 0
      width = 0
      height = 0
      src = ''
      onload: ((event: Event) => void) | null = null
      onerror: ((event: Event) => void) | null = null
      decode = jest.fn().mockRejectedValue(new DOMException('Decode failed', 'EncodingError'))
    }
    Object.defineProperty(globalThis, 'Image', { configurable: true, value: MockImage })

    const file = new File(['corrupt'], 'corrupt.jpg', { type: 'image/jpeg' })
    const result = await analyzeFaceLandmarkFile(file)

    expect(result.geometry.failureReason).toBe('image_decode_failed')
    expect(result.geometry.warnings[0]).toMatch(/fallback: Decode failed/)
    // Failed decode path must still revoke the object URL it created.
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:face-input')
  })

  it('rejects empty files before invoking a browser decoder', async () => {
    const createImageBitmap = globalThis.createImageBitmap as jest.Mock
    const file = new File([], 'empty.jpg', { type: 'image/jpeg' })
    const result = await analyzeFaceLandmarkFile(file)

    expect(result.geometry.failureReason).toBe('image_decode_failed')
    expect(result.geometry.warnings[0]).toBe('Image file is empty.')
    expect(createImageBitmap).not.toHaveBeenCalled()
  })
})
