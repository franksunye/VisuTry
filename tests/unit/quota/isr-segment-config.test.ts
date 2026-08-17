/** @jest-environment node */

jest.mock('@/lib/prisma', () => ({ prisma: {} }))

import * as brandPage from '@/app/[locale]/(main)/brand/[brand]/page'
import * as categoryPage from '@/app/[locale]/(main)/category/[category]/page'
import * as tryPage from '@/app/[locale]/(main)/try/[slug]/page'
import * as stylePage from '@/app/[locale]/(main)/style/[faceShape]/page'

describe('quota-sensitive public page segment config', () => {
  it('converts high-cardinality SEO catalog routes from hourly ISR to static', () => {
    expect(brandPage.dynamic).toBe('force-static')
    expect(categoryPage.dynamic).toBe('force-static')
    expect(tryPage.dynamic).toBe('force-static')
    expect((brandPage as { revalidate?: number }).revalidate).toBeUndefined()
    expect((categoryPage as { revalidate?: number }).revalidate).toBeUndefined()
    expect((tryPage as { revalidate?: number }).revalidate).toBeUndefined()
  })

  it('keeps finite face-shape style pages static', () => {
    expect(stylePage.dynamic).toBe('force-static')
    expect(stylePage.dynamicParams).toBe(false)
  })
})
