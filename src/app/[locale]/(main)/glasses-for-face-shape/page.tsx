import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Camera, CheckCircle2, Glasses, ScanFace } from 'lucide-react'
import { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'

type Props = {
  params: { locale: string }
}

const faceShapeRows = [
  {
    shape: 'Round face',
    slug: 'round-face',
    tryFirst: 'Rectangular, square, geometric, and slightly wider frames',
    avoidFirst: 'Very small round frames that repeat the face curve',
    reason: 'Angular lines add definition and make soft cheeks feel more balanced.',
  },
  {
    shape: 'Square face',
    slug: 'square-face',
    tryFirst: 'Round, oval, thin metal, and softly curved frames',
    avoidFirst: 'Heavy square frames that emphasize the jawline',
    reason: 'Curves soften stronger angles around the jaw and forehead.',
  },
  {
    shape: 'Oval face',
    slug: 'oval-face',
    tryFirst: 'Balanced rectangular, browline, aviator, and classic shapes',
    avoidFirst: 'Frames much narrower than the widest part of the face',
    reason: 'Oval proportions are flexible, so width, scale, and personal style matter most.',
  },
  {
    shape: 'Heart-shaped face',
    slug: 'heart-face',
    tryFirst: 'Lightweight, rounded, cat-eye, and bottom-balanced frames',
    avoidFirst: 'Top-heavy frames that make the forehead feel wider',
    reason: 'Softer or lifted shapes balance a wider forehead with a narrower chin.',
  },
  {
    shape: 'Diamond face',
    slug: 'diamond-face',
    tryFirst: 'Oval, rimless, cat-eye, and browline frames',
    avoidFirst: 'Very narrow frames that compress the cheekbones',
    reason: 'Frames with gentle width can balance prominent cheekbones and a narrower forehead.',
  },
  {
    shape: 'Oblong face',
    slug: 'oblong-face',
    tryFirst: 'Deep rectangular, oversized, browline, and statement frames',
    avoidFirst: 'Very shallow frames that lengthen the face visually',
    reason: 'More lens depth and visual weight can balance longer proportions.',
  },
]

const faqContent = [
  {
    question: 'How do I know what glasses suit my face?',
    answer: 'Start with your face shape, then check frame width, lens depth, bridge fit, and personal style. VisuTry uses AI face analysis to create a shortlist, then virtual try-on helps you compare the look on your own photo.',
  },
  {
    question: 'What are face shape glasses?',
    answer: 'Face shape glasses are frame styles chosen to balance your visible proportions. For example, angular frames can add definition to round faces, while round or oval frames can soften square faces.',
  },
  {
    question: 'How do I shop glasses by face shape?',
    answer: 'Start by finding your likely face shape, compare the frame styles that usually work for that shape, then use virtual try-on to check the exact frame scale on your own photo.',
  },
  {
    question: 'Can AI tell me my face shape for glasses?',
    answer: 'AI can estimate your likely face shape from a clear front-facing photo and turn that into frame recommendations. The result should be used as a shopping shortcut, not a rigid rule.',
  },
  {
    question: 'Should I choose glasses only by face shape?',
    answer: 'No. Face shape is a useful starting point, but frame size, color, prescription needs, and personal taste all matter. Virtual try-on is the final check.',
  },
  {
    question: 'What is the fastest way to choose glasses online?',
    answer: 'Use AI face analysis to narrow the frame shapes, then try the recommended styles on your photo before comparing specific products.',
  },
]

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: 'What Glasses Suit My Face? Face Shape Guide | VisuTry',
    description: 'Find what glasses suit your face shape, compare frame styles, and use VisuTry AI face analysis to move from recommendations to virtual glasses try-on.',
    pathname: '/glasses-for-face-shape',
  })
}

export default function GlassesForFaceShapePage({ params }: Props) {
  const locale = params.locale
  const faqSchema = generateStructuredData('faqPage', { questions: faqContent })
  const howToSchema = generateStructuredData('howTo', {
    name: 'How to choose glasses for your face shape',
    description: 'Identify your face shape, shortlist compatible frame styles, and validate the look with virtual glasses try-on.',
    totalTime: 'PT5M',
    steps: [
      {
        name: 'Find your face shape',
        text: 'Use a clear front-facing photo or compare your forehead, cheekbones, jawline, and face length.',
      },
      {
        name: 'Shortlist frame shapes',
        text: 'Choose frames that balance your proportions, such as angular frames for round faces or curved frames for square faces.',
      },
      {
        name: 'Try the frames on your photo',
        text: 'Use virtual try-on to confirm scale, color, and style before deciding which frames to buy.',
      },
    ],
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex rounded-lg border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700">
              What glasses suit my face?
            </p>
            <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-950 md:text-5xl">
              What Glasses Suit My Face Shape?
            </h1>
            <p className="mb-6 text-lg leading-8 text-gray-600">
              Use face shape as the starting point, then validate your shortlist with AI virtual
              glasses try-on. VisuTry turns the question &quot;what glasses suit my face?&quot; into a
              practical path for choosing frames online.
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
                href={`/${locale}/try-on/glasses`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Try glasses online
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: ScanFace, title: 'Analyze', text: 'Estimate your likely face shape from one clear photo.' },
              { icon: Glasses, title: 'Shortlist', text: 'Turn the result into frame shapes worth trying first.' },
              { icon: Camera, title: 'Try on', text: 'Compare glasses on your own photo before deciding.' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mb-2 text-base font-semibold text-gray-950">{item.title}</h2>
                  <p className="text-sm leading-6 text-gray-600">{item.text}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-5 max-w-3xl">
            <h2 className="mb-3 text-2xl font-bold text-gray-950">
              Quick frame guide by face shape
            </h2>
            <p className="text-sm leading-6 text-gray-600">
              These recommendations are a first filter. The best result comes from combining face
              shape, frame scale, and virtual try-on on your own photo.
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[0.9fr_1.45fr_1.2fr_1.55fr] gap-4 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
                <span>Face shape</span>
                <span>Try first</span>
                <span>Avoid first</span>
                <span>Why</span>
              </div>
              {faceShapeRows.map((row) => (
                <div
                  key={row.shape}
                  className="grid grid-cols-[0.9fr_1.45fr_1.2fr_1.55fr] gap-4 border-t border-gray-200 px-4 py-4 text-sm"
                >
                  <Link href={`/${locale}/style/${row.slug}`} className="font-semibold text-blue-700 hover:text-blue-900">
                    {row.shape}
                  </Link>
                  <span className="text-gray-700">{row.tryFirst}</span>
                  <span className="text-gray-600">{row.avoidFirst}</span>
                  <span className="text-gray-600">{row.reason}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            'Face shape narrows the first set of frame shapes.',
            'Virtual try-on checks the real visual scale on your own photo.',
            'Your best pair should fit both your proportions and your style.',
          ].map((item) => (
            <div key={item} className="flex gap-3 rounded-lg border border-gray-200 bg-white p-5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
              <p className="text-sm leading-6 text-gray-700">{item}</p>
            </div>
          ))}
        </section>

        <section className="mt-12 rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-normal text-blue-600">
                Next step
              </p>
              <h2 className="text-2xl font-bold text-gray-950">
                Move from advice to your own try-on
              </h2>
            </div>
            <Link
              href={`/${locale}/face-analysis`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Start with AI face analysis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {faqContent.map((item) => (
              <div key={item.question} className="rounded-lg border border-gray-200 p-5">
                <h3 className="mb-2 text-base font-semibold text-gray-950">{item.question}</h3>
                <p className="text-sm leading-6 text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
