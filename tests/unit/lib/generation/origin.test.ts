/** @jest-environment node */

import { resolveStoreTelemetryAttribution } from '@/lib/generation/origin'

describe('store/campaign telemetry origin mapping', () => {
  it('maps campaign experiences to CAMPAIGN without changing TryOnOrigin', () => {
    expect(resolveStoreTelemetryAttribution({ id: 'exp-c', type: 'CAMPAIGN' })).toEqual({
      telemetryOrigin: 'CAMPAIGN',
      campaignId: 'exp-c',
      storeId: null,
    })
  })

  it('maps store experiences and missing experience to STORE', () => {
    expect(resolveStoreTelemetryAttribution({ id: 'exp-s', type: 'STORE' })).toEqual({
      telemetryOrigin: 'STORE',
      campaignId: null,
      storeId: 'exp-s',
    })
    expect(resolveStoreTelemetryAttribution(null)).toEqual({
      telemetryOrigin: 'STORE',
      campaignId: null,
      storeId: null,
    })
  })
})
