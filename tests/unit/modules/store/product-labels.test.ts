import { productBrandForFrame } from '@/modules/store/application/product-labels'

describe('productBrandForFrame', () => {
  it('uses the explicit product brand even when the product name is unrelated', () => {
    const rigardsFrame = { name: 'RG1091TI', brand: 'RIGARDS' }
    const akilaFrame = { name: 'Model 2641', brand: 'Akila' }
    expect(productBrandForFrame(rigardsFrame)).toBe('RIGARDS')
    expect(productBrandForFrame(akilaFrame)).toBe('Akila')
  })

  it('returns null for missing or whitespace-only brands', () => {
    const missingBrandFrame = { name: 'Bali', brand: null }
    const blankBrandFrame = { name: 'Bali', brand: '   ' }
    expect(productBrandForFrame(missingBrandFrame)).toBeNull()
    expect(productBrandForFrame(blankBrandFrame)).toBeNull()
  })
})
