import { generateBlogArticleSEO } from '@/lib/blog-seo'
import { blogPostPath } from '@/lib/blog'
import { getPrescriptionTryOnArticleCopy } from '@/config/prescription-tryon-article-locales'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from '@/components/layout/PublicLink'
import { GrowthFunnelLink } from '@/components/analytics/GrowthFunnelLink'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { blogArt } from '@/config/blog-art'
import type { Locale } from '@/i18n'
import { localizedPath } from '@/lib/localized-path'
import { generateStructuredData, SITE_CONFIG } from '@/lib/seo'

export const dynamic = 'force-static'

const slug = 'prescription-glasses-virtual-tryon-guide'
const pathname = '/blog/' + slug
const publishedAt = '2025-11-04T10:00:00Z'
const updatedAt = '2026-11-16T00:00:00Z'
const artwork = blogArt[slug]

type PageProps = { params: { locale: Locale } }

export function generateMetadata({ params: { locale } }: PageProps): Metadata {
  const copy = getPrescriptionTryOnArticleCopy(locale)
  return generateBlogArticleSEO({
    locale, pathname, title: copy.title, description: copy.description, type: 'article',
    image: artwork.src, imageAlt: copy.imageAlt,
    imageWidth: artwork.width, imageHeight: artwork.height,
  })
}

export default function BlogPostPage({ params: { locale } }: PageProps) {
  const copy = getPrescriptionTryOnArticleCopy(locale)
  const articleUrl = new URL('/' + copy.language + pathname, SITE_CONFIG.url).toString()
  const article = generateStructuredData('article', {
    title: copy.title, description: copy.description,
    publishedAt, modifiedAt: updatedAt, author: 'VisuTry Team',
    image: new URL(artwork.src, SITE_CONFIG.url).toString(),
    inLanguage: copy.language, url: articleUrl, mainEntityOfPage: articleUrl,
  })

  return (
    <main className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        <Breadcrumbs items={[{ name: 'Blog', url: localizedPath(locale, '/blog') }, { name: copy.title }]} />
        <article lang={copy.language} dir="ltr" className="mt-6">
          <header>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">{copy.title}</h1>
            <p className="mt-4 text-lg leading-8 text-slate-700">{copy.description}</p>
            <p className="mt-3 text-sm text-slate-600">
              VisuTry Team · {copy.publishedPrefix} <time dateTime={publishedAt}>{copy.publishedLabel}</time>
              {' · '}{copy.updatedPrefix} <time dateTime={updatedAt}>{copy.updatedLabel}</time>
            </p>
          </header>

          <figure className="my-7">
            <Image
              src={artwork.src} alt={copy.imageAlt} width={artwork.width} height={artwork.height}
              sizes="(min-width: 768px) 704px, calc(100vw - 40px)"
              className="h-auto w-full rounded-xl object-contain" priority
            />
            <figcaption className="mt-2 text-sm text-slate-600">{copy.imageCaption}</figcaption>
          </figure>

          <div className="space-y-4 leading-7 text-slate-800 [&_a]:font-medium [&_a]:text-blue-700 [&_a]:underline [&_a]:underline-offset-2 [&_h2]:pt-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-tight [&_ul]:list-disc [&_ul]:ps-6">
            <h2>{copy.startHeading}</h2>
            <p>{copy.startP1}</p>
            <p>{copy.startP2}</p>
            <p>{copy.creditNote}</p>
            <GrowthFunnelLink
              href={localizedPath(locale, '/try-on/glasses')} sourcePage={localizedPath(locale, pathname)}
              destination="glasses-try-on" ctaLocation="photo-comparison"
              queryCluster="prescription-glasses-virtual-try-on" productPath="virtual_try_on" prefetch={false}
            >{copy.tryOnCta}</GrowthFunnelLink>
            <h2>{copy.compareHeading}</h2>
            <p>{copy.compareP}</p>
            <h2>{copy.previewHeading}</h2>
            <p>{copy.previewP}</p>
            <p>{copy.previewBefore}{' '}
              <Link href={localizedPath(locale, '/try-on/glasses/compare')}>{copy.previewLink}</Link>{' '}
              {copy.previewAfter}
            </p>
            <h2>{copy.fitHeading}</h2>
            <p>{copy.fitP}</p>
            <p>{copy.nextBefore}{' '}
              <Link href={blogPostPath(locale, 'prescription-glasses-online-shopping-guide-2025')}>
                {copy.checklistLink}
              </Link>{' '}{copy.nextBetween}{' '}
              <Link href={localizedPath(locale, '/glasses-guide/how-wide-should-glasses-be-for-my-face')}>
                {copy.widthLink}
              </Link>{copy.nextAfter}
            </p>
          </div>
        </article>
      </div>
    </main>
  )
}
