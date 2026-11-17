import { getNativeBlogHubText } from '@/config/native-blog-hub'
import type { Locale } from '@/i18n'
import { localeDirections } from '@/i18n'
import Image from 'next/image'
import Link from '@/components/layout/PublicLink'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { GrowthFunnelLink } from '@/components/analytics/GrowthFunnelLink'
import { blogPostPath } from '@/lib/blog'
import { localizedPath } from '@/lib/localized-path'
import { generateStructuredData, SITE_CONFIG } from '@/lib/seo'

export type NativeEditorialCopy = {
  title: string
  description: string
  category: string
  readTime: string
  imageAlt: string
  imageCaption: string
  publishedLabel: string
  updatedLabel: string
  sections: readonly { heading: string; paragraphs: readonly string[]; bullets?: readonly string[] }[]
  faq?: readonly { question: string; answer: string }[]
  tryOnLabel: string
  detectorLabel: string
  compareLabel: string
  widthLabel: string
  relatedLabel: string
  nextStepLabel: string
  creditDisclosure: string
}

export function NativeEditorialArticle({
  locale, slug, copy, art, publishedAt, modifiedAt, relatedSlug,
}: {
  locale: Locale
  slug: string
  copy: NativeEditorialCopy
  art: { src: string; width: number; height: number }
  publishedAt: string
  modifiedAt: string
  relatedSlug: string
}) {
  const sourcePage = localizedPath(locale, '/blog/' + slug)
  const canonical = new URL(sourcePage, SITE_CONFIG.url).toString()
  const article = generateStructuredData('article', {
    title: copy.title,
    description: copy.description,
    publishedAt,
    modifiedAt,
    author: 'VisuTry Team',
    image: new URL(art.src, SITE_CONFIG.url).toString(),
    inLanguage: locale,
    url: canonical,
    mainEntityOfPage: canonical,
  })
  const faq = copy.faq?.length
    ? generateStructuredData('faqPage', { questions: copy.faq })
    : null

  return (
    <main className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />
      {faq && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />}
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        <Breadcrumbs items={[{ name: getNativeBlogHubText(locale).title, url: localizedPath(locale, '/blog') }, { name: copy.title }]} />
        <article lang={locale} dir={localeDirections[locale]} className="mt-6">
          <header>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">{copy.title}</h1>
            <p className="mt-4 text-lg leading-8 text-slate-700">{copy.description}</p>
            <p className="mt-3 text-sm text-slate-600">
              VisuTry Team · {copy.publishedLabel} · {copy.updatedLabel} · {copy.readTime}
            </p>
          </header>
          <figure className="my-8">
            <Image src={art.src} width={art.width} height={art.height} alt={copy.imageAlt}
              sizes="(min-width: 768px) 704px, calc(100vw - 40px)"
              className="h-auto w-full rounded-xl object-contain" />
            <figcaption className="mt-2 text-sm text-slate-600">{copy.imageCaption}</figcaption>
          </figure>
          <div className="space-y-5 leading-7 text-slate-800 [&_h2]:pt-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:ps-6">
            {copy.sections.map(section => (
              <section key={section.heading} className="space-y-3">
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                {section.bullets && <ul className="space-y-2">{section.bullets.map((bullet,index) => <li key={index}>{bullet}</li>)}</ul>}
              </section>
            ))}
            {copy.faq && copy.faq.length > 0 && (
              <section className="space-y-3">
                {copy.faq.map(item => (
                  <div key={item.question} className="space-y-2">
                    <h3>{item.question}</h3>
                    <p>{item.answer}</p>
                  </div>
                ))}
              </section>
            )}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
              <p className="text-sm text-slate-700">{copy.creditDisclosure}</p>
              <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-blue-700">
                <GrowthFunnelLink
                  href={localizedPath(locale, '/try-on/glasses')}
                  sourcePage={sourcePage} destination="glasses-try-on"
                  ctaLocation="native-guide-primary" queryCluster={slug}
                  productPath="virtual_try_on" prefetch={false}
                >{copy.tryOnLabel}</GrowthFunnelLink>
                <Link href={localizedPath(locale, '/face-shape-detector')}>{copy.detectorLabel}</Link>
                <Link href={localizedPath(locale, '/try-on/glasses/compare')}>{copy.compareLabel}</Link>
              </div>
            </div>
            <p className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-blue-700">
              <Link href={localizedPath(locale, '/glasses-guide/how-wide-should-glasses-be-for-my-face')}>{copy.widthLabel}</Link>
              <Link href={blogPostPath(locale, relatedSlug)}>{copy.relatedLabel}</Link>
            </p>
            <p className="text-sm text-slate-600">{copy.nextStepLabel}</p>
          </div>
        </article>
      </div>
    </main>
  )
}
