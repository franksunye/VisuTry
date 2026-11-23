import {
  resolveExperienceSearchReadiness,
  resolveExperienceSearchVisibility,
  type ExperienceSearchVisibilityInput,
} from '@/modules/store/domain/experience-search-visibility'

function savedPage(): ExperienceSearchVisibilityInput {
  return {
    merchant: {
      name: 'Independent Optical', status: 'ACTIVE', pilotType: 'LIVE',
      websiteUrl: 'https://optical.example', referenceData: false,
    },
    experience: {
      type: 'STORE', name: 'Everyday collection', status: 'ACTIVE', referenceData: false,
    },
    frames: Array.from({ length: 4 }, () => ({ productUrl: null })),
  }
}

describe('saved Store/Campaign search readiness', () => {
  it.each(['STORE', 'CAMPAIGN'] as const)('reports eligibility for a saved %s without claiming actual indexing', (type) => {
    const input = savedPage()
    input.experience!.type = type
    expect(resolveExperienceSearchReadiness(input)).toEqual({
      visibility: 'PUBLIC_INDEX', reasons: [], indexableLocale: 'en',
      activeFrameCount: 4, minimumFrameCount: 4,
    })
    expect(resolveExperienceSearchVisibility(input)).toBe('PUBLIC_INDEX')
  })

  it('keeps a published one-product collection readable while explaining the search threshold', () => {
    const input = { ...savedPage(), frames: [{ productUrl: null }] }
    expect(resolveExperienceSearchReadiness(input)).toMatchObject({
      visibility: 'PUBLIC_NOINDEX', reasons: ['INSUFFICIENT_FRAMES'], activeFrameCount: 1,
    })
  })

  it('returns all actionable blockers for an otherwise public page', () => {
    const input = savedPage()
    input.merchant = { ...input.merchant!, pilotType: 'DEMO', websiteUrl: 'javascript:alert(1)' }
    input.frames = [{ productUrl: 'not-a-url' }]
    expect(resolveExperienceSearchReadiness(input).reasons).toEqual([
      'MERCHANT_NOT_INDEXABLE', 'INSUFFICIENT_FRAMES', 'MISSING_DESTINATION',
    ])
    expect(resolveExperienceSearchVisibility(input)).toBe('PUBLIC_NOINDEX')
  })

  it.each(['merchant', 'experience', 'pilot'] as const)('does not override %s reference provenance with a first-party exception', (source) => {
    const input = savedPage()
    input.merchant!.sponsoredUsagePolicyKey = 'VISUTRY_OWNED'
    if (source === 'merchant') input.merchant!.referenceData = true
    if (source === 'experience') input.experience!.referenceData = true
    if (source === 'pilot') input.merchant!.pilotType = 'REFERENCE'
    expect(resolveExperienceSearchReadiness(input)).toMatchObject({
      visibility: 'PUBLIC_NOINDEX', reasons: ['REFERENCE'],
    })
  })

  it.each([
    ['DRAFT', 'PRIVATE', 'DRAFT'],
    ['ENDED', 'PUBLIC_NOINDEX', 'EXPERIENCE_ENDED'],
    ['ARCHIVED', 'PUBLIC_NOINDEX', 'EXPERIENCE_ARCHIVED'],
  ] as const)('preserves the %s publication boundary', (status, visibility, reason) => {
    const input = savedPage()
    input.experience!.status = status
    expect(resolveExperienceSearchReadiness(input)).toMatchObject({ visibility, reasons: [reason] })
    expect(resolveExperienceSearchVisibility(input)).toBe(visibility)
  })

  it('does not describe an inactive merchant or missing page as public', () => {
    const inactive = savedPage()
    inactive.merchant!.status = 'SUSPENDED'
    expect(resolveExperienceSearchReadiness(inactive)).toMatchObject({
      visibility: 'PRIVATE', reasons: ['MERCHANT_INACTIVE'],
    })
    expect(resolveExperienceSearchReadiness({ merchant: null, experience: null, frames: [] }))
      .toMatchObject({ visibility: 'PRIVATE', reasons: ['MISSING_MERCHANT', 'MISSING_EXPERIENCE'] })
  })

  it('reports missing readable content before search-specific blockers', () => {
    expect(resolveExperienceSearchReadiness({ ...savedPage(), frames: [] })).toMatchObject({
      visibility: 'PUBLIC_NOINDEX', reasons: ['NO_READABLE_CONTENT'], activeFrameCount: 0,
    })
  })

  it('accepts a product destination and keeps bounded aggregate reads consistent', () => {
    const input = savedPage()
    input.merchant!.websiteUrl = null
    input.frames[0].productUrl = 'https://optical.example/products/round'
    const aggregate = { ...input, frames: [], frameCount: 4, hasProductDestination: true }
    expect(resolveExperienceSearchReadiness(input).visibility).toBe('PUBLIC_INDEX')
    expect(resolveExperienceSearchReadiness(aggregate)).toEqual(resolveExperienceSearchReadiness(input))
    expect(resolveExperienceSearchReadiness({ ...aggregate, hasProductDestination: false }).reasons)
      .toEqual(['MISSING_DESTINATION'])
  })
})
