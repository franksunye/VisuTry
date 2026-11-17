import type { Locale } from '@/i18n'
import { localeDirections } from '@/i18n'
import Image from 'next/image'
import Link from '@/components/layout/PublicLink'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { getNativeBlogHubText } from '@/config/native-blog-hub'
import { getNative2026Trends, OFFICIAL_2026_TREND_SOURCES } from '@/config/native-eyewear-trends-2026'
import { localizedPath } from '@/lib/localized-path'
import { generateStructuredData, SITE_CONFIG } from '@/lib/seo'

const path = '/blog/eyewear-trends-2026-glasses-sunglasses'
const publishedAt = '2026-07-20T10:00:00Z'
const modifiedAt = '2026-11-16T00:00:00Z'

/** Keeps the original 16 images, four groups, six intent shortlists and four FAQs. */
export function Native2026TrendsArticle({ locale }: { locale: Locale }) {
  const copy = getNative2026Trends(locale)
  if (!copy) return null
  const canonical = new URL(localizedPath(locale, path), SITE_CONFIG.url).toString()
  const article = generateStructuredData('article', {
    title: copy.title, description: copy.description, publishedAt, modifiedAt,
    author: 'VisuTry Team',
    image: new URL('/blog-covers/visutry-social.jpg', SITE_CONFIG.url).toString(),
    inLanguage: locale, url: canonical, mainEntityOfPage: canonical,
  })
  const faq = generateStructuredData('faqPage', {
    questions: copy.faq.map(([question, answer]) => ({ question, answer })),
  })
  return (
    <main className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        <Breadcrumbs items={[
          { name: getNativeBlogHubText(locale).title, url: localizedPath(locale, '/blog') },
          { name: copy.title },
        ]} />
        <article lang={locale} dir={localeDirections[locale]} className="mt-6 space-y-10 text-slate-800">
          <header className="space-y-4">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">{copy.title}</h1>
            <p className="text-lg leading-8">{copy.description}</p>
            <p className="text-sm text-slate-600">VisuTry Team · {copy.category} · {copy.readTime}</p>
            <p className="leading-7">{copy.lead}</p>
            <p className="leading-7">{copy.overview}</p>
            <p className="text-sm">
              {copy.labels.sources}:{' '}
              {OFFICIAL_2026_TREND_SOURCES.map(source => (
                <a className="me-4 font-medium text-blue-700 underline underline-offset-2"
                  href={source.url} key={source.url} target="_blank" rel="noopener noreferrer">
                  {source.title}
                </a>
              ))}
            </p>
          </header>

          <section className="space-y-4" data-native-intents="6">
            <h2 className="text-2xl font-semibold text-slate-950">{copy.intentTitle}</h2>
            <p>{copy.intentIntro}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {copy.intents.map(intent => (
                <div className="rounded-xl border border-slate-200 p-4" key={intent.name}>
                  <h3 className="font-bold text-slate-900">{intent.name}</h3>
                  <p className="mt-2 text-sm text-slate-700">{copy.labels.intentPick}: {intent.frames.map(frame => frame.name).join(' · ')}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-12" data-native-frames="16">
            {copy.groups.map((group,index) => (
              <section key={group.id} id={group.id} className="space-y-5">
                <div className="border-t border-slate-200 pt-7">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-700">{copy.labels.direction} {index+1}</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">{group.title}</h2>
                  <p className="mt-3 leading-7">{group.intro}</p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  {group.frames.map((frame,frameIndex) => (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                      key={frame.id} data-frame-id={frame.id}>
                      <div className="relative aspect-[4/3]">
                        <Image src={frame.image} alt={frame.name + ' · ' + (frame.category === 'Optical' ? copy.labels.optical : copy.labels.sunglasses)}
                          fill sizes="(min-width: 768px) 450px, 100vw"
                          className="object-contain p-5" priority={index === 0 && frameIndex === 0}/>
                      </div>
                      <div className="space-y-2 border-t border-slate-100 px-5 py-4">
                        <div className="flex flex-wrap justify-between gap-2">
                          <h3 className="font-bold text-slate-950">{frame.name}</h3>
                          <span className="text-xs text-slate-500">{frame.category === 'Optical' ? copy.labels.optical : copy.labels.sunglasses}</span>
                        </div>
                        <p className="text-sm font-medium">{frame.signal}</p>
                        <p className="text-sm"><strong>{copy.labels.bestFor}:</strong> {frame.bestFor}</p>
                        <p className="text-xs text-slate-600">{copy.labels.intensity}: {frame.intensity}/5</p>
                        <div className="flex flex-wrap gap-1.5">
                          {frame.tags.map(tag => <span key={tag} className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">{tag}</span>)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-950">{copy.stepsTitle}</h2>
            <ol className="list-decimal space-y-2 ps-6">{copy.steps.map(step => <li key={step}>{step}</li>)}</ol>
          </section>
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-950">{copy.limitsTitle}</h2>
            <ul className="list-disc space-y-2 ps-6">{copy.limits.map(limit => <li key={limit}>{limit}</li>)}</ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-950">{copy.whyTitle}</h2>
            <p className="leading-7">{copy.why}</p>
          </section>
          <section className="space-y-5">
            {copy.faq.map(([question,answer]) => (
              <div key={question} className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-950">{question}</h2>
                <p className="leading-7">{answer}</p>
              </div>
            ))}
          </section>

          <section className="space-y-4 rounded-xl border border-blue-100 bg-blue-50 p-5 sm:p-7">
            <h2 className="text-2xl font-bold text-slate-950">{copy.labels.ctaTitle}</h2>
            <p className="leading-7">{copy.labels.ctaBody}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-4 text-sm font-semibold text-blue-700">
              <Link href={localizedPath(locale, '/style-explorer')}>{copy.labels.styles}</Link>
              <Link href={localizedPath(locale, '/face-shape-detector')}>{copy.labels.detector}</Link>
              <Link href={localizedPath(locale, '/try-on/glasses/compare')}>{copy.labels.compare}</Link>
            </div>
          </section>
        </article>
      </div>
    </main>
  )
}
