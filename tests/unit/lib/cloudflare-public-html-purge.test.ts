/** @jest-environment node */

import { publicHtmlPurgeUrls, purgePublicHtmlTags, purgePublicHtmlUrls } from '@/lib/cloudflare-public-html-purge'
import { logger } from '@/lib/logger'

describe('exact Store/Campaign public HTML purge client', () => {
  const originalZone = process.env.CLOUDFLARE_ZONE_ID
  const originalToken = process.env.CLOUDFLARE_PUBLIC_HTML_PURGE_TOKEN

  afterEach(() => {
    jest.restoreAllMocks()
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

  it('emits a bounded canonical event for successful file purges without secrets', async () => {
    process.env.CLOUDFLARE_ZONE_ID = 'secret-zone'
    process.env.CLOUDFLARE_PUBLIC_HTML_PURGE_TOKEN = 'secret-token'
    const info = jest.spyOn(logger, 'info').mockImplementation(() => undefined)
    const fetchMock: typeof fetch = async () => new Response(JSON.stringify({ success: true }), { status: 200 })

    await expect(purgePublicHtmlUrls(['/en/store/luna-optical'], fetchMock)).resolves.toMatchObject({
      attempted: true,
      success: true,
      urlCount: 1,
    })

    expect(info).toHaveBeenCalledWith('store', 'Public HTML invalidation', {
      event: 'public_html_invalidation',
      type: 'files',
      status: 'success',
      source: 'cloudflare',
    })
    expect(JSON.stringify(info.mock.calls)).not.toContain('secret-zone')
    expect(JSON.stringify(info.mock.calls)).not.toContain('secret-token')
  })

  it('emits a bounded canonical event for successful tag purges', async () => {
    process.env.CLOUDFLARE_ZONE_ID = 'secret-zone'
    process.env.CLOUDFLARE_PUBLIC_HTML_PURGE_TOKEN = 'secret-token'
    const info = jest.spyOn(logger, 'info').mockImplementation(() => undefined)
    const fetchMock: typeof fetch = async () => new Response(JSON.stringify({ success: true }), { status: 200 })

    await expect(purgePublicHtmlTags(['visutry:public-html:campaign:en:merchant:petite-fit'], fetchMock)).resolves.toMatchObject({
      attempted: true,
      success: true,
      tagCount: 1,
    })

    expect(info).toHaveBeenCalledWith('store', 'Public HTML invalidation', {
      event: 'public_html_invalidation',
      type: 'tags',
      status: 'success',
      source: 'cloudflare',
    })
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
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined)
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
    expect(error).toHaveBeenCalledWith('store', 'Public HTML invalidation', expect.any(Error), {
      event: 'public_html_invalidation',
      type: 'tags',
      status: 'failed',
      source: 'cloudflare',
      failureReason: 'cloudflare_purge_partial_failure',
    })
  })

  it('emits a bounded warning when credentials are missing', async () => {
    delete process.env.CLOUDFLARE_ZONE_ID
    delete process.env.CLOUDFLARE_PUBLIC_HTML_PURGE_TOKEN
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined)

    await expect(purgePublicHtmlTags(['visutry:public-html:campaign:en:merchant:petite-fit'])).resolves.toMatchObject({
      attempted: false,
      success: false,
      reason: 'purge_credentials_not_configured',
    })

    expect(warn).toHaveBeenCalledWith('store', 'Public HTML invalidation', {
      event: 'public_html_invalidation',
      type: 'tags',
      status: 'not_attempted',
      source: 'cloudflare',
      failureReason: 'purge_credentials_not_configured',
    })
  })

  it('keeps the purge result when canonical logging throws', async () => {
    process.env.CLOUDFLARE_ZONE_ID = 'zone'
    process.env.CLOUDFLARE_PUBLIC_HTML_PURGE_TOKEN = 'token'
    jest.spyOn(logger, 'info').mockImplementation(() => {
      throw new Error('logger unavailable')
    })
    let requestCount = 0
    const fetchMock: typeof fetch = async () => {
      requestCount += 1
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }

    await expect(purgePublicHtmlTags(['visutry:public-html:campaign:en:merchant:petite-fit'], fetchMock)).resolves.toMatchObject({
      attempted: true,
      success: true,
      tagCount: 1,
    })
    expect(requestCount).toBe(1)
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
