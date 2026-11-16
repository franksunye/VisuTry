import { blogArt } from '@/config/blog-art'
import { Metadata } from 'next'
import { generateStructuredData, generateI18nSEO, SITE_CONFIG } from '@/lib/seo'
import Link from '@/components/layout/PublicLink'
import { History } from 'lucide-react'
import Image from 'next/image'
import BlogTags from '@/components/BlogTags'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'

export const dynamic = 'force-static'

const cover = blogArt['browline-clubmaster-glasses-complete-guide']

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return generateI18nSEO({
    locale: params.locale as any,
    title: 'Browline/Clubmaster Glasses Complete Guide 2025 - Retro Style Revival',
    description: 'Discover the history, style, and modern appeal of browline/Clubmaster glasses. Learn why this retro style is making a major comeback in 2025.',
    image: cover.src,
    imageAlt: cover.alt,
    imageWidth: cover.width,
    imageHeight: cover.height,
    pathname: '/blog/browline-clubmaster-glasses-complete-guide',
    type: 'article',
  })
}

const structuredData = generateStructuredData('article', {
  title: 'Browline/Clubmaster Glasses Complete Guide 2025',
  description: 'Complete guide to browline and Clubmaster style eyeglasses.',
  publishedAt: '2025-10-21T18:00:00Z',
  modifiedAt: '2025-10-21T18:00:00Z',
  author: 'VisuTry Team',
  image: `${SITE_CONFIG.url}${cover.src}`,
})

const articleTags = ['Browline Glasses', 'Clubmaster', 'Retro Style', 'Vintage Eyewear', 'Fashion Trends']

export default function BlogPostPage({ params }: { params: { locale: string } }) {
  const localePrefix = `/${params.locale}`

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <main className="container mx-auto px-4 py-12">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <Breadcrumbs
              items={[
                { name: 'Blog', url: `${localePrefix}/blog` },
                { name: 'Browline Clubmaster Glasses Guide' },
              ]}
            />
          </div>

          <article className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-8 border-b">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-x-4 text-sm text-gray-600">
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
                Browline frames take their name from the prominent upper rim. The slimmer lower rim gives the lenses a lighter outline, creating the two-part silhouette associated with mid-century eyewear.
              </p>
              <figure className="my-6">
                <Image
                  src={cover.src}
                  alt={cover.alt}
                  width={cover.width}
                  height={cover.height}
                  sizes="(max-width: 640px) 85vw, 480px"
                  className="mx-auto h-auto max-h-72 w-full max-w-lg object-contain"
                />
                <figcaption className="mt-2 text-center text-sm text-gray-600">A VisuTry style example shows how a dark upper rim gives a browline frame its shape.</figcaption>
              </figure>
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
              <p>
                Ray-Ban makes both the{' '}
                <a href="https://www.ray-ban.com/usa/eyeglasses/RX5154%20UNISEX%20clubmaster%20optics-black/8053672195736">Clubmaster Optics RB5154</a>{' '}
                and the <a href="https://www.ray-ban.com/usa/sunglasses/RB3016clubmasterclassic-blackongold/805289304449">Clubmaster Classic RB3016 sunglasses</a>.
                The brand’s product photos show the differences in lenses, rims and hardware. For a comparison with other silhouettes, see our{' '}
                <Link href={`${localePrefix}/blog/rayban-glasses-virtual-tryon-guide`}>Ray-Ban style guide</Link>.
              </p>
              <h2>Face Shapes and Browline Glasses</h2>
              <p>
                Not sure if browline glasses suit your face shape? Check out our <Link href={`${localePrefix}/blog/how-to-choose-glasses-for-your-face`} className="text-blue-600 hover:text-blue-800">complete face shape guide</Link> to learn more.
              </p>
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
                <Link href={`${localePrefix}/try-glasses-on-photo`} className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">
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
                variation, these frames offer timeless style that works across decades and occasions. For more style inspiration, check out our <Link href={`${localePrefix}/blog/celebrity-glasses-style-guide-2025`} className="text-blue-600 hover:text-blue-800">celebrity glasses style guide</Link>.
              </p>
              <p className="font-bold text-lg mt-6">
                Ready to join the browline revival? Try these iconic frames virtually with our <Link href={`${localePrefix}/blog/best-ai-virtual-glasses-tryon-tools-2025`} className="text-blue-600 hover:text-blue-800">AI virtual try-on tools</Link> and find your perfect match!
              </p>
            </div>
            <div className="p-8 bg-gray-50 border-t">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <BlogTags tags={articleTags} />
                <Link href={`${localePrefix}/try-glasses-on-photo`} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
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
