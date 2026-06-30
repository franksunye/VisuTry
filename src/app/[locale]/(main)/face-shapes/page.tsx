import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Glasses, Ruler, ScanFace, Scissors } from 'lucide-react'
import { FACE_SHAPE_CONTENT, FACE_SHAPE_SLUGS } from '@/config/face-shape-content'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'

interface FaceShapesPageProps {
  params: { locale: string }
}

const faqContent = [
  {
    question: 'What are the seven common face shapes?',
    answer: 'The seven commonly used styling categories are oval, round, square, heart, diamond, oblong, and triangle. Many people sit between two categories rather than matching one perfectly.',
  },
  {
    question: 'How can I find my face shape?',
    answer: 'Use a straight-on photo with a neutral expression, then compare face length, forehead width, cheekbone width, jaw width, and jaw curvature. Hair should be pulled away from the outline when possible.',
  },
  {
    question: 'Can my face be a mix of two shapes?',
    answer: 'Yes. Face-shape categories are styling shortcuts, not medical diagnoses. A primary and secondary shape often describes real proportions better than a forced single label.',
  },
]

export async function generateMetadata({ params }: FaceShapesPageProps): Promise<Metadata> {
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: 'The 7 Face Shapes: How to Identify Yours | VisuTry',
    description: 'Compare oval, round, square, heart, diamond, oblong, and triangle face shapes with practical measurement clues, glasses guides, and hairstyle advice.',
    pathname: '/face-shapes',
  })
}

export default function FaceShapesPage({ params }: FaceShapesPageProps) {
  const locale = params.locale
  const faqSchema = generateStructuredData('faqPage', { questions: faqContent })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              Face shape guide
            </p>
            <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-950 md:text-5xl">
              The 7 Face Shapes, Explained Clearly
            </h1>
            <p className="mb-6 max-w-3xl text-lg leading-8 text-gray-600">
              Face shape is a practical styling shortcut based on visible proportions—not a rigid
              rule or beauty score. Compare the seven common categories, then use glasses and
              hairstyle guides to turn the result into a useful shortlist.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/${locale}/face-analysis`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Analyze my face
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/${locale}/glasses-for-face-shape`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Compare glasses by face shape
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Ruler, title: 'Compare proportions', text: 'Look at length and the widest zones—not body weight or one isolated feature.' },
              { icon: ScanFace, title: 'Allow mixed shapes', text: 'A primary and secondary type is often more honest than a forced label.' },
              { icon: Glasses, title: 'Shortlist frames', text: 'Use shape to narrow options, then validate scale with virtual try-on.' },
              { icon: Scissors, title: 'Choose hairstyles', text: 'Use volume, length, texture, and parting to create the effect you want.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <Icon className="mb-3 h-5 w-5 text-blue-600" />
                <h2 className="mb-1 font-semibold text-gray-950">{title}</h2>
                <p className="text-sm leading-6 text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-6 max-w-3xl">
            <h2 className="mb-3 text-2xl font-bold text-gray-950">Compare all seven face shapes</h2>
            <p className="leading-7 text-gray-600">
              Start with the broad outline, then open the detailed guide to compare measurements,
              commonly confused shapes, eyewear, and hairstyles.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FACE_SHAPE_SLUGS.map((slug) => {
              const guide = FACE_SHAPE_CONTENT[slug]
              return (
                <article key={slug} className="flex flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="mb-2 text-sm font-semibold uppercase tracking-normal text-blue-600">{guide.name} face</p>
                  <h3 className="mb-3 text-xl font-bold text-gray-950">How to identify the {guide.name} face shape</h3>
                  <p className="mb-5 flex-1 text-sm leading-6 text-gray-600">{guide.shortDefinition}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
                    <Link href={`/${locale}/face-shapes/${slug}`} className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900">
                      Full guide <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href={`/${locale}/style/${guide.styleSlug}`} className="text-gray-700 hover:text-gray-950">
                      Glasses
                    </Link>
                    <Link href={`/${locale}/hairstyles-for/${guide.styleSlug}`} className="text-gray-700 hover:text-gray-950">
                      Hairstyles
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="mt-12 rounded-lg border border-amber-200 bg-amber-50 p-6">
          <h2 className="mb-2 text-lg font-semibold text-amber-950">Use face shape as a starting point</h2>
          <p className="text-sm leading-6 text-amber-900">
            These categories describe visible styling proportions. They do not determine beauty,
            prescription needs, frame size, or physical comfort. Try the actual frame on your own
            photo before making a buying decision.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold text-gray-950">Face shape FAQ</h2>
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
