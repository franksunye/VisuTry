"use client"

import { useState } from "react"
import { Share2, Copy, Check, Twitter, Facebook, MessageCircle } from "lucide-react"
import { cn } from "@/utils/cn"

interface ShareButtonProps {
  taskId: string
  className?: string
}

export function ShareButton({ taskId, className }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = `${window.location.origin}/share/${taskId}`
  const shareText = "Check out my AI glasses try-on result with VisuTry!"

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Copy failed:", error)
    }
  }

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    window.open(twitterUrl, "_blank", "width=550,height=420")
  }

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    window.open(facebookUrl, "_blank", "width=550,height=420")
  }

  const handleWeChatShare = () => {
    // WeChat sharing typically requires WeChat SDK, here we provide a copy link alternative
    handleCopyLink()
    alert("Link copied! You can paste and share it in WeChat")
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors",
          className
        )}
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share
      </button>
    )
  }

  return (
    <div className="relative">
      {/* Background Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => setIsOpen(false)}
      />

      {/* Share Panel */}
      <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Share Try-On Result</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Share Link */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Share Link
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
            />
            <button
              onClick={handleCopyLink}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Social Media Share */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Share to Social Media
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleTwitterShare}
              className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Twitter className="w-6 h-6 text-blue-500 mb-1" />
              <span className="text-xs text-gray-600">Twitter</span>
            </button>

            <button
              onClick={handleFacebookShare}
              className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Facebook className="w-6 h-6 text-blue-600 mb-1" />
              <span className="text-xs text-gray-600">Facebook</span>
            </button>

            <button
              onClick={handleWeChatShare}
              className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MessageCircle className="w-6 h-6 text-green-500 mb-1" />
              <span className="text-xs text-gray-600">WeChat</span>
            </button>
          </div>
        </div>

        {/* Tip Message */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            💡 Share your try-on result and let your friends experience VisuTry&apos;s AI try-on feature!
          </p>
        </div>
      </div>
    </div>
  )
}
