import Link from 'next/link'
import Image from 'next/image'
import { generateStructuredData } from '@/lib/seo'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { FaceAnalysisFunnelCTA } from '@/components/blog/FaceAnalysisFunnelCTA'

const structuredData = generateStructuredData('article', {
  title: 'Best Glasses for Different Face Shapes - Complete Guide 2026',
  description: 'Find the best glasses for your face shape, then use AI face analysis and virtual try-on to compare recommended frames on your own photo.',
  publishedAt: '2025-11-02T11:00:00Z',
  modifiedAt: '2026-06-12T10:00:00Z',
  author: 'VisuTry Team',
  image: '/blog-covers/face-shape-guide.jpg',
})

export const metadata = {
  title: 'Best Glasses for Different Face Shapes - Complete Guide 2026',
  description: 'Find the best glasses for your face shape, then use AI face analysis and virtual try-on to compare recommended frames on your own photo.',
  keywords: 'best glasses for round face, best glasses for square face, best glasses for oval face, glasses for face shape, what glasses suit my face',
}

const faqSchema = generateStructuredData('faqPage', {
  questions: [
    {
      question: 'What glasses suit my face shape?',
      answer: 'Start with frames that balance your face shape: angular frames for round faces, round or oval frames for square faces, balanced rectangular or browline frames for oval faces, and lighter or softly lifted frames for heart-shaped faces.',
    },
    {
      question: 'How do I know my face shape before buying glasses?',
      answer: 'You can estimate it manually by comparing forehead, cheekbone, jawline, and face length proportions, or use AI face analysis for glasses to get a structured starting point from one clear photo.',
    },
    {
      question: 'Should I use face shape rules or virtual try-on?',
      answer: 'Use face shape rules to build the first shortlist, then use virtual try-on to compare scale, balance, and style on your own photo.',
    },
  ],
})

