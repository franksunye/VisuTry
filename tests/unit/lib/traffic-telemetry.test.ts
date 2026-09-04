/** @jest-environment node */

import {
  resolveTrafficTelemetryDestination,
  serializeTrafficTelemetry,
  TRAFFIC_TELEMETRY_FIELDS,
  TRAFFIC_TELEMETRY_KEY_ALLOWLIST,
} from '@/lib/traffic-telemetry'

describe('traffic telemetry contract', () => {
  it('emits the exact flat bounded schema', () => {
    const record = serializeTrafficTelemetry({
      event_id: 'evt_1234567890123456',
      event_name: 'tryon_completed',
      consumer_funnel_id: 'funnel_1234567890123456',
      traffic_class: 'production_candidate',
      source_class: 'agent',
      agent_source: 'chatgpt',
      acquisition_source: 'chatgpt.com',
      acquisition_medium: 'referral',
      referrer_host: 'https://chatgpt.com/path?token=secret',
      landing_page: 'https://visutry.com/en/store/demo?email=secret',
      page_path: '/en/store/demo?email=secret',
      success: true,
      // @ts-expect-error intentional contract probe
      raw_provider_response: { secret: true },
    })

    expect(Object.keys(record).every((key) => TRAFFIC_TELEMETRY_KEY_ALLOWLIST.has(key))).toBe(true)
    expect(Object.keys(record)).toEqual(expect.arrayContaining(TRAFFIC_TELEMETRY_FIELDS.slice(0, 6)))
    expect(record.referrer_host).toBe('chatgpt.com')
    expect(record.landing_page).toBe('/en/store/demo')
    expect(record.page_path).toBe('/en/store/demo')
    expect(record).not.toHaveProperty('raw_provider_response')
    expect(record).not.toHaveProperty('email')
    expect(record).not.toHaveProperty('ip')
  })

  it('cannot introduce nested or arbitrary keys', () => {
    const record = serializeTrafficTelemetry({
      event_id: 'evt_1234567890123456',
      event_name: 'recommendation_viewed',
      consumer_funnel_id: 'funnel_1234567890123456',
      traffic_class: 'test',
      // @ts-expect-error intentional contract probe
      nested: { dynamic: { key: 'drop' } },
    })

    expect(Object.keys(record).sort()).toEqual([
      'consumer_funnel_id',
      'event_id',
      'event_name',
      'schema_version',
      'timestamp',
      'traffic_class',
    ])
  })

  it('routes production and preview to separate datasets', () => {
    expect(resolveTrafficTelemetryDestination({
      NODE_ENV: 'production',
      VERCEL_ENV: 'production',
      AXIOM_TRAFFIC_TOKEN: 'traffic-token',
    } as NodeJS.ProcessEnv)).toEqual({ dataset: 'visutry-traffic-pro', token: 'traffic-token' })

    expect(resolveTrafficTelemetryDestination({
      NODE_ENV: 'production',
      VERCEL_ENV: 'preview',
      AXIOM_TOKEN: 'preview-token',
    } as NodeJS.ProcessEnv)).toEqual({ dataset: 'visutry-ppe', token: 'preview-token' })

    expect(resolveTrafficTelemetryDestination({ NODE_ENV: 'development' } as NodeJS.ProcessEnv)).toBeNull()
  })
})
