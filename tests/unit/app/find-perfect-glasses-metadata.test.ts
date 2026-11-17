import { generateMetadata } from '@/app/[locale]/(public)/blog/find-perfect-glasses-online-guide/page'
import { locales } from '@/i18n'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.visutry.com'
const articlePath = '/blog/find-perfect-glasses-online-guide'

describe('online glasses guide metadata', () => {
  it.each(locales)('points the %s English-body article at its original English canonical', (locale) => {
    const metadata = generateMetadata({ params: { locale } })
    const englishUrl = `${siteUrl}/en${articlePath}`

    // Localized navigation/footer does not make the English article itself
    // a translated edition. The historic locale link remains accessible.
    expect(metadata.alternates?.canonical).toBe(englishUrl)
    expect(metadata.openGraph).toMatchObject({ type: 'article', url: englishUrl, locale: 'en_US' })
    expect(metadata.robots).toMatchObject({ index: true, follow: true })
    expect(metadata.alternates?.languages).toEqual({
      en: englishUrl,
      'x-default': englishUrl,
    })
  })
})
