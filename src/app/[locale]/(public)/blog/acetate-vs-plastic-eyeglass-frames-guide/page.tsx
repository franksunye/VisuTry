import { blogArt } from '@/config/blog-art'
import { Metadata } from 'next'
import { generateI18nSEO, generateStructuredData, SITE_CONFIG } from '@/lib/seo'
import Link from '@/components/layout/PublicLink'
import Image from 'next/image'
import BlogTags from '@/components/BlogTags'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { localizedPath } from '@/lib/localized-path'

export const dynamic = 'force-static'

const cover = blogArt['acetate-vs-plastic-eyeglass-frames-guide']

const title = 'Acetate vs Plastic Eyeglass Frames: What to Compare'
const description = 'Acetate is one kind of plastic. Learn what zyl means, how sheet acetate differs from molded frames, and which details to check when comparing two pairs.'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return generateI18nSEO({
    locale: params.locale as any,
    title,
    description,
    image: cover.src,
    imageAlt: cover.alt,
    imageWidth: cover.width,
    imageHeight: cover.height,
    pathname: '/blog/acetate-vs-plastic-eyeglass-frames-guide',
    type: 'article',
  })
}

const structuredData = generateStructuredData('article', {
  title,
  description,
  publishedAt: '2025-10-24T17:00:00Z',
  modifiedAt: '2026-11-16T00:00:00Z',
  author: 'VisuTry Team',
  image: `${SITE_CONFIG.url}${cover.src}`,
})

const articleTags = ['Eyeglass Materials', 'Frame Guide', 'Acetate Frames', 'Buying Guide', 'Eyewear Education']

type BlogPostPageProps = {
  params: { locale: string }
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  return (
    <>
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
                { name: 'Blog', url: localizedPath(params.locale, '/blog') },
                { name: 'Acetate vs Plastic Frames Guide' },
              ]}
            />
          </div>

          <article className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">

            <div className="p-8 border-b">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-x-4 text-sm text-gray-600">
                  <span>Author: VisuTry Team</span>
                  <span>Published: October 24, 2025</span>
                  <span>Updated: November 16, 2026</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {title}
              </h1>
              <p className="text-xl text-gray-600">
                One pair says “acetate” and the other says “plastic.” Those labels can describe the same material.
                For a useful comparison, start with the full material name and how the frame is made.
              </p>
            </div>

            <div className="p-8 prose prose-lg max-w-none">
              <h2>What does acetate mean on a frame label?</h2>
              <p>
                Cellulose acetate is a plastic made using cellulose from sources such as wood or cotton.
                In eyewear, “zyl” usually means cellulose acetate. A retailer might list the same pair as
                “zyl,” “acetate” or simply “plastic.” See the{' '}
                <a href="https://onlinelibrary.wiley.com/doi/10.1111/j.1600-0536.2006.00791.x">review of spectacle-frame materials</a> for these terms.
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
                <figcaption className="mt-2 text-center text-sm text-gray-600">This VisuTry style example shows color and rim thickness. A photograph alone cannot identify which plastic was used.</figcaption>
              </figure>
              <h2>Sheet acetate and molded frames</h2>
              <p>
                Sheet acetate can include layers of different colors. A maker cuts the frame front from the sheet,
                then shapes and polishes it. This can create translucent edges or a mottled tortoiseshell pattern
                that varies between pairs. Material supplier{' '}
                <a href="https://www.mazzucchelli1849.it/pages/materials-and-processing-creative-case">Mazzucchelli describes how it produces patterned acetate sheets</a>.
              </p>
              <p>
                Injection molding forms a frame part in a mold. A manufacturer may use nylon or another plastic.
                “Injection molded” describes the process, while “nylon” or “acetate” names a material.
                If the product page gives only the process, ask what the front and temples are made of.
              </p>
              <h2>How to compare two frames before buying</h2>
              <ul>
                <li><strong>For a lighter pair,</strong> ask for the frame weight in your size. Check whether the quoted weight includes lenses.</li>
                <li><strong>For a comfortable bridge,</strong> compare the shape of the nose contact area with a pair that sits well. Ask your optician which parts of the new frame they can adjust.</li>
                <li><strong>For a distinctive finish,</strong> look at the front, edge and temple photos. Ask whether the pictured finish varies from one frame to the next.</li>
                <li><strong>For long-term use,</strong> check the hinge construction, the availability of replacement temples and what the seller covers if a part breaks.</li>
              </ul>
              <p>
                For example, a broad acetate front with thick temples and a slender molded nylon frame can have very
                different weights even if the lenses are the same width. Compare those two models in your size
                before judging comfort or value from the material label.
              </p>
              <h2>Compare the look on your face</h2>
              <p>
                Use a clear portrait and a front-facing product image to compare the rim color and shape.
                Confirm the material, weight and fit with the seller. If you are ordering lenses too, see the{' '}
                <Link href={localizedPath(params.locale, '/blog/prescription-glasses-online-shopping-guide-2025')}>prescription glasses buying guide</Link>.
              </p>
            </div>

            <div className="p-8 bg-gray-50 border-t">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <BlogTags tags={articleTags} />
                <Link
                  href={localizedPath(params.locale, '/try-glasses-on-photo')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Preview a frame on your photo
                </Link>
              </div>
            </div>
          </article>
        </main>
      </div>
    </>
  )
}
