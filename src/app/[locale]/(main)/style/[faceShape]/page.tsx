import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle2, Glasses, ScanFace } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'
import {
  generateCollectionPageSchema,
  generateFaceShapeSlug,
  slugify,
  unslugify,
} from '@/lib/programmatic-seo'

interface FaceShapePageProps {
  params: {
    locale: string
    faceShape: string
  }
}

const faceShapeGuides = {
  'round-face': {
    name: 'round',
    displayName: 'Round',
    title: 'Best Glasses for Round Face Shapes',
    description:
      'Round faces usually have softer curves, fuller cheeks, and similar face width and length. Angular glasses can add definition and create a more balanced look.',
    characteristics: 'Soft cheeks, curved jawline, rounded chin, and less visible angles.',
    tryFirst: ['Rectangular frames', 'Square frames', 'Geometric frames', 'Slightly wider frames'],
    avoidFirst: ['Very small round frames', 'Tiny rimless frames', 'Frames much narrower than your face'],
    whyItWorks:
      'Straight lines and defined corners add contrast to softer proportions, while enough frame width prevents the glasses from looking too small.',
  },
  'square-face': {
    name: 'square',
    displayName: 'Square',
    title: 'Best Glasses for Square Face Shapes',
    description:
      'Square faces often have a broad forehead, strong jawline, and defined angles. Softer frames can reduce visual heaviness and balance the structure.',
    characteristics: 'Strong jawline, broad forehead, angular cheek area, and similar face width and length.',
    tryFirst: ['Round frames', 'Oval frames', 'Thin metal frames', 'Softly curved frames'],
    avoidFirst: ['Heavy square frames', 'Very boxy thick frames', 'Frames that sit too low on the cheeks'],
    whyItWorks:
      'Curved lenses soften angular features and lighter materials keep the frame from competing with a strong jawline.',
  },
  'oval-face': {
    name: 'oval',
    displayName: 'Oval',
    title: 'Best Glasses for Oval Face Shapes',
    description:
      'Oval faces are balanced and flexible, so the best glasses usually come down to scale, width, and personal style.',
    characteristics: 'Balanced proportions, softly rounded jawline, and face length slightly greater than width.',
    tryFirst: ['Balanced rectangular frames', 'Browline frames', 'Aviators', 'Classic square frames'],
    avoidFirst: ['Frames much wider than your face', 'Very narrow frames', 'Oversized frames that cover the eyebrows'],
    whyItWorks:
      'Oval proportions can carry many frame shapes, but the frame should still align with your brow width and facial scale.',
  },
  'heart-face': {
    name: 'heart',
    displayName: 'Heart',
    title: 'Best Glasses for Heart-Shaped Faces',
    description:
      'Heart-shaped faces usually have a wider forehead and a narrower chin. Lightweight or lifted frames can balance the top and bottom of the face.',
    characteristics: 'Wider forehead, narrower chin, and sometimes higher or more prominent cheekbones.',
    tryFirst: ['Lightweight frames', 'Rounded frames', 'Subtle cat-eye frames', 'Bottom-balanced frames'],
    avoidFirst: ['Very top-heavy frames', 'Deep heavy browlines', 'Frames wider than the forehead'],
    whyItWorks:
      'Softer lower edges and lighter top lines keep attention from collecting only at the forehead.',
  },
  'diamond-face': {
    name: 'diamond',
    displayName: 'Diamond',
    title: 'Best Glasses for Diamond Face Shapes',
    description:
      'Diamond faces often have prominent cheekbones with a narrower forehead and chin. Frames that add gentle width near the eyes work well.',
    characteristics: 'Prominent cheekbones, narrower forehead, narrower chin, and angular contours.',
    tryFirst: ['Oval frames', 'Rimless frames', 'Cat-eye frames', 'Browline frames'],
    avoidFirst: ['Very narrow frames', 'Tiny lenses', 'Frames that pinch visually at the cheekbones'],
    whyItWorks:
      'Soft width near the brow balances cheekbones without adding unnecessary weight to the lower face.',
  },
  'oblong-face': {
    name: 'oblong',
    displayName: 'Oblong',
    title: 'Best Glasses for Oblong Face Shapes',
    description:
      'Oblong faces are longer than they are wide. Frames with more depth or presence can balance the vertical proportion.',
    characteristics: 'Longer face length, straighter cheek lines, and often a longer nose or chin area.',
    tryFirst: ['Deep rectangular frames', 'Oversized frames', 'Browline frames', 'Statement frames'],
    avoidFirst: ['Very shallow frames', 'Tiny narrow frames', 'Frames that sit too high and lengthen the face'],
    whyItWorks:
      'More lens depth and visual weight help break up vertical length and make the face feel more balanced.',
  },
} as const

