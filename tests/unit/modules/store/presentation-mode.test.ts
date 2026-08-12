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

  it('lets an explicit ACTION_FIRST override persisted and contextual modes', () => {
    expect(resolvePresentationMode({
      experienceType: 'CAMPAIGN',
      explicitPresentationMode: 'ACTION_FIRST',
      persistedPresentationMode: 'EDITORIAL_FIRST',
      acquisitionSurface: 'face-analysis',
    })).toBe('ACTION_FIRST')
  })

  it('lets an explicit PRODUCT_FIRST override persisted and contextual modes', () => {
    expect(resolvePresentationMode({
      experienceType: 'CAMPAIGN',
      explicitPresentationMode: 'PRODUCT_FIRST',
      persistedPresentationMode: 'EDITORIAL_FIRST',
      acquisitionSurface: 'face-analysis',
    })).toBe('PRODUCT_FIRST')
  })

  it('lets persisted presentation override contextual ACTION_FIRST', () => {
    expect(resolvePresentationMode({
      experienceType: 'CAMPAIGN',
      persistedPresentationMode: 'EDITORIAL_FIRST',
      acquisitionSurface: 'face-analysis',
    })).toBe('EDITORIAL_FIRST')
  })

  it('uses contextual ACTION_FIRST only without explicit or persisted modes', () => {
    expect(resolvePresentationMode({
      experienceType: 'CAMPAIGN',
      acquisitionSurface: 'face-analysis',
    })).toBe('ACTION_FIRST')
  })
})
