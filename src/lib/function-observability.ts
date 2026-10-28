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

// Sample by route, not actor: low-volume AI and Merchant actions need full
// coverage, while high-frequency session/identity traffic can be sampled.
const SAMPLE_RATE: Readonly<Record<FunctionObservationRoute, number>> = {
  'api.auth.nextauth': 0.1,
  'api.consumer.try_on.submit': 1,
  'api.consumer.face_analysis.submit': 1,
  'api.consumer.store_session.create': 0.1,
  'api.consumer.store_try_on.submit': 1,
  'api.merchant.campaigns.collection': 1,
  'api.merchant.store.workspace': 1,
  'api.merchant.billing.checkout': 1,
  'api.cron.retention_notifications': 1,
  'api.cron.cleanup_expired_tasks': 1,
  'api.cron.cleanup_store_assets': 1,
  'api.cron.sync_pending_consumer_tasks': 1,
  'api.cron.sync_pending_store_tasks': 1,
}

// Bound synchronous console logging and asynchronous Axiom ingestion when an
// endpoint receives a burst of invalid requests. This is per warm Function
// instance, not a platform-wide rate limit. Capped buckets cannot be scaled
// by 1 / sample_rate, so emit one explicit marker for each capped route/minute.
const MAX_OBSERVATIONS_PER_ROUTE_MINUTE = 120
const observationBuckets = new Map<FunctionObservationRoute, {
  minute: number
  emitted: number
  capReported: boolean
}>()

function reserveObservationSlot(
  route: FunctionObservationRoute,
  actor: FunctionObservationActor,
  runtime: ObservationRuntime,
  sampleRate: number,
): boolean {
  const minute = Math.floor(Date.now() / 60_000)
  let bucket = observationBuckets.get(route)

  if (!bucket || bucket.minute !== minute) {
    bucket = { minute, emitted: 0, capReported: false }
    observationBuckets.set(route, bucket)
  }

  if (bucket.emitted < MAX_OBSERVATIONS_PER_ROUTE_MINUTE) {
    bucket.emitted += 1
    return true
  }

  if (!bucket.capReported) {
    bucket.capReported = true
    const capMessage = {
      schema_version: 1,
      route,
      actor,
      environment: runtime.environment,
      deployment_sha: runtime.deploymentSha,
      sample_rate: sampleRate,
      minute_utc: new Date(minute * 60_000).toISOString(),
      per_instance_limit: MAX_OBSERVATIONS_PER_ROUTE_MINUTE,
    }
    logger.warn('api', `cpu_observation_capped:${JSON.stringify(capMessage)}`, {
      event: 'function_request_observation_capped',
      route,
      role: actor,
      environment: runtime.environment,
    })
  }

  return false
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
    const sampleRate = SAMPLE_RATE[route]

    // Do not time or log on the default path; pass the original args through.
    if (!runtime || !request || (sampleRate < 1 && Math.random() >= sampleRate)) {
      return handler(...args)
    }

    const startedAt = performance.now()
    let httpStatus = 500

    try {
      const response = await handler(...args)
      httpStatus = response.status
      return response
    } finally {
      try {
        if (reserveObservationSlot(route, actor, runtime, sampleRate)) {
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
        }
      } catch {
        // Observability must not change the route response or error semantics.
      }
    }
  }) as Handler
}
