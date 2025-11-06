import Link from 'next/link'
import { generateStructuredData } from '@/lib/seo'
import { Breadcrumbs } from '@/components/blog/Breadcrumbs'

const structuredData = generateStructuredData('article', {
  title: 'Best Glasses for Different Face Shapes - Complete Guide 2025',
  description: 'Comprehensive guide to finding the best glasses for your face shape. Learn which frame styles work best for round, square, oval, heart, and oblong faces.',
  publishedAt: '2025-11-06T11:00:00Z',
  modifiedAt: '2025-11-06T11:00:00Z',
  author: 'VisuTry Team',
  image: '/og-image.jpg',
})

export const metadata = {
  title: 'Best Glasses for Different Face Shapes - Complete Guide 2025',
  description: 'Comprehensive guide to finding the best glasses for your face shape. Learn which frame styles work best for round, square, oval, heart, and oblong faces.',
  keywords: 'best glasses for round face, best glasses for square face, best glasses for oval face, glasses for face shape, how to choose glasses',
}

export default function BlogPostPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
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

              <h2>How to Determine Your Face Shape</h2>
              <p>
                To find your face shape, look at your face in the mirror and consider the width of your forehead, 
                cheekbones, and jawline, plus the length of your face.
              </p>

              <h2>1. Round Face Shape</h2>
              <p>
                <strong>Best glasses styles:</strong> Browline, Cat-eye, Rectangular, Geometric
              </p>
              <p>
                <strong>Avoid:</strong> Oversized round frames
              </p>

              <h2>2. Square Face Shape</h2>
              <p>
                <strong>Best glasses styles:</strong> Round frames, Oval, Oversized, Wayfarer
              </p>
              <p>
                <strong>Avoid:</strong> Heavy, angular frames
              </p>

              <h2>3. Oval Face Shape</h2>
              <p>
                <strong>Best glasses styles:</strong> Any style works! Browline, Cat-eye, Geometric
              </p>
              <p>
                <strong>Pro tip:</strong> Oval faces can pull off virtually any frame style!
              </p>

              <h2>4. Heart Face Shape</h2>
              <p>
                <strong>Best glasses styles:</strong> Bottom-heavy frames, Cat-eye, Aviator, Round
              </p>
              <p>
                <strong>Avoid:</strong> Top-heavy frames
              </p>

              <h2>5. Oblong Face Shape</h2>
              <p>
                <strong>Best glasses styles:</strong> Oversized frames, Browline, Wayfarer, Round
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

              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 rounded-lg my-8">
                <h3 className="text-2xl font-bold mb-4">Try Before You Buy</h3>
                <p className="mb-6">
                  Use our virtual try-on tool to see how different frames look on your face!
                </p>
                <Link href="/try-on" className="inline-block bg-white text-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                  Try Glasses Virtually →
                </Link>
              </div>

              <h2>Final Tips</h2>
              <ul>
                <li>Don't just follow rules - wear what makes you feel confident</li>
                <li>Try multiple styles</li>
                <li>Consider your lifestyle</li>
                <li>Use virtual try-on to test styles</li>
                <li>Read reviews from people with similar face shapes</li>
              </ul>

              <h2>Conclusion</h2>
              <p>
                Finding the best glasses for your face shape doesn't have to be complicated. By understanding 
                your face shape and knowing which frame styles complement it, you can confidently choose glasses 
                that look great and feel comfortable.
              </p>
            </div>
          </article>
        </main>
      </div>
    </>
  )
}

