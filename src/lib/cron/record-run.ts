import { logger } from '@/lib/logger'

type CronOutcome = 'success' | 'partial_failure' | 'failed'

/**
 * A small, searchable Axiom/Vercel event for each authenticated Cron invocation.
 * Uses existing log fields; no schema migration or extra monitoring service.
 */
export function recordCronRun(route: string, outcome: CronOutcome, startedAt: number): void {
  const data = {
    event: 'cron_run',
    route,
    status: outcome,
    durationMs: Date.now() - startedAt,
  }
  if (outcome === 'success') logger.info('cron', 'Cron run completed', data)
  else logger.warn('cron', 'Cron run incomplete', data)
}
