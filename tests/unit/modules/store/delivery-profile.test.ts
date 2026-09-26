import {
  assertExperienceDeliveryPolicy,
  DEFAULT_EXPERIENCE_DELIVERY_POLICY,
  resolveExperienceDeliveryPolicy,
  resolveRequestedDeliveryProfile,
} from '@/modules/store/domain/delivery-profile'

describe('Experience delivery profile policy', () => {
  it('defaults legacy/null policy to Web-only with a bounded idle timeout', () => {
    expect(resolveExperienceDeliveryPolicy(null)).toEqual(DEFAULT_EXPERIENCE_DELIVERY_POLICY)
    expect(resolveExperienceDeliveryPolicy({ kioskEnabled: true, kioskIdleTimeoutSeconds: 10 })).toEqual({
      kioskEnabled: false,
      kioskIdleTimeoutSeconds: 120,
    })
  })

  it('accepts only the closed kiosk policy contract and supported timeout range', () => {
    expect(() => assertExperienceDeliveryPolicy({ kioskEnabled: true, kioskIdleTimeoutSeconds: 30 })).not.toThrow()
    expect(() => assertExperienceDeliveryPolicy({ kioskEnabled: false, kioskIdleTimeoutSeconds: 900 })).not.toThrow()
    expect(() => assertExperienceDeliveryPolicy({ kioskEnabled: true, kioskIdleTimeoutSeconds: 29 })).toThrow()
    expect(() => assertExperienceDeliveryPolicy({ kioskEnabled: true, kioskIdleTimeoutSeconds: 901 })).toThrow()
    expect(() => assertExperienceDeliveryPolicy({ kioskEnabled: true, kioskIdleTimeoutSeconds: 60, arbitrary: true })).toThrow()
  })

  it('never resolves a disabled or unrequested Experience as Kiosk', () => {
    const enabled = { kioskEnabled: true, kioskIdleTimeoutSeconds: 60 }
    expect(resolveRequestedDeliveryProfile({ requested: 'kiosk', policy: enabled })).toBe('KIOSK')
    expect(resolveRequestedDeliveryProfile({ requested: null, policy: enabled })).toBe('WEB')
    expect(resolveRequestedDeliveryProfile({ requested: 'kiosk', policy: DEFAULT_EXPERIENCE_DELIVERY_POLICY })).toBe('WEB')
    expect(resolveRequestedDeliveryProfile({ requested: 'other', policy: enabled })).toBe('WEB')
  })
})
