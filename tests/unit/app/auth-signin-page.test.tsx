import { renderToStaticMarkup } from 'react-dom/server'
import SignInPage from '@/app/[locale]/(consumer-app)/auth/signin/page'

jest.mock('@/components/auth/MerchantAuthActions', () => ({
  MerchantAuthActions: ({ callbackUrl }: { callbackUrl: string }) => <div data-merchant-callback={callbackUrl} />,
}))
jest.mock('@/components/auth/ShopperAuthActions', () => ({
  ShopperAuthActions: ({ callbackUrl }: { callbackUrl: string }) => <div data-shopper-callback={callbackUrl} />,
}))
jest.mock('@/lib/seo', () => ({ generateI18nSEO: jest.fn() }))
jest.mock('@/lib/localized-path', () => ({
  localizedPath: (locale: string, path: string) => path === '/' ? `/${locale}` : `/${locale}${path}`,
}))
jest.mock('@/lib/commerce-handoff/merchant-continuation', () => ({
  getSafeShopperAuthCallbackUrl: (value: string | undefined, locale: string) => (
    value === `/${locale}/try-on` || value?.startsWith(`/${locale}/store`)
  ) ? value : null,
  getSafeMerchantAuthCallbackUrl: (value: string | undefined, locale: string) => value?.startsWith(`/${locale}/merchant?commercialIntent=`) ? value : value === `/${locale}/merchant` ? value : null,
}))

describe('auth boundary', () => {
  it('uses the consumer surface for ordinary public callbacks', async () => {
    const homeMarkup = renderToStaticMarkup(await SignInPage({
      params: Promise.resolve({ locale: 'en' }),
      searchParams: Promise.resolve({ callbackUrl: '/en' }),
    }))
    const seoMarkup = renderToStaticMarkup(await SignInPage({
      params: Promise.resolve({ locale: 'en' }),
      searchParams: Promise.resolve({ callbackUrl: '/en/style/round-face' }),
    }))

    for (const markup of [homeMarkup, seoMarkup]) {
      expect(markup).toContain('data-auth-surface="consumer"')
      expect(markup).toContain('data-shopper-callback="/en"')
      expect(markup).not.toContain('Create a merchant workspace')
      expect(markup).not.toContain('data-merchant-callback')
      expect(markup).not.toContain('Need a merchant workspace')
      expect(markup).not.toContain('Use merchant access')
      expect(markup).not.toContain('return to the page you were viewing')
    }
  })

  it('keeps the explicit merchant callback and rejects an external callback as an open redirect', async () => {
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
    expect(merchantMarkup).toContain('shopper experience')
    expect(unsafeMarkup).toContain('data-auth-surface="consumer"')
    expect(unsafeMarkup).toContain('data-shopper-callback="/en"')
    expect(unsafeMarkup).not.toContain('data-merchant-callback')
    expect(unsafeMarkup).not.toContain('evil.example')
  })

  it('preserves Store/Campaign shopper continuation', async () => {
    const markup = renderToStaticMarkup(await SignInPage({
      params: Promise.resolve({ locale: 'en' }),
      searchParams: Promise.resolve({ callbackUrl: '/en/store/ello-sunglasses' }),
    }))

    expect(markup).toContain('data-auth-surface="shopper"')
    expect(markup).toContain('data-shopper-callback="/en/store/ello-sunglasses"')
    expect(markup).not.toContain('data-merchant-callback')
    expect(markup).not.toContain('Need a merchant workspace')
    expect(markup).not.toContain('Use merchant access')
  })

  it('keeps a paid plan intent in the merchant Auth0 callback', async () => {
    const markup = renderToStaticMarkup(await SignInPage({
      params: Promise.resolve({ locale: 'en' }),
      searchParams: Promise.resolve({ callbackUrl: '/en/merchant?commercialIntent=GROWTH' }),
    }))
    expect(markup).toContain('data-merchant-callback="/en/merchant?commercialIntent=GROWTH"')
  })
})
