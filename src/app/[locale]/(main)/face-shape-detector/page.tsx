import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, LockKeyhole, ScanFace, ShieldCheck } from 'lucide-react'
import { FreeFaceShapeDetector } from '@/components/face-shape/FreeFaceShapeDetector'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'

interface FaceShapeDetectorPageProps {
  params: { locale: string }
}

const faqContent = [
  {
    question: 'Is this face shape detector free?',
    answer: 'Yes. The on-device face-shape estimate does not require an account, credits, or a server-side AI request.',
  },
  {
    question: 'Is my photo uploaded or stored?',
    answer: 'No. This free tool reads the selected image in browser memory and runs MediaPipe locally. The model files are downloaded from a public CDN, but the photo is not sent to VisuTry by this detector.',
  },
  {
    question: 'How accurate is an online face shape detector?',
    answer: 'Results depend on pose, crop, lighting, hair coverage, and whether your proportions sit between categories. Treat the output as a styling estimate and compare the measurement explanation before using it.',
  },
  {
    question: 'What photo works best?',
    answer: 'Use one centered, straight-on face with level eyes, a neutral expression, even lighting, and the forehead and jaw visible.',
  },
]

export async function generateMetadata({ params }: FaceShapeDetectorPageProps): Promise<Metadata> {
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: 'Free Face Shape Detector: Private, On-Device Test',
    description: 'Upload one photo to estimate your face shape for free. Processing runs in your browser with no login, no credits, and no photo upload to VisuTry.',
    pathname: '/face-shape-detector',
  })
}

export default function FaceShapeDetectorPage({ params }: FaceShapeDetectorPageProps) {
  const locale = params.locale
  const faqSchema = generateStructuredData('faqPage', { questions: faqContent })
  const appSchema = generateStructuredData('softwareApplication', {
    name: 'VisuTry Free Face Shape Detector',
    url: `https://www.visutry.com/${locale}/face-shape-detector`,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web Browser',
    description: 'A free on-device face-shape estimate based on MediaPipe landmarks and geometric proportions.',
    featureList: [
      'No login or credits required',
      'Photo processed in browser memory',
      'Seven face-shape categories',
      'Input quality and pose checks',
    ],
  })
  const howToSchema = generateStructuredData('howTo', {
    name: 'How to use the free face shape detector',
    description: 'Choose one clear front-facing photo, let the browser measure facial proportions, and review the likely shape and styling guides.',
    totalTime: 'PT1M',
    steps: [
      { name: 'Choose a photo', text: 'Select a JPG, PNG, or WebP with one straight-on face.' },
      { name: 'Run local analysis', text: 'The browser maps facial landmarks and checks pose and image quality.' },
      { name: 'Review the estimate', text: 'Read the likely shape, measured signals, and related glasses or hairstyle guides.' },
    ],
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <main className="bg-gradient-to-b from-blue-50 via-white to-white">
        <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="mx-auto mb-9 max-w-4xl text-center">
            <p className="mb-3 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700 shadow-sm">
              <ScanFace className="h-4 w-4" />
              Free · No login · On-device
            </p>
            <h1 className="mb-4 text-4xl font-bold leading-tight text-gray-950 md:text-6xl">
              Free Face Shape Detector
            </h1>
            <p className="mx-auto max-w-3xl text-lg leading-8 text-gray-600">
              Estimate whether your face is oval, round, square, heart, diamond, oblong, or
              triangle. Your photo stays in this browser and the free result uses no Gemini request.
            </p>
          </div>

          <FreeFaceShapeDetector locale={locale} />

          <section className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { icon: LockKeyhole, title: 'Photo stays local', text: 'The selected image is not submitted to VisuTry by this free detector.' },
              { icon: ScanFace, title: 'Geometry-based estimate', text: 'MediaPipe landmarks are converted into aspect-corrected facial proportions.' },
              { icon: ShieldCheck, title: 'Honest result language', text: 'Quality describes the photo—not a guaranteed probability of being correct.' },
            ].map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-lg border border-gray-200 bg-white p-5">
                <Icon className="mb-3 h-5 w-5 text-blue-600" />
                <h2 className="mb-2 font-semibold text-gray-950">{title}</h2>
                <p className="text-sm leading-6 text-gray-600">{text}</p>
              </article>
            ))}
          </section>

          <section className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-2xl font-bold text-gray-950">For the clearest result</h2>
              <ul className="grid gap-3 text-sm leading-6 text-gray-700">
                {[
                  'Use one face with a neutral expression.',
                  'Keep both eyes level and look directly at the camera.',
                  'Pull hair away from the forehead and jaw when possible.',
                  'Avoid strong shadows, beauty filters, and wide-angle distortion.',
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-green-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-lg border border-gray-200 bg-gray-50 p-6">
              <h2 className="mb-3 text-2xl font-bold text-gray-950">Prefer to check manually?</h2>
              <p className="mb-5 text-sm leading-6 text-gray-600">
                Measure face length, forehead, cheekbones, and jaw, then compare the seven common
                outline patterns without uploading a photo anywhere.
              </p>
              <Link href={`/${locale}/face-shape-measurement`} className="inline-flex items-center gap-2 font-semibold text-blue-700 hover:text-blue-900">
                Open the measurement guide <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          </section>

          <section className="mt-12">
            <h2 className="mb-5 text-2xl font-bold text-gray-950">Free face shape detector FAQ</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {faqContent.map((item) => (
                <article key={item.question} className="rounded-lg border border-gray-200 bg-white p-5">
                  <h3 className="mb-2 font-semibold text-gray-950">{item.question}</h3>
                  <p className="text-sm leading-6 text-gray-600">{item.answer}</p>
                </article>
              ))}
            </div>
          </section>
        </section>
      </main>
    </>
  )
}
