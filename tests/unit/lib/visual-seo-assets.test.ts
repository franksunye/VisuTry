import fs from 'node:fs'
import path from 'node:path'
import {
  B01_VISUAL_SEO_ASSETS,
  B02_VISUAL_SEO_ASSETS,
  B03_VISUAL_SEO_ASSETS,
  B04_VISUAL_SEO_ASSETS,
  getVisualSeoAssetsForPage,
  VISUAL_SEO_ASSETS,
} from '@/config/visual-seo-assets'

describe('B01, B02, B03, and B04 visual SEO master assets', () => {
  it('keeps all thirty-three source and public assets present with stable dimensions', () => {
    expect(B01_VISUAL_SEO_ASSETS).toHaveLength(8)
    expect(B02_VISUAL_SEO_ASSETS).toHaveLength(8)
    expect(B03_VISUAL_SEO_ASSETS).toHaveLength(8)
    expect(B04_VISUAL_SEO_ASSETS).toHaveLength(9)
    expect(new Set(VISUAL_SEO_ASSETS.map((asset) => asset.id)).size).toBe(33)
    expect(new Set(VISUAL_SEO_ASSETS.map((asset) => asset.publicPath)).size).toBe(33)

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

  it('maps B01 to the three intended English landing pages', () => {
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

  it('maps B03 to photo comparison, frame compare, and advisor pages', () => {
    expect(B03_VISUAL_SEO_ASSETS).toHaveLength(8)
    expect(getVisualSeoAssetsForPage('/try-glasses-on-photo', 'B03')).toHaveLength(2)
    expect(getVisualSeoAssetsForPage('/compare-glasses-frames', 'B03')).toHaveLength(3)
    expect(getVisualSeoAssetsForPage('/ai-glasses-advisor', 'B03')).toHaveLength(3)
    expect(B03_VISUAL_SEO_ASSETS.every((asset) => asset.bodyPosition === 'before')).toBe(true)

    expect(B03_VISUAL_SEO_ASSETS.find((asset) => asset.id === 'VSEO-019')?.displayWidth).toBe('primary')
    expect(B03_VISUAL_SEO_ASSETS.find((asset) => asset.id === 'VSEO-023')?.displayWidth).toBe('primary')
    expect(
      B03_VISUAL_SEO_ASSETS
        .filter((asset) => asset.pagePath === '/try-glasses-on-photo')
        .map((asset) => asset.displayWidth),
    ).toEqual(['compare', 'secondary'])
  })

  it('maps B04 to the three face style owner pages and decision stages', () => {
    expect(B04_VISUAL_SEO_ASSETS).toHaveLength(9)
    expect(getVisualSeoAssetsForPage('/style/round-face', 'B04')).toHaveLength(3)
    expect(getVisualSeoAssetsForPage('/style/oval-face', 'B04')).toHaveLength(3)
    expect(getVisualSeoAssetsForPage('/style/square-face', 'B04')).toHaveLength(3)
    expect(B04_VISUAL_SEO_ASSETS.map((asset) => asset.stage)).toEqual([
      'hero', 'compare', 'fit',
      'hero', 'compare', 'fit',
      'hero', 'compare', 'fit',
    ])
    expect(B04_VISUAL_SEO_ASSETS.every((asset) => asset.bodyPosition === 'before')).toBe(true)
  })
})
