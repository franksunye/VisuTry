import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Eye, Glasses, ScanFace, Sparkles } from 'lucide-react'
import { FaceAnalysisFunnelCTA } from '@/components/blog/FaceAnalysisFunnelCTA'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { getAiGlassesAdvisorArticleCopy } from '@/config/ai-glasses-advisor-article-locales'
import { FACE_SHAPE_SLUGS } from '@/config/face-shape-content'
import { getFaceShapeSeoCopy } from '@/config/face-shape-seo-locales'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'

export const dynamic = 'force-static'

const coverImage = '/blog-covers/face-shape-guide.jpg'
const publishedAt = '2026-06-08T10:00:00Z'
const modifiedAt = '2026-07-27T04:00:00Z'
const pathname = '/blog/ai-face-analysis-for-glasses-guide'

type PageProps = { params: { locale: string } }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = getAiGlassesAdvisorArticleCopy(params.locale)

  return generateI18nSEO({
    locale: params.locale as Locale,
    title: article.metaTitle,
    description: article.metaDescription,
    image: coverImage,
    pathname,
    type: 'article',
  })
}

const workflowIcons = [ScanFace, Sparkles, Eye]

export default function BlogPostPage({ params }: PageProps) {
  const { locale } = params
  const localePrefix = `/${locale}`
  const article = getAiGlassesAdvisorArticleCopy(locale)
  const seoCopy = getFaceShapeSeoCopy(locale)
  const sourcePage = `${localePrefix}${pathname}`
  const structuredData = generateStructuredData('article', {
    title: article.metaTitle,
    description: article.metaDescription,
    publishedAt,
    modifiedAt,
    author: 'VisuTry Team',
    image: coverImage,
  })
  const faqSchema = generateStructuredData('faqPage', {
    questions: seoCopy.glasses.faq,
  })
  const paths = [
    {
      href: `${localePrefix}/face-shape-detector`,
      icon: ScanFace,
      title: article.pathDetector,
      body: seoCopy.detector.intro,
    },
    {
      href: `${localePrefix}/face-analysis`,
      icon: Sparkles,
      title: article.pathAdvisor,
      body: seoCopy.glasses.intro,
    },
    {
      href: `${localePrefix}/glasses-for-face-shape`,
      icon: Glasses,
      title: article.pathGuide,
      body: seoCopy.glasses.guideIntro,
    },
    {
      href: `${localePrefix}/try-on/glasses`,
      icon: Eye,
      title: article.pathTryOn,
      body: article.finalBody,
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <main className="container mx-auto px-4 py-12">
          <div className="mb-6">
            <Breadcrumbs
              items={[
                { name: 'Blog', url: `${localePrefix}/blog` },
                { name: article.articleLabel },
              ]}
            />
          </div>

          <article className="mx-auto max-w-4xl overflow-hidden rounded-lg bg-white shadow-lg">
            <div className="relative h-72 w-full overflow-hidden md:h-96">
              <Image
                src={coverImage}
                alt={article.title}
                fill
                className="object-cover"
                priority
              />
            </div>

            <header className="border-b p-8">
              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span>VisuTry Team</span>
                <span>{article.publishedLabel}</span>
                <span>{article.readTime}</span>
              </div>
              <p className="mb-3 text-sm font-semibold text-blue-700">{article.eyebrow}</p>
              <h1 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">{article.title}</h1>
              <p className="text-xl text-gray-600">{article.intro}</p>
              <FaceAnalysisFunnelCTA
                locale={locale}
                title={article.heroTitle}
                body={article.heroBody}
                tone="light"
                sourcePage={sourcePage}
                ctaLocation="article_hero"
                primaryLabel={article.pathDetector}
                secondaryAction="advisor"
                secondaryLabel={article.pathAdvisor}
              />
            </header>

            <div className="prose prose-lg max-w-none p-8">
              <h2>{article.overviewTitle}</h2>
              {article.overview.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}

              <h2>{article.workflowTitle}</h2>
              <div className="not-prose my-8 grid gap-4 md:grid-cols-3">
                {seoCopy.glasses.steps.map((step, index) => {
                  const Icon = workflowIcons[index] || Glasses
                  return (
                    <div key={step.title} className="rounded-lg border border-gray-200 p-5">
                      <Icon className="mb-3 h-6 w-6 text-blue-600" />
                      <h3 className="mb-2 text-lg font-bold text-gray-900">{step.title}</h3>
                      <p className="text-sm text-gray-600">{step.text}</p>
                    </div>
                  )
                })}
              </div>

              <h2>{article.guideTitle}</h2>
              <p>{article.guideIntro}</p>
              <div className="not-prose my-6 overflow-x-auto rounded-lg border border-gray-200">
                <div className="min-w-[720px]">
                  <div className="grid grid-cols-[1fr_1.4fr_1.4fr] bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
                    <span>{seoCopy.glasses.columns[0]}</span>
                    <span>{seoCopy.glasses.columns[1]}</span>
                    <span>{seoCopy.glasses.columns[3]}</span>
                  </div>
                  {FACE_SHAPE_SLUGS.map((shape) => {
                    const shapeHref = locale === 'en'
                      ? `${localePrefix}/style/${shape}-face`
                      : `${localePrefix}/face-shape-detector`

                    return (
                      <div
                        key={shape}
                        className="grid grid-cols-[1fr_1.4fr_1.4fr] gap-3 border-t border-gray-200 px-4 py-4 text-sm"
                      >
                        <Link href={shapeHref} className="font-semibold text-blue-700 hover:underline">
                          {seoCopy.shapeNames[shape]}
                        </Link>
                        <span className="text-gray-700">{seoCopy.glasses.tryFirst[shape]}</span>
                        <span className="text-gray-600">{seoCopy.glasses.reasons[shape]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <h2>{article.decisionTitle}</h2>
              <p>{article.decisionIntro}</p>
              <ol>
                {article.decisionSteps.map((step) => <li key={step}>{step}</li>)}
              </ol>

              <FaceAnalysisFunnelCTA
                locale={locale}
                title={article.finalTitle}
                body={article.finalBody}
                sourcePage={sourcePage}
                ctaLocation="article_midpoint"
                primaryLabel={article.pathDetector}
                secondaryLabel={article.pathTryOn}
              />

              <h2>{article.pathsTitle}</h2>
              <p>{article.pathsIntro}</p>
              <div className="not-prose my-8 grid gap-4 md:grid-cols-2">
                {paths.map((path) => {
                  const Icon = path.icon
                  return (
                    <Link
                      key={path.href}
                      href={path.href}
                      className="group rounded-lg border border-gray-200 p-5 transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <Icon className="h-6 w-6 text-blue-600" />
                        <ArrowRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                      </div>
                      <h3 className="font-bold text-gray-900">{path.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{path.body}</p>
                    </Link>
                  )
                })}
              </div>

              <h2>{article.faqTitle}</h2>
              {seoCopy.glasses.faq.map((item) => (
                <div key={item.question}>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </div>
              ))}

              <div className="not-prose my-8 rounded-lg border border-green-200 bg-green-50 p-6">
                <div className="mb-4 flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-700" />
                  <h2 className="text-xl font-bold text-green-950">{article.checklistTitle}</h2>
                </div>
                <ul className="flex flex-col gap-y-3 text-green-900">
                  {article.checklist.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="not-prose rounded-xl bg-gray-950 p-7 text-white">
                <h2 className="text-2xl font-bold text-white">{article.finalTitle}</h2>
                <p className="mt-3 leading-7 text-gray-300">{article.finalBody}</p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={`${localePrefix}/face-shape-detector`}
                    className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-semibold text-gray-950"
                  >
                    {article.pathDetector}<ArrowRight className="ms-2 h-4 w-4" />
                  </Link>
                  <Link
                    href={`${localePrefix}/try-on/glasses`}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-600 px-5 py-3 text-sm font-semibold text-white"
                  >
                    {article.pathTryOn}<Eye className="ms-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </article>
        </main>
      </div>
    </>
  )
}
