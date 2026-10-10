import { brandAccentForDisplay, brandMediaPath, normalizeBrandAccent, normalizeBrandMediaUrl, inspectBrandImage } from '@/modules/merchant/domain/merchant-brand-kit'

describe('G1-C tenant-scoped Brand Kit contract', () => {
  it('allows only the AA-ready accent palette and a safe reset', () => {
    expect(normalizeBrandAccent('#1d4ed8')).toBe('#1D4ED8')
    expect(normalizeBrandAccent(null)).toBeNull()
    expect(brandAccentForDisplay(null)).toBe('#1F4B5A')
    expect(() => normalizeBrandAccent('#fff')).toThrow('supported accessible')
    expect(() => normalizeBrandAccent('var(--evil)')).toThrow()
  })
  it('accepts only same-merchant, same-experience versioned uploads', () => {
    const url = 'https://store-cdn.public.blob.vercel-storage.com/merchant-brand/merchA/hero/campA/abc123.webp'
    expect(brandMediaPath('merchA', 'hero', 'campA')).toBe('merchant-brand/merchA/hero/campA/')
    expect(normalizeBrandMediaUrl(url, 'merchA', 'hero', 'campA')).toBe(url)
    for (const value of [
      url.replace('merchA', 'other'), url.replace('campA', 'other'),
      url.replace('.webp', '.svg'), url + '?redirect=http://127.0.0.1',
      'http://127.0.0.1/merchant-brand/merchA/hero/campA/abc123.webp',
      'https://store-cdn.public.blob.vercel-storage.com.evil.example/merchant-brand/merchA/hero/campA/a.webp',
      'https://store-cdn.public.blob.vercel-storage.com/merchant-brand/merchA/hero/campA/../other/a.webp',
    ]) expect(() => normalizeBrandMediaUrl(value, 'merchA', 'hero', 'campA')).toThrow()
    expect(normalizeBrandMediaUrl(null, 'merchA', 'hero', 'campA')).toBeNull()
  })
  it('checks PNG binary headers/dimensions and rejects image MIME spoofing', () => {
    const makePng = (w: number, h: number) => {
      const bytes = new Uint8Array(64)
      bytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a], 0)
      bytes.set([0x49,0x48,0x44,0x52], 12)
      new DataView(bytes.buffer).setUint32(16,w); new DataView(bytes.buffer).setUint32(20,h)
      return bytes
    }
    expect(inspectBrandImage(makePng(1200,600),'image/png','hero')).toMatchObject({width:1200,height:600})
    expect(() => inspectBrandImage(makePng(100,100),'image/jpeg','logo')).toThrow()
    expect(() => inspectBrandImage(makePng(100,100),'image/png','hero')).toThrow()
    expect(() => inspectBrandImage(makePng(4097,100),'image/png','logo')).toThrow()
    expect(() => inspectBrandImage(new TextEncoder().encode('<svg>evil</svg>'),'image/png','logo')).toThrow()
  })
})
