import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, ScanFace, Scissors } from 'lucide-react'
import { FACE_SHAPE_CONTENT, FACE_SHAPE_SLUGS } from '@/config/face-shape-content'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'

interface HairstylesHubPageProps {
  params: { locale: string }
}

const faqContent = [
  {
    question: 'How do I choose a hairstyle for my face shape?',
    answer: 'Start with where your face carries width and length. Then use hair volume, fringe, layers, and the ending point of the cut to create contrast or emphasize the structure you like.',
  },
  {
    question: 'Does face shape decide which haircut I can wear?',
    answer: 'No. Face shape is one styling input. Hair texture, density, growth pattern, maintenance, and personal style should decide the final cut.',
  },
  {
    question: 'Can one hairstyle work for several face shapes?',
    answer: 'Yes. Most cuts can be adapted through length, layering, parting, fringe, and volume placement. The details matter more than the haircut name alone.',
  },
]

export async function generateMetadata({ params }: HairstylesHubPageProps): Promise<Metadata> {
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: 'Best Hairstyles for Every Face Shape | VisuTry',
    description: 'Compare hairstyle ideas for oval, round, square, heart, diamond, oblong, and triangle faces, with practical guidance on length, layers, fringe, and volume.',
    pathname: '/hairstyles-for-face-shape',
    noIndex: params.locale !== 'en',
    availableLocales: ['en'] as const,
  })
}

export default function HairstylesHubPage({ params }: HairstylesHubPageProps) {
  const locale = params.locale
  const faqSchema = generateStructuredData('faqPage', { questions: faqContent })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex rounded-lg border border-violet-200 bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-700">
              Hairstyle decision guide
            </p>
            <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-950 md:text-5xl">
              Best Hairstyles for Your Face Shape
            </h1>
            <p className="mb-6 max-w-3xl text-lg leading-8 text-gray-600">
              The useful question is not “Which haircut is allowed?” It is where to place length,
              texture, fringe, and volume for the effect you want. Start with your likely face shape,
              then adapt the recommendation to your hair and daily routine.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/${locale}/face-shapes`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700"
              >
                Compare face shapes
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/${locale}/face-shape-detector`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Try the free detector
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Scissors className="h-5 w-5 text-violet-600" />
              <h2 className="text-lg font-semibold text-gray-950">Four levers change the visual result</h2>
            </div>
            <ul className="grid gap-3 text-sm leading-6 text-gray-700">
              {[
                'Length controls where the eye stops vertically.',
                'Layers decide where width and movement appear.',
                'Fringe changes the visible forehead and face length.',
                'Parting and texture create symmetry, contrast, or softness.',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-green-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold text-gray-950">Hairstyle guides for all seven face shapes</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FACE_SHAPE_SLUGS.map((slug) => {
              const guide = FACE_SHAPE_CONTENT[slug]
              return (
                <article key={slug} className="flex flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-xl font-bold text-gray-950">{guide.name} face</h3>
                    <ScanFace className="h-5 w-5 text-violet-600" />
                  </div>
                  <p className="mb-4 text-sm leading-6 text-gray-600">{guide.hairstyles.rationale}</p>
                  <p className="mb-2 text-sm font-semibold text-gray-950">Try first</p>
                  <ul className="mb-5 grid gap-1 text-sm text-gray-600">
                    {guide.hairstyles.tryFirst.slice(0, 3).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                  <Link
                    href={`/${locale}/hairstyles-for/${guide.styleSlug}`}
                    className="mt-auto inline-flex items-center gap-1 font-semibold text-violet-700 hover:text-violet-900"
                  >
                    Full {guide.name.toLowerCase()} face guide <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              )
            })}
          </div>
        </section>

        <section className="mt-12 rounded-lg border border-gray-200 bg-gray-50 p-6">
          <h2 className="mb-3 text-xl font-bold text-gray-950">What face-shape advice cannot tell you</h2>
          <p className="max-w-4xl text-sm leading-7 text-gray-700">
            A photo cannot tell us your curl pattern, density, cowlicks, chemical history, styling
            time, or how a cut behaves in your climate. Use these pages to prepare useful questions,
            then make the final plan with a stylist who can assess your hair in person.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold text-gray-950">Hairstyles by face shape FAQ</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {faqContent.map((item) => (
              <article key={item.question} className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="mb-2 font-semibold text-gray-950">{item.question}</h3>
                <p className="text-sm leading-6 text-gray-600">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
