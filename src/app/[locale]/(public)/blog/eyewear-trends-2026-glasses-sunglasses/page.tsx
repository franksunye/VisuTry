import { Metadata } from 'next'
import Image from 'next/image'
import { blogArt } from '@/config/blog-art'
import Link from '@/components/layout/PublicLink'
import {
  ArrowRight,
  Briefcase as BriefcaseBusiness,
  CheckCircle2,
  Glasses,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { generateI18nSEO, generateStructuredData, SITE_CONFIG } from '@/lib/seo'

export const dynamic = 'force-static'

const title = 'Eyewear Trends 2026: 16 Glasses and Sunglasses Styles to Try'
const description =
  'Compare 16 optical and sunglass styles in the VisuTry catalog, with examples from 2026 collections and photos to help you shortlist a shape.'
const cover = blogArt['eyewear-trends-2026-glasses-sunglasses']
const publishedAt = '2026-07-20T10:00:00Z'
const modifiedAt = '2026-11-16T00:00:00Z'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return generateI18nSEO({
    locale: params.locale as any,
    title,
    description,
    image: cover.src,
    imageAlt: cover.alt,
    imageWidth: cover.width,
    imageHeight: cover.height,
    pathname: '/blog/eyewear-trends-2026-glasses-sunglasses',
    type: 'article',
  })
}

const structuredData = generateStructuredData('article', {
  title,
  description,
  publishedAt,
  modifiedAt,
  author: 'VisuTry Team',
  image: `${SITE_CONFIG.url}${cover.src}`,
})

type FrameStyle = {
  id: string
  name: string
  category: 'Optical' | 'Sunglasses'
  image: string
  signal: string
  bestFor: string
  intensity: 1 | 2 | 3 | 4 | 5
  tags: string[]
}

