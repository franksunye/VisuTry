import app from '../.open-next/worker.js'
import { classify, upstreamRequest, type RouteDecision } from './worker'

interface Env {
  VERCEL_ORIGIN: string
}

interface RouterExecutionContext {
  waitUntil(promise: Promise<unknown>): void
  passThroughOnException(): void
}

interface AppWorker {
  fetch(request: Request, env: unknown, ctx: RouterExecutionContext): Promise<Response>
}

const appWorker = app as unknown as AppWorker

function withRouterHeaders(response: Response, decision: RouteDecision, latencyMs: number): Response {
  const headers = new Headers(response.headers)
  headers.set('x-visutry-router-backend', decision.backend)
  headers.set('x-visutry-router-class', decision.routeClass)
  headers.set('x-visutry-router-latency-ms', String(latencyMs))
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export default {
  async fetch(request: Request, env: Env, ctx: RouterExecutionContext): Promise<Response> {
    const decision = classify(request)
    const startedAt = Date.now()

    if (decision.backend === 'cloudflare') {
      const response = await appWorker.fetch(request, env, ctx)
      const latencyMs = Date.now() - startedAt
      console.log(JSON.stringify({
        path: new URL(request.url).pathname,
        backend: decision.backend,
        routeClass: decision.routeClass,
        status: response.status,
        latencyMs,
      }))
      return withRouterHeaders(response, decision, latencyMs)
    }

    try {
      const response = await fetch(upstreamRequest(request, env.VERCEL_ORIGIN))
      const latencyMs = Date.now() - startedAt
      console.log(JSON.stringify({
        path: new URL(request.url).pathname,
        backend: decision.backend,
        routeClass: decision.routeClass,
        status: response.status,
        latencyMs,
      }))
      return withRouterHeaders(response, decision, latencyMs)
    } catch (error) {
      const latencyMs = Date.now() - startedAt
      console.log(JSON.stringify({
        path: new URL(request.url).pathname,
        backend: decision.backend,
        routeClass: decision.routeClass,
        status: 502,
        latencyMs,
        error: error instanceof Error ? error.name : 'upstream-fetch-failed',
      }))
      return new Response('Upstream unavailable', {
        status: 502,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'x-visutry-router-backend': decision.backend,
          'x-visutry-router-class': decision.routeClass,
          'x-visutry-router-latency-ms': String(latencyMs),
        },
      })
    }
  },
}
