import {
  AXIOM_SERIALIZED_KEY_ALLOWLIST,
  logger,
  normalizeLogData,
  serializeAxiomRecord,
} from '@/lib/logger'

function collectSerializedKeys(value: unknown, prefix = ''): string[] {
  if (value === undefined) return []
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : []
  }

  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return collectSerializedKeys(nestedValue, path)
  })
}

describe('normalizeLogData', () => {
  it('keeps the bounded analytics contract and drops dynamic fields', () => {
    expect(normalizeLogData({
      event_name: 'recommendation_viewed',
      consumer_funnel_id: 'funnel-1',
      traffic_class: 'production_candidate',
      source_class: 'organic_search',
      acquisition_source: 'google',
      success: true,
      arbitraryProviderField: 'must not become an Axiom column',
      providerResponse: { choices: [{ message: { content: 'raw response' } }] },
    })).toEqual({
      event_name: 'recommendation_viewed',
      consumer_funnel_id: 'funnel-1',
      traffic_class: 'production_candidate',
      source_class: 'organic_search',
      acquisition_source: 'google',
      success: true,
    })
  })

  it('keeps only approved fields inside known diagnostic families', () => {
    expect(normalizeLogData({
      diagnostics: {
        code: 'UPSTREAM_TIMEOUT',
        failureReason: 'timeout',
        rawProviderPayload: { secret: 'drop me' },
      },
      metadata: {
        providerId: 'task-1',
        unexpected: 'drop me',
      },
    })).toEqual({
      diagnostics: {
        code: 'UPSTREAM_TIMEOUT',
        failureReason: 'timeout',
      },
      metadata: {
        providerId: 'task-1',
      },
    })
  })

  it('bounds strings and approved primitive arrays', () => {
    const longValue = 'x'.repeat(600)
    const languages = Array.from({ length: 25 }, (_, index) => `lang-${index}`)

    const normalized = normalizeLogData({
      message: longValue,
      browser_languages: languages,
      platforms: [{ name: 'drop object arrays' }],
    })

    expect(normalized?.message).toHaveLength(512)
    expect(normalized?.browser_languages).toHaveLength(20)
    expect(normalized).not.toHaveProperty('platforms')
  })

  it('rejects non-object payloads instead of coercing them into arbitrary fields', () => {
    expect(normalizeLogData(JSON.stringify({ response: 'raw provider response' }))).toBeUndefined()
    expect(normalizeLogData({ data: { nested: 'raw provider response' } })).toBeUndefined()
  })

  it('copies only fixed request context fields to the log envelope', () => {
    logger.clearLogs()
    logger.info('general', 'context boundary', undefined, {
      userId: 'user-1',
      url: 'https://example.test/en',
      injectedField: 'must not become an envelope field',
    })

    const [entry] = logger.getLogs({ limit: 1 })
    expect(entry).toMatchObject({ userId: 'user-1', url: 'https://example.test/en' })
    expect(entry).not.toHaveProperty('injectedField')
  })

  it('emits only the explicit flattened Axiom key allowlist', () => {
    const serialized = serializeAxiomRecord({
      id: 'log-1',
      timestamp: '2026-09-04T00:00:00.000Z',
      level: 'error',
      category: 'grsai',
      message: 'provider failed',
      error: { name: 'Error', message: 'bounded error', stack: 'dev-only stack' },
      data: {
        provider: 'grsai',
        diagnostics: {
          code: 'UPSTREAM_TIMEOUT',
          failureReason: 'timeout',
          dynamicSubkey: 'must not escape',
        },
        metadata: { providerId: 'task-1', arbitrary: { nested: true } },
        providerResponse: { choices: [{ message: { content: 'raw response' } }] },
      } as never,
    })

    const keys = collectSerializedKeys(serialized)
    expect(keys.every((key) => AXIOM_SERIALIZED_KEY_ALLOWLIST.has(key))).toBe(true)
    expect(keys).toContain('data.provider')
    expect(keys).toContain('data.diagnostics.code')
    expect(keys).toContain('data.metadata.providerId')
    expect(keys).not.toContain('data.providerResponse')
    expect(keys).not.toContain('data.diagnostics.dynamicSubkey')
    expect(keys).not.toContain('data.metadata.arbitrary.nested')
  })
})
