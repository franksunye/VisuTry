import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { generateStructuredData } from '@/lib/seo'

export interface BreadcrumbItem {
  name: string
  url?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

/**
 * Breadcrumbs component with Schema.org structured data
 * Improves SEO and user navigation
 */
export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  // Always include Home as the first item
  const allItems: BreadcrumbItem[] = [
    { name: 'Home', url: '/' },
    ...items,
  ]

  // Generate structured data
  const breadcrumbSchema = generateStructuredData('breadcrumbList', {
    items: allItems,
  })

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Visual Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className={`flex items-center space-x-2 text-sm ${className}`}
      >
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1
          const isFirst = index === 0

          return (
            <div key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
              )}
              
              {isLast ? (
                <span className="text-gray-600 font-medium" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.url || '/'}
                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                >
                  {isFirst && <Home className="w-4 h-4 mr-1" />}
                  {item.name}
                </Link>
              )}
            </div>
          )
        })}
      </nav>
    </>
  )
}

