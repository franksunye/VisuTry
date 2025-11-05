import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import {
  generateFaceShapeTitle,
  generateFaceShapeDescription,
  generateCollectionPageSchema,
  generateCanonicalUrl,
  generateFaceShapeSlug,
  unslugify,
  slugify,
} from '@/lib/programmatic-seo'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface FaceShapePageProps {
  params: {
    faceShape: string
  }
}

// Generate static params for all face shapes
export async function generateStaticParams() {
  const shapes = await prisma.faceShape.findMany({
    select: { name: true },
  })

  return shapes.map(shape => ({
    faceShape: generateFaceShapeSlug(shape.name),
  }))
}

// Generate metadata
export async function generateMetadata({
  params,
}: FaceShapePageProps): Promise<Metadata> {
  const shapeName = unslugify(params.faceShape)
  const shape = await prisma.faceShape.findFirst({
    where: { name: { equals: shapeName, mode: 'insensitive' } },
  })

  if (!shape) {
    return {
      title: 'Face Shape Not Found',
      description: 'The face shape you are looking for does not exist.',
    }
  }

  const title = generateFaceShapeTitle(shape.displayName)
  const description = generateFaceShapeDescription(shape.displayName)
  const url = `/style/${params.faceShape}`
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

export default async function FaceShapePage({ params }: FaceShapePageProps) {
  const shapeName = unslugify(params.faceShape)

  const shape = await prisma.faceShape.findFirst({
    where: { name: { equals: shapeName, mode: 'insensitive' } },
  })

  if (!shape) {
    notFound()
  }

  const frames = await prisma.glassesFrame.findMany({
    where: {
      isActive: true,
      faceShapes: {
        some: {
          faceShape: {
            name: { equals: shapeName, mode: 'insensitive' },
          },
        },
      },
    },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center text-sm text-gray-600">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{shape.displayName}</span>
      </div>

      {/* Back Button */}
      <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Link>

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{shape.displayName} Face</h1>
        {shape.description && (
          <p className="text-lg text-gray-600 mb-4">{shape.description}</p>
        )}
        {shape.characteristics && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Characteristics:</h3>
            <p className="text-gray-700">{shape.characteristics}</p>
          </div>
        )}
      </div>

      {/* Recommended Frames */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Best Glasses for {shape.displayName} Face ({frames.length})
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
          <p className="text-gray-600">No glasses found for this face shape yet.</p>
        )}
      </div>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateCollectionPageSchema({
              name: `${shape.displayName} Face Glasses`,
              description: shape.description || `Best glasses for ${shape.displayName} face shapes`,
              url: generateCanonicalUrl(`/style/${params.faceShape}`),
              itemCount: frames.length,
            })
          ),
        }}
      />
    </div>
  )
}

