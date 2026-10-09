import { isLoopbackImageUrl, publicMerchantImageUrl } from '@/lib/is-loopback-image-url'

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
      process.env.NODE_ENV = 'production'
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
      process.env.NODE_ENV = previousNodeEnv
    }
  })
})