const groups: Array<{
  id: string
  title: string
  intro: string
  frames: FrameStyle[]
}> = [
  {
    id: 'timeless-classics',
    title: 'Timeless classics, updated',
    intro:
      'These shapes remain useful because they are easy to understand, easy to style, and flexible across work and everyday settings. Compare finish, lens color and scale within the same silhouette.',
    frames: [
      {
        id: 'sun-wayfarer-black',
        name: 'Classic Black Wayfarer',
        category: 'Sunglasses',
        image: '/assets/glasses-presets/style-explorer/sun-wayfarer-black.jpg',
        signal: 'Direct, versatile, and quietly confident.',
        bestFor: 'Everyday wear, travel, casual tailoring, and a first serious pair of sunglasses.',
        intensity: 3,
        tags: ['Classic', 'Everyday', 'Versatile'],
      },
      {
        id: 'sun-aviator-gold',
        name: 'Gold Aviator',
        category: 'Sunglasses',
        image: '/assets/glasses-presets/style-explorer/sun-aviator-gold.jpg',
        signal: 'Relaxed confidence with a recognizable vintage reference.',
        bestFor: 'Travel, outdoor use, casual looks, and users who prefer metal over acetate.',
        intensity: 3,
        tags: ['Classic', 'Vacation', 'Metal'],
      },
      {
        id: 'optical-warm-tortoise',
        name: 'Warm Tortoise Acetate',
        category: 'Optical',
        image: '/assets/glasses-presets/style-explorer/optical-warm-tortoise.jpg',
        signal: 'Approachable, warm, and more dimensional than a plain black frame.',
        bestFor: 'Work, everyday wear, and users moving from utility frames into personal style.',
        intensity: 3,
        tags: ['Classic', 'Professional', 'Warm'],
      },
      {
        id: 'optical-slim-browline',
        name: 'Slim Browline',
        category: 'Optical',
        image: '/assets/glasses-presets/style-explorer/optical-slim-browline.jpg',
        signal: 'Structured and capable without the weight of a traditional heavy browline.',
        bestFor: 'Work, presentations, smart casual outfits, and confident professional looks.',
        intensity: 3,
        tags: ['Professional', 'Classic', 'Confident'],
      },
    ],
  },
  {
    id: 'modern-minimal',
    title: 'Modern minimal and barely-there frames',
    intro:
      'Minimal eyewear is not simply “less frame.” The strongest versions use proportion, finish, and lens shape carefully, creating a refined look without making the glasses disappear completely.',
    frames: [
      {
        id: 'optical-thin-gold-oval',
        name: 'Thin Gold Metal Oval',
        category: 'Optical',
        image: '/assets/glasses-presets/style-explorer/optical-thin-gold-oval.jpg',
        signal: 'Light, polished, and quietly refined.',
        bestFor: 'Work, everyday use, minimal wardrobes, and people who dislike heavy frames.',
        intensity: 2,
        tags: ['Minimal', 'Professional', 'Refined'],
      },
      {
        id: 'optical-clear-soft-square',
        name: 'Clear Soft Square',
        category: 'Optical',
        image: '/assets/glasses-presets/style-explorer/optical-clear-soft-square.jpg',
        signal: 'Clean and contemporary with a softer visual footprint than black acetate.',
        bestFor: 'Everyday wear, creative offices, neutral wardrobes, and a safe first style experiment.',
        intensity: 2,
        tags: ['Minimal', 'Clean', 'Everyday'],
      },
      {
        id: 'optical-rimless-geometric',
        name: 'Rimless Geometric',
        category: 'Optical',
        image: '/assets/glasses-presets/style-explorer/optical-rimless-geometric.jpg',
        signal: 'Precise, technical, and nearly weightless.',
        bestFor: 'Professional settings, modern minimal looks, and users who want shape without a visible rim.',
        intensity: 1,
        tags: ['Minimal', 'Technical', 'Professional'],
      },
      {
        id: 'optical-slim-black-oval',
        name: 'Slim Black Oval',
        category: 'Optical',
        image: '/assets/glasses-presets/style-explorer/optical-slim-black-oval.jpg',
        signal: 'A cool 1990s reference with an intellectual, fashion-aware edge.',
        bestFor: 'Work, understated fashion, monochrome wardrobes, and users exploring smaller lenses.',
        intensity: 2,
        tags: ['Minimal', '90s', 'Classic'],
      },
    ],
  },
  {
    id: 'bold-statements',
    title: 'Bold statements and expressive optical frames',
    intro:
      'Statement eyewear changes the hierarchy of an outfit: the glasses become one of the first things people notice. The key is not to choose the loudest frame, but to choose a frame whose visual weight matches the identity you want to project.',
    frames: [
      {
        id: 'sun-cat-eye-black',
        name: 'Black Cat-Eye',
        category: 'Sunglasses',
        image: '/assets/glasses-presets/style-explorer/sun-cat-eye-black.jpg',
        signal: 'Elegant, directional, and deliberately expressive.',
        bestFor: 'Events, weekends, travel, and users who want an upswept silhouette.',
        intensity: 4,
        tags: ['Bold', 'Creative', 'Elegant'],
      },
      {
        id: 'sun-oversized-gradient',
        name: 'Oversized Gradient',
        category: 'Sunglasses',
        image: '/assets/glasses-presets/style-explorer/sun-oversized-gradient.jpg',
        signal: 'Glamorous, protective, and intentionally visible.',
        bestFor: 'Vacation, strong outerwear, large-scale accessories, and high-impact looks.',
        intensity: 5,
        tags: ['Bold', 'Vacation', 'Glamour'],
      },
      {
        id: 'optical-transparent-geometric',
        name: 'Transparent Geometric',
        category: 'Optical',
        image: '/assets/glasses-presets/style-explorer/optical-transparent-geometric.jpg',
        signal: 'Modern and creative without relying on dark color or heavy thickness.',
        bestFor: 'Creative work, weekends, design-led wardrobes, and a noticeable but wearable update.',
        intensity: 3,
        tags: ['Creative', 'Modern', 'Geometric'],
      },
      {
        id: 'optical-statement-color',
        name: 'Statement Color Optical',
        category: 'Optical',
        image: '/assets/glasses-presets/style-explorer/optical-statement-color.jpg',
        signal: 'Individual, expressive, and intentionally less neutral.',
        bestFor: 'Creative settings, weekends, social occasions, and users ready to make color part of their identity.',
        intensity: 5,
        tags: ['Bold', 'Color', 'Creative'],
      },
    ],
  },
  {
    id: 'sport-future-retro',
    title: 'Sport, future, and retro revival',
    intro:
      'Compare a shield that curves around the face, a straight flat top, a narrow rectangle and a rounded tortoise frame. Watch where each outer corner ends relative to your cheek.',
    frames: [
      {
        id: 'sun-shield-wraparound-black',
        name: 'Shield Wraparound',
        category: 'Sunglasses',
        image: '/assets/glasses-presets/style-explorer/sun-shield-wraparound-black.jpg',
        signal: 'Sporty, futuristic, and built to become the focal accessory.',
        bestFor: 'Outdoor looks, travel, streetwear, and users who want a high-energy style shift.',
        intensity: 5,
        tags: ['Sport', 'Future', 'Bold'],
      },
      {
        id: 'sun-curved-flat-top-black',
        name: 'Curved Flat-Top',
        category: 'Sunglasses',
        image: '/assets/glasses-presets/style-explorer/sun-curved-flat-top-black.jpg',
        signal: 'Architectural, controlled, and strongly modern.',
        bestFor: 'Minimal outfits that need one strong accessory, weekends, and fashion-forward styling.',
        intensity: 5,
        tags: ['Architectural', 'Bold', 'Modern'],
      },
      {
        id: 'sun-narrow-rectangle-black',
        name: 'Narrow Rectangle Sunglasses',
        category: 'Sunglasses',
        image: '/assets/glasses-presets/style-explorer/sun-narrow-rectangle-black.jpg',
        signal: 'Sleek, sharp, and intentionally fashion-led.',
        bestFor: 'Weekend looks, events, Y2K references, and users comfortable with shallow lenses.',
        intensity: 4,
        tags: ['90s', 'Y2K', 'Creative'],
      },
      {
        id: 'sun-round-tortoise',
        name: 'Tortoise Round Sunglasses',
        category: 'Sunglasses',
        image: '/assets/glasses-presets/style-explorer/sun-round-tortoise.jpg',
        signal: 'Warm, relaxed, and vintage without feeling costume-like.',
        bestFor: 'Travel, weekends, casual layers, and users who prefer softer silhouettes.',
        intensity: 3,
        tags: ['Retro', 'Relaxed', 'Vacation'],
      },
    ],
  },
]

