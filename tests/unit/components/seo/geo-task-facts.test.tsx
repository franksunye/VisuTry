import { renderToStaticMarkup } from 'react-dom/server'
import { GeoTaskFacts, GEO_TASK_FACTS, GEO_SEARCH_TASK_BY_PATH, getGeoSearchTaskId } from '@/components/seo/GeoTaskFacts'

describe('GEO task-first factual content contract', () => {
  it('has 13 distinct source-verified English task explanations', () => {
    expect(Object.keys(GEO_TASK_FACTS)).toHaveLength(13)
    expect(new Set(Object.values(GEO_TASK_FACTS).map((item) => item.answer)).size).toBe(13)
    for (const item of Object.values(GEO_TASK_FACTS)) {
      expect(item.answer.length).toBeGreaterThan(100)
      expect(item.limitation.length).toBeGreaterThan(60)
      expect(item.action.href).toMatch(/^\/en\//)
    }
  })
  it('injects only six exact Search-to-Tool routes, never programmatic combinations', () => {
    expect(Object.keys(GEO_SEARCH_TASK_BY_PATH)).toHaveLength(6)
    expect(getGeoSearchTaskId('/try-glasses-on-photo')).toBe('photo')
    expect(getGeoSearchTaskId('/glasses-guide/how-wide-should-glasses-be-for-my-face')).toBeNull()
    expect(getGeoSearchTaskId('/face-shape-detector')).toBeNull()
  })
  it('separates photo Try-On from built-in preset Frame Compare', () => {
    const tryon = renderToStaticMarkup(<GeoTaskFacts task="try-on" />)
    const compare = renderToStaticMarkup(<GeoTaskFacts task="compare" />)
    expect(tryon).toContain('front-facing image')
    expect(tryon).toContain('available credit')
    expect(compare).toContain('built-in preset frame looks')
    expect(compare).toContain('arbitrary store screenshots')
  })
  it('keeps paid Advisor and Merchant commitments accurate', () => {
    const advisor = renderToStaticMarkup(<GeoTaskFacts task="advisor" />)
    const merchant = renderToStaticMarkup(<GeoTaskFacts task="merchant" />)
    expect(advisor).toContain('credit-based Top Picks')
    expect(merchant).toContain('official Shopify app')
    expect(merchant).toContain('guaranteed merchant sales')
  })
})
