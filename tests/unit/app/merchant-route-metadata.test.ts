import { metadata } from '@/app/[locale]/merchant/layout'

describe('Merchant workspace route metadata', () => {
  it('keeps every Merchant workspace route out of public SEO indexing', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })
})
