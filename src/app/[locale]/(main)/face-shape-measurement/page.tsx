import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, CheckCircle2, Ruler, ScanFace } from 'lucide-react'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'

interface FaceShapeMeasurementPageProps {
  params: { locale: string }
}

const measurementSteps = [
  {
    name: 'Face length',
    points: 'Center of the visible upper forehead to the tip of the chin',
    use: 'Separates compact, balanced, and distinctly long proportions.',
  },
  {
    name: 'Forehead width',
    points: 'Across the widest visible upper-face area near the temples',
    use: 'Helps distinguish heart and triangle width patterns.',
  },
  {
    name: 'Cheekbone width',
    points: 'Across the widest point of the upper cheeks',
    use: 'Identifies whether the cheekbones dominate, as on many diamond faces.',
  },
  {
    name: 'Jaw width',
    points: 'From one jaw corner to the other across the lower face',
    use: 'Separates tapered, moderate, and broad lower-face structures.',
  },
]

const faqContent = [
  {
    question: 'Can I measure face shape from a photo?',
    answer: 'You can compare proportions from a straight-on photo, but pixel measurements depend on crop, perspective, and image dimensions. Do not convert a photo ratio into millimeters without a physical calibration reference.',
  },
  {
    question: 'Do I need exact millimeters to identify face shape?',
    answer: 'No. Relative comparisons—such as whether the forehead or jaw is wider—are more useful than exact physical size for face-shape classification.',
  },
  {
    question: 'What if my measurements fit two face shapes?',
    answer: 'That is common. Record a primary and secondary shape and use styling advice from both rather than forcing a single label.',
  },
]

export async function generateMetadata({ params }: FaceShapeMeasurementPageProps): Promise<Metadata> {
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: 'How to Measure Your Face Shape: 4 Measurements',
    description: 'Measure face length, forehead, cheekbones, and jaw correctly. Compare the ratios, avoid photo measurement mistakes, and identify your likely face shape.',
    pathname: '/face-shape-measurement',
  })
}

export default function FaceShapeMeasurementPage({ params }: FaceShapeMeasurementPageProps) {
  const locale = params.locale
  const faqSchema = generateStructuredData('faqPage', { questions: faqContent })
  const howToSchema = generateStructuredData('howTo', {
    name: 'How to measure your face shape',
    description: 'Compare face length with forehead, cheekbone, and jaw width to identify the dominant face-shape pattern.',
    totalTime: 'PT5M',
    steps: measurementSteps.map((step) => ({
      name: `Measure ${step.name.toLowerCase()}`,
      text: `${step.points}. ${step.use}`,
    })),
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              <Ruler className="h-4 w-4" />
              Five-minute measurement guide
            </p>
            <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-950 md:text-5xl">
              How to Measure Your Face Shape
            </h1>
            <p className="mb-6 max-w-3xl text-lg leading-8 text-gray-600">
              Use four relative measurements—face length, forehead, cheekbones, and jaw—to find the
              dominant outline. You do not need perfect millimeters; consistent measuring points and
              a straight-on view matter more.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/${locale}/face-shape-detector`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Use the free detector
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/${locale}/face-shapes`}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Compare all face shapes
              </Link>
            </div>
          </div>

          <aside className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ScanFace className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-950">Before measuring</h2>
            </div>
            <ul className="grid gap-3 text-sm leading-6 text-gray-700">
              {[
                'Pull hair away from the forehead and jaw outline.',
                'Keep your head straight with a neutral expression.',
                'Use a flexible tape for physical measurements.',
                'Take each measurement twice and use the average.',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-green-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold text-gray-950">The four measurements</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {measurementSteps.map((step, index) => (
              <article key={step.name} className="rounded-lg border border-gray-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {index + 1}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-950">{step.name}</h3>
                </div>
                <p className="mb-2 text-sm font-semibold text-gray-800">{step.points}</p>
                <p className="text-sm leading-6 text-gray-600">{step.use}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-5 max-w-3xl">
            <h2 className="mb-3 text-2xl font-bold text-gray-950">Turn measurements into a likely shape</h2>
            <p className="leading-7 text-gray-600">
              Compare which horizontal zone is widest, then add face length and jaw curvature. These
              are descriptive patterns, not universal biological thresholds.
            </p>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <div className="min-w-[850px]">
              <div className="grid grid-cols-[0.75fr_1.2fr_1.35fr] gap-4 bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-700">
                <span>Likely shape</span>
                <span>Dominant proportion</span>
                <span>Confirm with</span>
              </div>
              {[
                ['Oval', 'Moderately longer than wide', 'Balanced widths and a softly tapered jaw'],
                ['Round', 'Width and length are relatively close', 'Curved jaw with no strong corner'],
                ['Square', 'Broad, balanced width', 'Visible jaw corners and straighter outline'],
                ['Heart', 'Forehead wider than jaw', 'Lower face tapers toward a narrow chin'],
                ['Diamond', 'Cheekbones wider than forehead and jaw', 'Outline narrows at temples and chin'],
                ['Oblong', 'Vertical length clearly dominates', 'Straighter sides and similar width zones'],
                ['Triangle', 'Jaw wider than forehead', 'Outline becomes broader toward the bottom'],
              ].map(([shape, proportion, confirmation]) => (
                <div key={shape} className="grid grid-cols-[0.75fr_1.2fr_1.35fr] gap-4 border-t border-gray-200 px-5 py-4 text-sm leading-6">
                  <Link href={`/${locale}/face-shapes/${shape.toLowerCase()}`} className="font-semibold text-blue-700 hover:text-blue-900">{shape}</Link>
                  <span className="text-gray-700">{proportion}</span>
                  <span className="text-gray-600">{confirmation}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-lg border border-amber-200 bg-amber-50 p-6">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-700" />
            <h2 className="text-lg font-semibold text-amber-950">Do not convert photo pixels into physical frame size</h2>
          </div>
          <p className="text-sm leading-7 text-amber-900">
            Photo crop and camera distance change pixel measurements. Without a known physical
            reference such as pupillary distance or a calibration object, a browser photo cannot
            reliably tell you that you need a specific frame width in millimeters.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold text-gray-950">Face measurement FAQ</h2>
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
