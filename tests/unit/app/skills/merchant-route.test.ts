/** @jest-environment node */

import { GET } from '@/app/skills/merchant/route'

describe('Merchant Skill endpoint', () => {
  it('is public, cacheable, and combines setup, campaign, and analytics guidance', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/markdown')
    expect(response.headers.get('cache-control')).toContain('public')
    const text = await response.text()
    expect(text).toContain('# VisuTry Merchant')
    expect(text).toMatch(/Store workflow/iu)
    expect(text).toMatch(/Campaign workflow/iu)
    expect(text).toMatch(/Analytics workflow/iu)
    expect(text).not.toContain('secretHash')
  })
})
