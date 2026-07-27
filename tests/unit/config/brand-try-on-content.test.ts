import fs from 'node:fs'
import path from 'node:path'
import {
  BRAND_TRY_ON_CONTENT,
  CURATED_BRAND_SLUGS,
  getCuratedBrandContent,
} from '@/config/brand-try-on-content'

describe('brand virtual try-on content', () => {
  it('defines one complete entry for every curated brand slug', () => {
    expect(Object.keys(BRAND_TRY_ON_CONTENT).sort()).toEqual([...CURATED_BRAND_SLUGS].sort())
    for (const slug of CURATED_BRAND_SLUGS) {
      const content = getCuratedBrandContent(slug)
      expect(content?.slug).toBe(slug)
      expect(content?.styles).toHaveLength(4)
      expect(content?.title).toContain(content?.name)
      expect(content?.description.length).toBeGreaterThan(100)
    }
  })

  it('only references existing local Style Explorer images', () => {
    for (const content of Object.values(BRAND_TRY_ON_CONTENT)) {
      for (const style of content.styles) {
        expect(style.image).toMatch(/^\/assets\/glasses-presets\/style-explorer\//)
        expect(fs.existsSync(path.join(process.cwd(), 'public', style.image))).toBe(true)
      }
    }
  })

  it('returns null for brands that have not been editorially approved', () => {
    expect(getCuratedBrandContent('gucci')).toBeNull()
  })
})
