import {
  assertIndexNowUrl,
  buildDiscoveryCanaryIndexNowUrls,
  INDEXNOW_HOST,
  INDEXNOW_KEY,
  INDEXNOW_KEY_LOCATION,
} from '@/config/discovery-indexnow'

describe('Discovery Canary IndexNow contract', () => {
  it('builds the fixed Store, Campaign, and six Frame canonical URL list', () => {
    const urls = buildDiscoveryCanaryIndexNowUrls()

    expect(urls).toHaveLength(8)
    expect(new Set(urls).size).toBe(8)
    expect(urls.every((url) => new URL(url).hostname === INDEXNOW_HOST)).toBe(true)
    expect(urls).toContain('https://www.visutry.com/en/store/visutry-demo')
    expect(urls).toContain('https://www.visutry.com/en/c/visutry-demo/everyday-fit')
    expect(urls.filter((url) => url.includes('/en/demo/frames/'))).toHaveLength(6)
  })

  it('rejects arbitrary hosts and non-canonical query or fragment URLs', () => {
    expect(() => assertIndexNowUrl('https://evil.example/en/store/visutry-demo')).toThrow()
    expect(() => assertIndexNowUrl('https://www.visutry.com/en/store/visutry-demo?source=test')).toThrow()
    expect(() => assertIndexNowUrl('https://www.visutry.com/en/store/visutry-demo#frames')).toThrow()
  })

  it('publishes a stable verification key without treating it as a secret', () => {
    expect(INDEXNOW_KEY).toMatch(/^[a-f0-9]{32}$/)
    expect(INDEXNOW_KEY_LOCATION).toBe(`https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`)
  })
})
