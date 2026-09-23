/** @jest-environment node */

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('next/headers', () => ({ headers: jest.fn(() => new Headers({ host: 'www.visutry.com', 'x-forwarded-proto': 'https' })) }))
jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => { throw new Error('NOT_FOUND') }),
  redirect: jest.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
}))
jest.mock('@/lib/auth-runtime', () => ({ authOptions: {} }))
jest.mock('@/modules/merchant/application/merchant-memberships', () => ({
  listMerchantsForUser: jest.fn(),
}))
jest.mock('@/modules/merchant/application/merchant-agent-credentials', () => ({
  listMerchantAgentCredentials: jest.fn(),
}))
jest.mock('@/modules/merchant/application/merchant-control-center', () => ({
  getMerchantControlCenter: jest.fn(),
}))
jest.mock('@/modules/merchant/application/merchant-operating-reads', () => ({
  getMerchantWorkspaceMode: jest.fn(),
}))
jest.mock('@/modules/merchant/application/merchant-operating-home', () => ({
  getMerchantOperatingHome: jest.fn(),
}))
jest.mock('@/modules/merchant/application/merchant-access', () => ({
  requireMerchantMembership: jest.fn(),
}))
jest.mock('@/components/merchant/MerchantControlCenter', () => ({
  MerchantControlCenter: (props: { selectedMerchantId: string; onboardingState?: string }) => <div data-selected-merchant={props.selectedMerchantId} data-onboarding-state={props.onboardingState} />,
}))
jest.mock('@/components/merchant/MerchantOperatingHome', () => ({
  MerchantOperatingHome: () => <div data-testid="merchant-operating-home" />,
}))
jest.mock('@/components/merchant/MerchantWorkspaceShell', () => ({
  MerchantWorkspaceShell: (props: { children: React.ReactNode }) => <div data-testid="merchant-workspace-shell">{props.children}</div>,
}))
jest.mock('@/components/merchant/MerchantWorkspaceOnboarding', () => ({
  MerchantWorkspaceOnboarding: (props: { locale: string; commercialIntent?: string }) => (
    <div data-onboarding-locale={props.locale} data-commercial-intent={props.commercialIntent}>Create your Merchant Workspace</div>
  ),
}))

import { getServerSession } from 'next-auth'
import { listMerchantsForUser } from '@/modules/merchant/application/merchant-memberships'
import { listMerchantAgentCredentials } from '@/modules/merchant/application/merchant-agent-credentials'
import { getMerchantControlCenter } from '@/modules/merchant/application/merchant-control-center'
import { getMerchantWorkspaceMode } from '@/modules/merchant/application/merchant-operating-reads'
import { getMerchantOperatingHome } from '@/modules/merchant/application/merchant-operating-home'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import MerchantWorkspacePage from '@/app/[locale]/merchant/page'

const session = getServerSession as jest.Mock
const merchants = listMerchantsForUser as jest.Mock
const credentials = listMerchantAgentCredentials as jest.Mock
const control = getMerchantControlCenter as jest.Mock
const workspaceMode = getMerchantWorkspaceMode as jest.Mock
const operatingHome = getMerchantOperatingHome as jest.Mock
const membership = requireMerchantMembership as jest.Mock

