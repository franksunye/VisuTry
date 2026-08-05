import { resolveFetchableImageUrl } from '@/modules/store/application/fetch-image-file'

describe('resolveFetchableImageUrl', () => {
  it('resolves Store-owned catalog assets against the application origin', () => {
    expect(
      resolveFetchableImageUrl(
        '/assets/glasses-presets/rectangle-classic.jpg',
        'https://www.visutry.com',
      ),
    ).toBe('https://www.visutry.com/assets/glasses-presets/rectangle-classic.jpg')
  })

  it('preserves valid remote HTTP(S) image URLs', () => {
    expect(
      resolveFetchableImageUrl('https://cdn.example.com/catalog/frame.jpg'),
    ).toBe('https://cdn.example.com/catalog/frame.jpg')
  })

  it('rejects non-HTTP image inputs', () => {
    expect(() => resolveFetchableImageUrl('file:///tmp/frame.jpg')).toThrow(
      /HTTP\(S\)/,
    )
  })
})
