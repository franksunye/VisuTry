import { logger } from '@/lib/logger'

export type FunctionObservationActor = 'consumer' | 'merchant' | 'admin' | 'system' | 'shared'

/**
 * Stable route-family labels only. Never pass a request URL, slug, task ID,
 * merchant ID, or other request-derived value as a route label.
 */
export type FunctionObservationRoute =
  | 'api.auth.nextauth'
  | 'api.consumer.try_on.submit'
  | 'api.consumer.face_analysis.submit'
  | 'api.consumer.store_session.create'
  | 'api.consumer.store_try_on.submit'
  | 'api.merchant.campaigns.collection'
  | 'api.merchant.store.workspace'
  | 'api.merchant.billing.checkout'
  | 'api.cron.retention_notifications'
  | 'api.cron.cleanup_expired_tasks'
  | 'api.cron.cleanup_store_assets'
  | 'api.cron.sync_pending_consumer_tasks'
  | 'api.cron.sync_pending_store_tasks'

const SAMPLE_RATE: Record<FunctionObservationActor, number> = {
  consumer: 0.1,
  merchant: 1,
  admin: 1,
  system: 1,
  shared: 0.1,
}

type ObservationRuntime = {
  environment: 'production' | 'preview'
  deploymentSha: string
}

function resolveObservationRuntime(env: NodeJS.ProcessEnv = process.env): ObservationRuntime | null {
  if (env.APP_ENV?.trim().toLowerCase() === 'local') return null
  if (env.VISUTRY_CPU_OBSERVABILITY !== '1') return null

  const environment = env.VERCEL_ENV
  if (environment !== 'production' && environment !== 'preview') return null

  const deploymentSha = env.VERCEL_GIT_COMMIT_SHA?.trim()
  if (!deploymentSha || !/^[0-9a-f]{40}$/i.test(deploymentSha)) return null

  return { environment, deploymentSha }
}

function requestContentLength(request: Request): number | undefined {
  const raw = request.headers.get('content-length')
  if (!raw || !/^\d+$/.test(raw)) return undefined

  const value = Number(raw)
  return Number.isSafeInteger(value) && value <= 100_000_000 ? value : undefined
}

/**
 * Add an opt-in, sampled request-structure log around a Node.js route handler.
 * `durationMs` is handler wall time, not CPU time; Vercel's aggregate Function
 * Active CPU remains the CPU source of truth under concurrent execution.
 */
export function withFunctionObservation<Handler extends (...args: never[]) => Promise<Response>>(
  route: FunctionObservationRoute,
  actor: FunctionObservationActor,
  handler: Handler,
): Handler {
  return (async (...args: Parameters<Handler>) => {
    const runtime = resolveObservationRuntime()
    const request = args[0] as Request | undefined
    const sampleRate = SAMPLE_RATE[actor]

    // Do not time or log on the default path; pass the original args through.
    if (!runtime || !request || Math.random() >= sampleRate) {
      return handler(...args)
    }

    const startedAt = performance.now()
    let httpStatus = 500

    try {
      const response = await handler(...args)
      httpStatus = response.status
      return response
    } finally {
      const durationMs = Math.max(0, Math.round(performance.now() - startedAt))
      const contentLength = requestContentLength(request)
      const envelope = {
        schema_version: 1,
        route,
        actor,
        environment: runtime.environment,
        deployment_sha: runtime.deploymentSha,
        sample_rate: sampleRate,
        method: request.method,
        http_status: httpStatus,
        handler_duration_ms: durationMs,
        ...(contentLength === undefined ? {} : { request_bytes: contentLength }),
      }

      try {
        // Keep Axiom's indexed schema unchanged: deployment SHA and sample rate
        // live in this bounded JSON message; indexed fields use its existing
        // audited `event`, `route`, `role`, `httpStatus`, `durationMs`,
        // `contentLength`, and `environment` columns.
        logger.info(
          'api',
          `cpu_observation:${JSON.stringify(envelope)}`,
          {
            event: 'function_request_observation',
            route,
            role: actor,
            httpStatus,
            durationMs,
            ...(contentLength === undefined ? {} : { contentLength }),
            environment: runtime.environment,
          },
          { method: request.method },
        )
      } catch {
        // Observability must not change the route response or error semantics.
      }
    }
  }) as Handler
}
