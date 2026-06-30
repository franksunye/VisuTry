import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, Eye, Glasses, ScanFace, ShieldCheck } from 'lucide-react'
import { FaceAnalysisFunnelCTA } from '@/components/blog/FaceAnalysisFunnelCTA'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'

const title = 'AI Face Shape Detector for Glasses - Which Glasses Suit My Face?'
const description = 'Use AI face shape detection to find which glasses suit your face, shortlist frame styles, and move from face analysis to virtual try-on.'
const coverImage = '/blog-covers/face-shape-guide.jpg'
const publishedAt = '2026-06-08T10:00:00Z'
const modifiedAt = '2026-06-24T05:45:00Z'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return generateI18nSEO({
    locale: params.locale as any,
    title,
    description,
    image: coverImage,
    pathname: '/blog/ai-face-analysis-for-glasses-guide',
    type: 'article',
  })
}

const structuredData = generateStructuredData('article', {
  title,
  description,
  publishedAt,
  modifiedAt,
  author: 'VisuTry Team',
  image: coverImage,
})

const faceShapeTips = [
  {
    shape: 'Round face',
    best: 'Angular, rectangular, square, and slightly wider frames.',
    why: 'Straight lines can add definition and make the face feel more balanced.',
  },
  {
    shape: 'Square face',
    best: 'Round, oval, thinner metal, and softly curved frames.',
    why: 'Curves can soften a strong jawline and reduce visual heaviness.',
  },
  {
    shape: 'Oval face',
    best: 'Most styles work well, especially balanced rectangular or browline frames.',
    why: 'Oval faces usually have flexible proportions, so fit and personal style matter most.',
  },
  {
    shape: 'Heart face',
    best: 'Lightweight, rounded, cat-eye, or bottom-balanced frames.',
    why: 'These can balance a wider forehead with a narrower chin.',
  },
  {
    shape: 'Diamond face',
    best: 'Oval, rimless, browline, and gently upswept frames.',
    why: 'The goal is to highlight cheekbones without making the temples feel too wide.',
  },
  {
    shape: 'Oblong face',
    best: 'Taller, wider, and deeper frames with visible structure.',
    why: 'More frame height can make a longer face look more proportionate.',
  },
  {
    shape: 'Triangle face',
    best: 'Browline, cat-eye, and top-accent frames.',
    why: 'More visual weight near the brow can balance a broader jaw.',
  },
]

const workflowSteps = [
  {
    icon: ScanFace,
    title: 'Start with face shape',
    body: 'AI face analysis gives you a starting point: face shape, key features, and frame styles that are likely to work.',
  },
  {
    icon: Glasses,
    title: 'Shortlist frame styles',
    body: 'Use the recommendations to narrow the search before comparing dozens of product photos.',
  },
  {
    icon: Eye,
    title: 'Validate with try-on',
    body: 'Virtual try-on shows how the shortlist actually looks on your own photo, including scale and style balance.',
  },
]

