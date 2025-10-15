"use client"

import { useState } from "react"
import { ExternalLink, Calendar, Glasses } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { enUS } from "date-fns/locale"

interface TryOnItem {
  id: string
  resultImageUrl: string | null
  userImageUrl: string
  glassesImageUrl: string | null
  createdAt: Date
  metadata?: any
}

interface PublicTryOnGalleryProps {
  tryOns: TryOnItem[]
}

export function PublicTryOnGallery({ tryOns }: PublicTryOnGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  if (tryOns.length === 0) {
    return (
      <div className="p-12 text-center">
        <Glasses className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Public Works Yet
        </h3>
        <p className="text-gray-500">
          This user hasn&apos;t shared any try-on works yet
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tryOns.map((tryOn) => (
            <div
              key={tryOn.id}
              className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={() => setSelectedImage(tryOn.resultImageUrl)}
            >
              <img
                src={tryOn.resultImageUrl || tryOn.userImageUrl}
                alt="Try-on work"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <ExternalLink className="w-8 h-8 text-white" />
                </div>
              </div>
              
              {/* Time label */}
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                  {formatDistanceToNow(new Date(tryOn.createdAt), {
                    addSuffix: true,
                    locale: enUS
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 图片预览模态框 */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Try-on work preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            
            {/* Close button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75 transition-colors"
            >
              ✕
            </button>
            
            {/* 查看详情按钮 */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-center">
              <Link
                href={`/share/${tryOns.find(t => t.resultImageUrl === selectedImage)?.id}`}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                查看详情
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
