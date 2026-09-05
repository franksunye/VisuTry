/** @jest-environment node */

import {
  buildPublicDeliveryForensicEvent,
  classifyPublicDeliveryRequest,
  classifyUa,
  emitPublicDeliveryForensicEvent,
  forensicPathFamily,
  isPublicDeliveryForensicsEnabled,
  shouldSamplePublicDelivery,
} from '../../cloudflare-router/public-delivery-forensics'
import { classifyB4ProductionPublicSlice } from '../../cloudflare-router/b4-production-public-slice'

function request(path: string, headers: Record<string, string> = {}): Request {
  return new Request(`https://www.visutry.com${path}`, {
    headers,
  })
}

describe('public delivery forensic telemetry', () => {
  it('classifies request classes and prefetch without retaining query values', () => {
    expect(classifyPublicDeliveryRequest(request('/en/style/round-face?_rsc=opaque'))).toMatchObject({
      requestClass: 'rsc',
      isRsc: true,
      isPrefetch: false,
    })
    expect(classifyPublicDeliveryRequest(request('/en', { 'next-router-prefetch': '1' }))).toMatchObject({
      requestClass: 'rsc',
      isPrefetch: true,
    })
    expect(classifyPublicDeliveryRequest(request('/sitemaps/core.xml')).requestClass).toBe('sitemap')
    expect(classifyPublicDeliveryRequest(request('/_next/static/chunks/app.js')).requestClass).toBe('next_static')
    expect(classifyPublicDeliveryRequest(request('/api/health')).requestClass).toBe('api')
  })

  it('uses bounded route families and does not expose arbitrary slugs', () => {
    expect(forensicPathFamily('/en/style/round-face')).toBe('/:locale/style/:faceShape')
    expect(forensicPathFamily('/en/glasses-guide/private-slug')).toBe('/:locale/glasses-guide/:slug')
    expect(forensicPathFamily('/unexpected/private-value')).toBe('/*')
  })

  it('classifies bot and browser families from UA only', () => {
    expect(classifyUa('Mozilla/5.0 Chrome/123.0')).toBe('chrome')
    expect(classifyUa('Mozilla/5.0 AppleWebKit Safari/605.1')).toBe('safari')
    expect(classifyUa('Googlebot/2.1 (+http://www.google.com/bot.html)')).toBe('googlebot')
    expect(classifyUa('OAI-SearchBot/1.0')).toBe('oai_searchbot')
    expect(classifyUa('curl/8.0')).toBe('curl')
  })

  it('samples all forensic trigger classes, skips authenticated requests, and is deterministic', () => {
    expect(shouldSamplePublicDelivery(request('/en/style/round-face?_rsc=a'))).toBe(true)
    expect(shouldSamplePublicDelivery(request('/sitemaps/core.xml'))).toBe(true)
    expect(shouldSamplePublicDelivery(request('/en', { 'user-agent': 'Googlebot/2.1' }))).toBe(true)
    expect(shouldSamplePublicDelivery(request('/en', { cookie: 'next-auth.session-token=secret' }))).toBe(false)
    const sampled = request('/en', { 'cf-ray': 'stable-ray' })
    expect(shouldSamplePublicDelivery(sampled)).toBe(shouldSamplePublicDelivery(sampled))
  })

  it('captures only response headers and keeps the body untouched', () => {
    const req = request('/en/glasses-guide/round-face-cat-eye?_rsc=opaque', {
      'cf-ray': 'ray-id-1',
      'user-agent': 'OAI-SearchBot/1.0',
    })
    const decision = classifyB4ProductionPublicSlice(req)
    const response = new Response('body', {
      status: 200,
      headers: {
        'content-type': 'text/x-component; charset=utf-8',
        'content-length': '4',
        'cf-cache-status': 'DYNAMIC',
        'x-vercel-cache': 'HIT',
        'x-vercel-id': 'iad1::abc',
      },
    })
    const event = buildPublicDeliveryForensicEvent(req, decision, response)
    expect(event).toMatchObject({
      event: 'public_delivery_forensic',
      requestId: 'ray-id-1',
      pathFamily: '/:locale/glasses-guide/:slug',
      requestClass: 'rsc',
      uaClass: 'oai_searchbot',
      forwardedToVercel: true,
      cfCacheStatus: 'DYNAMIC',
      vercelCache: 'HIT',
      contentLength: 4,
    })
    expect(event).not.toHaveProperty('path')
    expect(event).not.toHaveProperty('userAgent')
    expect(event).not.toHaveProperty('cookie')
  })

  it('emits through waitUntil only when enabled and never synchronously logs', async () => {
    expect(isPublicDeliveryForensicsEnabled({})).toBe(false)
    expect(isPublicDeliveryForensicsEnabled({ VISUTRY_PUBLIC_DELIVERY_FORENSICS: '1' })).toBe(true)
    const waitUntil = jest.fn()
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    const req = request('/sitemaps/core.xml')
    const decision = classifyB4ProductionPublicSlice(req)

    emitPublicDeliveryForensicEvent(req, decision, new Response('ok'), {}, { waitUntil })
    expect(waitUntil).not.toHaveBeenCalled()
    emitPublicDeliveryForensicEvent(
      req,
      decision,
      new Response('ok'),
      { VISUTRY_PUBLIC_DELIVERY_FORENSICS: '1' },
      { waitUntil },
    )
    expect(waitUntil).toHaveBeenCalledTimes(1)
    expect(log).not.toHaveBeenCalled()
    await Promise.resolve()
    expect(log).toHaveBeenCalledTimes(1)
    log.mockRestore()
  })
})
