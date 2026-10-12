import { mcpStoreJourneyPolicy, mcpStoreDeliveryPolicy } from '@/modules/merchant/mcp/store-policy-input'

const sixLegalJourneys = [
  ['FACE_ANALYSIS', 'RECOMMENDATION'],
  ['FACE_ANALYSIS', 'RECOMMENDATION', 'TRY_ON'],
  ['FACE_ANALYSIS', 'RECOMMENDATION', 'TRY_ON', 'COMPARE'],
  ['FACE_ANALYSIS', 'FIT_PROFILE', 'RECOMMENDATION'],
  ['FACE_ANALYSIS', 'FIT_PROFILE', 'RECOMMENDATION', 'TRY_ON'],
  ['FACE_ANALYSIS', 'FIT_PROFILE', 'RECOMMENDATION', 'TRY_ON', 'COMPARE'],
]

describe('Merchant MCP shared canonical Store policy input', () => {
  it.each(sixLegalJourneys)('accepts a valid canonical Journey: %p', (...enabledStages) => {
    expect(mcpStoreJourneyPolicy.safeParse({ enabledStages }).success).toBe(true)
  })

  it.each([
    ['COMPARE without TRY_ON', { enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION', 'COMPARE'] }],
    ['reordered stages', { enabledStages: ['RECOMMENDATION', 'FACE_ANALYSIS'] }],
    ['duplicate stages', { enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION', 'RECOMMENDATION'] }],
    ['missing mandatory stage', { enabledStages: ['FACE_ANALYSIS', 'TRY_ON'] }],
    ['unknown stage', { enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION', 'ARBITRARY'] }],
    ['extra configuration field', { enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION'], javascript: 'alert(1)' }],
  ])('rejects %s rather than persisting an invalid Journey', (_reason, value) => {
    expect(mcpStoreJourneyPolicy.safeParse(value).success).toBe(false)
  })

  it.each([30, 120, 900])('accepts bounded Kiosk idle timeout %i seconds', (seconds) => {
    expect(mcpStoreDeliveryPolicy.safeParse({ kioskEnabled: true, kioskIdleTimeoutSeconds: seconds }).success).toBe(true)
    expect(mcpStoreDeliveryPolicy.safeParse({ kioskEnabled: false, kioskIdleTimeoutSeconds: seconds }).success).toBe(true)
  })

  it.each([
    { kioskEnabled: true, kioskIdleTimeoutSeconds: 29 },
    { kioskEnabled: true, kioskIdleTimeoutSeconds: 901 },
    { kioskEnabled: true, kioskIdleTimeoutSeconds: 120.5 },
    { kioskEnabled: 'true', kioskIdleTimeoutSeconds: 120 },
    { kioskEnabled: false, kioskIdleTimeoutSeconds: 120, arbitraryScript: true },
  ])('rejects unsupported Delivery policy: %p', value => {
    expect(mcpStoreDeliveryPolicy.safeParse(value).success).toBe(false)
  })
})
