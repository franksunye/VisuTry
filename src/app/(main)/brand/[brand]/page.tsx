'use client'

import { useEffect, useState } from 'react'
import type { Metadata } from 'next'
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

export default function BrandPage({ params }: BrandPageProps) {
  const [brand, setBrand] = useState<string | null>(null)
  const [frames, setFrames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const brandName = unslugify(params.brand)

        // Fetch frames for this brand
        const framesResponse = await fetch('/api/glasses/frames')
        const framesData = await framesResponse.json()

        if (!framesData.success) {
          setError('Failed to load brand')
          return
        }

        const brandFrames = framesData.data.filter(
          (frame: any) => frame.brand?.toLowerCase() === brandName.toLowerCase()
        )

        if (brandFrames.length === 0) {
          setError('Brand not found')
          return
        }

        setBrand(brandName)
        setFrames(brandFrames)
      } catch (err) {
        setError('Failed to load data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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

  if (error || !brand) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Brand Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The brand you are looking for does not exist.'}</p>
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
        <span className="text-gray-900">{brand}</span>
      </div>

      {/* Back Button */}
      <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Link>

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{brand}</h1>
        <p className="text-lg text-gray-600">
          Explore {brand} glasses and try them on virtually with VisuTry
        </p>
      </div>

      {/* Frames Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {brand} Models ({frames.length})
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

