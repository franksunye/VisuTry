/** @jest-environment node */

import { publicHtmlPurgeUrls, purgePublicHtmlUrls } from '@/lib/cloudflare-public-html-purge'

describe('exact Store/Campaign public HTML purge client', () => {
  const originalZone = process.env.CLOUDFLARE_ZONE_ID
  const originalToken = process.env.CLOUDFLARE_PUBLIC_HTML_PURGE_TOKEN

  afterEach(() => {
    if (originalZone === undefined) delete process.env.CLOUDFLARE_ZONE_ID
    else process.env.CLOUDFLARE_ZONE_ID = originalZone
    if (originalToken === undefined) delete process.env.CLOUDFLARE_PUBLIC_HTML_PURGE_TOKEN
    else process.env.CLOUDFLARE_PUBLIC_HTML_PURGE_TOKEN = originalToken
  })

  it('deduplicates and rejects broad/query-bearing paths', () => {
    expect(publicHtmlPurgeUrls(['/en/store/luna-optical', '/en/store/luna-optical', '/en/store/*', '/en/store/x?purge=all'])).toEqual([
      'https://www.visutry.com/en/store/luna-optical',
    ])
  })

  it('uses exact files only and never purge_everything', async () => {
    process.env.CLOUDFLARE_ZONE_ID = 'zone'
    process.env.CLOUDFLARE_PUBLIC_HTML_PURGE_TOKEN = 'token'
    const calls: RequestInit[] = []
    const fetchMock: typeof fetch = async (_input, init) => {
      calls.push(init ?? {})
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }
    await expect(purgePublicHtmlUrls(['/en/store/luna-optical', '/en/c/luna-optical/petite-fit'], fetchMock)).resolves.toMatchObject({
      attempted: true,
      success: true,
      urlCount: 2,
    })
    expect(String(calls[0].body)).toContain('www.visutry.com/en/store/luna-optical')
    expect(String(calls[0].body)).not.toContain('purge_everything')
  })

  it('does not fail the caller when credentials are absent', async () => {
    delete process.env.CLOUDFLARE_ZONE_ID
    delete process.env.CLOUDFLARE_PUBLIC_HTML_PURGE_TOKEN
    await expect(purgePublicHtmlUrls(['/en/store/luna-optical'])).resolves.toMatchObject({
      attempted: false,
      success: false,
    })
  })
})
