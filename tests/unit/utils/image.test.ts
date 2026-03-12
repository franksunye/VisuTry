import { compressImage } from '@/utils/image'

type MockCanvasContext = {
  drawImage: jest.Mock
  getImageData?: jest.Mock
}

describe('image utils', () => {
  const originalCreateElement = document.createElement.bind(document)
  const originalImage = global.Image
  const originalCreateObjectURL = URL.createObjectURL
  let consoleLogSpy: jest.SpyInstance

  function installCanvasMocks(alphaValues: number[]) {
    const outputContext: MockCanvasContext = {
      drawImage: jest.fn(),
    }
    const sampleContext: MockCanvasContext = {
      drawImage: jest.fn(),
      getImageData: jest.fn().mockReturnValue({
        data: Uint8ClampedArray.from(alphaValues.flatMap(alpha => [0, 0, 0, alpha])),
      }),
    }

    const outputCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn().mockReturnValue(outputContext),
      toBlob: jest.fn((callback: (blob: Blob | null) => void, type: string) => {
        callback(new Blob(['compressed'], { type }))
      }),
    }

    const sampleCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn().mockReturnValue(sampleContext),
    }

    jest
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        if (tagName === 'canvas') {
          return (outputCanvas.getContext.mock.calls.length === 0 ? outputCanvas : sampleCanvas) as unknown as HTMLCanvasElement
        }

        return originalCreateElement(tagName)
      })

    return { outputCanvas, sampleCanvas }
  }

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url')

    class MockImage {
      onload: null | (() => void) = null
      onerror: null | (() => void) = null
      width = 1600
      height = 900

      set src(_value: string) {
        setTimeout(() => this.onload?.(), 0)
      }
    }

    global.Image = MockImage as unknown as typeof Image
  })

  afterEach(() => {
    jest.restoreAllMocks()
    global.Image = originalImage
    URL.createObjectURL = originalCreateObjectURL
  })

  it('should normalize user photos to jpeg', async () => {
    installCanvasMocks([255, 255, 255, 255])

    const input = new File(['portrait'], 'portrait.png', { type: 'image/png' })
    const output = await compressImage(input, undefined, undefined, { profile: 'user-photo' })

    expect(output.type).toBe('image/jpeg')
    expect(output.name).toBe('portrait.jpg')
  })

  it('should preserve transparency for item images by outputting png', async () => {
    installCanvasMocks([255, 0, 255, 255])

    const input = new File(['frame'], 'frame.webp', { type: 'image/webp' })
    const output = await compressImage(input, undefined, undefined, { profile: 'item-photo' })

    expect(output.type).toBe('image/png')
    expect(output.name).toBe('frame.png')
  })

  it('should normalize opaque item images to jpeg', async () => {
    installCanvasMocks([255, 255, 255, 255])

    const input = new File(['frame'], 'frame.png', { type: 'image/png' })
    const output = await compressImage(input, undefined, undefined, { profile: 'item-photo' })

    expect(output.type).toBe('image/jpeg')
    expect(output.name).toBe('frame.jpg')
  })
})
