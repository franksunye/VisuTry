import { buildMerchantExperienceHref } from '@/modules/store/application/build-merchant-experience-href'

describe('internal Merchant Experience handoff', () => {
  it.each([
    ['discover', '/en/c/akila/statement-frames'],
    ['face-analysis', '/en/c/akila/statement-frames'],
    ['compare', '/en/store/luna-optical'],
    ['seo', '/en/c/akila/statement-frames'],
  ] as const)('builds the %s first-touch contract', (surface, path) => {
    const href = buildMerchantExperienceHref({ path, surface, campaign: 'homepage-featured-edit' })
    const url = new URL(href, 'https://visutry.local')
    expect(url.pathname).toBe(path)
    expect(url.searchParams.get('source')).toBe('visutry')
    expect(url.searchParams.get('medium')).toBe('internal')
    expect(url.searchParams.get('surface')).toBe(surface)
    expect(url.searchParams.get('campaign')).toBe('homepage-featured-edit')
  })

  it('preserves existing query parameters and rejects external handoff paths', () => {
    expect(buildMerchantExperienceHref({ path: '/en/store/luna-optical?foo=bar', surface: 'other' })).toContain('foo=bar')
    expect(() => buildMerchantExperienceHref({ path: 'https://evil.example', surface: 'other' })).toThrow('relative')
  })
})
