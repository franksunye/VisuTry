import { productBrandForFrame } from '@/modules/store/application/product-labels'

describe('productBrandForFrame', () => {
  it('exposes the leading brand for a tagged multi-brand catalog', () => {
    expect(productBrandForFrame({ name: 'RIGARDS RG1091TI', collectionTags: ['retailer', 'multi-brand'] })).toBe('RIGARDS')
    expect(productBrandForFrame({ name: 'Akila Myca', collectionTags: ['multi-brand'] })).toBe('Akila')
  })

  it('does not invent a product brand for a single-brand catalog', () => {
    expect(productBrandForFrame({ name: 'Bali', collectionTags: ['core-style'] })).toBeNull()
  })
})
