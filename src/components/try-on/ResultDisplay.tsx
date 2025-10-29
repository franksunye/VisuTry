"use client"

import { useState } from "react"
import { Download, Share2, RotateCcw, Heart, Twitter, Facebook, Copy, Check } from "lucide-react"
import { cn } from "@/utils/cn"

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
  const [liked, setLiked] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState(false)

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

  const handleShare = async (platform: "twitter" | "facebook" | "copy") => {
    setSharing(true)

    try {
      // Generate share link
      const shareUrl = `${window.location.origin}/share/${taskId}`
      const shareText = "Check out my AI glasses try-on result with VisuTry!"

      switch (platform) {
        case "twitter":
          const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
          window.open(twitterUrl, "_blank")
          break

        case "facebook":
          const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
          window.open(facebookUrl, "_blank")
          break

        case "copy":
          await navigator.clipboard.writeText(shareUrl)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
          break
      }
    } catch (error) {
      console.error("Share failed:", error)
      alert("Share failed, please try again")
    } finally {
      setSharing(false)
    }
  }

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/try-on/${taskId}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ liked: !liked }),
      })
      
      if (response.ok) {
        setLiked(!liked)
      }
    } catch (error) {
      console.error("Feedback failed:", error)
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Your Result
        </h2>
        <p className="text-gray-600 text-sm">
          How does it look?
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Result Image */}
        <div className="relative">
          <img
            src={resultImageUrl}
            alt="AI Try-On Result"
            className="w-full h-auto object-contain bg-gray-50"
          />

          {/* Floating Action Button */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <button
              onClick={handleLike}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                liked
                  ? "bg-red-500 text-white"
                  : "bg-white bg-opacity-80 text-gray-600 hover:bg-opacity-100"
              )}
            >
              <Heart className={cn("w-5 h-5", liked && "fill-current")} />
            </button>
          </div>
        </div>

        {/* Action Area */}
        <div className="p-4">
          <div className="flex flex-col gap-3">
            {/* Primary Actions */}
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

            {/* Share Actions */}
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => handleShare("twitter")}
                disabled={sharing}
                className="flex items-center justify-center w-10 h-10 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
                title="Share on Twitter"
              >
                <Twitter className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleShare("facebook")}
                disabled={sharing}
                className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                title="Share on Facebook"
              >
                <Facebook className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleShare("copy")}
                disabled={sharing}
                className="flex items-center justify-center w-10 h-10 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                title="Copy link"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
