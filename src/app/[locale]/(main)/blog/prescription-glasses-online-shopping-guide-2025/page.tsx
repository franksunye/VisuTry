import { Metadata } from 'next'
import { generateSEO, generateStructuredData } from '@/lib/seo'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, CheckCircle2, AlertTriangle } from 'lucide-react'
import BlogTags from '@/components/BlogTags'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'

export const metadata: Metadata = generateSEO({
  title: 'How to Buy Prescription Glasses Online 2025 - Complete Shopping Guide',
  description: 'Learn how to safely buy prescription glasses online. Get tips on measuring PD, reading prescriptions, choosing lenses, and avoiding common mistakes.',
  url: '/blog/prescription-glasses-online-shopping-guide-2025',
  type: 'article',
})

const structuredData = generateStructuredData('article', {
  title: 'How to Buy Prescription Glasses Online 2025 - Complete Shopping Guide',
  description: 'Complete guide to buying prescription glasses online safely and successfully.',
  publishedAt: '2025-10-28T19:00:00Z',
  modifiedAt: '2025-10-28T19:00:00Z',
  author: 'VisuTry Team',
  image: '/blog-covers/prescription-online-shopping.jpg',
})

const articleTags = ['Online Shopping', 'Prescription Glasses', 'Buying Guide', 'Eyewear Tips', 'How-To']

