/** @jest-environment node */

import { GET } from '@/app/skills/commerce-analyst/route'

describe('Commerce Analyst Skill endpoint', () => {
  it('is public, cacheable, and contains the read/advice safety contract', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/markdown')
    expect(response.headers.get('cache-control')).toContain('public')
    const text = await response.text()
    expect(text).toMatch(/objective-aware/iu)
    expect(text).toMatch(/small sample/iu)
    expect(text).toContain('reference-data')
    expect(text).toContain('revenue')
    expect(text).toContain('READ / ADVISE')
    expect(text).not.toContain('secretHash')
  })
})
