import fs from 'node:fs'
import path from 'node:path'
import {
  BRAND_TRY_ON_CONTENT,
  BRAND_PHOTO_TRY_ON_GUIDANCE,
  CURATED_BRAND_SLUGS,
  getCuratedBrandContent,
} from '@/config/brand-try-on-content'

describe('brand virtual try-on content', () => {
  it('includes the current Gentle Monster expansion batch', () => {
    expect(CURATED_BRAND_SLUGS).toEqual(expect.arrayContaining([
      'maui-jim',
      'miu-miu',
      'moscot',
      'prada',
      'gucci',
    ]))
  })

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

  it('explains the real photo handoff without promising a preloaded brand frame', () => {
    const guidance = BRAND_PHOTO_TRY_ON_GUIDANCE
    expect(guidance.heroNote).toMatch(/portrait/i)
    expect(guidance.heroNote).toMatch(/not load a branded frame/i)
    expect(guidance.sectionNote).toMatch(/not exact branded products/i)
    expect(guidance.cardCta).toMatch(/using a photo/i)
    expect(guidance.steps).toHaveLength(3)
    expect(guidance.steps.map(step => step.text).join(' ')).toMatch(/front-facing product photo or screenshot/i)
    expect(guidance.steps.map(step => step.text).join(' ')).toMatch(/Upload your portrait and that frame image/i)
    expect(guidance.steps.map(step => step.text).join(' ')).toMatch(/exact model.s dimensions/i)
  })

  it('returns null for brands that have not been editorially approved', () => {
    expect(getCuratedBrandContent('chanel')).toBeNull()
  })
})
