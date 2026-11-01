import { renderToStaticMarkup } from 'react-dom/server'
import { FrameWidthBuyingGuide } from '@/components/seo/FrameWidthBuyingGuide'

describe('FrameWidthBuyingGuide', () => {
  const html = renderToStaticMarkup(<FrameWidthBuyingGuide />)

  it('explains all three frame markings without equating them to total width', () => {
    expect(html).toContain('52')
    expect(html).toContain('18')
    expect(html).toContain('145')
    expect(html).toContain('not the overall front-frame width')
    expect(html).toContain('2 × 52 + 18 = 122 mm')
    expect(html).toContain('overall frame width')
  })

  it('contains four fit checks and a physical-fit limitation', () => {
    expect(html).toContain('Look at the sides')
    expect(html).toContain('Check for excess overhang')
    expect(html).toContain('Center the eyes')
    expect(html).toContain('Confirm the bridge and temples')
    expect(html).toContain('A photo cannot confirm physical comfort')
    expect(html).toContain('seller or an optician')
  })
})
