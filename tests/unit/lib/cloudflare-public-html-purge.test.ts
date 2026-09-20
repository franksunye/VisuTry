/** @jest-environment node */

import { publicHtmlPurgeUrls, purgePublicHtmlTags, purgePublicHtmlUrls } from '@/lib/cloudflare-public-html-purge'

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

  it('batches every file without truncating beyond the Cloudflare batch limit', async () => {
    process.env.CLOUDFLARE_ZONE_ID = 'zone'
    process.env.CLOUDFLARE_PUBLIC_HTML_PURGE_TOKEN = 'token'
    const calls: RequestInit[] = []
    const fetchMock: typeof fetch = async (_input, init) => {
      calls.push(init ?? {})
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }
    const paths = Array.from({ length: 205 }, (_, index) => `/en/store/merchant-${index}`)
    await expect(purgePublicHtmlUrls(paths, fetchMock)).resolves.toMatchObject({
      attempted: true,
      success: true,
      urlCount: 205,
      batchCount: 3,
      failedBatchCount: 0,
    })
    const purgedUrls = calls.flatMap((call) => JSON.parse(String(call.body)).files as string[])
    expect(calls).toHaveLength(3)
    expect(purgedUrls).toHaveLength(205)
    expect(new Set(purgedUrls).size).toBe(205)
    expect(calls.every((call) => (JSON.parse(String(call.body)).files as string[]).length <= 100)).toBe(true)
  })

  it('purges canonical Store/Campaign Cache-Tags in batches and reports partial failure', async () => {
    process.env.CLOUDFLARE_ZONE_ID = 'zone'
    process.env.CLOUDFLARE_PUBLIC_HTML_PURGE_TOKEN = 'token'
    const calls: RequestInit[] = []
    const fetchMock: typeof fetch = async (_input, init) => {
      calls.push(init ?? {})
      const batch = JSON.parse(String(init?.body)).tags as string[]
      return new Response(JSON.stringify({ success: batch.length === 100 }), { status: 200 })
    }
    const tags = Array.from({ length: 101 }, (_, index) => `visutry:public-html:campaign:en:merchant:${index}`)
    await expect(purgePublicHtmlTags(tags, fetchMock)).resolves.toMatchObject({
      attempted: true,
      success: false,
      tagCount: 101,
      batchCount: 2,
      failedBatchCount: 1,
    })
    expect(calls).toHaveLength(3)
    expect(calls.every((call) => (JSON.parse(String(call.body)).tags as string[]).length <= 100)).toBe(true)
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
