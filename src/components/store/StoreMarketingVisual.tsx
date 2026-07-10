'use client'

import { useState } from 'react'
import { ImageIcon, Sparkles } from 'lucide-react'

interface StoreMarketingVisualProps {
  src: string
  alt: string
  label: string
  description: string
  aspectClass?: string
  priority?: boolean
}

export function StoreMarketingVisual({
  src,
  alt,
  label,
  description,
  aspectClass = 'aspect-[4/3]',
  priority = false,
}: StoreMarketingVisualProps) {
  const [hasError, setHasError] = useState(false)

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-blue-950/5 ${aspectClass}`}>
      {!hasError ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="flex h-full min-h-72 flex-col items-center justify-center bg-gradient-to-br from-white via-blue-50/60 to-white p-8 text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600 shadow-sm">
            <ImageIcon className="h-5 w-5" />
          </span>
          <p className="text-sm font-bold text-gray-950">{label}</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-gray-600">{description}</p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            Image asset ready to add
          </div>
        </div>
      )}
    </div>
  )
}
