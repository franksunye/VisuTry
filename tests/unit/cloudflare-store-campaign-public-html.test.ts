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

  it('models archived Campaign stale-HIT exposure if purge fails, then exact-tag purge isolates Store and closes the Guest route', async () => {
    const storePath = '/en/store/luna-optical'
    const campaignPath = '/en/c/luna-optical/petite-fit'
    const stored = new Map<string, Response>()
    const cache = {
      match: jest.fn(async (key: Request) => stored.get(key.url)),
      put: jest.fn(async (key: Request, response: Response) => {
        stored.set(key.url, response)
      }),
    }
    const active = new Set([storePath, campaignPath])
    const fetchOrigin = jest.fn(async (input: Request) => {
      const pathname = new URL(input.url).pathname
      return active.has(pathname)
        ? new Response(`<html>ACTIVE: ${pathname}</html>`, { status: 200, headers: { 'content-type': 'text/html' } })
        : new Response('not found', { status: 404, headers: { 'content-type': 'text/html' } })
    })
    const runtime = { cache, fetchOrigin }
    const policy = {
      isEligible: isStoreCampaignPublicHtmlEligible,
      cacheKey: storeCampaignPublicHtmlCacheKey,
      cacheTag: storeCampaignPublicHtmlCacheTag,
      ttlSeconds: 3600,
    }

    // Two independent public identities enter Cache API with canonical tags.
    expect((await handlePublicHtmlOffload(request(storePath), runtime, policy)).status).toBe('MISS')
    expect((await handlePublicHtmlOffload(request(campaignPath), runtime, policy)).status).toBe('MISS')
    expect(stored.get(storeCampaignPublicHtmlCacheKey(request(storePath)).url)?.headers.get('Cache-Tag'))
      .toBe('visutry:public-html:store:en:luna-optical')
    const campaignTag = storeCampaignPublicHtmlCacheTag(request(campaignPath))
    expect(campaignTag).toBe('visutry:public-html:campaign:en:luna-optical:petite-fit')

    // The canonical DB/route-admission archive has happened, but a failed
    // post-commit edge purge still leaves the earlier 200 in the Worker cache.
    active.delete(campaignPath)
    const unsafeCached = await handlePublicHtmlOffload(request(campaignPath), runtime, policy)
    expect(unsafeCached.status).toBe('HIT')
    expect(unsafeCached.response.status).toBe(200)
    expect(await unsafeCached.response.text()).toContain('ACTIVE:')
    expect(fetchOrigin).toHaveBeenCalledTimes(2) // cache HIT never rechecks origin

    // Simulate an acknowledged Cloudflare purge of exactly that Cache-Tag.
    // This is an in-memory behavioral model, NOT live Cloudflare purge proof.
    for (const [key, response] of stored) {
      if (response.headers.get('Cache-Tag') === campaignTag) stored.delete(key)
    }

    const archivedGuest = await handlePublicHtmlOffload(request(campaignPath), runtime, policy)
    expect(archivedGuest.status).toBe('BYPASS')
    expect(archivedGuest.response.status).toBe(404)
    expect(stored.has(storeCampaignPublicHtmlCacheKey(request(campaignPath)).url)).toBe(false)
    const unrelatedStore = await handlePublicHtmlOffload(request(storePath), runtime, policy)
    expect(unrelatedStore.status).toBe('HIT')
    expect(unrelatedStore.response.status).toBe(200)
    expect(fetchOrigin).toHaveBeenCalledTimes(3)
  })
})