export default function BlogPostPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <main className="container mx-auto px-4 py-12">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <Breadcrumbs
              items={[
                { name: 'Blog', url: '/blog' },
                { name: 'Prescription Glasses Online Shopping Guide' },
              ]}
            />
          </div>

          <article className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Cover Image */}
            <div className="relative h-96 w-full overflow-hidden">
              <Image
                src="/blog-covers/prescription-online-shopping.jpg"
                alt="How to Buy Prescription Glasses Online Guide"
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="h-64 bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center">
              <div className="text-center text-white">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4" />
                <h1 className="text-3xl font-bold">Online Glasses Shopping Guide</h1>
              </div>
            </div>
            <div className="p-8 border-b">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Author: VisuTry Team</span>
                  <span>Published: October 21, 2025</span>
                  <span>Read time: 10 min</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                How to Buy Prescription Glasses Online 2025: Complete Shopping Guide
              </h1>
              <p className="text-xl text-gray-600">
                Save money and time by buying prescription glasses online. Learn everything you need to know 
                to shop safely, avoid mistakes, and get perfect-fitting glasses delivered to your door.
              </p>
            </div>
            <div className="p-8 prose prose-lg max-w-none">
              <h2>Why Buy Glasses Online?</h2>
              <p>
                The online eyewear market has exploded in recent years. According to <a href="https://www.grandviewresearch.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">Grand View Research</a>, 
                the global online eyewear market is expected to reach <strong>$38.2 billion by 2027</strong>, 
                growing at 8.5% annually.
              </p>
              <h3>Benefits of Online Shopping:</h3>
              <ul>
                <li><strong>Cost savings</strong> - 50-70% cheaper than retail stores</li>
                <li><strong>Convenience</strong> - Shop from home, 24/7</li>
                <li><strong>Wider selection</strong> - Thousands of styles available</li>
                <li><strong>Virtual try-on</strong> - See frames on your face before buying (check out our <Link href="/blog/best-ai-virtual-glasses-tryon-tools-2025" className="text-blue-600 hover:text-blue-800">guide to the best AI virtual try-on tools</Link>)</li>
                <li><strong>Easy comparison</strong> - Compare prices and styles instantly</li>
                <li><strong>Home delivery</strong> - Glasses shipped to your door</li>
              </ul>
              <h2>Step-by-Step Guide to Buying Online</h2>
              <h3>Step 1: Get a Current Prescription</h3>
              <p>
                You need a valid prescription from an eye doctor. In the US, prescriptions are typically valid 
                for 1-2 years. Your prescription should include:
              </p>
              <ul>
                <li><strong>OD (Right Eye)</strong> and <strong>OS (Left Eye)</strong> measurements</li>
                <li><strong>Sphere (SPH)</strong> - Nearsighted (-) or farsighted (+)</li>
                <li><strong>Cylinder (CYL)</strong> - Astigmatism correction (if applicable)</li>
                <li><strong>Axis</strong> - Angle of astigmatism (if applicable)</li>
                <li><strong>Add</strong> - Reading addition for bifocals/progressives (if needed)</li>
                <li><strong>Pupillary Distance (PD)</strong> - Distance between pupils</li>
              </ul>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 my-8">
                <h3 className="text-lg font-bold text-yellow-900 mb-2">⚠️ Important Note</h3>
                <p className="text-gray-800 mb-0">
                  By law in the US, your eye doctor must provide you with a copy of your prescription after 
                  an eye exam, even if you don&apos;t ask for it. Don&apos;t let them tell you otherwise!
                </p>
              </div>
              <h3>Step 2: Measure Your Pupillary Distance (PD)</h3>
              <p>
                <strong>PD</strong> is crucial for proper lens alignment. If it&apos;s not on your prescription, 
                you can measure it yourself:
              </p>
              <h4>DIY Method:</h4>
              <ol>
                <li>Stand 8 inches from a mirror</li>
                <li>Hold a ruler against your eyebrows</li>
                <li>Close your right eye</li>
                <li>Align the ruler&apos;s 0mm with the center of your left pupil</li>
                <li>Look straight ahead and measure to the center of your right pupil</li>
                <li>Average PD for adults: 54-74mm</li>
              </ol>
              <h4>App Method:</h4>
              <p>
                Many online retailers offer free PD measurement apps. These use your phone&apos;s camera and 
                are surprisingly accurate.
              </p>
              <h3>Step 3: Choose Your Frames</h3>
              <p>
                This is the fun part! Consider:
              </p>
              <ul>
                <li><strong>Face shape</strong> - See our <Link href="/blog/how-to-choose-glasses-for-your-face" className="text-blue-600 hover:text-blue-800">face shape guide</Link></li>
                <li><strong>Frame material</strong> - Learn about <Link href="/blog/acetate-vs-plastic-eyeglass-frames-guide" className="text-blue-600 hover:text-blue-800">acetate vs plastic frames</Link></li>
                <li><strong>Frame size</strong> - Check measurements (lens width, bridge, temple length)</li>
                <li><strong>Style</strong> - Professional, casual, trendy, classic</li>
                <li><strong>Color</strong> - Match your skin tone and wardrobe</li>
              </ul>
              <div className="bg-blue-50 p-6 rounded-lg my-8">
                <h3 className="text-xl font-bold text-blue-900 mb-3">💡 Use Virtual Try-On</h3>
                <p className="text-gray-700 mb-4">
                  Don&apos;t guess how frames will look! Use our AI-powered virtual try-on to see hundreds 
                  of styles on your actual face. This dramatically reduces the chance of ordering frames 
                  that don&apos;t suit you.
                </p>
                <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-bold">
                  Try Frames Virtually →
                </Link>
              </div>
              <h3>Step 4: Select Your Lenses</h3>
              <p>
                Lens options can be confusing. Here&apos;s what you need to know:
              </p>
              <h4>Lens Materials:</h4>
              <ul>
                <li><strong>Standard plastic (CR-39)</strong> - Cheapest, thickest</li>
                <li><strong>Polycarbonate</strong> - Impact-resistant, good for kids/sports</li>
                <li><strong>High-index (1.67, 1.74)</strong> - Thinner, lighter for strong prescriptions</li>
                <li><strong>Trivex</strong> - Lightweight, clear, impact-resistant</li>
              </ul>
              <h4>Lens Coatings:</h4>
              <ul>
                <li><strong>Anti-reflective (AR)</strong> - Reduces glare, highly recommended</li>
                <li><strong>Scratch-resistant</strong> - Protects lenses, usually included</li>
                <li><strong>UV protection</strong> - Blocks harmful UV rays</li>
                <li><strong>Blue light blocking</strong> - Reduces digital eye strain</li>
                <li><strong>Photochromic (Transitions)</strong> - Darken in sunlight</li>
              </ul>
              <h4>Lens Types:</h4>
              <ul>
                <li><strong>Single vision</strong> - One prescription throughout</li>
                <li><strong>Bifocals</strong> - Two prescriptions (distance and reading)</li>
                <li><strong>Progressives</strong> - Gradual transition, no visible line</li>
              </ul>
              <h3>Step 5: Enter Your Prescription</h3>
              <p>
                Carefully enter all prescription values. Double-check:
              </p>
              <ul>
                <li>Correct eye (OD vs OS)</li>
                <li>Positive (+) or negative (-) signs</li>
                <li>All decimal points</li>
                <li>PD measurement</li>
              </ul>
              <div className="bg-red-50 border-l-4 border-red-400 p-6 my-8">
                <h3 className="text-lg font-bold text-red-900 mb-2">🚨 Common Mistake</h3>
                <p className="text-gray-800 mb-0">
                  Entering the wrong prescription is the #1 cause of returns. Take your time and verify 
                  every number before submitting your order!
                </p>
              </div>
              <h3>Step 6: Review and Order</h3>
              <p>
                Before clicking &quot;Buy&quot;:
              </p>
              <ul>
                <li>✅ Verify prescription details</li>
                <li>✅ Confirm frame size and color</li>
                <li>✅ Check lens options and coatings</li>
                <li>✅ Review return policy</li>
                <li>✅ Look for discount codes</li>
                <li>✅ Consider ordering a backup pair</li>
              </ul>
              <h2>Top Online Retailers Compared</h2>
              <div className="overflow-x-auto my-8">
                <table className="min-w-full bg-white border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 border text-left">Retailer</th>
                      <th className="px-4 py-3 border text-left">Price Range</th>
                      <th className="px-4 py-3 border text-left">Best For</th>
                      <th className="px-4 py-3 border text-left">Return Policy</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 border font-semibold">Zenni Optical</td>
                      <td className="px-4 py-2 border">$6-$50</td>
                      <td className="px-4 py-2 border">Budget shoppers</td>
                      <td className="px-4 py-2 border">30 days, 50% refund</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-2 border font-semibold">Warby Parker</td>
                      <td className="px-4 py-2 border">$95-$145</td>
                      <td className="px-4 py-2 border">Quality & style</td>
                      <td className="px-4 py-2 border">30 days, full refund</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border font-semibold">EyeBuyDirect</td>
                      <td className="px-4 py-2 border">$20-$100</td>
                      <td className="px-4 py-2 border">Trendy styles</td>
                      <td className="px-4 py-2 border">14 days, full refund</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-2 border font-semibold">GlassesUSA</td>
                      <td className="px-4 py-2 border">$30-$200</td>
                      <td className="px-4 py-2 border">Designer brands</td>
                      <td className="px-4 py-2 border">14 days, full refund</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <h2>Common Mistakes to Avoid</h2>
              <ol>
                <li><strong>Using an old prescription</strong> - Get a current exam</li>
                <li><strong>Wrong PD measurement</strong> - Measure carefully or ask your doctor</li>
                <li><strong>Ignoring frame measurements</strong> - Check size compatibility</li>
                <li><strong>Skipping virtual try-on</strong> - Always preview frames on your face. Check out our <Link href="/blog/best-ai-virtual-glasses-tryon-tools-2025" className="text-blue-600 hover:text-blue-800">guide to the best AI virtual try-on tools</Link></li>
                <li><strong>Choosing cheapest lenses</strong> - Invest in quality coatings</li>
                <li><strong>Not reading return policy</strong> - Know your options before buying</li>
                <li><strong>Ordering just one pair</strong> - Consider a backup</li>
              </ol>
              <h2>Money-Saving Tips</h2>
              <ul>
                <li><strong>Use FSA/HSA funds</strong> - Pre-tax dollars for glasses</li>
                <li><strong>Look for first-time discounts</strong> - Many sites offer 15-20% off</li>
                <li><strong>Buy multiple pairs</strong> - Often cheaper per pair</li>
                <li><strong>Skip unnecessary upgrades</strong> - Basic coatings are often sufficient</li>
                <li><strong>Wait for sales</strong> - Black Friday, Cyber Monday, etc.</li>
                <li><strong>Use coupon codes</strong> - Search before checkout</li>
              </ul>
              <h2>What to Do When Your Glasses Arrive</h2>
              <ol>
                <li><strong>Inspect immediately</strong> - Check for damage or defects</li>
                <li><strong>Verify prescription</strong> - Make sure vision is clear</li>
                <li><strong>Check fit</strong> - Frames should be comfortable</li>
                <li><strong>Test all distances</strong> - Near, far, and intermediate</li>
                <li><strong>Wear for a few days</strong> - Allow adjustment period</li>
                <li><strong>Contact retailer if issues</strong> - Don&apos;t wait until return period ends</li>
              </ol>
              <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-8 rounded-lg my-8">
                <h3 className="text-2xl font-bold mb-4">Start Your Online Glasses Journey</h3>
                <p className="mb-6">
                  Ready to save money and get perfect-fitting glasses? Use our virtual try-on tool to find 
                  your ideal frames, then shop with confidence knowing exactly how they&apos;ll look!
                </p>
                <Link href="/" className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                  Find Your Perfect Frames →
                </Link>
              </div>
              <h2>Conclusion</h2>
              <p>
                Buying prescription glasses online is safe, convenient, and can save you hundreds of dollars.
                By following this guide - getting an accurate prescription, measuring your PD correctly, using
                virtual try-on, and choosing quality lenses - you&apos;ll get glasses that fit perfectly and
                help you see clearly.
              </p>
              <p>
                The key is taking your time, double-checking all measurements, and using tools like virtual
                try-on to make informed decisions. With thousands of satisfied customers buying glasses online
                every day, you can shop with confidence! Don&apos;t forget to consider your <Link href="/blog/how-to-choose-glasses-for-your-face" className="text-blue-600 hover:text-blue-800">face shape</Link> and <Link href="/blog/browline-clubmaster-glasses-complete-guide" className="text-blue-600 hover:text-blue-800">popular styles</Link> when selecting frames.
              </p>
              <p className="font-bold text-lg mt-6">
                Ready to save money on your next pair of glasses? Start with our virtual try-on tool today!
              </p>
            </div>
            <div className="p-8 bg-gray-50 border-t">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <BlogTags tags={articleTags} />
                <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Start Shopping
                </Link>
              </div>
            </div>
          </article>
        </main>
      </div>
    </>
  )
}

