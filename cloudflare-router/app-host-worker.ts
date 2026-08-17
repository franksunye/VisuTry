import app from '../.open-next/worker.js'
import {
  classifyStagingPublicSlice,
  fallbackRequest,
  rewriteFallbackLocation,
  routerLogFields,
  withB4RouterHeaders,
} from './b4-staging-router'

interface Env {
  VERCEL_ORIGIN: string
  PUBLIC_HOST?: string
}

interface RouterExecutionContext {
  waitUntil(promise: Promise<unknown>): void
  passThroughOnException(): void
}

interface AppWorker {
  fetch(request: Request, env: unknown, ctx: RouterExecutionContext): Promise<Response>
}

const appWorker = app as unknown as AppWorker

export default {
  async fetch(request: Request, env: Env, ctx: RouterExecutionContext): Promise<Response> {
    const decision = classifyStagingPublicSlice(request)
    const startedAt = Date.now()
    const publicHost = env.PUBLIC_HOST || new URL(request.url).host

    if (decision.backend === 'cloudflare') {
      const response = await appWorker.fetch(request, env, ctx)
      const latencyMs = Date.now() - startedAt
      console.log(JSON.stringify(routerLogFields(request, decision, response.status, latencyMs)))
      return withB4RouterHeaders(response, decision, latencyMs)
    }

    try {
      const response = await fetch(fallbackRequest(request, env.VERCEL_ORIGIN))
      const latencyMs = Date.now() - startedAt
      console.log(JSON.stringify(routerLogFields(request, decision, response.status, latencyMs)))
      return withB4RouterHeaders(
        rewriteFallbackLocation(response, env.VERCEL_ORIGIN, publicHost),
        decision,
        latencyMs,
      )
    } catch (error) {
      const latencyMs = Date.now() - startedAt
      const errorClass = error instanceof Error ? error.name : 'upstream-fetch-failed'
      console.log(JSON.stringify(routerLogFields(request, decision, 502, latencyMs, errorClass)))
      return new Response('Upstream unavailable', {
        status: 502,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'x-visutry-router-backend': decision.backend,
          'x-visutry-router-class': decision.routeClass,
          'x-visutry-router-layer': 'layer3-vercel',
          'x-visutry-router-invocation': decision.invocation,
          'x-visutry-router-cache': decision.cacheClass,
          'x-visutry-router-latency-ms': String(latencyMs),
        },
      })
    }
  },
}
