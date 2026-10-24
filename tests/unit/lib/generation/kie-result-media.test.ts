import { kieResultExtension, readBoundedKieResult } from '@/lib/generation/kie-result-media'

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
    const blob = await readBoundedKieResult(new Response(data, { headers: { 'content-type': 'image/webp' } }))
    expect(blob.type).toBe('image/webp')
    expect(Array.from(new Uint8Array(await blob.arrayBuffer()))).toEqual(Array.from(data))
  })
  it('rejects a declared oversized result before collecting content', async () => {
    const response = new Response('x', {
      headers: { 'content-type': 'image/jpeg', 'content-length': String(15 * 1024 * 1024 + 1) },
    })
    await expect(readBoundedKieResult(response)).rejects.toThrow('safe media size')
  })
  it('rejects HTML masquerading as an image', async () => {
    await expect(readBoundedKieResult(
      new Response('{}', { headers: { 'content-type': 'text/html' } }),
    )).rejects.toThrow('supported image')
  })
})
