'use client'

import { useEffect, useState } from 'react'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import {
  generateCategoryTitle,
  generateCategoryDescription,
  generateCollectionPageSchema,
  generateCanonicalUrl,
  generateCategorySlug,
  unslugify,
  slugify,
} from '@/lib/programmatic-seo'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface CategoryPageProps {
  params: {
    category: string
  }
}

// Generate static params for all categories
export async function generateStaticParams() {
  const categories = await prisma.glassesCategory.findMany({
    select: { name: true },
  })

  return categories.map(cat => ({
    category: generateCategorySlug(cat.name),
  }))
}

// Generate metadata
export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const categoryName = unslugify(params.category)
  const category = await prisma.glassesCategory.findFirst({
    where: { name: { equals: categoryName, mode: 'insensitive' } },
  })

  if (!category) {
    return {
      title: 'Category Not Found',
      description: 'The category you are looking for does not exist.',
    }
  }

  const title = generateCategoryTitle(category.displayName)
  const description = generateCategoryDescription(category.displayName)
  const url = `/category/${params.category}`
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

export default function CategoryPage({ params }: CategoryPageProps) {
  const [category, setCategory] = useState<any>(null)
  const [frames, setFrames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoryName = unslugify(params.category)

        // Fetch category
        const categoryResponse = await fetch('/api/glasses/categories')
        const categoryData = await categoryResponse.json()

        if (!categoryData.success) {
          setError('Failed to load category')
          return
        }

        const foundCategory = categoryData.data.find(
          (c: any) => c.name.toLowerCase() === categoryName.toLowerCase()
        )

        if (!foundCategory) {
          setError('Category not found')
          return
        }

        setCategory(foundCategory)

        // Fetch frames for this category
        const framesResponse = await fetch('/api/glasses/frames')
        const framesData = await framesResponse.json()

        if (framesData.success) {
          const categoryFrames = framesData.data.filter((frame: any) =>
            frame.category?.toLowerCase() === categoryName.toLowerCase()
          )
          setFrames(categoryFrames)
        }
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

  if (error || !category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The category you are looking for does not exist.'}</p>
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
        <span className="text-gray-900">{category.displayName}</span>
      </div>

      {/* Back Button */}
      <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Link>

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{category.displayName}</h1>
        {category.description && (
          <p className="text-lg text-gray-600">{category.description}</p>
        )}
      </div>

      {/* Frames Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Available {category.displayName} ({frames.length})
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
                  <p className="text-sm text-gray-600 mt-1">{frame.brand}</p>
                  {frame.price && (
                    <p className="text-lg font-bold text-gray-900 mt-2">${frame.price}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No glasses found in this category yet.</p>
        )}
      </div>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateCollectionPageSchema({
              name: category.displayName,
              description: category.description || `${category.displayName} glasses`,
              url: generateCanonicalUrl(`/category/${params.category}`),
              itemCount: frames.length,
            })
          ),
        }}
      />
    </div>
  )
}

