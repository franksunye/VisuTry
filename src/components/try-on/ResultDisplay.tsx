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
      console.error("下载失败:", error)
      alert("下载失败，请重试")
    }
  }

  const handleShare = async (platform: "twitter" | "facebook" | "copy") => {
    setSharing(true)
    
    try {
      // 生成分享链接
      const shareUrl = `${window.location.origin}/share/${taskId}`
      const shareText = "看看我用VisuTry AI试戴的眼镜效果！"
      
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
      console.error("分享失败:", error)
      alert("分享失败，请重试")
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
      console.error("反馈失败:", error)
    }
  }

  return (
    <div className={cn("max-w-4xl mx-auto", className)}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          试戴完成！
        </h2>
        <p className="text-gray-600">
          AI为您生成了专属的试戴效果，您觉得怎么样？
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* 结果图片 */}
        <div className="relative">
          <img
            src={resultImageUrl}
            alt="AI试戴结果"
            className="w-full h-auto max-h-96 object-contain bg-gray-50"
          />
          
          {/* 浮动操作按钮 */}
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

        {/* 操作区域 */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 主要操作 */}
            <div className="flex-1 grid grid-cols-2 gap-3">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-5 h-5 mr-2" />
                下载图片
              </button>
              
              <button
                onClick={onTryAgain}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                重新试戴
              </button>
            </div>

            {/* 分享操作 */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleShare("twitter")}
                disabled={sharing}
                className="flex items-center justify-center w-12 h-12 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                <Twitter className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => handleShare("facebook")}
                disabled={sharing}
                className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Facebook className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => handleShare("copy")}
                disabled={sharing}
                className="flex items-center justify-center w-12 h-12 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* 提示信息 */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 提示：您可以下载图片保存到本地，或者分享给朋友看看效果！
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