type FaceShapeSlug = keyof typeof faceShapeGuides

function normalizeFaceShapeSlug(slug: string): FaceShapeSlug | null {
  const normalized = slugify(slug)
  if (normalized in faceShapeGuides) return normalized as FaceShapeSlug
  if (normalized === 'round') return 'round-face'
  if (normalized === 'square') return 'square-face'
  if (normalized === 'oval') return 'oval-face'
  if (normalized === 'heart' || normalized === 'heart-shaped-face') return 'heart-face'
  if (normalized === 'diamond') return 'diamond-face'
  if (normalized === 'oblong' || normalized === 'long-face') return 'oblong-face'
  return null
}

function getDbNameCandidates(slug: string, fallback?: { name: string; displayName: string }) {
  return Array.from(new Set([
    fallback?.name,
    fallback?.displayName,
    unslugify(slug),
    unslugify(slug).replace(/ Face$/i, ''),
  ].filter(Boolean))) as string[]
}

async function getDbShape(candidates: string[]) {
  try {
    return await prisma.faceShape.findFirst({
      where: {
        OR: candidates.map((candidate) => ({
          name: { equals: candidate, mode: 'insensitive' as const },
        })),
      },
    })
  } catch {
    return null
  }
}

async function getRecommendedFrames(candidates: string[]) {
  try {
    return await prisma.glassesFrame.findMany({
      where: {
        isActive: true,
        faceShapes: {
          some: {
            faceShape: {
              OR: candidates.map((candidate) => ({
                name: { equals: candidate, mode: 'insensitive' as const },
              })),
            },
          },
        },
      },
      take: 12,
    })
  } catch {
    return []
  }
}

export async function generateStaticParams() {
  const fallbackParams = Object.keys(faceShapeGuides).map((faceShape) => ({ faceShape }))
  const enabled = process.env.PROGRAMMATIC_SEO_ENABLED === 'true'

  if (!enabled) return fallbackParams

  try {
    const shapes = await prisma.faceShape.findMany({
      select: { name: true },
    })
    const dbParams = shapes.map((shape) => ({
      faceShape: normalizeFaceShapeSlug(generateFaceShapeSlug(shape.name)) || generateFaceShapeSlug(shape.name),
    }))
    const unique = new Map([...fallbackParams, ...dbParams].map((param) => [param.faceShape, param]))
    return Array.from(unique.values())
  } catch {
    return fallbackParams
  }
}

export const dynamicParams = true
export const revalidate = 3600

export async function generateMetadata({ params }: FaceShapePageProps): Promise<Metadata> {
  const normalizedSlug = normalizeFaceShapeSlug(params.faceShape)
  if (!normalizedSlug) {
    return {
      title: 'Face Shape Not Found',
      description: 'The face shape you are looking for does not exist.',
    }
  }

  const guide = faceShapeGuides[normalizedSlug]

  return generateI18nSEO({
    locale: params.locale as Locale,
    title: `${guide.title} | Style Guide and AI Try-On`,
    description: `${guide.description} Use VisuTry to analyze your face shape and try recommended glasses on your own photo.`,
    pathname: `/style/${normalizedSlug}`,
  })
}

