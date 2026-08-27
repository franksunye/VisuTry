import { renderToStaticMarkup } from 'react-dom/server'
import SignInPage from '@/app/[locale]/(main)/auth/signin/page'

jest.mock('@/components/auth/MerchantAuthActions', () => ({
  MerchantAuthActions: ({ callbackUrl }: { callbackUrl: string }) => <div data-merchant-callback={callbackUrl} />,
}))
jest.mock('@/components/auth/ShopperAuthActions', () => ({
  ShopperAuthActions: ({ callbackUrl }: { callbackUrl: string }) => <div data-shopper-callback={callbackUrl} />,
}))
jest.mock('@/lib/seo', () => ({ generateI18nSEO: jest.fn() }))
jest.mock('@/lib/localized-path', () => ({ localizedPath: (locale: string, path: string) => `/${locale}${path}` }))
jest.mock('@/lib/commerce-handoff/merchant-continuation', () => ({
  getSafeShopperAuthCallbackUrl: (value: string | undefined, locale: string) => value?.startsWith(`/${locale}/store`) ? value : null,
}))

describe('merchant sign-in continuation', () => {
  it('keeps the merchant callback and rejects an external callback as an open redirect', async () => {
    const merchantMarkup = renderToStaticMarkup(await SignInPage({
      params: Promise.resolve({ locale: 'en' }),
      searchParams: Promise.resolve({ callbackUrl: '/en/merchant' }),
    }))
    const unsafeMarkup = renderToStaticMarkup(await SignInPage({
      params: Promise.resolve({ locale: 'en' }),
      searchParams: Promise.resolve({ callbackUrl: 'https://evil.example/steal' }),
    }))

    expect(merchantMarkup).toContain('data-auth-surface="merchant-admin"')
    expect(merchantMarkup).toContain('data-merchant-callback="/en/merchant"')
    expect(unsafeMarkup).toContain('data-merchant-callback="/en/merchant"')
    expect(unsafeMarkup).not.toContain('evil.example')
  })
})
