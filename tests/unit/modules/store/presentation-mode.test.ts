import { resolvePresentationMode } from '@/modules/store/domain/presentation-mode'

describe('resolvePresentationMode', () => {
  it('defaults Stores to product-first and Campaigns to editorial-first', () => {
    expect(resolvePresentationMode({ experienceType: 'STORE' })).toBe('PRODUCT_FIRST')
    expect(resolvePresentationMode({ experienceType: 'CAMPAIGN' })).toBe('EDITORIAL_FIRST')
  })

  it.each(['face-analysis', 'compare', 'style-explorer'] as const)(
    'uses action-first for the known contextual surface %s',
    (acquisitionSurface) => {
      expect(resolvePresentationMode({ experienceType: 'CAMPAIGN', acquisitionSurface })).toBe('ACTION_FIRST')
    },
  )

  it('does not promote unknown or generic surfaces', () => {
    expect(resolvePresentationMode({ experienceType: 'STORE', acquisitionSurface: 'discover' })).toBe('PRODUCT_FIRST')
    expect(resolvePresentationMode({ experienceType: 'CAMPAIGN', acquisitionSurface: 'other' })).toBe('EDITORIAL_FIRST')
  })

  it('honors an explicit mode only when a caller has a trusted value', () => {
    expect(resolvePresentationMode({ experienceType: 'STORE', explicitPresentationMode: 'ACTION_FIRST' })).toBe('ACTION_FIRST')
  })
})
