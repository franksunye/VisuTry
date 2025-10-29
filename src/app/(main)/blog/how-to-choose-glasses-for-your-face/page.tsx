import { Metadata } from 'next'
import { generateSEO, generateStructuredData } from '@/lib/seo'
import Link from 'next/link'
import { ArrowLeft, Glasses, Share2 } from 'lucide-react'
import BlogTags from '@/components/BlogTags'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'

export const metadata: Metadata = generateSEO({
  title: 'How to Choose the Right Glasses for Your Face Shape? Complete Guide',
  description: 'Detailed analysis of suitable glasses styles for different face shapes, including round, square, long faces and professional advice. Use AI try-on tool to find your perfect match.',
  url: '/blog/how-to-choose-glasses-for-your-face',
  type: 'article',
})

// Structured data
const structuredData = generateStructuredData('article', {
  title: 'How to Choose the Right Glasses for Your Face Shape? Complete Guide',
  description: 'Detailed analysis of suitable glasses styles for different face shapes, including round, square, long faces and professional advice.',
  publishedAt: '2025-10-15T10:00:00Z',
  modifiedAt: '2025-10-15T10:00:00Z',
  author: 'VisuTry Team',
  image: '/blog/face-shape-guide.jpg',
})

const articleTags = ['Face Shape', 'Glasses Selection', 'Style Guide', 'Buying Guide', 'Fashion Tips']

export default function BlogPostPage() {
  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <main className="container mx-auto px-4 py-12">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <Breadcrumbs
              items={[
                { name: 'Blog', url: '/blog' },
                { name: 'How to Choose Glasses for Your Face' },
              ]}
            />
          </div>

          {/* Back button */}
          <div className="mb-8">
            <Link
              href="/blog"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
          </div>

          {/* Article content */}
          <article className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Article header */}
            <div className="h-64 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
              <div className="text-center text-white">
                <Glasses className="w-16 h-16 mx-auto mb-4" />
                <h1 className="text-3xl font-bold">Face Shape & Glasses Guide</h1>
              </div>
            </div>

            {/* Article metadata */}
            <div className="p-8 border-b">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Author: VisuTry Team</span>
                  <span>Published: October 15, 2025</span>
                  <span>Read time: 5 min</span>
                </div>
                <button className="flex items-center text-blue-600 hover:text-blue-800">
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </button>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                How to Choose the Right Glasses for Your Face Shape? Complete Guide
              </h1>
              <p className="text-xl text-gray-600">
                Choosing the right glasses not only improves vision but also perfectly complements your face shape. This article provides detailed tips for matching glasses to different face shapes. If you&apos;re ready to shop, check out our <Link href="/blog/prescription-glasses-online-shopping-guide-2025" className="text-blue-600 hover:text-blue-800">complete online shopping guide</Link>.
              </p>
            </div>

            {/* Article body */}
            <div className="p-8 prose prose-lg max-w-none">
              <h2>Why is Face Shape Important?</h2>
              <p>
                When choosing glasses, face shape is one of the most important factors to consider. The right glasses can:
              </p>
              <ul>
                <li>Balance facial proportions</li>
                <li>Highlight your best features</li>
                <li>Enhance your overall appearance</li>
                <li>Boost your confidence</li>
              </ul>

              <h2>Glasses Selection Guide for Different Face Shapes</h2>

              <h3>1. Round Face</h3>
              <p>
                <strong>Characteristics:</strong> Face width and length are similar, rounded chin, less prominent cheekbones.
              </p>
              <p>
                <strong>Recommended glasses:</strong>
              </p>
              <ul>
                <li>Square or rectangular frames</li>
                <li>Angular designs</li>
                <li>Frame width slightly larger than the widest part of the face</li>
              </ul>

              <h3>2. Square Face</h3>
              <p>
                <strong>Characteristics:</strong> Forehead, cheekbones, and jawline are similar in width, with a square jawline.
              </p>
              <p>
                <strong>Recommended glasses:</strong>
              </p>
              <ul>
                <li>Round or oval frames</li>
                <li>Soft curved designs (like <Link href="/blog/browline-clubmaster-glasses-complete-guide" className="text-blue-600 hover:text-blue-800">browline clubmaster styles</Link>)</li>
                <li>Avoid overly square styles</li>
              </ul>

              <h3>3. Long Face</h3>
              <p>
                <strong>Characteristics:</strong> Face length is significantly greater than width, with a high forehead.
              </p>
              <p>
                <strong>Recommended glasses:</strong>
              </p>
              <ul>
                <li>Large or wide frame designs</li>
                <li>Decorative frames</li>
                <li>Low bridge designs</li>
              </ul>

              <h3>4. Heart-Shaped Face</h3>
              <p>
                <strong>Characteristics:</strong> Wide forehead with a narrow, pointed chin, forming an inverted triangle.
              </p>
              <p>
                <strong>Recommended glasses:</strong>
              </p>
              <ul>
                <li>Bottom-heavy frame designs</li>
                <li>Cat-eye shapes</li>
                <li>Avoid heavy top portions</li>
              </ul>

              {/* CTA section */}
              <div className="bg-blue-50 p-6 rounded-lg my-8">
                <h3 className="text-xl font-bold text-blue-900 mb-4">
                  🔍 Try AI Virtual Glasses Try-On Now
                </h3>
                <p className="text-blue-800 mb-4">
                  Not sure which glasses suit you? Use our AI virtual try-on tool - just upload your photo to see how different glasses look on you!
                </p>
                <Link
                  href="/"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Try-On
                </Link>
              </div>

              <h2>Other Factors to Consider When Choosing Glasses</h2>

              <h3>Skin Tone Matching</h3>
              <p>
                Besides face shape, skin tone is also an important factor in choosing glasses:
              </p>
              <ul>
                <li><strong>Warm skin tones:</strong> Suit gold, brown, orange frames</li>
                <li><strong>Cool skin tones:</strong> Suit silver, black, blue frames</li>
              </ul>

              <h3>Lifestyle</h3>
              <p>
                Consider your daily activities and professional needs:
              </p>
              <ul>
                <li>Sports enthusiasts: Choose lightweight, non-slip materials</li>
                <li>Business professionals: Choose classic, professional styles</li>
                <li>Fashion lovers: Can try bold designs</li>
              </ul>

              <h2>Conclusion</h2>
              <p>
                Choosing the right glasses requires considering multiple factors including face shape, skin tone, and lifestyle.
                Most importantly, choose styles that make you feel confident and comfortable. For style inspiration, check out our <Link href="/blog/celebrity-glasses-style-guide-2025" className="text-blue-600 hover:text-blue-800">celebrity glasses style guide</Link>.
              </p>
              <p>
                With VisuTry&apos;s AI virtual try-on technology, you can easily try different styles
                and find the perfect glasses for you. Explore our <Link href="/blog/best-ai-virtual-glasses-tryon-tools-2025" className="text-blue-600 hover:text-blue-800">comprehensive guide to AI virtual try-on tools</Link> to learn more about the latest technology.
              </p>
              <p>
                Once you&apos;ve found your perfect style, check out our <Link href="/blog/prescription-glasses-online-shopping-guide-2025" className="text-blue-600 hover:text-blue-800">complete guide to buying prescription glasses online</Link> to make your purchase with confidence.
              </p>
            </div>

            {/* Article footer */}
            <div className="p-8 bg-gray-50 border-t">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <BlogTags tags={articleTags} />
                <Link
                  href="/"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Now
                </Link>
              </div>
            </div>
          </article>
        </main>
      </div>
    </>
  )
}
