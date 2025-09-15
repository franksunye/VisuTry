"use client"

import { useState, useEffect } from "react"
import { Check, Loader2 } from "lucide-react"
import { cn } from "@/utils/cn"

interface GlassesFrame {
  id: string
  name: string
  imageUrl: string
  category?: string
  brand?: string
}

interface FrameSelectorProps {
  selectedFrameId: string | null
  onFrameSelect: (frameId: string) => void
  disabled?: boolean
  className?: string
}

export function FrameSelector({
  selectedFrameId,
  onFrameSelect,
  disabled = false,
  className
}: FrameSelectorProps) {
  const [frames, setFrames] = useState<GlassesFrame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  useEffect(() => {
    fetchFrames()
  }, [])

  const fetchFrames = async () => {
    try {
      const response = await fetch("/api/frames")
      const data = await response.json()
      
      if (data.success) {
        setFrames(data.data)
      } else {
        setError(data.error || "获取眼镜框架失败")
      }
    } catch (err) {
      setError("网络错误，请重试")
    } finally {
      setLoading(false)
    }
  }

  // 获取所有分类
  const categories = ["all", ...Array.from(new Set(frames.map(frame => frame.category).filter(Boolean)))]
  
  // 过滤框架
  const filteredFrames = selectedCategory === "all" 
    ? frames 
    : frames.filter(frame => frame.category === selectedCategory)

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600">加载眼镜款式...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchFrames}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          重新加载
        </button>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 分类筛选 */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              disabled={disabled}
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {category === "all" ? "全部" : category}
            </button>
          ))}
        </div>
      )}

      {/* 框架网格 */}
      {filteredFrames.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFrames.map(frame => (
            <div
              key={frame.id}
              className={cn(
                "relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all duration-200",
                selectedFrameId === frame.id
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-gray-300",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => !disabled && onFrameSelect(frame.id)}
            >
              <div className="aspect-square relative">
                <img
                  src={frame.imageUrl}
                  alt={frame.name}
                  className="w-full h-full object-cover"
                />
                
                {selectedFrameId === frame.id && (
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-3">
                <h4 className="font-medium text-gray-900 text-sm truncate">
                  {frame.name}
                </h4>
                {frame.brand && (
                  <p className="text-xs text-gray-500 truncate">
                    {frame.brand}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">暂无可用的眼镜款式</p>
        </div>
      )}
    </div>
  )
}
