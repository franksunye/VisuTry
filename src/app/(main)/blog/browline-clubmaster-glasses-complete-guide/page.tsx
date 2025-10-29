import { Metadata } from 'next'
import { generateSEO, generateStructuredData } from '@/lib/seo'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, History } from 'lucide-react'
import Image from 'next/image'
import BlogTags from '@/components/BlogTags'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'

export const metadata: Metadata = generateSEO({
  title: 'Browline/Clubmaster Glasses Complete Guide 2025 - Retro Style Revival',
  description: 'Discover the history, style, and modern appeal of browline/Clubmaster glasses. Learn why this retro style is making a major comeback in 2025.',
  url: '/blog/browline-clubmaster-glasses-complete-guide',
  type: 'article',
})

const structuredData = generateStructuredData('article', {
  title: 'Browline/Clubmaster Glasses Complete Guide 2025',
  description: 'Complete guide to browline and Clubmaster style eyeglasses.',
  publishedAt: '2025-10-21T18:00:00Z',
  modifiedAt: '2025-10-21T18:00:00Z',
  author: 'VisuTry Team',
  image: '/Zenni Retro Browline Glasses.jpg',
})

const articleTags = ['Browline Glasses', 'Clubmaster', 'Retro Style', 'Vintage Eyewear', 'Fashion Trends']

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
                { name: 'Browline Clubmaster Glasses Guide' },
              ]}
            />
          </div>

          <div className="mb-8">
            <Link href="/blog" className="inline-flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="w-4 h-4 mr-2" />Back to Blog
            </Link>
          </div>
          <article className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-64 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
              <div className="text-center text-white">
                <History className="w-16 h-16 mx-auto mb-4" />
                <h1 className="text-3xl font-bold">Browline/Clubmaster Guide</h1>
              </div>
            </div>
            <div className="p-8 border-b">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Author: VisuTry Team</span>
                  <span>Published: October 21, 2025</span>
                  <span>Read time: 8 min</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Browline/Clubmaster Glasses Complete Guide 2025: The Retro Style Revival
              </h1>
              <p className="text-xl text-gray-600">
                Discover why browline glasses are experiencing a major comeback. From their 1950s origins to 
                modern interpretations, learn everything about this iconic retro style.
              </p>
            </div>
            <div className="p-8 prose prose-lg max-w-none">
              <h2>The History of Browline Glasses</h2>
              <p>
                <strong>Browline glasses</strong> (also known as Clubmaster style) were first introduced in the 
                1940s and reached peak popularity in the 1950s and 1960s. According to <a href="https://www.smithsonianmag.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">Smithsonian Magazine</a>, 
                browline frames accounted for <strong>over 50% of all eyeglasses sold</strong> in America during 
                the 1950s, making them the most popular eyewear style of the era.
              </p>
              <div className="my-6">
                <Image src="/Zenni Retro Browline Glasses.jpg" alt="Retro browline glasses" width={800} height={600} className="rounded-lg shadow-md" />
              </div>
              <h2>What Defines Browline Style?</h2>
              <p>Browline glasses are characterized by:</p>
              <ul>
                <li><strong>Bold upper frame</strong> - Thick acetate or plastic on top</li>
                <li><strong>Thin lower rim</strong> - Metal wire or rimless bottom</li>
                <li><strong>Keyhole bridge</strong> - Classic vintage detail</li>
                <li><strong>Combination materials</strong> - Acetate and metal mix</li>
                <li><strong>Intellectual aesthetic</strong> - Sophisticated, scholarly look</li>
              </ul>
              <h2>Why Browline Glasses Are Trending in 2025</h2>
              <p>Several factors have contributed to the browline revival:</p>
              <h3>1. Vintage Fashion Movement</h3>
              <p>
                The broader trend toward vintage and retro fashion has brought browline glasses back into the 
                spotlight. Millennials and Gen Z consumers are embracing styles from the 1950s-1980s.
              </p>
              <h3>2. Celebrity Endorsement</h3>
              <p>Celebrities wearing browline glasses include:</p>
              <ul>
                <li><strong>Robert Downey Jr.</strong> - Frequently spotted in Clubmasters</li>
                <li><strong>Emma Watson</strong> - Wears browline frames for intellectual chic</li>
                <li><strong>Bruno Mars</strong> - Signature retro style</li>
                <li><strong>Rashida Jones</strong> - Modern browline advocate</li>
              </ul>
              <h3>3. Versatility</h3>
              <p>
                Browline glasses work across multiple contexts - professional, casual, creative - making them 
                a practical choice for modern lifestyles.
              </p>
              <h2>Ray-Ban Clubmaster: The Iconic Version</h2>
              <div className="my-6">
                <Image src="/Ray-Ban RB5154 Clubmaster - Browline Black Frame Eyeglasses.jpg" alt="Ray-Ban Clubmaster eyeglasses" width={800} height={600} className="rounded-lg shadow-md" />
              </div>
              <p>
                The <strong>Ray-Ban Clubmaster</strong> (RB5154 for optical, RB3016 for sunglasses) is the most 
                famous browline style. Introduced in the 1980s, it became an instant classic and remains one of 
                Ray-Ban&apos;s best-selling frames.
              </p>
              <h3>Clubmaster Features:</h3>
              <ul>
                <li>Premium acetate upper frame</li>
                <li>Metal lower rim and temples</li>
                <li>Available in multiple colors and sizes</li>
                <li>Price: $150-$200 for optical frames</li>
              </ul>
              <h2>Face Shapes and Browline Glasses</h2>
              <h3>Best For:</h3>
              <ul>
                <li><strong>Oval faces</strong> - The angular top adds definition</li>
                <li><strong>Square faces</strong> - Softens angular features</li>
                <li><strong>Triangle faces</strong> - Balances narrow chin</li>
              </ul>
              <h3>May Not Suit:</h3>
              <ul>
                <li><strong>Round faces</strong> - Can emphasize roundness</li>
                <li><strong>Heart-shaped faces</strong> - Top-heavy design may not balance</li>
              </ul>
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-lg my-8">
                <h3 className="text-2xl font-bold mb-4">Try Browline Styles Virtually</h3>
                <p className="mb-6">
                  See how browline/Clubmaster glasses look on your face before buying. Try multiple brands 
                  and colors with our AI-powered virtual try-on tool!
                </p>
                <Link href="/" className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                  Try Browline Styles →
                </Link>
              </div>
              <h2>Modern Browline Variations</h2>
              <h3>1. Classic Browline</h3>
              <p>Traditional 1950s style with thick acetate top and thin metal bottom.</p>
              <h3>2. Contemporary Clubmaster</h3>
              <p>Updated proportions with modern materials and colors.</p>
              <h3>3. Oversized Browline</h3>
              <p>Larger frames for a bold, fashion-forward statement.</p>
              <h3>4. Minimalist Browline</h3>
              <p>Subtle interpretation with thinner upper frame.</p>
              <h2>Where to Buy Browline Glasses</h2>
              <h3>Luxury Options ($200-$500)</h3>
              <ul>
                <li><strong>Ray-Ban Clubmaster</strong> - The original and best</li>
                <li><strong>Oliver Peoples</strong> - Premium browline variations</li>
                <li><strong>Moscot Yukel</strong> - Vintage-inspired quality</li>
              </ul>
              <h3>Mid-Range ($80-$200)</h3>
              <ul>
                <li><strong>Warby Parker Ames</strong> - Modern take on classic style</li>
                <li><strong>Persol</strong> - Italian craftsmanship</li>
              </ul>
              <h3>Budget-Friendly ($20-$80)</h3>
              <ul>
                <li><strong>Zenni Optical</strong> - Affordable browline options</li>
                <li><strong>EyeBuyDirect</strong> - Trendy budget frames</li>
              </ul>
              <h2>Styling Browline Glasses</h2>
              <h3>Professional Look</h3>
              <ul>
                <li>Pair with suits and dress shirts</li>
                <li>Choose classic colors: black, tortoise</li>
                <li>Perfect for business meetings and presentations</li>
              </ul>
              <h3>Casual Style</h3>
              <ul>
                <li>Works with jeans and t-shirts</li>
                <li>Try colorful acetate options</li>
                <li>Great for coffee shops and creative spaces</li>
              </ul>
              <h3>Vintage Aesthetic</h3>
              <ul>
                <li>Combine with retro clothing</li>
                <li>Choose authentic vintage colors</li>
                <li>Perfect for themed events</li>
              </ul>
              <h2>Conclusion</h2>
              <p>
                <strong>Browline/Clubmaster glasses</strong> represent a perfect blend of vintage charm and 
                modern sophistication. Whether you choose the iconic Ray-Ban Clubmaster or a contemporary 
                variation, these frames offer timeless style that works across decades and occasions.
              </p>
              <p className="font-bold text-lg mt-6">
                Ready to join the browline revival? Try these iconic frames virtually and find your perfect match!
              </p>
            </div>
            <div className="p-8 bg-gray-50 border-t">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <BlogTags tags={articleTags} />
                <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Try Browline Styles
                </Link>
              </div>
            </div>
          </article>
        </main>
      </div>
    </>
  )
}

