/** @jest-environment node */

jest.mock('@/lib/prisma', () => ({ prisma: {} }))

import * as brandPage from '@/app/[locale]/(public)/brand/[brand]/page'
import * as categoryPage from '@/app/[locale]/(public)/category/[category]/page'
import * as tryPage from '@/app/[locale]/(public)/try/[slug]/page'
import * as stylePage from '@/app/[locale]/(public)/style/[faceShape]/page'

describe('quota-sensitive public page segment config', () => {
  it('converts high-cardinality SEO catalog routes from hourly ISR to static', () => {
    expect(brandPage.dynamic).toBe('force-static')
    expect(categoryPage.dynamic).toBe('force-static')
    expect(tryPage.dynamic).toBe('force-static')
    expect((brandPage as { revalidate?: number }).revalidate).toBeUndefined()
    expect((categoryPage as { revalidate?: number }).revalidate).toBeUndefined()
    expect((tryPage as { revalidate?: number }).revalidate).toBeUndefined()
    // Cloudflare OpenNext may open dynamicParams during CLOUDFLARE_BUILD.
    // The Vercel/unit default must keep bot slugs from becoming ISR entries.
    expect(process.env.CLOUDFLARE_BUILD).toBeUndefined()
    expect(brandPage.dynamicParams).toBe(false)
    expect(categoryPage.dynamicParams).toBe(false)
    expect(tryPage.dynamicParams).toBe(false)
  })

  it('keeps finite face-shape style pages static', () => {
    expect(stylePage.dynamic).toBe('force-static')
    expect(stylePage.dynamicParams).toBe(false)
  })
})
