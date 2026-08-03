import type { Metadata } from 'next'
import Link from 'next/link'
import { Camera, Glasses, ScanFace } from 'lucide-react'
import { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'
import { FACE_SHAPE_SLUGS } from '@/config/face-shape-content'
import { getFaceShapeSeoCopy } from '@/config/face-shape-seo-locales'
import { SearchToToolLanding } from '@/components/growth/SearchToToolLanding'

type Props = {
  params: { locale: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const copy = getFaceShapeSeoCopy(params.locale)
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: copy.glasses.metaTitle,
    description: copy.glasses.metaDescription,
    pathname: '/glasses-for-face-shape',
  })
}

export default function GlassesForFaceShapePage({ params }: Props) {
  const locale = params.locale
  const copy = getFaceShapeSeoCopy(locale)
  const sourcePage = 'glasses-for-face-shape'
  const queryCluster = 'glasses-for-face-shape'
  const faqSchema = generateStructuredData('faqPage', { questions: copy.glasses.faq })
  const howToSchema = generateStructuredData('howTo', {
    name: copy.glasses.title,
    description: copy.glasses.intro,
    totalTime: 'PT5M',
    steps: copy.glasses.steps.map((step) => ({ name: step.title, text: step.text })),
  })

  return (
    <SearchToToolLanding
      locale={locale}
      sourcePage={sourcePage}
      queryCluster={queryCluster}
      contentCluster="search-tool"
      eyebrow={copy.glasses.eyebrow}
      title={copy.glasses.title}
      intro={copy.glasses.intro}
      schemas={[faqSchema, howToSchema]}
      steps={copy.glasses.steps.map((step, index) => ({
        ...step,
        icon: [ScanFace, Glasses, Camera][index],
      }))}
      ctaLabels={{
        detector: copy.glasses.detectorCta,
        tryOn: copy.glasses.tryOnCta,
        compare: 'Compare frames side by side',
      }}
      principles={copy.glasses.principles}
      faq={copy.glasses.faq}
      faqEyebrow={copy.glasses.nextEyebrow}
      faqTitle={copy.glasses.nextTitle}
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
        </div>
      )}
    >
      <section className="mt-12">
        <div className="mb-5 max-w-3xl">
          <h2 className="mb-3 text-2xl font-bold text-gray-950">
            {copy.glasses.guideTitle}
          </h2>
          <p className="text-sm leading-6 text-gray-600">
            {copy.glasses.guideIntro}
          </p>
        </div>

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
                <Link href={locale === 'en' ? `/${locale}/style/${shape}-face` : `/${locale}/face-shape-detector`} className="font-semibold text-blue-700 hover:text-blue-900">
                  {copy.shapeNames[shape]}
                </Link>
                <span className="text-gray-700">{copy.glasses.tryFirst[shape]}</span>
                <span className="text-gray-600">{copy.glasses.avoidFirst[shape]}</span>
                <span className="text-gray-600">{copy.glasses.reasons[shape]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SearchToToolLanding>
  )
}
