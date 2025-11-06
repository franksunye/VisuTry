import Link from 'next/link'
import { generateStructuredData } from '@/lib/seo'
import { Breadcrumbs } from '@/components/blog/Breadcrumbs'

const structuredData = generateStructuredData('article', {
  title: 'How to Find Your Perfect Glasses Online - Step-by-Step Guide',
  description: 'Complete step-by-step guide to finding and buying the perfect glasses online. Learn how to choose frames, use virtual try-on, and make confident purchases.',
  publishedAt: '2025-11-06T12:00:00Z',
  modifiedAt: '2025-11-06T12:00:00Z',
  author: 'VisuTry Team',
  image: '/og-image.jpg',
})

export const metadata = {
  title: 'How to Find Your Perfect Glasses Online - Step-by-Step Guide',
  description: 'Complete step-by-step guide to finding and buying the perfect glasses online. Learn how to choose frames, use virtual try-on, and make confident purchases.',
  keywords: 'find perfect glasses online, how to choose glasses online, buy glasses online, glasses shopping guide',
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
                { name: 'How to Find Your Perfect Glasses Online' },
              ]}
            />
          </div>

          <article className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-8">
              <h1 className="text-4xl font-bold mb-4">
                How to Find Your Perfect Glasses Online
              </h1>
              <p className="text-xl text-green-100 mb-6">
                Step-by-Step Guide to Confident Online Eyewear Shopping
              </p>
              <div className="flex items-center justify-between text-sm text-green-100">
                <span>By VisuTry Team</span>
                <span>7 min read</span>
              </div>
            </div>

            <div className="p-8 prose prose-lg max-w-none">
              <p>
                Buying glasses online can be intimidating. But with the right approach, you can find frames 
                that look amazing and fit perfectly—often at better prices than in-store options.
              </p>

              <p>
                This step-by-step guide will walk you through the entire process.
              </p>

              <h2>Step 1: Determine Your Face Shape</h2>
              <p>
                Before you start shopping, identify your face shape. This is the foundation for finding 
                flattering frames.
              </p>
              <ul>
                <li><strong>Round face:</strong> Look for browline or rectangular frames</li>
                <li><strong>Square face:</strong> Try round or oval frames</li>
                <li><strong>Oval face:</strong> You can wear almost any style!</li>
                <li><strong>Heart face:</strong> Choose bottom-heavy or cat-eye frames</li>
                <li><strong>Oblong face:</strong> Go for oversized or browline frames</li>
              </ul>

              <p>
                <Link href="/blog/best-glasses-for-face-shapes-guide" className="text-blue-600 hover:text-blue-800 font-semibold">
                  Read our complete face shape guide →
                </Link>
              </p>

              <h2>Step 2: Gather Your Information</h2>
              <p>
                You'll need some key information before shopping:
              </p>
              <ul>
                <li><strong>Your prescription</strong> - Get it from your eye doctor</li>
                <li><strong>Your pupillary distance (PD)</strong> - Distance between pupils (usually 58-68mm)</li>
                <li><strong>Your frame size preferences</strong> - Small, medium, or large</li>
                <li><strong>Your style preferences</strong> - Classic, trendy, professional, casual</li>
              </ul>

              <h2>Step 3: Choose Your Style</h2>
              <p>
                Think about your lifestyle and personal style:
              </p>
              <ul>
                <li><strong>Professional:</strong> Classic browline, rectangular, or metal frames</li>
                <li><strong>Casual:</strong> Wayfarer, round, or trendy styles</li>
                <li><strong>Fashion-forward:</strong> Cat-eye, geometric, or bold colors</li>
                <li><strong>Timeless:</strong> Browline, aviator, or classic round</li>
              </ul>

              <h2>Step 4: Use Virtual Try-On</h2>
              <p>
                This is the game-changer for online shopping. Virtual try-on lets you see how frames 
                look on your face before buying.
              </p>
              <p>
                <strong>How to use virtual try-on:</strong>
              </p>
              <ol>
                <li>Take a clear, front-facing photo of your face</li>
                <li>Upload it to the virtual try-on tool</li>
                <li>Browse and try different frame styles</li>
                <li>Compare multiple options</li>
                <li>Save your favorites</li>
              </ol>

              <p>
                <Link href="/blog/prescription-glasses-virtual-tryon-guide" className="text-blue-600 hover:text-blue-800 font-semibold">
                  Learn more about virtual try-on →
                </Link>
              </p>

              <h2>Step 5: Compare Brands and Prices</h2>
              <p>
                Once you've narrowed down your style, compare options:
              </p>
              <ul>
                <li><strong>Ray-Ban:</strong> Classic, affordable, widely available</li>
                <li><strong>Tom Ford:</strong> Luxury, premium quality, higher price</li>
                <li><strong>Oliver Peoples:</strong> Sophisticated, excellent craftsmanship</li>
                <li><strong>Warby Parker:</strong> Affordable, stylish, good quality</li>
              </ul>

              <h2>Step 6: Check Reviews and Ratings</h2>
              <p>
                Before purchasing, read reviews from other customers:
              </p>
              <ul>
                <li>How do they fit? (Too tight? Too loose?)</li>
                <li>Are they comfortable for all-day wear?</li>
                <li>How's the quality?</li>
                <li>Do they match the photos?</li>
              </ul>

              <h2>Step 7: Verify Your Prescription</h2>
              <p>
                Double-check your prescription details:
              </p>
              <ul>
                <li>Sphere (SPH) - Lens power</li>
                <li>Cylinder (CYL) - Astigmatism correction</li>
                <li>Axis - Astigmatism angle</li>
                <li>Add - Bifocal/progressive addition</li>
                <li>Pupillary Distance (PD) - Critical for proper fit</li>
              </ul>

              <h2>Step 8: Make Your Purchase</h2>
              <p>
                When you're ready to buy:
              </p>
              <ul>
                <li>Choose your frame style and color</li>
                <li>Enter your prescription details</li>
                <li>Select lens options (anti-glare, blue light filter, etc.)</li>
                <li>Review your order</li>
                <li>Complete checkout</li>
              </ul>

              <h2>Step 9: Receive and Inspect</h2>
              <p>
                When your glasses arrive:
              </p>
              <ul>
                <li>Check that they match your order</li>
                <li>Inspect for any damage</li>
                <li>Try them on and check the fit</li>
                <li>Verify the prescription is correct</li>
              </ul>

              <h2>Step 10: Adjust and Enjoy</h2>
              <p>
                If needed, visit a local optician for minor adjustments. Most adjustments are free or low-cost.
              </p>

              <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-8 rounded-lg my-8">
                <h3 className="text-2xl font-bold mb-4">Ready to Find Your Perfect Glasses?</h3>
                <p className="mb-6">
                  Start with our virtual try-on tool to see how different frames look on your face. 
                  It's the easiest way to find glasses you'll love!
                </p>
                <Link href="/try-on" className="inline-block bg-white text-green-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                  Start Virtual Try-On →
                </Link>
              </div>

              <h2>Common Mistakes to Avoid</h2>
              <ul>
                <li>❌ Buying without trying on first</li>
                <li>❌ Ignoring your face shape</li>
                <li>❌ Choosing frames that are too small or too large</li>
                <li>❌ Not verifying your prescription</li>
                <li>❌ Forgetting to check return policies</li>
              </ul>

              <h2>Pro Tips for Success</h2>
              <ul>
                <li>✅ Try at least 5-10 different styles</li>
                <li>✅ Ask friends for opinions on your favorites</li>
                <li>✅ Consider your lifestyle and daily activities</li>
                <li>✅ Don't rush - take your time deciding</li>
                <li>✅ Check return and warranty policies</li>
              </ul>

              <h2>Conclusion</h2>
              <p>
                Finding your perfect glasses online is easier than ever with virtual try-on technology. 
                By following these 10 steps, you can confidently choose frames that look great, fit perfectly, 
                and match your personal style.
              </p>

              <p>
                The key is to take your time, use the tools available, and don't settle until you find 
                frames you absolutely love.
              </p>

              <p>
                <Link href="/try-on" className="text-blue-600 hover:text-blue-800 font-semibold">
                  Ready to start? Try our virtual try-on tool now! →
                </Link>
              </p>
            </div>
          </article>
        </main>
      </div>
    </>
  )
}

