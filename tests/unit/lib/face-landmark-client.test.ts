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

import { detectFaceLandmarksFromImage } from '@/lib/face-landmark-client'
import type { FaceLandmarkPoint } from '@/types/face-analysis'

const landmarks: FaceLandmarkPoint[] = Array.from({ length: 455 }, (_, index) => ({
  x: 0.2 + (index % 20) * 0.02,
  y: 0.2 + (index % 25) * 0.02,
  z: 0,
}))

describe('face-landmark-client detector fallback', () => {
  beforeEach(() => {
    mockGpuDetect.mockReset()
    mockCpuDetect.mockReset()
    mockCreateFromOptions.mockClear()
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
})
