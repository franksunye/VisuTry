/** @jest-environment node */

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => { throw new Error('NOT_FOUND') }),
  redirect: jest.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
}))
jest.mock('@/lib/auth-runtime', () => ({ authOptions: {} }))
jest.mock('@/modules/merchant/application/merchant-memberships', () => ({ listMerchantsForUser: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-access', () => ({ requireMerchantMembership: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-operating-reads', () => ({
  getMerchantOperatingActivation: jest.fn(),
  getMerchantCatalogCount: jest.fn(),
}))
jest.mock('@/components/merchant/MerchantWorkspaceShell', () => ({ MerchantWorkspaceShell: (props: { children: React.ReactNode }) => <div>{props.children}</div> }))
jest.mock('@/components/merchant/MerchantCatalogSelfService', () => ({ MerchantCatalogSelfService: () => <div>catalog</div> }))

import { getServerSession } from 'next-auth'
import { listMerchantsForUser } from '@/modules/merchant/application/merchant-memberships'
import MerchantCatalogPage from '@/app/[locale]/merchant/catalog/page'

describe('Merchant operating route authorization', () => {
  it('rejects a catalog route selected for a Merchant outside the user membership set', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-a' } })
    ;(listMerchantsForUser as jest.Mock).mockResolvedValue([
      { merchant: { id: 'merchant-a', slug: 'alpha', name: 'Alpha' }, membership: { role: 'OWNER' } },
    ])
    await expect(MerchantCatalogPage({ params: { locale: 'en' }, searchParams: { merchantId: 'merchant-b' } })).rejects.toThrow('NOT_FOUND')
  })
})