describe('Merchant workspace authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    session.mockResolvedValue({ user: { id: 'user-a', role: 'ADMIN' } })
    merchants.mockResolvedValue([
      { merchant: { id: 'merchant-a', slug: 'alpha', name: 'Alpha', status: 'ACTIVE' }, membership: { role: 'OWNER' } },
      { merchant: { id: 'merchant-b', slug: 'beta', name: 'Beta', status: 'ACTIVE' }, membership: { role: 'ADMIN' } },
    ])
    credentials.mockResolvedValue([])
    workspaceMode.mockResolvedValue({ mode: 'ACTIVATION', reason: 'FIRST_VALUE_NOT_REACHED' })
    operatingHome.mockResolvedValue({
      merchant: { id: 'merchant-a', slug: 'alpha', name: 'Alpha' },
      store: { exists: true, status: 'DRAFT', selectedProductCount: 1, eligibleProductCount: 1, readiness: 'READY' },
      catalog: { total: 1, ready: 1, issueCount: 0 },
      campaigns: { total: 0, active: 0, draft: 0, archived: 0, needsAttention: 0 },
      shopper: { hasActivity: false, periodLabel: 'Last 30 days', metrics: [] },
      commercial: { status: 'FREE', planName: 'Free', threshold: null, attention: false },
    })
    control.mockResolvedValue({
      merchant: { id: 'merchant-a', slug: 'alpha', name: 'Alpha', websiteUrl: null, status: 'ACTIVE', referenceData: false },
      store: null,
      experiences: [],
      activeCampaignCount: 0,
      shopperActivityAvailable: false,
      credentialUsage: { active: 0 },
    })
  })

  it('uses internal User.id and rechecks membership for the selected tenant', async () => {
    const result = await MerchantWorkspacePage({ params: { locale: 'en' }, searchParams: { merchantId: 'merchant-b', onboarding: 'created' } })
    expect(result).toBeTruthy()
    expect(merchants).toHaveBeenCalledWith('user-a')
    expect(membership).toHaveBeenCalledWith({ userId: 'user-a', merchantId: 'merchant-b', roles: ['OWNER', 'ADMIN'] })
    expect(credentials).toHaveBeenCalledWith({ userId: 'user-a', merchantId: 'merchant-b' })
    expect((result as { props: { onboardingState?: string } }).props.onboardingState).toBe('created')
  })

  it('denies a URL-selected merchant without membership instead of trusting the locator', async () => {
    merchants.mockResolvedValue([
      { merchant: { id: 'merchant-a', slug: 'alpha', name: 'Alpha', status: 'ACTIVE' }, membership: { role: 'OWNER' } },
    ])
    await expect(MerchantWorkspacePage({ params: { locale: 'en' }, searchParams: { merchantId: 'merchant-b' } })).rejects.toThrow('NOT_FOUND')
    expect(membership).not.toHaveBeenCalled()
  })

  it('shows first-time onboarding for a global ADMIN with no MerchantMembership', async () => {
    merchants.mockResolvedValue([])
    const result = await MerchantWorkspacePage({ params: { locale: 'en' } })
    expect(result).toBeTruthy()
    expect(control).not.toHaveBeenCalled()
  })

  it('preserves a paid purchase intent through first-time Merchant onboarding', async () => {
    merchants.mockResolvedValue([])
    const result = await MerchantWorkspacePage({ params: { locale: 'en' }, searchParams: { commercialIntent: 'growth' } })
    expect((result as { props: { commercialIntent?: string } }).props.commercialIntent).toBe('GROWTH')
  })

  it('routes an existing Merchant with a paid intent to the canonical purchase summary', async () => {
    await expect(MerchantWorkspacePage({ params: { locale: 'en' }, searchParams: { commercialIntent: 'GROWTH' } }))
      .rejects.toThrow('REDIRECT:/en/merchant/purchase?merchantId=merchant-a&commercialIntent=GROWTH')
    expect(control).not.toHaveBeenCalled()
  })

  it('preserves the existing workspace path for a multi-merchant user', async () => {
    const result = await MerchantWorkspacePage({ params: { locale: 'en' }, searchParams: { merchantId: 'merchant-b' } })
    expect(result).toBeTruthy()
    expect(membership).toHaveBeenCalledWith({ userId: 'user-a', merchantId: 'merchant-b', roles: ['OWNER', 'ADMIN'] })
  })

  it('uses the dedicated Operating Home after First Value without loading the control aggregate or credentials', async () => {
    workspaceMode.mockResolvedValue({ mode: 'OPERATING', reason: 'STORE_PREVIEWED' })
    const result = await MerchantWorkspacePage({ params: { locale: 'en' }, searchParams: { merchantId: 'merchant-a' } }) as React.ReactElement

    const operatingHomeElement = result.props.children as React.ReactElement
    expect(operatingHomeElement.type).toHaveProperty('name', 'MerchantOperatingHome')
    expect(operatingHomeElement.props.home).toBeDefined()
    expect(operatingHome).toHaveBeenCalledWith({ merchantId: 'merchant-a' })
    expect(control).not.toHaveBeenCalled()
    expect(credentials).not.toHaveBeenCalled()
  })

  it('uses Operating Home for an existing ACTIVE Store without synthesizing activation history', async () => {
    workspaceMode.mockResolvedValue({ mode: 'OPERATING', reason: 'ACTIVE_STORE' })
    const result = await MerchantWorkspacePage({ params: { locale: 'en' }, searchParams: { merchantId: 'merchant-a' } }) as React.ReactElement

    const operatingHomeElement = result.props.children as React.ReactElement
    expect(operatingHomeElement.type).toHaveProperty('name', 'MerchantOperatingHome')
    expect(workspaceMode).toHaveBeenCalledWith({ merchantId: 'merchant-a' })
    expect(control).not.toHaveBeenCalled()
    expect(credentials).not.toHaveBeenCalled()
  })

  it('keeps unauthenticated users on the existing login redirect', async () => {
    session.mockResolvedValue(null)
    await expect(MerchantWorkspacePage({ params: { locale: 'en' } })).rejects.toThrow('REDIRECT:/en/auth/signin?callbackUrl=/en/merchant')
    expect(control).not.toHaveBeenCalled()
  })
})
