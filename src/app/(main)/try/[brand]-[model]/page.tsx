'use client'

import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import {
  generateFrameTitle,
  generateFrameDescription,
  generateProductSchema,
  generateBreadcrumbSchema,
  generateCanonicalUrl,
  parseFrameSlug,
  slugify,
} from '@/lib/programmatic-seo'
import { SITE_CONFIG } from '@/lib/seo'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Glasses, Heart } from 'lucide-react'

interface ProductPageProps {
  params: {
    'brand-model': string
  }
}

// Generate static params for all frames
export async function generateStaticParams() {
  const frames = await prisma.glassesFrame.findMany({
    where: { isActive: true },
    select: { brand: true, model: true },
  })

  return frames.map(frame => ({
    'brand-model': `${slugify(frame.brand || '')}-${slugify(frame.model || '')}`,
  }))
}

// Generate metadata
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const slug = params['brand-model']
  const parsed = parseFrameSlug(slug)

  if (!parsed) {
    return {
      title: 'Product Not Found',
      description: 'The product you are looking for does not exist.',
    }
  }

  const frame = await prisma.glassesFrame.findFirst({
    where: {
      brand: { equals: parsed.brand, mode: 'insensitive' },
      model: { equals: parsed.model, mode: 'insensitive' },
    },
  })

  if (!frame) {
    return {
      title: 'Product Not Found',
      description: 'The product you are looking for does not exist.',
    }
  }

  const title = generateFrameTitle(frame.brand || '', frame.model || '')
  const description = generateFrameDescription(frame.brand || '', frame.model || '')
  const url = `/try/${slug}`
  const canonicalUrl = generateCanonicalUrl(url)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [frame.imageUrl],
      url: canonicalUrl,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [frame.imageUrl],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  const [frame, setFrame] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFrame = async () => {
      try {
        const slug = params['brand-model']
        const parsed = parseFrameSlug(slug)

        if (!parsed) {
          setError('Invalid product URL')
          return
        }

        const response = await fetch('/api/glasses/frames')
        const data = await response.json()

        if (!data.success) {
          setError('Failed to load product')
          return
        }

        const foundFrame = data.data.find(
          (f: any) =>
            f.brand?.toLowerCase() === parsed.brand.toLowerCase() &&
            f.model?.toLowerCase() === parsed.model.toLowerCase()
        )

        if (!foundFrame) {
          setError('Product not found')
          return
        }

        setFrame(foundFrame)
      } catch (err) {
        setError('Failed to load product')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchFrame()
  }, [params])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    )
  }

  if (error || !frame) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center text-sm text-gray-600">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/brand/${slugify(frame.brand || '')}`} className="hover:text-gray-900">
          {frame.brand}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{frame.name}</span>
      </div>

      {/* Back Button */}
      <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Product Image */}
        <div className="flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden h-96">
          <Image
            src={frame.imageUrl}
            alt={frame.name}
            width={400}
            height={400}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{frame.name}</h1>
          <p className="text-gray-600 mb-4">{frame.description}</p>

          {/* Product Details */}
          <div className="space-y-3 mb-6">
            {frame.brand && (
              <div>
                <span className="font-semibold text-gray-700">Brand:</span>
                <span className="ml-2 text-gray-600">{frame.brand}</span>
              </div>
            )}
            {frame.model && (
              <div>
                <span className="font-semibold text-gray-700">Model:</span>
                <span className="ml-2 text-gray-600">{frame.model}</span>
              </div>
            )}
            {frame.category && (
              <div>
                <span className="font-semibold text-gray-700">Category:</span>
                <Link
                  href={`/category/${slugify(frame.category)}`}
                  className="ml-2 text-blue-600 hover:text-blue-700"
                >
                  {frame.category}
                </Link>
              </div>
            )}
            {frame.style && (
              <div>
                <span className="font-semibold text-gray-700">Style:</span>
                <span className="ml-2 text-gray-600">{frame.style}</span>
              </div>
            )}
            {frame.material && (
              <div>
                <span className="font-semibold text-gray-700">Material:</span>
                <span className="ml-2 text-gray-600">{frame.material}</span>
              </div>
            )}
            {frame.color && (
              <div>
                <span className="font-semibold text-gray-700">Color:</span>
                <span className="ml-2 text-gray-600">{frame.color}</span>
              </div>
            )}
            {frame.price && (
              <div>
                <span className="font-semibold text-gray-700">Price:</span>
                <span className="ml-2 text-gray-600">${frame.price}</span>
              </div>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4">
            <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center">
              <Glasses className="w-5 h-5 mr-2" />
              Try On Virtually
            </button>
            <button className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition flex items-center justify-center">
              <Heart className="w-5 h-5 mr-2" />
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Face Shapes */}
      {frame.faceShapes && frame.faceShapes.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended for Face Shapes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {frame.faceShapes.map((rec: any) => (
              <Link
                key={rec.faceShape.id}
                href={`/style/${slugify(rec.faceShape.name)}`}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition"
              >
                <p className="font-semibold text-gray-900">{rec.faceShape.displayName}</p>
                {rec.reason && <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateProductSchema({
              name: frame.name,
              description: frame.description || '',
              image: frame.imageUrl,
              brand: frame.brand || 'Unknown',
              price: frame.price,
              url: generateCanonicalUrl(`/try/${params['brand-model']}`),
            })
          ),
        }}
      />
    </div>
  )
}

