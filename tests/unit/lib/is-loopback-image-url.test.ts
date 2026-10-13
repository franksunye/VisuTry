import { isLoopbackImageUrl, publicMerchantImageUrl, shouldBypassMerchantImageOptimization } from '@/lib/is-loopback-image-url'

describe('public Merchant media trust boundary', () => {
  it('accepts approved remote and same-origin asset paths', () => {
    expect(publicMerchantImageUrl('https://assets.example.com/frames/a.webp')).toBe('https://assets.example.com/frames/a.webp')
    expect(publicMerchantImageUrl('/assets/glasses-presets/large-round-classic.jpg')).toBe('/assets/glasses-presets/large-round-classic.jpg')
    expect(publicMerchantImageUrl('//127.0.0.1/admin')).toBeNull()
    expect(publicMerchantImageUrl('javascript:alert(1)')).toBeNull()
    expect(publicMerchantImageUrl('https://user:pass@cdn.example.com/private')).toBeNull()
  })

  it('blocks private and metadata-network hosts even in development', () => {
    for (const address of [
      'http://10.12.0.1/private', 'http://172.20.0.1/internal',
      'http://192.168.1.8/config', 'http://169.254.169.254/latest/meta-data',
      'http://100.90.0.1/status', 'https://internal.local/asset.png',
      'http://[::ffff:127.0.0.1]:8000/admin',
    ]) {
      expect(publicMerchantImageUrl(address)).toBeNull()
    }
  })

  it('enables Local prepared-demo loopback only outside Production', () => {
    const localAsset = 'http://127.0.0.1:3001/assets/demo.jpg'
    if (process.env.NODE_ENV !== 'production') {
      expect(isLoopbackImageUrl(localAsset)).toBe(true)
      expect(publicMerchantImageUrl(localAsset)).toBe(localAsset)
    }

    const previousNodeEnv = process.env.NODE_ENV
    try {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true, configurable: true })
      jest.isolateModules(() => {
        const production = jest.requireActual<typeof import('@/lib/is-loopback-image-url')>('@/lib/is-loopback-image-url')
        for (const address of [
          localAsset, 'http://localhost:3001/qa.jpg',
          'http://127.1:3001/qa.jpg', 'http://2130706433:3001/qa.jpg',
        ]) {
          expect(production.isLoopbackImageUrl(address)).toBe(false)
          expect(production.publicMerchantImageUrl(address)).toBeNull()
        }
      })
    } finally {
      Object.defineProperty(process.env, 'NODE_ENV', { value: previousNodeEnv, writable: true, configurable: true })
    }
  })
})

describe('Merchant-imported product image optimization boundary', () => {
  it('keeps optimizer-eligible Merchant CDNs consistent with next.config remotePatterns', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded = require('../../../next.config.js')
    const config = loaded.default ?? loaded
    const httpsHosts = (config.images?.remotePatterns ?? [])
      .filter((pattern: { protocol: string }) => pattern.protocol === 'https')
      .map((pattern: { hostname: string }) => pattern.hostname)
    expect(httpsHosts.length).toBeGreaterThan(5)
    for (const hostPattern of httpsHosts) {
      const host = hostPattern.startsWith('**.') ? `merchant.${hostPattern.slice(3)}` : hostPattern
      expect(shouldBypassMerchantImageOptimization(`https://${host}/image.jpg`)).toBe(false)
    }
  })

  it('keeps relative assets and configured CDNs on the bounded Next optimizer', () => {
    for (const src of [
      '/assets/glasses-presets/round-classic.jpg',
      'https://cdn.shopify.com/s/files/1/frame.jpg',
      'https://cdn11.bigcommerce.com/s-product/product.jpg',
      'https://merchant.public.blob.vercel-storage.com/brand/frame.webp',
      'https://images.unsplash.com/photo-123',
    ]) {
      expect(shouldBypassMerchantImageOptimization(src)).toBe(false)
    }
  })

  it('loads genuine approved Merchant website images without authorizing arbitrary Next optimizer fetches', () => {
    for (const src of [
      'https://www.visutry.com/assets/glasses-presets/round-classic.jpg',
      'https://merchant.example.com/catalog/frame.jpg',
      'https://cdn.shopify.com.evil.example/frame.jpg',
      'https://cdn.shopify.com:8443/frame.jpg',
      'http://eyewear.example.com/frame.jpg',
    ]) {
      expect(shouldBypassMerchantImageOptimization(src)).toBe(true)
    }
  })

  it('does not make unsafe or private addresses eligible to render', () => {
    for (const src of ['http://169.254.169.254/latest/meta-data', 'https://private.internal/secret', 'javascript:alert(1)', '//127.0.0.1/admin']) {
      expect(publicMerchantImageUrl(src)).toBeNull()
    }
    expect(shouldBypassMerchantImageOptimization('http://127.0.0.1:3002/prepared.jpg')).toBe(true) // publicMerchantImageUrl separately rejects it in Production
  })
})
