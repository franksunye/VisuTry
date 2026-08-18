import { writeIsrTelemetrySafely, type AnalyticsEngineBinding } from './telemetry'
import {
  PASSTHROUGH_ROUTE_CLASS,
  STABLE_VERCEL_ORIGIN,
  parsePassthroughStage,
  passthroughOriginRequest,
  rewritePublicLocation,
  shouldInstrumentRequest,
} from './isr-passthrough'

export interface Env {
  VERCEL_ORIGIN: string
  PUBLIC_HOST?: string
  ISR_PASSTHROUGH_STAGE?: string
  ISR_TELEMETRY?: AnalyticsEngineBinding
  ISR_TELEMETRY_ENABLED?: string
  ISR_TELEMETRY_SAMPLE_RATE?: string
  ISR_HTML_TELEMETRY_SAMPLE_RATE?: string
}

function originOf(env: Env): string {
  return env.VERCEL_ORIGIN || STABLE_VERCEL_ORIGIN
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = originOf(env)
    const publicHost = env.PUBLIC_HOST || 'www.visutry.com'
    const stage = parsePassthroughStage(env.ISR_PASSTHROUGH_STAGE)
    const startedAt = Date.now()

    let upstream: Request
    try {
      upstream = passthroughOriginRequest(request, origin)
    } catch {
      return new Response('Unsafe origin', {
        status: 502,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      })
    }

    try {
      const response = await fetch(upstream)
      const latencyMs = Date.now() - startedAt
      const url = new URL(request.url)
      if (shouldInstrumentRequest({ method: request.method, pathname: url.pathname, stage })) {
        writeIsrTelemetrySafely({
          env,
          request,
          response,
          backend: 'vercel',
          routeClass: PASSTHROUGH_ROUTE_CLASS,
          latencyMs,
        })
      }
      return rewritePublicLocation(response, origin, publicHost)
    } catch {
      const latencyMs = Date.now() - startedAt
      console.error(JSON.stringify({
        path: new URL(request.url).pathname,
        backend: 'vercel',
        routeClass: PASSTHROUGH_ROUTE_CLASS,
        status: 502,
        latencyMs,
        error: 'upstream-fetch-failed',
      }))
      return new Response('Upstream unavailable', {
        status: 502,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      })
    }
  },
}
