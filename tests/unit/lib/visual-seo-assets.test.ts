import fs from 'node:fs'
import path from 'node:path'
import { B01_VISUAL_SEO_ASSETS, getVisualSeoAssetsForPage } from '@/config/visual-seo-assets'

describe('B01 visual SEO master assets', () => {
  it('keeps all eight source and public assets present with stable dimensions', () => {
    expect(B01_VISUAL_SEO_ASSETS).toHaveLength(8)
    expect(new Set(B01_VISUAL_SEO_ASSETS.map((asset) => asset.id)).size).toBe(8)
    expect(new Set(B01_VISUAL_SEO_ASSETS.map((asset) => asset.publicPath)).size).toBe(8)

    for (const asset of B01_VISUAL_SEO_ASSETS) {
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
    expect(getVisualSeoAssetsForPage('/face-shape-detector')).toHaveLength(3)
    expect(getVisualSeoAssetsForPage('/what-is-my-face-shape')).toHaveLength(3)
    expect(getVisualSeoAssetsForPage('/what-glasses-suit-my-face')).toHaveLength(2)
  })
})
