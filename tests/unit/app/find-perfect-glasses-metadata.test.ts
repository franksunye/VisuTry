import { generateMetadata } from '@/app/[locale]/(public)/blog/find-perfect-glasses-online-guide/page'
import { locales } from '@/i18n'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.visutry.com'
const articlePath = '/blog/find-perfect-glasses-online-guide'

describe('online glasses guide metadata', () => {
  it.each(locales)('points the %s canonical and alternates to the article', (locale) => {
    const metadata = generateMetadata({ params: { locale } })
    const articleUrl = `${siteUrl}/${locale}${articlePath}`

    expect(metadata.alternates?.canonical).toBe(articleUrl)
    expect(metadata.openGraph).toMatchObject({ type: 'article', url: articleUrl })
    expect(metadata.robots).toMatchObject({ index: true, follow: true })
    for (const language of locales) {
      expect(metadata.alternates?.languages?.[language]).toBe(`${siteUrl}/${language}${articlePath}`)
    }
    expect(metadata.alternates?.languages?.['x-default']).toBe(`${siteUrl}/en${articlePath}`)
  })
})