const styleIntents = [
  { icon: BriefcaseBusiness, name: 'Professional', picks: 'Slim Browline, Thin Gold Metal Oval, Warm Tortoise Acetate' },
  { icon: ShieldCheck, name: 'Minimal', picks: 'Rimless Geometric, Clear Soft Square, Slim Black Oval' },
  { icon: Glasses, name: 'Classic', picks: 'Black Wayfarer, Gold Aviator, Warm Tortoise Acetate' },
  { icon: Sparkles, name: 'Creative', picks: 'Transparent Geometric, Statement Color, Narrow Rectangle' },
  { icon: Sun, name: 'Bold', picks: 'Shield Wraparound, Curved Flat-Top, Oversized Gradient' },
  { icon: Sun, name: 'Vacation', picks: 'Gold Aviator, Tortoise Round, Black Cat-Eye' },
]

function Intensity({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Style intensity ${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={`h-1.5 w-5 rounded-full ${index < value ? 'bg-blue-600' : 'bg-gray-200'}`}
        />
      ))}
    </div>
  )
}

export default function BlogPostPage({ params }: { params: { locale: string } }) {
  const localePrefix = `/${params.locale}`
  const questions = [
    { question: 'Which frame shapes appeared in 2026 collections?', answer: 'Chanel’s Fall–Winter collection includes shield sunglasses and oval eyeglasses. The October MYKITA and RIMOWA release pairs a slim wraparound shield with a round design.' },
    { question: 'How can I compare a trend with my usual style?', answer: 'Keep a familiar frame as a reference. Compare one new shape on the same portrait and look at the upper rim, lens depth and the space around your cheeks.' },
    { question: 'What changes when a frame is rimless?', answer: 'The lens edge forms the outline, so the lens shape and the position of the bridge and temples are easier to see. Compare the rimless example with a full-rim frame of a similar width.' },
    { question: 'How many frames should I try first?', answer: 'Start with two that differ in one feature. If the outline works for you, try a second color or finish before comparing prices and physical measurements.' },
  ]
  const faqSchema = generateStructuredData('faqPage', {
    questions,
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <main className="container mx-auto px-4 py-12">
          <div className="mb-6">
            <Breadcrumbs
              items={[
                { name: 'Blog', url: `${localePrefix}/blog` },
                { name: 'Eyewear Trends 2026' },
              ]}
            />
          </div>

          <article lang="en" dir="ltr" className="mx-auto max-w-5xl overflow-hidden rounded-xl bg-white shadow-lg">
            <div className="border-b border-gray-100 px-6 py-10 md:px-12 md:py-14">
              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">Eyewear Trends</span>
                <span>VisuTry Team</span>
                <span>Published Jul 20, 2026 · Updated Nov 16, 2026</span>
                <span>12 min read</span>
              </div>
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-gray-950 md:text-5xl">
                16 Eyewear Styles to Try in 2026
              </h1>
              <p className="mt-5 max-w-3xl text-xl leading-8 text-gray-600">
                From dependable classics to shield sunglasses and true rimless geometry, these are
                the frame directions worth understanding before you buy. The goal is not to follow
                every trend—it is to discover which style feels credible on your own face.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`${localePrefix}/style-explorer`}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Explore My Eyewear Style
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Link>
                <Link
                  href={`${localePrefix}/face-shape-detector`}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                >
                  Find My Face Shape
                </Link>
              </div>
            </div>

            <div className="prose prose-lg max-w-none px-6 py-10 md:px-12">
              <p className="lead">
                A shield and a slim oval make very different starting points. In its{' '}
                <a className="text-blue-700 underline" href="https://www.chanel.com/us/eyewear/fall-winter-2026-collection/">Fall–Winter 2026 eyewear collection</a>,
                Chanel shows shield sunglasses and oval optical frames. In October,{' '}
                <a className="text-blue-700 underline" href="https://press.rimowa.com/rimowa-and-mykita-unveil-two-new-eyewear-designs-alongside-a-campaign-fronted-by-nina-hoss-leon-dame/?lang=eng">MYKITA and RIMOWA introduced</a>
                {' '}both a round design and a slim wraparound shield.
              </p>
              <p>
                The 16 images below are VisuTry catalog examples. Use them to compare one feature at a
                time, such as a flat versus curved upper rim, before looking for a specific retail model.
              </p>

              <div className="not-prose my-8 rounded-xl border border-blue-100 bg-blue-50 p-6">
                <h2 className="text-xl font-bold text-gray-950">The useful rule</h2>
                <p className="mt-2 text-gray-700">
                  Face shape helps you narrow the options. Style intent decides what you want the
                  glasses to communicate. Virtual try-on decides whether the result feels right on you.
                </p>
              </div>

              <h2>Choose the message before the frame</h2>
              <p>
                Instead of starting with dozens of product thumbnails, start with the version of
                yourself you want to present. These six directions are broad enough to guide a first
                shortlist without turning style into a rigid personality test.
              </p>

              <div className="not-prose my-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {styleIntents.map((intent) => {
                  const Icon = intent.icon
                  return (
                    <div key={intent.name} className="rounded-xl border border-gray-200 p-5">
                      <Icon className="h-6 w-6 text-blue-600" />
                      <h3 className="mt-3 font-bold text-gray-950">{intent.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-600">Try first: {intent.picks}</p>
                    </div>
                  )
                })}
              </div>

              {groups.map((group, groupIndex) => (
                <section key={group.id} id={group.id} className="scroll-mt-24">
                  <div className="mt-14 border-t border-gray-200 pt-10">
                    <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                      Direction {groupIndex + 1}
                    </p>
                    <h2>{group.title}</h2>
                    <p>{group.intro}</p>
                  </div>

                  <div className="not-prose my-8 grid gap-6 md:grid-cols-2">
                    {group.frames.map((frame) => (
                      <div key={frame.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <div className="relative aspect-[4/3] bg-white">
                          <Image
                            src={frame.image}
                            alt={`${frame.name} ${frame.category.toLowerCase()} front view`}
                            fill
                            className="object-contain p-8"
                            sizes="(min-width: 768px) 420px, 100vw"
                          />
                        </div>
                        <div className="border-t border-gray-100 p-5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-lg font-bold text-gray-950">{frame.name}</h3>
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                              {frame.category}
                            </span>
                          </div>
                          <p className="mt-3 text-sm font-medium text-gray-800">{frame.signal}</p>
                          <p className="mt-2 text-sm leading-6 text-gray-600">
                            <strong className="text-gray-800">Best for:</strong> {frame.bestFor}
                          </p>
                          <div className="mt-4 flex items-center justify-between gap-3">
                            <Intensity value={frame.intensity} />
                            <span className="text-xs text-gray-500">Intensity {frame.intensity}/5</span>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {frame.tags.map((tag) => (
                              <span key={tag} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              <div className="not-prose my-12 rounded-2xl bg-gray-950 p-7 text-white md:p-9">
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-300">From inspiration to evidence</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Turn one style direction into four visible looks</h2>
                <p className="mt-3 max-w-3xl text-gray-300">
                  Style Explorer recommends four visibly different frames from the same style intent,
                  lets you review and adjust the exact selection before generation, then creates every
                  look from the same portrait. Completed results are saved automatically to Dashboard History.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={`${localePrefix}/style-explorer`}
                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    Discover Four Looks
                    <ArrowRight className="ms-2 h-4 w-4" />
                  </Link>
                  <Link
                    href={`${localePrefix}/try-on/glasses/compare`}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-600 px-5 py-3 font-semibold text-white hover:bg-gray-900"
                  >
                    Compare Specific Frames
                  </Link>
                </div>
              </div>

              <h2>How to choose without guessing</h2>
              <ol>
                <li><strong>Define the role:</strong> everyday, work, weekend, outdoor, travel, or event.</li>
                <li><strong>Set the style direction:</strong> professional, minimal, classic, creative, bold, or vacation.</li>
                <li><strong>Choose a useful range:</strong> include one safe option, two directional options, and one stretch option.</li>
                <li><strong>Check visual weight:</strong> thin metal and rimless frames behave differently from thick acetate and shield frames.</li>
                <li><strong>Try the same portrait:</strong> changing the photo makes side-by-side judgment less reliable.</li>
                <li><strong>Verify real-world fit:</strong> frame width, bridge, temples, prescription compatibility, and comfort still matter.</li>
              </ol>

              <h2>What trend coverage cannot decide for you</h2>
              <div className="not-prose my-6 grid gap-4 md:grid-cols-2">
                {[
                  'Whether the bridge sits comfortably on your nose',
                  'Whether the frame width matches your head width',
                  'Whether your prescription works with the lens shape',
                  'Whether the frame clears your cheeks when you smile',
                  'Whether you still like the look after the novelty fades',
                  'Whether the product color matches the listing in real light',
                ].map((item) => (
                  <div key={item} className="flex gap-3 rounded-lg border border-gray-200 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                    <span className="text-sm leading-6 text-gray-700">{item}</span>
                  </div>
                ))}
              </div>

              <h2>Why these 16 frames form a useful exploration catalog</h2>
              <p>
                A useful catalog does not need hundreds of near-duplicates. It needs enough contrast to
                expose meaningful preferences. These 16 styles cover optical and sun categories,
                visual intensity from 1 to 5, metal, acetate, mixed and rimless construction, classic
                and trend-led silhouettes, and settings ranging from work to vacation.
              </p>
              <p>
                They are also designed to complement VisuTry&apos;s existing 16 practical optical presets.
                Start with one style set, save the shapes you like, and check the seller’s dimensions for your final pair.
              </p>

              <h2>FAQ</h2>
              {questions.map(({ question, answer }) => (
                <div key={question} className="mb-5">
                  <h3 className="font-semibold">{question}</h3>
                  <p>{answer}</p>
                </div>
              ))}

              <div className="not-prose mt-12 rounded-xl border border-blue-100 bg-blue-50 p-7 text-center">
                <Glasses className="mx-auto h-8 w-8 text-blue-600" />
                <h2 className="mt-3 text-2xl font-bold text-gray-950">Turn the guide into a real decision</h2>
                <p className="mx-auto mt-3 max-w-2xl text-gray-600">
                  Choose a style intent, review four recommended frames, and generate four comparable
                  looks from the same portrait instead of relying on product photos alone.
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href={`${localePrefix}/style-explorer`}
                    className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    Explore Four Styles on My Photo
                    <ArrowRight className="ms-2 h-4 w-4" />
                  </Link>
                  <Link
                    href={`${localePrefix}/try-on/glasses/compare`}
                    className="inline-flex items-center rounded-lg border border-blue-200 bg-white px-5 py-3 font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    Open Frame Compare
                  </Link>
                </div>
              </div>


            </div>
          </article>
        </main>
      </div>
    </>
  )
}
