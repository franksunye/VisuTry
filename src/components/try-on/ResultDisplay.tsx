"use client"

import { Download, RotateCcw } from "lucide-react"
import { cn } from "@/utils/cn"
import { TryOnResultImage } from "@/components/OptimizedImage"
import { logger } from "@/lib/logger"

interface ResultDisplayProps {
  resultImageUrl: string
  taskId: string
  onTryAgain: () => void
  className?: string
}

export function ResultDisplay({
  resultImageUrl,
  taskId,
  onTryAgain,
  className
}: ResultDisplayProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(resultImageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = `visutry-result-${taskId}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.URL.revokeObjectURL(url)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error("Download failed:", error)
      logger.error('general', 'Download failed', err)
      alert("Download failed, please try again")
    }
  }

  return (
    <div className={cn("w-full h-full min-h-0 flex flex-col", className)}>
      <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-full min-h-0">
        {/* Keep the full result image inside the fixed-height viewport. An
            intrinsic-height image can otherwise cover the action buttons. */}
        <div data-testid="try-on-result-image-viewport" className="relative min-h-0 flex-1 overflow-hidden bg-gray-50">
          <TryOnResultImage
            src={resultImageUrl}
            alt="AI Try-On Result"
            priority={true}
            useFill={true}
            className="object-contain"
          />
        </div>

        {/* Keep actions above the image, reachable even at narrow heights. */}
        <div className="relative z-10 flex-shrink-0 border-t border-gray-100 bg-white p-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex min-h-11 items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>

            <button
              type="button"
              onClick={onTryAgain}
              className="flex min-h-11 items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
