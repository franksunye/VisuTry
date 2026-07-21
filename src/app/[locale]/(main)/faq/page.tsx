import Link from 'next/link'
import { Metadata } from 'next'
import { ArrowRight, Glasses, Grid2X2, ScanFace, Shield, Sparkles } from 'lucide-react'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'
import { Locale } from '@/i18n'
import { getTranslations, setRequestLocale } from 'next-intl/server'

type Props = {
  params: { locale: string }
}

function toAnchorId(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  setRequestLocale(params.locale)
  const t = await getTranslations({ locale: params.locale, namespace: 'marketing.faqPage' })
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: t('metaTitle'),
    description: t('metaDescription'),
    pathname: '/faq',
  })
}

export default async function FaqPage({ params }: Props) {
  setRequestLocale(params.locale)
  const t = await getTranslations({ locale: params.locale, namespace: 'marketing.faqPage' })
  const tNav = await getTranslations({ locale: params.locale, namespace: 'nav' })
  const faqGroups = [
    {
      title: t('groups.using.title'),
      items: [
        { question: t('groups.using.q1.question'), answer: t('groups.using.q1.answer') },
        { question: t('groups.using.q2.question'), answer: t('groups.using.q2.answer') },
        { question: t('groups.using.q3.question'), answer: t('groups.using.q3.answer') },
      ],
    },
    {
      title: t('groups.credits.title'),
      items: [
        { question: t('groups.credits.q1.question'), answer: t('groups.credits.q1.answer') },
        { question: t('groups.credits.q2.question'), answer: t('groups.credits.q2.answer') },
        { question: t('groups.credits.q3.question'), answer: t('groups.credits.q3.answer') },
      ],
    },
    {
      title: t('groups.privacy.title'),
      items: [
        { question: t('groups.privacy.q1.question'), answer: t('groups.privacy.q1.answer') },
        { question: t('groups.privacy.q2.question'), answer: t('groups.privacy.q2.answer') },
        { question: t('groups.privacy.q3.question'), answer: t('groups.privacy.q3.answer') },
      ],
    },
  ]
  const allFaqItems = faqGroups.flatMap((group) => group.items)
  const faqSchema = generateStructuredData('faqPage', {
    questions: allFaqItems,
  })

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <p className="mb-3 inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
          {t('badge')}
        </p>
        <h1 className="max-w-3xl text-3xl font-bold leading-tight text-gray-950 md:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-gray-600">
          {t('subtitle')}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ScanFace, label: tNav('faceShapeDetector'), href: `/${params.locale}/face-shape-detector` },
            { icon: Sparkles, label: tNav('faceAnalysis'), href: `/${params.locale}/face-analysis` },
            { icon: Glasses, label: tNav('tryGlasses'), href: `/${params.locale}/try-on/glasses` },
            { icon: Grid2X2, label: tNav('compare'), href: `/${params.locale}/try-on/glasses/compare` },
          ].map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.label} href={item.href} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm font-semibold text-gray-800 hover:border-blue-200 hover:text-blue-700">
                <Icon className="h-4 w-4 text-blue-600" />
                {item.label}
                <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            )
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="h-fit rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase text-gray-500">{t('topics')}</h2>
          <div className="space-y-2">
            {faqGroups.map((group) => (
              <a key={group.title} href={`#${toAnchorId(group.title)}`} className="block rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700">
                {group.title}
              </a>
            ))}
          </div>
        </aside>

        <section className="space-y-6">
          {faqGroups.map((group) => (
            <div key={group.title} id={toAnchorId(group.title)} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-950">{group.title}</h2>
              <div className="space-y-3">
                {group.items.map((item) => (
                  <details key={item.question} className="group rounded-lg border border-gray-200 p-4">
                    <summary className="cursor-pointer list-none text-base font-semibold text-gray-950">
                      {item.question}
                    </summary>
                    <p className="mt-3 text-sm leading-6 text-gray-600">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 text-blue-700" />
              <div>
                <h2 className="font-bold text-blue-950">{t('supportTitle')}</h2>
                <p className="mt-1 text-sm leading-6 text-blue-900">
                  {t('supportDescription')}
                </p>
                <a href="mailto:support@visutry.com" className="mt-3 inline-flex text-sm font-bold text-blue-700 underline">
                  support@visutry.com
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