export default function BlogPostPage({ params }: { params: { locale: string } }) {
  const localePrefix = `/${params.locale}`
  const faqSchema = generateStructuredData('faqPage', {
    questions: [
      {
        question: 'What is AI face analysis for glasses?',
        answer: 'AI face analysis for glasses uses a photo to estimate your face shape and visible facial features, then suggests frame styles that may suit your proportions.',
      },
      {
        question: 'Can AI tell which glasses fit my face?',
        answer: 'AI can help narrow down frame shapes and styles, but it should be combined with virtual try-on, measurements, comfort, and your personal taste.',
      },
      {
        question: 'Should I choose glasses by face shape or virtual try-on result?',
        answer: 'Use face shape as the starting point and virtual try-on as the final visual check. The best choice usually comes from both signals together.',
      },
    ],
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <main className="container mx-auto px-4 py-12">
          <div className="mb-6">
            <Breadcrumbs
              items={[
                { name: 'Blog', url: `${localePrefix}/blog` },
                { name: 'AI Face Analysis for Glasses' },
              ]}
            />
          </div>

          <article className="mx-auto max-w-4xl overflow-hidden rounded-lg bg-white shadow-lg">
            <div className="relative h-72 w-full overflow-hidden md:h-96">
              <Image
                src={coverImage}
                alt="Face shape guide for choosing glasses with AI analysis"
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="border-b p-8">
              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span>VisuTry Team</span>
                <span>Published Jun 8, 2026</span>
                <span>8 min read</span>
              </div>
              <h1 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
                AI Face Shape Detector for Glasses: Which Glasses Suit My Face?
              </h1>
              <p className="text-xl text-gray-600">
                Choosing glasses online gets much easier when you know your face shape first.
                AI face analysis can turn one photo into a practical frame shortlist, then
                virtual try-on helps you see which styles actually feel like you.
              </p>
            </div>

            <div className="prose prose-lg max-w-none p-8">
              <p>
                Most glasses guides start with the same advice: find your face shape, then pick
                frames that balance it. That advice is useful, but it can be hard to apply when
                you are judging your own face in a mirror or comparing yourself with generic
                diagrams.
              </p>

              <p>
                AI face analysis makes the first step clearer. Instead of guessing whether your
                face is round, square, oval, heart, diamond, oblong, or triangle, you can upload a
                clear photo and get a structured result with a confidence score, key features, and
                personalized frame guidance.
              </p>

              <p>
                If you came here searching for an <Link href={`${localePrefix}/face-shape-detector`}>AI face shape detector for glasses</Link>,
                start with the free detector first, then return to this guide to understand
                why each frame direction may suit your face.
              </p>

              <FaceAnalysisFunnelCTA
                locale={params.locale}
                title="Turn face shape advice into a try-on shortlist"
                body="Start with one portrait, get frame directions, then test the recommended styles on your own photo instead of browsing hundreds of frames cold."
                tone="light"
              />

              <div className="not-prose my-8 grid gap-4 md:grid-cols-3">
                {workflowSteps.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="rounded-lg border border-gray-200 p-5">
                      <Icon className="mb-3 h-6 w-6 text-blue-600" />
                      <h2 className="mb-2 text-lg font-bold text-gray-900">{item.title}</h2>
                      <p className="text-sm text-gray-600">{item.body}</p>
                    </div>
                  )
                })}
              </div>

              <h2>What AI face analysis can tell you</h2>
              <p>
                A good face analysis result should be practical, not mysterious. For eyewear, the
                most useful signals are:
              </p>
              <ul>
                <li><strong>Estimated face shape:</strong> the closest match among common eyewear categories.</li>
                <li><strong>Confidence score:</strong> how certain the AI is about the estimate.</li>
                <li><strong>Key features:</strong> visible traits such as jaw softness, forehead width, or cheekbone prominence.</li>
                <li><strong>Best frame directions:</strong> styles worth trying first.</li>
                <li><strong>Frames to avoid:</strong> styles that may exaggerate proportions you want to balance.</li>
              </ul>

              <p>
                It is also important to be honest about limits. AI face analysis is style guidance,
                not medical advice, and it does not replace optical measurements, prescription
                details, or comfort testing. Think of it as a smarter starting point for shopping.
              </p>

              <h2>Best glasses by face shape</h2>
              <p>
                These rules are not absolute. They work best as a first shortlist before you use
                virtual try-on to compare real frames.
              </p>

              <div className="not-prose my-6 overflow-x-auto rounded-lg border border-gray-200">
                <div className="min-w-[720px]">
                  <div className="grid grid-cols-[1fr_1.4fr_1.4fr] bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
                    <span>Face shape</span>
                    <span>Try first</span>
                    <span>Why it works</span>
                  </div>
                  {faceShapeTips.map((tip) => (
                    <div
                      key={tip.shape}
                      className="grid grid-cols-[1fr_1.4fr_1.4fr] gap-3 border-t border-gray-200 px-4 py-4 text-sm"
                    >
                      <span className="font-semibold text-gray-900">{tip.shape}</span>
                      <span className="text-gray-700">{tip.best}</span>
                      <span className="text-gray-600">{tip.why}</span>
                    </div>
                  ))}
                </div>
              </div>

              <h2>How to use AI analysis and virtual try-on together</h2>
              <p>
                Face analysis answers the first question: which styles are worth your attention?
                Virtual try-on answers the second question: how do those styles look on your own
                face?
              </p>

              <ol>
                <li><strong>Run a face analysis</strong> with a clear, front-facing photo.</li>
                <li><strong>Save the recommended frame shapes</strong> from the report.</li>
                <li><strong>Try on at least five frames</strong> across the recommended styles.</li>
                <li><strong>Compare scale, balance, and personality</strong>, not just whether the frame technically matches your face shape.</li>
                <li><strong>Check real-world details</strong> such as frame measurements, bridge fit, prescription lens options, and return policy before buying.</li>
              </ol>

              <FaceAnalysisFunnelCTA locale={params.locale} />

              <h2>Quick answers for shoppers comparing AI glasses tools</h2>
              <p>
                Search results for glasses face-shape tools often promise a scan, a frame advisor,
                or a virtual mirror. The useful question is not which label sounds most advanced,
                but whether the workflow moves you from analysis to a smaller set of frames you
                can actually evaluate.
              </p>
              <ul>
                <li><strong>If you do not know your face shape:</strong> start with the <Link href={`${localePrefix}/face-shape-detector`}>free Face Shape Detector</Link>.</li>
                <li><strong>If you do not know which glasses suit your face:</strong> use the <Link href={`${localePrefix}/face-analysis`}>AI Glasses Advisor</Link> to get a personalized shortlist.</li>
                <li><strong>If you already know your face shape:</strong> compare recommended styles in the <Link href={`${localePrefix}/glasses-for-face-shape`}>glasses for face shape guide</Link>.</li>
                <li><strong>If you already have frames in mind:</strong> go straight to <Link href={`${localePrefix}/try-on/glasses`}>virtual glasses try-on</Link>.</li>
              </ul>

              <h2>What to look for in the try-on result</h2>
              <p>
                Once you have a shortlist, the best frame is not always the one that follows the
                face-shape rule most perfectly. Look for these practical signs:
              </p>
              <ul>
                <li><strong>Eyebrow balance:</strong> the top of the frame should usually sit near, not far below, your brow line.</li>
                <li><strong>Cheek clearance:</strong> frames should not visually crowd your cheeks when you smile.</li>
                <li><strong>Width:</strong> the frame should feel close to your face width instead of pinching inward or stretching outward.</li>
                <li><strong>Style signal:</strong> the frame should match the version of yourself you want to present.</li>
              </ul>

              <h2>FAQ</h2>
              <h3>What is AI face analysis for glasses?</h3>
              <p>
                AI face analysis for glasses uses a photo to estimate your face shape and visible
                facial features. The result can help you choose frame shapes that are more likely
                to balance your proportions.
              </p>

              <h3>Can AI tell which glasses fit my face?</h3>
              <p>
                AI can narrow down good frame directions, but it should not be the only signal.
                Use it with virtual try-on, frame measurements, comfort needs, and your own taste.
              </p>

              <h3>Should I choose glasses by face shape or try-on result?</h3>
              <p>
                Use face shape as the starting point and the try-on result as the visual check.
                If a frame breaks the rule but looks balanced and feels like you, it may still be
                the right choice.
              </p>

              <div className="not-prose my-8 rounded-lg border border-green-200 bg-green-50 p-6">
                <div className="mb-4 flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-green-700" />
                  <h2 className="text-xl font-bold text-green-950">A practical final checklist</h2>
                </div>
                <ul className="space-y-3 text-green-900">
                  <li className="flex gap-2"><CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0" /> Know your face shape before browsing hundreds of frames.</li>
                  <li className="flex gap-2"><CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0" /> Try several recommended styles, not just one pair.</li>
                  <li className="flex gap-2"><CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0" /> Compare the try-on result with frame measurements and lens needs.</li>
                  <li className="flex gap-2"><CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0" /> Choose the pair that looks balanced and feels natural for your style.</li>
                </ul>
              </div>

              <p>
                For a broader shopping workflow, read our{' '}
                <Link href={`${localePrefix}/blog/prescription-glasses-virtual-tryon-guide`}>
                  prescription glasses virtual try-on guide
                </Link>
                {' '}or start directly with{' '}
                <Link href={`${localePrefix}/face-shape-detector`}>the free Face Shape Detector</Link>.
              </p>
            </div>
          </article>
        </main>
      </div>
    </>
  )
}
