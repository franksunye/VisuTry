import fs from 'fs'
import path from 'path'

import {
  VISUTRY_POSITIONING,
  VISUTRY_PRODUCT_NAMES,
  VISUTRY_PRODUCT_PATH,
  VISUTRY_PUBLIC_BOUNDARIES,
  VISUTRY_PUBLIC_FACTS,
} from '@/lib/product-positioning'
import { SITE_CONFIG, generateStructuredData } from '@/lib/seo'

const rootDir = process.cwd()
const locales = ['en', 'id', 'ar', 'ru', 'de', 'ja', 'es', 'pt', 'fr']

describe('AI-facing product positioning', () => {
  it('freezes the canonical consumer workflow', () => {
    expect(VISUTRY_PRODUCT_PATH).toEqual([
      'Face Shape Detector',
      'Glasses Advisor',
      'Virtual Try-On',
      'Frame Compare',
    ])
    expect(VISUTRY_PRODUCT_NAMES.credits).toBe('Credits Pack')
    expect(VISUTRY_POSITIONING.organization).toContain('eyewear decision and conversion platform')
    expect(VISUTRY_POSITIONING.merchant).toContain('AI commerce and campaign engine')
  })

  it('keeps durable facts and boundaries explicit', () => {
    expect(VISUTRY_PUBLIC_FACTS.join(' ')).toContain('one-time purchase')
    expect(VISUTRY_PUBLIC_FACTS.join(' ')).toContain('do not expire')
    expect(VISUTRY_PUBLIC_FACTS.join(' ')).toContain('browser memory')
    expect(VISUTRY_PUBLIC_BOUNDARIES.join(' ')).toContain('not identity recognition or medical assessments')
    expect(VISUTRY_PUBLIC_BOUNDARIES.join(' ')).toContain('does not currently claim a public agent action API')
  })

  it('uses the canonical category in global metadata and structured data', () => {
    expect(SITE_CONFIG.description).toBe(VISUTRY_POSITIONING.organization)

    const organization = generateStructuredData('organization', {})
    const website = generateStructuredData('website', { potentialAction: undefined })

    expect(organization.description).toBe(VISUTRY_POSITIONING.organization)
    expect(website.description).toBe(VISUTRY_POSITIONING.organization)
  })

  it('does not expose legacy global identity terms', () => {
    const metadata = [SITE_CONFIG.title, SITE_CONFIG.description, ...(SITE_CONFIG.keywords || [])].join(' ')
    expect(metadata).not.toMatch(/Nano Banana|Gemini 2\.5 Flash Image/i)
    expect(metadata).not.toMatch(/virtual try-on outfit|virtual try-on shoes|virtual try-on accessories/i)
    expect(metadata).not.toMatch(/try on anything|multi-category virtual try-on/i)
  })

  it('publishes consumer, merchant, and claim-boundary facts in llms.txt', () => {
    const llms = fs.readFileSync(path.join(rootDir, 'public/llms.txt'), 'utf8')
    expect(llms).toContain('Face Shape Detector → Glasses Advisor → Virtual Try-On → Frame Compare')
    expect(llms).toContain('AI Commerce / Campaign Engine')
    expect(llms).toContain('does not currently claim a public agent action API')
    expect(llms).not.toMatch(/Nano Banana|Gemini 2\.5 Flash Image/i)
  })

  it.each(locales)('provides the business bridge in %s', (locale) => {
    const messages = JSON.parse(
      fs.readFileSync(path.join(rootDir, 'messages', `${locale}.json`), 'utf8'),
    )

    expect(messages.marketing.home.business).toEqual(
      expect.objectContaining({
        eyebrow: expect.any(String),
        title: expect.any(String),
        description: expect.any(String),
        cta: expect.any(String),
      }),
    )
    expect(messages.marketing.home.business.title.length).toBeGreaterThan(20)
  })
})
