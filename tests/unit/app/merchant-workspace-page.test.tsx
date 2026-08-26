/** @jest-environment node */

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('next/headers', () => ({ headers: jest.fn(() => new Headers({ host: 'www.visutry.com', 'x-forwarded-proto': 'https' })) }))
jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => { throw new Error('NOT_FOUND') }),
  redirect: jest.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
}))
jest.mock('@/lib/auth-runtime', () => ({ authOptions: {} }))
jest.mock('@/modules/merchant/cloudflare', () => ({
  listMerchantsForUser: jest.fn(),
  listMerchantAgentCredentials: jest.fn(),
  getMerchantControlCenter: jest.fn(),
  requireMerchantMembership: jest.fn(),
}))
jest.mock('@/components/merchant/MerchantControlCenter', () => ({
  MerchantControlCenter: (props: { selectedMerchantId: string; onboardingState?: string }) => <div data-selected-merchant={props.selectedMerchantId} data-onboarding-state={props.onboardingState} />,
}))
jest.mock('@/components/merchant/MerchantWorkspaceOnboarding', () => ({
  MerchantWorkspaceOnboarding: (props: { locale: string }) => <div data-onboarding-locale={props.locale}>Create your Merchant Workspace</div>,
}))

import { getServerSession } from 'next-auth'
import {
  listMerchantsForUser,
  listMerchantAgentCredentials,
  getMerchantControlCenter,
  requireMerchantMembership,
} from '@/modules/merchant/cloudflare'
import MerchantWorkspacePage from '@/app/[locale]/merchant/page'

const session = getServerSession as jest.Mock
const merchants = listMerchantsForUser as jest.Mock
const credentials = listMerchantAgentCredentials as jest.Mock
const control = getMerchantControlCenter as jest.Mock
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

  it('preserves the existing workspace path for a multi-merchant user', async () => {
    const result = await MerchantWorkspacePage({ params: { locale: 'en' }, searchParams: { merchantId: 'merchant-b' } })
    expect(result).toBeTruthy()
    expect(membership).toHaveBeenCalledWith({ userId: 'user-a', merchantId: 'merchant-b', roles: ['OWNER', 'ADMIN'] })
  })

  it('keeps unauthenticated users on the existing login redirect', async () => {
    session.mockResolvedValue(null)
    await expect(MerchantWorkspacePage({ params: { locale: 'en' } })).rejects.toThrow('REDIRECT:/en/auth/signin?callbackUrl=/en/merchant')
    expect(control).not.toHaveBeenCalled()
  })
})
