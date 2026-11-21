import { generateMetadata } from '@/app/[locale]/(public)/blog/find-perfect-glasses-online-guide/page'
import { getNativeChoiceGuide } from '@/config/native-choice-between-frames'
import { locales } from '@/i18n'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.visutry.com'
const articlePath = '/blog/find-perfect-glasses-online-guide'

describe('online glasses guide metadata', () => {
  it.each(locales)('publishes %s self-canonical with genuine translated main article text', (locale) => {
    const metadata = generateMetadata({ params: { locale } })
    const articleUrl = `${siteUrl}/${locale}${articlePath}`
    const copy = getNativeChoiceGuide(locale)

    expect(metadata.alternates?.canonical).toBe(articleUrl)
    expect(metadata.openGraph).toMatchObject({ type: 'article', url: articleUrl })
    expect(metadata.robots).toMatchObject({ index: true, follow: true })
    expect(metadata.title).toBe(copy?.title || 'How to Choose Between Two Pairs of Glasses Online')
    for (const language of locales) {
      expect(metadata.alternates?.languages?.[language]).toBe(`${siteUrl}/${language}${articlePath}`)
    }
    expect(metadata.alternates?.languages?.['x-default']).toBe(`${siteUrl}/en${articlePath}`)
  })
})
