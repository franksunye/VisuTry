import fs from 'node:fs'
import path from 'node:path'
import { B01_VISUAL_SEO_ASSETS, B02_VISUAL_SEO_ASSETS, getVisualSeoAssetsForPage, VISUAL_SEO_ASSETS } from '@/config/visual-seo-assets'

describe('B01 and B02 visual SEO master assets', () => {
  it('keeps all sixteen source and public assets present with stable dimensions', () => {
    expect(B01_VISUAL_SEO_ASSETS).toHaveLength(8)
    expect(B02_VISUAL_SEO_ASSETS).toHaveLength(8)
    expect(new Set(VISUAL_SEO_ASSETS.map((asset) => asset.id)).size).toBe(16)
    expect(new Set(VISUAL_SEO_ASSETS.map((asset) => asset.publicPath)).size).toBe(16)

    for (const asset of VISUAL_SEO_ASSETS) {
      expect(fs.existsSync(path.join(process.cwd(), asset.sourcePath))).toBe(true)
      expect(fs.existsSync(path.join(process.cwd(), 'public', asset.publicPath))).toBe(true)
      expect(asset.publicPath).toMatch(/\.webp$/)
      expect(asset.width).toBeGreaterThan(0)
      expect(asset.height).toBeGreaterThan(0)
      expect(asset.alt).not.toMatch(/\b(image|picture)\b/i)
      expect(asset.body.length).toBeGreaterThan(80)
    }
  })

  it('maps the assets to the three intended English landing pages', () => {
    expect(getVisualSeoAssetsForPage('/face-shape-detector', 'B01')).toHaveLength(3)
    expect(getVisualSeoAssetsForPage('/what-is-my-face-shape', 'B01')).toHaveLength(3)
    expect(getVisualSeoAssetsForPage('/what-glasses-suit-my-face', 'B01')).toHaveLength(2)
  })

  it('maps B02 to the four intended English product-explanation pages', () => {
    expect(B02_VISUAL_SEO_ASSETS).toHaveLength(8)
    expect(getVisualSeoAssetsForPage('/what-glasses-suit-my-face', 'B02')).toHaveLength(1)
    expect(getVisualSeoAssetsForPage('/find-glasses-for-my-face', 'B02')).toHaveLength(3)
    expect(getVisualSeoAssetsForPage('/virtual-glasses-try-on', 'B02')).toHaveLength(3)
    expect(getVisualSeoAssetsForPage('/try-glasses-on-photo', 'B02')).toHaveLength(1)
    expect(B02_VISUAL_SEO_ASSETS.every((asset) => asset.bodyPosition === 'before')).toBe(true)
  })
})
