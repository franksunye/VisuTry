/** @jest-environment node */

import { resolveStoreTelemetryAttribution, resolveTelemetryIsTest, resolveTelemetryOriginFromMetadata } from '@/lib/generation/origin'

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

  it('captures origin at creation time from metadata rather than later inference', () => {
    expect(resolveTelemetryOriginFromMetadata({ telemetryOrigin: 'CAMPAIGN', campaignId: 'exp-c' }, 'STORE_DEMO')).toBe('CAMPAIGN')
    expect(resolveTelemetryOriginFromMetadata({ telemetryOrigin: 'STORE', storeId: 'exp-s' }, 'STORE_PILOT')).toBe('STORE')
    expect(resolveTelemetryOriginFromMetadata({ campaignId: 'exp-c' }, 'STORE_DEMO')).toBe('CAMPAIGN')
    expect(resolveTelemetryOriginFromMetadata({}, 'CONSUMER')).toBe('CONSUMER')
  })

  it('uses merchant/experience referenceData as the canonical isTest marker', () => {
    expect(resolveTelemetryIsTest({ merchantReferenceData: true })).toBe(true)
    expect(resolveTelemetryIsTest({ experienceReferenceData: true })).toBe(true)
    expect(resolveTelemetryIsTest({ sessionReferenceData: true })).toBe(true)
    expect(resolveTelemetryIsTest({ merchantReferenceData: false, experienceReferenceData: false })).toBe(false)
  })
})
