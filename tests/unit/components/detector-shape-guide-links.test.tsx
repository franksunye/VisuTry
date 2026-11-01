import { renderToStaticMarkup } from 'react-dom/server'
import { DetectorShapeGuideLinks } from '@/components/seo/DetectorShapeGuideLinks'
import { FACE_SHAPE_SLUGS } from '@/config/face-shape-content'

describe('DetectorShapeGuideLinks', () => {
  const html = renderToStaticMarkup(<DetectorShapeGuideLinks />)

  it('links to each of the seven canonical English shape guides', () => {
    for (const shape of FACE_SHAPE_SLUGS) {
      expect(html).toContain(`/en/style/${shape}-face`)
    }
  })

  it('uses existing curated frame guidance without promising perfect fit', () => {
    expect(html).toContain('styling estimate')
    expect(html).toContain('Width, comfort and personal preference')
    expect(html).toContain('Try first:')
  })
})
