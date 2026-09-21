/** @jest-environment node */

import { mockModeEnabled } from '@/lib/mocks'

describe('mock auth environment guard', () => {
  it('allows requested mocks only in explicit Local', () => {
    expect(mockModeEnabled({ APP_ENV: 'local', ENABLE_MOCKS: 'true' })).toBe(true)
    expect(mockModeEnabled({ APP_ENV: 'preview', VERCEL_ENV: 'preview', ENABLE_MOCKS: 'true' })).toBe(false)
    expect(mockModeEnabled({ APP_ENV: 'production', VERCEL_ENV: 'production', ENABLE_MOCKS: 'true' })).toBe(false)
  })

  it('allows automated test context without enabling Preview or Production mocks', () => {
    expect(mockModeEnabled({ NODE_ENV: 'test' })).toBe(true)
    expect(mockModeEnabled({ NODE_ENV: 'test', VERCEL_ENV: 'preview', APP_ENV: 'preview' })).toBe(false)
    expect(mockModeEnabled({ NODE_ENV: 'test', VERCEL_ENV: 'production', APP_ENV: 'production' })).toBe(false)
  })
})
