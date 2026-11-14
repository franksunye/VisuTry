import { renderToStaticMarkup } from 'react-dom/server'
import { RoundGlassesRoundFaceGuide } from '@/components/seo/RoundGlassesRoundFaceGuide'

describe('RoundGlassesRoundFaceGuide', () => {
  const html = renderToStaticMarkup(<RoundGlassesRoundFaceGuide />)

  it('compares three directions without making absolute face-shape claims', () => {
    expect(html).toContain('Soft round frame')
    expect(html).toContain('Rectangle frame')
    expect(html).toContain('Subtle cat-eye frame')
    expect(html).toContain('Face shape alone does not determine')
  })

  it('explains image prerequisites, comparison and fitting limitations', () => {
    expect(html).toContain('product photo or screenshot')
    expect(html).toContain('same clear, front-facing portrait')
    expect(html).toContain('does not automatically load')
    expect(html).toContain('not a physical fitting')
    expect(html).toContain('seller or an optician')
  })
})
