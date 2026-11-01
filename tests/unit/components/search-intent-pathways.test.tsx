import { renderToStaticMarkup } from 'react-dom/server'
import { SearchIntentPathways } from '@/components/seo/SearchIntentPathways'

describe('SearchIntentPathways', () => {
  it('distinguishes face-shape selection from exact-frame try-on', () => {
    const html = renderToStaticMarkup(<SearchIntentPathways intent="selection" />)
    expect(html).toContain('free face-shape estimate')
    expect(html).toContain('/en/face-shape-detector')
    expect(html).toContain('/en/try-glasses-on-photo')
  })

  it('does not promise automatic frame loading for ready-to-try users', () => {
    const html = renderToStaticMarkup(<SearchIntentPathways intent="frame-ready" />)
    expect(html).toContain('separate product photo or retailer screenshot')
    expect(html).toContain('not preloaded')
    expect(html).toContain('/en/find-glasses-for-my-face')
    expect(html).toContain('/en/compare-glasses-frames')
  })
})
