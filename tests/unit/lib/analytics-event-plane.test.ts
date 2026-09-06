import {
  emitAnalyticsEvent,
  resolveAnalyticsEventProviderConfig,
  TursoAnalyticsEventSink,
  type AnalyticsEvent,
} from '@/lib/analytics-event-plane'
import { logger } from '@/lib/logger'

const event: AnalyticsEvent = {
  eventId: 'evt:merchant_page_viewed:merchant-1:session-1',
  eventVersion: 1,
  eventType: 'merchant_page_viewed',
  occurredAt: new Date('2026-09-03T00:00:00.000Z'),
  merchantId: 'merchant-1',
  sessionId: 'session-1',
  payload: {
    source: 'direct',
    password: 'must-not-persist',
    email: 'must-not-persist',
    faceGeometry: { x: 1 },
  },
}

describe('analytics event plane', () => {
  it('requires complete Turso configuration only when explicitly enabled in production', () => {
    expect(resolveAnalyticsEventProviderConfig({ NODE_ENV: 'test' })).toEqual({ provider: 'disabled' })
    expect(() => resolveAnalyticsEventProviderConfig({
      NODE_ENV: 'production',
      ANALYTICS_EVENT_PROVIDER: 'turso',
    })).toThrow('configuration is incomplete')
    expect(() => resolveAnalyticsEventProviderConfig({
      NODE_ENV: 'production',
      ANALYTICS_EVENT_PROVIDER: 'turso',
      TURSO_DATABASE_URL: 'libsql://user:secret@analytics.turso.io',
      TURSO_AUTH_TOKEN: 'token',
    })).toThrow('configuration is incomplete')
  })

  it('writes an idempotent, sanitized event without sensitive payload values', async () => {
    const execute = jest.fn().mockResolvedValue({ rows: [] })
    const sink = new TursoAnalyticsEventSink({ execute })

    await sink.write(event)

    expect(execute).toHaveBeenCalledTimes(1)
    const statement = execute.mock.calls[0]?.[0] as { sql: string; args: unknown[] }
    expect(statement.sql).toContain('INSERT OR IGNORE INTO analytics_events')
    expect(JSON.stringify(statement.args)).not.toContain('must-not-persist')
    expect(statement.args).toContain('merchant-1')
    expect(statement.args).toContain('session-1')
  })

  it('contains Turso errors and never turns them into request failures', async () => {
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined)
    const sink = { write: jest.fn().mockRejectedValue(new Error('request URL contains secret')) }

    await expect(emitAnalyticsEvent(sink, event)).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalledWith('general', 'Analytics event sink failed open', expect.objectContaining({
      provider: 'turso',
      eventType: 'merchant_page_viewed',
    }))
    expect(JSON.stringify(warn.mock.calls)).not.toContain('request URL contains secret')
    warn.mockRestore()
  })
})
