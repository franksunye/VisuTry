import type { Metadata } from 'next'
import { Camera, Glasses, Grid2X2 } from 'lucide-react'
import { SearchToToolLanding } from '@/components/growth/SearchToToolLanding'
import { SearchIntentPathways } from '@/components/seo/SearchIntentPathways'
import { B02VisualSeoSections } from '@/components/seo/B02VisualSeoSections'
import { B03VisualSeoSections } from '@/components/seo/B03VisualSeoSections'
import { getSearchToToolRouteCopy } from '@/config/search-to-tool-route-copy'
import type { Locale } from '@/i18n'
import { generateStructuredData } from '@/lib/seo'
import { generateSearchToToolSEO } from '@/lib/search-to-tool-seo'

const pathname = '/try-glasses-on-photo'
const routeId = 'try-glasses-on-photo' as const

type Props = { params: { locale: string } }

export const dynamic = 'force-static'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const copy = getSearchToToolRouteCopy(params.locale, routeId)
  return generateSearchToToolSEO({
    locale: params.locale as Locale,
    title: copy.metaTitle,
    description: copy.metaDescription,
    pathname,
  })
}

export default function TryGlassesOnPhotoPage({ params }: Props) {
  const locale = params.locale
  const copy = getSearchToToolRouteCopy(locale, routeId)
  const sourcePage = pathname
  const queryCluster = 'try-glasses-on-photo'

  const schemas = [
    generateStructuredData('faqPage', { questions: copy.faq }),
    generateStructuredData('softwareApplication', {
      name: copy.title,
      url: `https://www.visutry.com/${locale}${pathname}`,
      applicationCategory: 'ShoppingApplication',
      operatingSystem: 'Web Browser',
      description: copy.software!.description,
      featureList: copy.software!.featureList,
    }),
  ]

  return (
    <SearchToToolLanding
      locale={locale}
      sourcePage={sourcePage}
      queryCluster={queryCluster}
      contentCluster="search-tool"
      eyebrow={copy.eyebrow}
      title={copy.title}
      intro={copy.intro}
      schemas={schemas}
      afterCtas={locale === 'en' ? <SearchIntentPathways intent='frame-ready' /> : undefined}
      steps={[
        { ...copy.steps[0], icon: Camera },
        { ...copy.steps[1], icon: Glasses },
        { ...copy.steps[2], icon: Grid2X2 },
      ]}
      includeCtas={['try_on', 'compare', 'detector']}
      bottomCtas={['try_on', 'compare']}
      ctaLabels={copy.ctaLabels}
      principles={copy.principles}
      faq={copy.faq}
      faqEyebrow={copy.faqEyebrow}
      faqTitle={copy.faqTitle}
    >
      {locale === 'en' ? (
        <section className="mx-auto my-10 max-w-4xl rounded-xl border border-slate-200 bg-white p-6 md:p-8" aria-labelledby="frame-photo-tips">
          <h2 id="frame-photo-tips" className="text-2xl font-bold text-slate-900">
            How to try on glasses from an online store screenshot
          </h2>
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-base leading-7 text-slate-700">
            <li>Save or crop the product image so the complete frame and both temples are visible, without covering labels or stickers.</li>
            <li>Choose a straight-on portrait with your face centered and evenly lit.</li>
            <li>Upload both images in Try-On and inspect the result for shape, color and apparent frame scale.</li>
            <li>When two pairs look close, generate both previews and compare them before deciding.</li>
          </ol>
          <p className="mt-5 text-sm leading-6 text-slate-600">
            This is an independent visual preview using the frame image you provide. VisuTry does not
            offer a retailer or brand inventory, and an AI preview cannot verify measurements, optical
            fit or comfort. Confirm those details with the seller.
          </p>
        </section>
      ) : null}
      <B02VisualSeoSections locale={locale} pagePath="/try-glasses-on-photo" />
      <B03VisualSeoSections locale={locale} pagePath="/try-glasses-on-photo" />
    </SearchToToolLanding>
  )
}
