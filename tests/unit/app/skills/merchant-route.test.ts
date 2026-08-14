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
    expect(text).toMatch(/Store Builder \/ Delivery Factory/iu)
    expect(text).toMatch(/Campaign Builder/iu)
    expect(text).toMatch(/Commerce Analyst/iu)
    expect(text).toMatch(/State A — no usable Store/iu)
    expect(text).toMatch(/State B — Store exists, no Campaign/iu)
    expect(text).toMatch(/State C — Campaigns exist/iu)
    expect(text).toMatch(/Observed facts, Interpretation, and Recommendation/iu)
    expect(text).toMatch(/Do not stop after saying that the connection is verified/iu)
    expect(text).toMatch(/There is no MCP website crawler/iu)
    expect(text).toMatch(/publish_campaign requires explicit approval/iu)
    expect(text).not.toMatch(/create_website_crawler|scrape_catalog|invented_tool/iu)
    expect(text).not.toContain('secretHash')
  })
})
