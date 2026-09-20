/** @jest-environment node */

import {
  isSafeStoreCampaignQuery,
  isStoreCampaignPublicHtmlEligible,
  isStoreCampaignPublicHtmlPath,
  storeCampaignPublicHtmlCacheTag,
  storeCampaignPublicHtmlCacheKey,
  storeCampaignPublicHtmlRoute,
} from '../../cloudflare-router/store-campaign-public-html'
import { handlePublicHtmlOffload } from '../../cloudflare-router/public-html-offload'

function request(path: string, init: RequestInit = {}) {
  return new Request(`https://www.visutry.com${path}`, init)
}

describe('Store/Campaign public HTML edge gate', () => {
  it('accepts only exact EN Store/Campaign detail shapes', () => {
    expect(storeCampaignPublicHtmlRoute('/en/store/luna-optical')).toMatchObject({ surface: 'STORE', merchantSlug: 'luna-optical' })
    expect(storeCampaignPublicHtmlRoute('/en/c/luna-optical/petite-fit')).toMatchObject({ surface: 'CAMPAIGN', merchantSlug: 'luna-optical', experienceSlug: 'petite-fit' })
    expect(isStoreCampaignPublicHtmlPath('/en/store')).toBe(false)
    expect(isStoreCampaignPublicHtmlPath('/en/store/')).toBe(false)
    expect(isStoreCampaignPublicHtmlPath('/en/store/luna-optical/extra')).toBe(false)
    expect(isStoreCampaignPublicHtmlPath('/en/store-explorer/luna-optical')).toBe(false)
    expect(isStoreCampaignPublicHtmlPath('/de/store/luna-optical')).toBe(false)
    expect(isStoreCampaignPublicHtmlPath('/en/c/luna-optical/petite-fit/extra')).toBe(false)
    expect(isStoreCampaignPublicHtmlPath('/en/c/luna%2Foptical/petite-fit')).toBe(false)
  })

  it('allows safe attribution queries but fails open for unknown or RSC queries', () => {
    expect(isSafeStoreCampaignQuery(new URL('https://www.visutry.com/en/store/luna-optical?utm_source=guide&campaign=launch'))).toBe(true)
    expect(isSafeStoreCampaignQuery(new URL('https://www.visutry.com/en/store/luna-optical?merchantContinuation=bounded'))).toBe(true)
    expect(isSafeStoreCampaignQuery(new URL('https://www.visutry.com/en/store/luna-optical?unknown=1'))).toBe(false)
    expect(isSafeStoreCampaignQuery(new URL('https://www.visutry.com/en/store/luna-optical?_rsc=1'))).toBe(false)
    expect(isStoreCampaignPublicHtmlEligible(request('/en/store/luna-optical?utm_source=guide'))).toBe(true)
    expect(isStoreCampaignPublicHtmlEligible(request('/en/store/luna-optical?unknown=1'))).toBe(false)
    expect(isStoreCampaignPublicHtmlEligible(request('/en/store/luna-optical', { headers: { cookie: 'session=1' } }))).toBe(false)
    expect(isStoreCampaignPublicHtmlEligible(request('/en/c/luna-optical/petite-fit', { headers: { rsc: '1' } }))).toBe(false)
  })

  it('shares the safe HTML cache engine and strips only approved query variants from the key', async () => {
    const cacheEntries = new Map<string, Response>()
    const cache = {
      match: jest.fn(async (key: Request) => cacheEntries.get(key.url)),
      put: jest.fn(async (key: Request, response: Response) => { cacheEntries.set(key.url, response) }),
    }
    const origin = jest.fn(async () => new Response('<html>store</html>', { status: 200, headers: { 'content-type': 'text/html' } }))
    const policy = {
      isEligible: isStoreCampaignPublicHtmlEligible,
      cacheKey: storeCampaignPublicHtmlCacheKey,
      cacheTag: storeCampaignPublicHtmlCacheTag,
      ttlSeconds: 3600,
    }
    const first = await handlePublicHtmlOffload(request('/en/store/luna-optical?utm_source=guide'), { cache, fetchOrigin: origin }, policy)
    const second = await handlePublicHtmlOffload(request('/en/store/luna-optical?campaign=launch'), { cache, fetchOrigin: origin }, policy)
    expect(first.status).toBe('MISS')
    expect(second.status).toBe('HIT')
    expect(first.response.headers.get('Cache-Tag')).toBeNull()
    expect(origin).toHaveBeenCalledTimes(1)
    expect(cache.put).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({ headers: expect.any(Headers) }),
    )
    const storedResponse = cache.put.mock.calls[0][1] as Response
    expect(storedResponse.headers.get('Cache-Tag')).toBe('visutry:public-html:store:en:luna-optical')
    expect(storeCampaignPublicHtmlCacheKey(request('/en/store/luna-optical?utm_source=guide')).url).toBe('https://www.visutry.com/en/store/luna-optical')
  })
})
