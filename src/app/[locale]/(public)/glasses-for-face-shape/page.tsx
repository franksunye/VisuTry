import type { Metadata } from 'next'
import Link from '@/components/layout/PublicLink'
import { Camera, Glasses, ScanFace } from 'lucide-react'
import { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'
import { FACE_SHAPE_SLUGS } from '@/config/face-shape-content'
import { getFaceShapeSeoCopy } from '@/config/face-shape-seo-locales'
import { SearchToToolLanding } from '@/components/growth/SearchToToolLanding'
import { EN_FACE_SHAPE_GLASSES_HUB, EN_FRAME_FIT_CHECKS } from '@/config/english-search-entry-content'

type Props = {
  params: { locale: string }
}

export const dynamic = 'force-static'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const copy = getFaceShapeSeoCopy(params.locale)
  const glassesCopy = params.locale === 'en' ? { ...copy.glasses, ...EN_FACE_SHAPE_GLASSES_HUB } : copy.glasses
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: glassesCopy.metaTitle,
    description: glassesCopy.metaDescription,
    pathname: '/glasses-for-face-shape',
  })
}

export default function GlassesForFaceShapePage({ params }: Props) {
  const locale = params.locale
  const copy = getFaceShapeSeoCopy(locale)
  const glassesCopy = locale === 'en' ? { ...copy.glasses, ...EN_FACE_SHAPE_GLASSES_HUB } : copy.glasses
  const sourcePage = 'glasses-for-face-shape'
  const queryCluster = 'glasses-for-face-shape'
  const faqSchema = generateStructuredData('faqPage', { questions: glassesCopy.faq })
  const howToSchema = generateStructuredData('howTo', {
    name: glassesCopy.title,
    description: glassesCopy.intro,
    totalTime: 'PT5M',
    steps: glassesCopy.steps.map((step) => ({ name: step.title, text: step.text })),
  })

  return (
    <SearchToToolLanding
      locale={locale}
      sourcePage={sourcePage}
      queryCluster={queryCluster}
      contentCluster="search-tool"
      eyebrow={glassesCopy.eyebrow}
      title={glassesCopy.title}
      intro={glassesCopy.intro}
      schemas={[faqSchema, howToSchema]}
      steps={glassesCopy.steps.map((step, index) => ({
        ...step,
        icon: [ScanFace, Glasses, Camera][index],
      }))}
      ctaLabels={{
        detector: copy.glasses.detectorCta,
        tryOn: copy.glasses.tryOnCta,
        compare: 'Compare frames side by side',
      }}
      principles={glassesCopy.principles}
      faq={glassesCopy.faq}
      faqEyebrow={glassesCopy.nextEyebrow}
      faqTitle={glassesCopy.nextTitle}
      afterCtas={(
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
          <Link href={locale === 'en' ? `/${locale}/face-shapes` : `/${locale}/face-shape-detector`} className="text-blue-700 hover:text-blue-900">
            {copy.glasses.faceShapesLink}
          </Link>
          {locale === 'en' && (
            <Link href={`/${locale}/hairstyles-for-face-shape`} className="text-blue-700 hover:text-blue-900">
              {copy.glasses.hairstylesLink}
            </Link>
          )}
          <Link href={`/${locale}/sunglasses-for-face-shape`} className="text-blue-700 hover:text-blue-900">
            {copy.glasses.sunglassesLink}
          </Link>
          {locale === 'en' && (
            <Link href={`/${locale}/glasses-guide`} className="text-blue-700 hover:text-blue-900">
              Explore glasses guides →
            </Link>
          )}
        </div>
      )}
    >
      <section className="mt-12">
        <div className="mb-5 max-w-3xl">
          <h2 className="mb-3 text-2xl font-bold text-gray-950">
            {copy.glasses.guideTitle}
          </h2>
          <p className="text-sm leading-6 text-gray-600">
            {glassesCopy.guideIntro}
          </p>
        </div>

        {locale === 'en' ? (
          <div className="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white">
            {FACE_SHAPE_SLUGS.map((shape) => (
              <article key={shape} className="grid gap-3 p-5 md:grid-cols-[0.7fr_1.3fr_1.5fr] md:gap-6">
                <h3 className="font-semibold">
                  <Link href={`/en/style/${shape}-face`} className="text-blue-700 hover:text-blue-900">{copy.shapeNames[shape]}</Link>
                </h3>
                <p className="text-sm leading-6 text-gray-700"><span className="font-semibold">Try first: </span>{copy.glasses.tryFirst[shape]}.</p>
                <div className="text-sm leading-6 text-gray-600">
                  <p>{copy.glasses.reasons[shape]}</p>
                  <p className="mt-1">{EN_FRAME_FIT_CHECKS[shape]}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[0.9fr_1.45fr_1.2fr_1.55fr] gap-4 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
                {copy.glasses.columns.map((column) => <span key={column}>{column}</span>)}
              </div>
              {FACE_SHAPE_SLUGS.map((shape) => (
                <div
                  key={shape}
                  className="grid grid-cols-[0.9fr_1.45fr_1.2fr_1.55fr] gap-4 border-t border-gray-200 px-4 py-4 text-sm"
                >
                  <Link href={`/${locale}/style/${shape}-face`} className="font-semibold text-blue-700 hover:text-blue-900">
                    {copy.shapeNames[shape]}
                  </Link>
                  <span className="text-gray-700">{copy.glasses.tryFirst[shape]}</span>
                  <span className="text-gray-600">{copy.glasses.avoidFirst[shape]}</span>
                  <span className="text-gray-600">{copy.glasses.reasons[shape]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {locale === 'en' && (
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
            <Link href="/en/blog/ai-face-analysis-for-glasses-guide" className="text-blue-700 hover:text-blue-900">Choose glasses using your photo</Link>
            <Link href="/en/glasses-guide/how-wide-should-glasses-be-for-my-face" className="text-blue-700 hover:text-blue-900">How wide should glasses be?</Link>
            <Link href="/en/glasses-guide/should-glasses-cover-your-eyebrows" className="text-blue-700 hover:text-blue-900">Where should frames sit near your brows?</Link>
          </div>
        )}
      </section>
    </SearchToToolLanding>
  )
}
