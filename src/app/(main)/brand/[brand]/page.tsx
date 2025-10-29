import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import {
  generateBrandTitle,
  generateBrandDescription,
  generateCollectionPageSchema,
  generateCanonicalUrl,
  generateBrandSlug,
  unslugify,
  slugify,
} from '@/lib/programmatic-seo'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface BrandPageProps {
  params: {
    brand: string
  }
}

// Generate static params for all brands
export async function generateStaticParams() {
  const brands = await prisma.glassesFrame.findMany({
    where: { isActive: true },
    distinct: ['brand'],
    select: { brand: true },
  })

  return brands
    .filter((b): b is { brand: string } => b.brand !== null && b.brand !== undefined)
    .map(b => ({
      brand: generateBrandSlug(b.brand),
    }))
}

// Generate metadata
export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const brandName = unslugify(params.brand)
  const frames = await prisma.glassesFrame.findMany({
    where: {
      brand: { equals: brandName, mode: 'insensitive' },
      isActive: true,
    },
    take: 1,
  })

  if (frames.length === 0) {
    return {
      title: 'Brand Not Found',
      description: 'The brand you are looking for does not exist.',
    }
  }

  const title = generateBrandTitle(brandName)
  const description = generateBrandDescription(brandName)
  const url = `/brand/${params.brand}`
  const canonicalUrl = generateCanonicalUrl(url)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

export default async function BrandPage({ params }: BrandPageProps) {
  const brandName = unslugify(params.brand)

  const frames = await prisma.glassesFrame.findMany({
    where: {
      isActive: true,
      brand: { equals: brandName, mode: 'insensitive' },
    },
  })

  if (frames.length === 0) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center text-sm text-gray-600">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{brandName}</span>
      </div>

      {/* Back Button */}
      <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Link>

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{brandName}</h1>
        <p className="text-lg text-gray-600">
          Explore {brandName} glasses and try them on virtually with VisuTry
        </p>
      </div>

      {/* Frames Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {brandName} Models ({frames.length})
        </h2>

        {frames.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {frames.map(frame => (
              <Link
                key={frame.id}
                href={`/try/${slugify(frame.brand || '')}-${slugify(frame.model || '')}`}
                className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
              >
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  <Image
                    src={frame.imageUrl}
                    alt={frame.name}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                    {frame.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{frame.model}</p>
                  {frame.category && (
                    <p className="text-xs text-gray-500 mt-1">{frame.category}</p>
                  )}
                  {frame.price && (
                    <p className="text-lg font-bold text-gray-900 mt-2">${frame.price}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No glasses found for this brand yet.</p>
        )}
      </div>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateCollectionPageSchema({
              name: `${brand} Glasses`,
              description: `Explore ${brand} glasses and try them on virtually with VisuTry`,
              url: generateCanonicalUrl(`/brand/${params.brand}`),
              itemCount: frames.length,
            })
          ),
        }}
      />
    </div>
  )
}

