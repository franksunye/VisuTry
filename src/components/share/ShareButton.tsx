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
    // 微信分享通常需要微信SDK，这里提供复制链接的替代方案
    handleCopyLink()
    alert("链接已复制，您可以在微信中粘贴分享")
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
        分享
      </button>
    )
  }

  return (
    <div className="relative">
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => setIsOpen(false)}
      />
      
      {/* 分享面板 */}
      <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">分享试戴效果</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* 分享链接 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            分享链接
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
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  复制
                </>
              )}
            </button>
          </div>
        </div>

        {/* 社交媒体分享 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            分享到社交媒体
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
              <span className="text-xs text-gray-600">微信</span>
            </button>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            💡 分享您的试戴效果，让朋友们也来体验VisuTry的AI试戴功能！
          </p>
        </div>
      </div>
    </div>
  )
}
