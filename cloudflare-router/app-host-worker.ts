import app from '../.open-next/worker.js'
import {
  classifyStagingPublicSlice,
  fallbackRequest,
  resolveOpenNextAppWorker,
  rewriteFallbackLocation,
  routerLogFields,
  sanitizeWorkerException,
  withB4RouterHeaders,
} from './b4-staging-router'
import { writeIsrTelemetrySafely, type AnalyticsEngineBinding } from './telemetry'

interface Env {
  VERCEL_ORIGIN: string
  PUBLIC_HOST?: string
  ISR_TELEMETRY?: AnalyticsEngineBinding
  ISR_TELEMETRY_ENABLED?: string
  ISR_TELEMETRY_SAMPLE_RATE?: string
  ISR_HTML_TELEMETRY_SAMPLE_RATE?: string
}

interface RouterExecutionContext {
  waitUntil(promise: Promise<unknown>): void
  passThroughOnException(): void
}

interface AppWorker {
  fetch(request: Request, env: unknown, ctx: RouterExecutionContext): Promise<Response>
}

const appWorker = resolveOpenNextAppWorker(app) as unknown as AppWorker

export default {
  async fetch(request: Request, env: Env, ctx: RouterExecutionContext): Promise<Response> {
    const decision = classifyStagingPublicSlice(request)
    const startedAt = Date.now()
    const publicHost = env.PUBLIC_HOST || new URL(request.url).host

    if (decision.backend === 'cloudflare') {
      try {
        const response = await appWorker.fetch(request, env, ctx)
        const latencyMs = Date.now() - startedAt
        console.log(JSON.stringify(routerLogFields(request, decision, response.status, latencyMs)))
        return withB4RouterHeaders(response, decision, latencyMs)
      } catch (error) {
        const latencyMs = Date.now() - startedAt
        const { errorClass, errorDetail } = sanitizeWorkerException(error)
        console.log(JSON.stringify({
          ...routerLogFields(request, decision, 500, latencyMs, errorClass),
          errorDetail,
        }))
        const previewHost = new URL(request.url).host.endsWith('.workers.dev')
        return new Response(
          previewHost
            ? JSON.stringify({ error: errorClass, detail: errorDetail })
            : 'Internal Server Error',
          {
            status: 500,
            headers: {
              'content-type': previewHost ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
              'x-visutry-router-backend': decision.backend,
              'x-visutry-router-class': decision.routeClass,
              'x-visutry-router-layer': 'layer2-worker',
              'x-visutry-router-invocation': decision.invocation,
              'x-visutry-router-cache': decision.cacheClass,
              'x-visutry-router-latency-ms': String(latencyMs),
            },
          },
        )
      }
    }

    try {
      const response = await fetch(fallbackRequest(request, env.VERCEL_ORIGIN))
      const latencyMs = Date.now() - startedAt
      console.log(JSON.stringify(routerLogFields(request, decision, response.status, latencyMs)))
      writeIsrTelemetrySafely({
        env,
        request,
        response,
        backend: decision.backend,
        routeClass: decision.routeClass,
        latencyMs,
      })
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
