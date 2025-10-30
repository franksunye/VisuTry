"use client"

import { Download, RotateCcw } from "lucide-react"
import { cn } from "@/utils/cn"
import { TryOnResultImage } from "@/components/OptimizedImage"

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
      console.error("Download failed:", error)
      alert("Download failed, please try again")
    }
  }

  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-full">
        {/* Result Image - Optimized with Next.js Image (responsive layout) */}
        <div className="relative flex-1 bg-gray-50 min-h-0">
          <TryOnResultImage
            src={resultImageUrl}
            alt="AI Try-On Result"
            priority={true}
            useFill={false}
            className="w-full h-auto"
          />
        </div>

        {/* Action Area */}
        <div className="p-4 flex-shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>

            <button
              onClick={onTryAgain}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
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