export default function BlogPostPage({ params }: { params: { locale: string } }) {
  const localePrefix = `/${params.locale}`

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <main className="container mx-auto px-4 py-12">
          <div className="mb-6">
            <Breadcrumbs
              items={[
                { name: 'Blog', url: '/blog' },
                { name: 'Best Glasses for Different Face Shapes' },
              ]}
            />
          </div>

          <article className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Cover Image */}
            <div className="relative h-96 w-full overflow-hidden">
              <Image
                src="/blog-covers/face-shape-guide.jpg"
                alt="Best Glasses for Different Face Shapes Guide"
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8">
              <h1 className="text-4xl font-bold mb-4">
                Best Glasses for Different Face Shapes
              </h1>
              <p className="text-xl text-purple-100 mb-6">
                Complete Guide to Finding Frames That Flatter Your Face
              </p>
              <div className="flex items-center justify-between text-sm text-purple-100">
                <span>By VisuTry Team</span>
                <span>8 min read</span>
              </div>
            </div>

            <div className="p-8 prose prose-lg max-w-none">
              <p>
                One of the most important factors in choosing glasses is finding frames that complement your face shape. 
                The right frames can enhance your features, while the wrong ones can make you look unflattering.
              </p>
              <p>
                The fastest workflow is simple: identify your face shape, shortlist a few frame
                styles, then use virtual try-on to see which one actually fits your face and style.
                If you are unsure where to start, run <Link href={`${localePrefix}/face-analysis`}>AI face analysis for glasses</Link>
                {' '}or compare all recommendations in the <Link href={`${localePrefix}/glasses-for-face-shape`}>glasses for face shape hub</Link>.
              </p>

              <FaceAnalysisFunnelCTA
                locale={params.locale}
                title="Not sure which face shape you have?"
                body="Upload one front-facing photo, get an AI face shape report, and move into a focused glasses try-on shortlist."
                tone="light"
              />

              <h2>How to Determine Your Face Shape</h2>
              <p>
                To find your face shape, look at your face in the mirror and consider the width of your forehead, 
                cheekbones, and jawline, plus the length of your face.
              </p>

              <h2>1. Round Face Shape</h2>
              <div className="my-6">
                <Image
                  src="/Ray-Ban RB5154 Clubmaster - Browline Black Frame Eyeglasses.jpg"
                  alt="Best glasses for round face shape - browline frames"
                  width={800}
                  height={600}
                  className="rounded-lg shadow-md"
                />
              </div>
              <p>
                <strong>Best glasses styles:</strong> Browline, Cat-eye, Rectangular, Geometric
              </p>
              <p>
                See the full <Link href={`${localePrefix}/style/round-face`}>round face glasses guide</Link>
                {' '}for more frame examples and try-on prompts.
              </p>
              <p>
                <strong>Avoid:</strong> Oversized round frames
              </p>

              <h2>2. Square Face Shape</h2>
              <p>
                <strong>Best glasses styles:</strong> Round frames, Oval, Oversized, Wayfarer
              </p>
              <p>
                See the full <Link href={`${localePrefix}/style/square-face`}>square face glasses guide</Link>
                {' '}to compare softer, curved frame options.
              </p>
              <p>
                <strong>Avoid:</strong> Heavy, angular frames
              </p>

              <h2>3. Oval Face Shape</h2>
              <p>
                <strong>Best glasses styles:</strong> Any style works! Browline, Cat-eye, Geometric
              </p>
              <p>
                See the full <Link href={`${localePrefix}/style/oval-face`}>oval face glasses guide</Link>
                {' '}for balanced rectangular, browline, and aviator starting points.
              </p>
              <p>
                <strong>Pro tip:</strong> Oval faces can pull off virtually any frame style!
              </p>

              <h2>4. Heart Face Shape</h2>
              <p>
                <strong>Best glasses styles:</strong> Bottom-heavy frames, Cat-eye, Aviator, Round
              </p>
              <p>
                See the full <Link href={`${localePrefix}/style/heart-face`}>heart face glasses guide</Link>
                {' '}for lightweight and softly lifted frame directions.
              </p>
              <p>
                <strong>Avoid:</strong> Top-heavy frames
              </p>

              <h2>5. Oblong Face Shape</h2>
              <p>
                <strong>Best glasses styles:</strong> Oversized frames, Browline, Wayfarer, Round
              </p>
              <p>
                See the full <Link href={`${localePrefix}/style/oblong-face`}>oblong face glasses guide</Link>
                {' '}for taller frames and width-balancing ideas.
              </p>
              <p>
                <strong>Avoid:</strong> Narrow, small frames
              </p>

              <h2>Popular Brands by Face Shape</h2>
              <ul>
                <li><strong>Round Faces:</strong> Ray-Ban Clubmaster, Tom Ford Browline</li>
                <li><strong>Square Faces:</strong> Ray-Ban Round Metal, Warby Parker Wayfarer</li>
                <li><strong>Oval Faces:</strong> Any style! Ray-Ban Aviator, Tom Ford Cat-Eye</li>
                <li><strong>Heart Faces:</strong> Ray-Ban Aviator, Cat-Eye styles</li>
                <li><strong>Oblong Faces:</strong> Oversized frames, Browline, Wayfarer</li>
              </ul>

              <h2>Frame Size Matters</h2>
              <ul>
                <li><strong>Small faces:</strong> 130-140mm wide</li>
                <li><strong>Average faces:</strong> 140-150mm wide</li>
                <li><strong>Large faces:</strong> 150mm+ wide</li>
              </ul>

              <FaceAnalysisFunnelCTA locale={params.locale} />

              <h2>Final Tips</h2>
              <ul>
                <li>Don&apos;t just follow rules - wear what makes you feel confident</li>
                <li>Try multiple styles</li>
                <li>Consider your lifestyle</li>
                <li>Use virtual try-on to test styles</li>
                <li>Read reviews from people with similar face shapes</li>
              </ul>

              <h2>Conclusion</h2>
              <p>
                Finding the best glasses for your face shape doesn&apos;t have to be complicated. By understanding
                your face shape and knowing which frame styles complement it, you can confidently choose glasses
                that look great and feel comfortable. Use face shape guidance to narrow the options,
                then use <Link href={`${localePrefix}/try-on/glasses`}>AI glasses try-on</Link> to compare real looks.
              </p>
            </div>
          </article>
        </main>
      </div>
    </>
  )
}