export default async function FaceShapePage({ params }: FaceShapePageProps) {
  const normalizedSlug = normalizeFaceShapeSlug(params.faceShape)
  if (!normalizedSlug) notFound()

  const guide = faceShapeGuides[normalizedSlug]
  const candidates = getDbNameCandidates(params.faceShape, guide)
  const [dbShape, frames] = await Promise.all([
    getDbShape(candidates),
    getRecommendedFrames(candidates),
  ])
  const locale = params.locale
  const displayName = dbShape?.displayName?.replace(/\s+Face$/i, '') || guide.displayName
  const description = dbShape?.description || guide.description
  const characteristics = dbShape?.characteristics || guide.characteristics
  const pageUrl = `/${locale}/style/${normalizedSlug}`
  const canonicalPath = `/style/${normalizedSlug}`

  const faqContent = [
    {
      question: `What glasses are best for a ${displayName.toLowerCase()} face?`,
      answer: `${guide.tryFirst.join(', ')} are strong starting points for a ${displayName.toLowerCase()} face. The final choice should be checked with virtual try-on because frame width, color, and lens depth also matter.`,
    },
    {
      question: `Should ${displayName.toLowerCase()} faces avoid any glasses?`,
      answer: `${guide.avoidFirst.join(', ')} are usually weaker first choices. They can still work on some people, but they should be validated on your own photo before buying.`,
    },
    {
      question: 'Can AI help me choose glasses for my face shape?',
      answer: 'Yes. AI face analysis can estimate your face shape and turn it into a frame shortlist. VisuTry then lets you try recommended glasses styles on your own photo.',
    },
  ]
  const faqSchema = generateStructuredData('faqPage', { questions: faqContent })
  const collectionSchema = generateCollectionPageSchema({
    name: `${displayName} Face Glasses`,
    description,
    url: `https://visutry.com${pageUrl}`,
    itemCount: frames.length,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <Link href={`/${locale}`} className="hover:text-gray-900">
            Home
          </Link>
          <span>/</span>
          <Link href={`/${locale}/glasses-for-face-shape`} className="hover:text-gray-900">
            Glasses for face shape
          </Link>
          <span>/</span>
          <span className="text-gray-900">{displayName} face</span>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex rounded-lg border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700">
              Face-shape glasses guide
            </p>
            <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-950 md:text-5xl">
              Best Glasses for {displayName} Face Shapes
            </h1>
            <p className="mb-6 text-lg leading-8 text-gray-600">{description}</p>
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

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ScanFace className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-950">{displayName} face characteristics</h2>
            </div>
            <p className="mb-5 text-sm leading-6 text-gray-600">{characteristics}</p>
            <div className="rounded-lg bg-blue-50 p-4 text-sm leading-6 text-blue-900">
              Face shape is the first filter. Virtual try-on is the visual check that shows whether
              the frame scale, color, and style actually work on your photo.
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-5 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <Glasses className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-950">Try first</h2>
            </div>
            <ul className="grid gap-2 text-sm text-gray-700">
              {guide.tryFirst.map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-semibold text-gray-950">Avoid as a first filter</h2>
            <ul className="grid gap-2 text-sm text-gray-700">
              {guide.avoidFirst.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-semibold text-gray-950">Why it works</h2>
            <p className="text-sm leading-6 text-gray-600">{guide.whyItWorks}</p>
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-normal text-blue-600">
                Recommended frames
              </p>
              <h2 className="text-2xl font-bold text-gray-950">
                Glasses to try for {displayName.toLowerCase()} faces
              </h2>
            </div>
            <Link href={`/${locale}/try-on/glasses`} className="text-sm font-semibold text-blue-700 hover:text-blue-900">
              Try any glasses on your photo
            </Link>
          </div>

          {frames.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {frames.map((frame) => (
                <Link
                  key={frame.id}
                  href={`/${locale}/try/${slugify(frame.brand || '')}-${slugify(frame.model || frame.id)}`}
                  className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-lg"
                >
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    {/* Frame catalogs may include mixed remote hosts, so keep this page resilient. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={frame.imageUrl}
                      alt={frame.name}
                      width={360}
                      height={240}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-950 group-hover:text-blue-700">{frame.name}</h3>
                    <p className="mt-1 text-sm text-gray-600">{frame.brand}</p>
                    {frame.price && (
                      <p className="mt-2 text-lg font-bold text-gray-950">${frame.price}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="mb-2 text-lg font-semibold text-gray-950">
                No saved frames for this face shape yet
              </h3>
              <p className="mb-5 max-w-3xl text-sm leading-6 text-gray-600">
                You can still use the recommendations above as your first filter. Start with AI
                face analysis, then try glasses styles on your own photo to check the real fit.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/${locale}/face-analysis`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Analyze my face
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/${locale}/glasses-for-face-shape`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Compare all face shapes
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </section>

        <section className="mt-12 rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-normal text-blue-600">
                AI shopping workflow
              </p>
              <h2 className="text-2xl font-bold text-gray-950">
                From {displayName.toLowerCase()} face guide to virtual try-on
              </h2>
            </div>
            <Link
              href={`/${locale}/face-analysis`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Start face analysis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              'Use the face-shape guide to narrow the first frame shapes.',
              'Upload a photo for AI face analysis and personalized recommendations.',
              'Try glasses on your photo to confirm scale, color, and style.',
            ].map((item) => (
              <div key={item} className="rounded-lg border border-gray-200 p-5">
                <p className="text-sm leading-6 text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold text-gray-950">
            {displayName} face glasses FAQ
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {faqContent.map((item) => (
              <div key={item.question} className="rounded-lg border border-gray-200 bg-white p-5">
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
