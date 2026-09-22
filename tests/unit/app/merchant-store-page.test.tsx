/** @jest-environment node */

jest.mock('@/modules/merchant/application/merchant-operating-page', () => ({
  requireOperatingMerchantPage: jest.fn().mockResolvedValue({
    context: {
      merchants: [{ id: 'merchant-a', slug: 'alpha', name: 'Alpha', role: 'OWNER' }],
      selectedMerchantId: 'merchant-a',
    },
  }),
}))
jest.mock('@/components/merchant/MerchantWorkspaceShell', () => ({
  MerchantWorkspaceShell: (props: { children: React.ReactNode }) => <div data-testid="shell">{props.children}</div>,
}))
jest.mock('@/components/merchant/MerchantStoreWorkspace', () => ({
  MerchantStoreWorkspace: (props: { merchantId: string; locale: string }) => <div data-testid="operating-store" data-merchant={props.merchantId} data-locale={props.locale} />,
}))

import MerchantStorePage from '@/app/[locale]/merchant/store/page'

describe('Merchant operating Store route', () => {
  it('preserves selected tenant/locale and renders the dedicated Operating workspace', async () => {
    const result = await MerchantStorePage({ params: { locale: 'zh' }, searchParams: { merchantId: 'merchant-a' } })
    const shell = result as React.ReactElement
    const storeWorkspace = shell.props.children as React.ReactElement

    expect(shell.type).toBeDefined()
    expect(storeWorkspace.props).toMatchObject({ merchantId: 'merchant-a', locale: 'zh' })
    expect(storeWorkspace.key).toBe('merchant-a')
  })
})
