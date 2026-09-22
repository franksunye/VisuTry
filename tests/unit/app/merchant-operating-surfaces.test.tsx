/** @jest-environment node */

jest.mock('@/modules/merchant/application/merchant-operating-page', () => ({ requireOperatingMerchantPage: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-operating-reads', () => ({ getMerchantOperatingAnalytics: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-control-center', () => ({ getMerchantControlCenter: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-agent-credentials', () => ({ listMerchantAgentCredentials: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-workspace-agent', () => ({ getMerchantWorkspaceAgentConfig: jest.fn() }))
jest.mock('@/components/merchant/MerchantWorkspaceShell', () => ({ MerchantWorkspaceShell: (props: { children: React.ReactNode }) => <div>{props.children}</div> }))
jest.mock('@/components/merchant/MerchantAnalyticsWorkspace', () => ({ MerchantAnalyticsWorkspace: () => <div data-testid="analytics-workspace" /> }))
jest.mock('@/components/merchant/MerchantIntegrationsWorkspace', () => ({ MerchantIntegrationsWorkspace: () => <div data-testid="integrations-workspace" /> }))
jest.mock('@/components/merchant/MerchantControlCenter', () => ({
  MerchantCommerceIntelligence: jest.fn(() => <div />),
  MerchantAgentAccess: jest.fn(() => <div />),
}))

import type React from 'react'
import MerchantAnalyticsPage from '@/app/[locale]/merchant/analytics/page'
import MerchantIntegrationsPage from '@/app/[locale]/merchant/integrations/page'
import { requireOperatingMerchantPage } from '@/modules/merchant/application/merchant-operating-page'
import { getMerchantOperatingAnalytics } from '@/modules/merchant/application/merchant-operating-reads'
import { getMerchantControlCenter } from '@/modules/merchant/application/merchant-control-center'
import { listMerchantAgentCredentials } from '@/modules/merchant/application/merchant-agent-credentials'
import { getMerchantWorkspaceAgentConfig } from '@/modules/merchant/application/merchant-workspace-agent'

const authorize = requireOperatingMerchantPage as jest.Mock
const analytics = getMerchantOperatingAnalytics as jest.Mock
const controlCenter = getMerchantControlCenter as jest.Mock
const credentials = listMerchantAgentCredentials as jest.Mock
const config = getMerchantWorkspaceAgentConfig as jest.Mock

const context = { userId: 'user-a', selectedMerchantId: 'merchant-authorized', merchants: [{ id: 'merchant-authorized', slug: 'safe', name: 'Safe Merchant', role: 'OWNER' }] }

describe('Merchant operating surface route boundaries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    authorize.mockResolvedValue({ context })
    analytics.mockResolvedValue({ hasActivity: false })
    credentials.mockResolvedValue([{ id: 'credential-a', name: 'Agent', status: 'ACTIVE', createdAt: new Date('2026-09-01T00:00:00Z'), lastUsedAt: null, revokedAt: null, prefix: 'safe-prefix', masked: 'safe-masked', scopes: ['merchant:read'] }])
    config.mockResolvedValue({ endpoint: 'https://local.visutry.test/api/mcp', skills: [{ name: 'Skill', purpose: 'Help.', url: 'https://local.visutry.test/skills/merchant', prompt: 'Help.' }] })
  })

  it('uses only the canonical route-specific Analytics read and passes the authorized Merchant context', async () => {
    const result = await MerchantAnalyticsPage({ params: { locale: 'en' }, searchParams: { merchantId: 'tampered-merchant' } }) as React.ReactElement
    const child = result.props.children as React.ReactElement

    expect(analytics).toHaveBeenCalledWith({ merchantId: 'merchant-authorized' })
    expect(controlCenter).not.toHaveBeenCalled()
    expect(credentials).not.toHaveBeenCalled()
    expect(config).not.toHaveBeenCalled()
    expect(child.type).toHaveProperty('name', 'MerchantAnalyticsWorkspace')
    expect(child.props.merchantId).toBe('merchant-authorized')
    expect(child.props.locale).toBe('en')
  })

  it('uses only credential metadata and safe Agent config, serialized for the selected Merchant', async () => {
    const result = await MerchantIntegrationsPage({ params: { locale: 'en' }, searchParams: { merchantId: 'tampered-merchant' } }) as React.ReactElement
    const child = result.props.children as React.ReactElement

    expect(credentials).toHaveBeenCalledWith({ userId: 'user-a', merchantId: 'merchant-authorized' })
    expect(config).toHaveBeenCalledTimes(1)
    expect(analytics).not.toHaveBeenCalled()
    expect(controlCenter).not.toHaveBeenCalled()
    expect(child.type).toHaveProperty('name', 'MerchantIntegrationsWorkspace')
    expect(child.key).toBe('merchant-authorized')
    expect(child.props.initialCredentials[0]).toMatchObject({ createdAt: '2026-09-01T00:00:00.000Z', lastUsedAt: null, revokedAt: null, masked: 'safe-masked' })
    expect(child.props.initialCredentials[0]).not.toHaveProperty('secret')
  })

  it('keeps the operating activation gate ahead of both route-specific reads', async () => {
    authorize.mockRejectedValue(new Error('REDIRECT:/en/merchant?merchantId=merchant-authorized'))
    await expect(MerchantAnalyticsPage({ params: { locale: 'en' } })).rejects.toThrow('REDIRECT:')
    await expect(MerchantIntegrationsPage({ params: { locale: 'en' } })).rejects.toThrow('REDIRECT:')
    expect(analytics).not.toHaveBeenCalled()
    expect(credentials).not.toHaveBeenCalled()
    expect(config).not.toHaveBeenCalled()
  })
})
