import Link from 'next/link'
import Image from 'next/image'
import { Metadata } from 'next'
import { generateStructuredData, generateI18nSEO } from '@/lib/seo'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'

const structuredData = generateStructuredData('article', {
  title: 'Prescription Glasses Virtual Try-On Guide - Find Your Perfect Fit Online',
  description: 'Complete guide to using virtual try-on tools for prescription glasses. Learn how to find the perfect fit online without visiting a store.',
  publishedAt: '2025-11-04T10:00:00Z',
  modifiedAt: '2025-11-04T10:00:00Z',
  author: 'VisuTry Team',
  image: '/blog-covers/ai-virtual-tryon.jpg',
})

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return generateI18nSEO({
    locale: params.locale as any,
    title: 'Prescription Glasses Virtual Try-On Guide - Find Your Perfect Fit Online',
    description: 'Complete guide to using virtual try-on tools for prescription glasses. Learn how to find the perfect fit online without visiting a store.',
    pathname: '/blog/prescription-glasses-virtual-tryon-guide',
    type: 'article',
  })
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
                { name: 'Blog', url: '../blog' },
                { name: 'Prescription Glasses Virtual Try-On Guide' },
              ]}
            />
          </div>

          <article className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Cover Image */}
            <div className="relative h-96 w-full overflow-hidden">
              <Image
                src="/blog-covers/ai-virtual-tryon.jpg"
                alt="Prescription Glasses Virtual Try-On Guide"
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
              <h1 className="text-4xl font-bold mb-4">
                Prescription Glasses Virtual Try-On Guide
              </h1>
              <p className="text-xl text-blue-100 mb-6">
                Find Your Perfect Fit Online Without Visiting a Store
              </p>
              <div className="flex items-center justify-between text-sm text-blue-100">
                <span>By VisuTry Team</span>
                <span>6 min read</span>
              </div>
            </div>

            <div className="p-8 prose prose-lg max-w-none">
              <p>
                Buying prescription glasses online has become easier than ever, thanks to virtual try-on technology. 
                But many people still worry: <strong>Will they fit my face? Will I like how they look?</strong>
              </p>

              <p>
                This guide will show you exactly how to use virtual try-on tools to find prescription glasses that 
                fit perfectly—without ever leaving your home.
              </p>

              <h2>Why Virtual Try-On for Prescription Glasses?</h2>
              <p>
                Virtual try-on technology has revolutionized online eyewear shopping. Here&apos;s why it matters:
              </p>
              <ul>
                <li><strong>See before you buy</strong> - Visualize how frames look on your face</li>
                <li><strong>Save time</strong> - No need to visit multiple stores</li>
                <li><strong>Better decisions</strong> - Compare multiple styles instantly</li>
                <li><strong>Confidence</strong> - Know exactly what you&apos;re getting</li>
                <li><strong>Convenience</strong> - Shop anytime, anywhere</li>
              </ul>

              <h2>Step-by-Step Guide to Virtual Try-On</h2>

              <h3>Step 1: Prepare Your Photo</h3>
              <p>
                The quality of your virtual try-on depends on your photo. Here&apos;s what you need:
              </p>
              <ul>
                <li>Clear, front-facing photo of your face</li>
                <li>Good lighting (natural light is best)</li>
                <li>No sunglasses or hats</li>
                <li>Neutral expression</li>
                <li>Hair pulled back (optional but helpful)</li>
              </ul>

              <h3>Step 2: Upload and Select Frames</h3>
              <p>
                Upload your photo to the virtual try-on tool and browse prescription glasses options.
              </p>

              <h3>Step 3: Try Multiple Styles</h3>
              <p>
                Don&apos;t settle on the first pair! Try at least 5-10 different styles to see what works best.
              </p>

              <h3>Step 4: Check the Fit</h3>
              <p>
                Look for proper alignment and balance with your face shape.
              </p>

              <h2>Best Prescription Glasses for Virtual Try-On</h2>
              <div className="my-6">
                <Image
                  src="/Ray-Ban RB5154 Clubmaster - Browline Black Frame Eyeglasses.jpg"
                  alt="Ray-Ban prescription glasses for virtual try-on"
                  width={800}
                  height={600}
                  className="rounded-lg shadow-md"
                />
              </div>
              <p>
                Popular brands that work great with virtual try-on:
              </p>
              <ul>
                <li><strong>Ray-Ban</strong> - Classic styles, excellent quality</li>
                <li><strong>Tom Ford</strong> - Luxury options, premium materials</li>
                <li><strong>Oliver Peoples</strong> - Sophisticated designs</li>
                <li><strong>Warby Parker</strong> - Affordable, stylish frames</li>
              </ul>

              <h2>Pro Tips for Success</h2>
              <ul>
                <li>Try frames in different colors</li>
                <li>Consider your lifestyle</li>
                <li>Check frame size</li>
                <li>Read reviews from other customers</li>
                <li>Use multiple tools for comparison</li>
              </ul>

              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-lg my-8">
                <h3 className="text-2xl font-bold mb-4">Ready to Try Prescription Glasses Virtually?</h3>
                <p className="mb-6">
                  Use our AI-powered virtual try-on tool to find your perfect prescription glasses.
                </p>
                <Link href="../try-on" className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                  Start Virtual Try-On →
                </Link>
              </div>

              <h2>Conclusion</h2>
              <p>
                Virtual try-on technology makes buying prescription glasses online safer and more enjoyable. 
                By following this guide, you can confidently find frames that look great and fit perfectly.
              </p>
            </div>
          </article>
        </main>
      </div>
    </>
  )
}
