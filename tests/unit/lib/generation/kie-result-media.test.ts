import { kieResultExtension, readBoundedKieResult } from '@/lib/generation/kie-result-media'
import { mockKieStreamResponse } from '../../../support/kie-stream-response'

describe('shared Kie media reader for Consumer and Store (offline)', () => {
  it.each([['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp']])(
    'maps %s to %s', (mime, extension) => {
      expect(kieResultExtension(mime)).toBe(extension)
    },
  )
  it('rejects unsupported images', () => {
    expect(() => kieResultExtension('application/json')).toThrow('supported image')
  })
  it('reads streaming WebP with correct type and bytes', async () => {
    const data = new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80])
    const blob = await readBoundedKieResult(mockKieStreamResponse('image/webp', Array.from(data)))
    expect(blob.type).toBe('image/webp')
    expect(blob.size).toBe(data.byteLength)
  })
  it('rejects a declared oversized result before collecting content', async () => {
    const response = mockKieStreamResponse('image/jpeg', [120], String(15 * 1024 * 1024 + 1))
    await expect(readBoundedKieResult(response)).rejects.toThrow('safe media size')
  })
  it('rejects HTML masquerading as an image', async () => {
    await expect(readBoundedKieResult(
      mockKieStreamResponse('text/html', [123, 125]),
    )).rejects.toThrow('supported image')
  })
})
