/**
 * Production Vercel pass-through matcher for ISR edge telemetry (P0-E2B).
 *
 * Observability only. Every request this Worker receives is fetched from a
 * stable *.vercel.app origin. It never calls visutry-cf-production / OpenNext.
 */

import { LOCALES, type Locale } from './telemetry'
import { productionFallbackOrigin, productionPublicHost } from './b4-production-public-slice'

export const STABLE_VERCEL_ORIGIN = productionFallbackOrigin()
export const PRODUCTION_PUBLIC_HOST = productionPublicHost()
export const PASSTHROUGH_WORKER_NAME = 'visutry-isr-passthrough'
export const PASSTHROUGH_ROUTE_CLASS = 'vercel-passthrough'

export type PassthroughStage = 1 | 2

export type PassthroughDecision = {
  instrumented: boolean
  stage: PassthroughStage | null
  family: string | null
  locale: Locale | null
}

const STAGE1_FAMILY = 'glasses-guide'

const STAGE2_PREFIX_FAMILIES = ['style', 'sunglasses-for', 'face-shapes', 'hairstyles-for'] as const
const STAGE2_HUB_OR_PREFIX_FAMILIES = ['blog'] as const

function cleanPath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname || '/'
}

export function parsePassthroughStage(value: string | undefined): PassthroughStage {
  return value === '2' ? 2 : 1
}

export function isSafeVercelOrigin(origin: string): boolean {
  try {
    const url = new URL(origin)
    if (url.protocol !== 'https:') return false
    const host = url.hostname.toLowerCase()
    if (host === PRODUCTION_PUBLIC_HOST || host === 'visutry.com' || host === 'www.visutry.com') return false
    if (host.endsWith('.workers.dev')) return false
    return host.endsWith('.vercel.app')
  } catch {
    return false
  }
}

export function extractLocaleSegment(pathname: string): Locale | null {
  const first = cleanPath(pathname).split('/').filter(Boolean)[0]
  return LOCALES.includes(first as Locale) ? (first as Locale) : null
}

function restAfterLocale(pathname: string, locale: Locale): string {
  const path = cleanPath(pathname)
  return path === `/${locale}` ? '' : path.slice(locale.length + 1)
}

export function classifyInstrumentedSeoPath(
  pathname: string,
  stage: PassthroughStage,
): PassthroughDecision {
  const locale = extractLocaleSegment(pathname)
  if (!locale) return { instrumented: false, stage: null, family: null, locale: null }

  const rest = restAfterLocale(pathname, locale)
  if (!rest) return { instrumented: false, stage: null, family: null, locale }

  if (rest === `/${STAGE1_FAMILY}` || rest.startsWith(`/${STAGE1_FAMILY}/`)) {
    return { instrumented: true, stage: 1, family: STAGE1_FAMILY, locale }
  }

  if (stage < 2) return { instrumented: false, stage: null, family: null, locale }

  for (const family of STAGE2_HUB_OR_PREFIX_FAMILIES) {
    if (rest === `/${family}` || rest.startsWith(`/${family}/`)) {
      return { instrumented: true, stage: 2, family, locale }
    }
  }

  for (const family of STAGE2_PREFIX_FAMILIES) {
    if (rest.startsWith(`/${family}/`)) {
      return { instrumented: true, stage: 2, family, locale }
    }
  }

  return { instrumented: false, stage: null, family: null, locale }
}

export function shouldInstrumentRequest(input: {
  method: string
  pathname: string
  stage: PassthroughStage
}): boolean {
  const method = input.method.toUpperCase()
  if (method !== 'GET' && method !== 'HEAD') return false
  return classifyInstrumentedSeoPath(input.pathname, input.stage).instrumented
}

export function cloudflareRoutePatterns(stage: PassthroughStage, host = PRODUCTION_PUBLIC_HOST): string[] {
  const patterns: string[] = []
  for (const locale of LOCALES) {
    patterns.push(`${host}/${locale}/glasses-guide`)
    patterns.push(`${host}/${locale}/glasses-guide/*`)
    if (stage < 2) continue
    patterns.push(`${host}/${locale}/style/*`)
    patterns.push(`${host}/${locale}/blog`)
    patterns.push(`${host}/${locale}/blog/*`)
    patterns.push(`${host}/${locale}/sunglasses-for/*`)
    patterns.push(`${host}/${locale}/face-shapes/*`)
    patterns.push(`${host}/${locale}/hairstyles-for/*`)
  }
  return patterns
}

export function passthroughOriginRequest(request: Request, origin: string): Request {
  if (!isSafeVercelOrigin(origin)) {
    throw new Error('unsafe-vercel-origin')
  }

  const incoming = new URL(request.url)
  const target = new URL(origin)
  target.pathname = incoming.pathname
  target.search = incoming.search

  const headers = new Headers(request.headers)
  headers.set('host', target.host)
  headers.set('x-forwarded-host', incoming.host)
  headers.set('x-forwarded-proto', incoming.protocol.replace(':', '') || 'https')
  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body

  return new Request(target, {
    method: request.method,
    headers,
    body,
    redirect: 'manual',
    cache: 'no-store',
  })
}

const VISUTRY_VERCEL_ORIGIN = /https:\/\/visutry(?:[.-][\w]+)*\.vercel\.app/gi

export function rewritePublicLocation(response: Response, origin: string, publicHost: string): Response {
  const location = response.headers.get('location')
  if (!location) return response

  let rewritten = location
  try {
    const originHost = new URL(origin).host
    rewritten = rewritten.replace(VISUTRY_VERCEL_ORIGIN, `https://${publicHost}`)
    rewritten = rewritten.split(originHost).join(publicHost)
    rewritten = rewritten.replace(`https://${publicHost}//`, `https://${publicHost}/`)
  } catch {
    return response
  }

  if (rewritten === location) return response
  const headers = new Headers(response.headers)
  headers.set('location', rewritten)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
