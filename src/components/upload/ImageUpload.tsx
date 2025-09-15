"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { validateImageFile, compressImage, createImagePreview } from "@/utils/image"
import { cn } from "@/utils/cn"

interface ImageUploadProps {
  onImageSelect: (file: File, preview: string) => void
  onImageRemove: () => void
  currentImage?: string
  loading?: boolean
  className?: string
  label?: string
  description?: string
  accept?: string
}

export function ImageUpload({
  onImageSelect,
  onImageRemove,
  currentImage,
  loading = false,
  className,
  label = "上传图片",
  description = "支持 JPEG、PNG、WebP 格式，最大 5MB",
  accept = "image/jpeg,image/png,image/webp"
}: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (file: File) => {
    const validation = validateImageFile(file)
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    setUploading(true)
    try {
      // 压缩图片
      const compressedFile = await compressImage(file)
      
      // 创建预览
      const preview = await createImagePreview(compressedFile)
      
      onImageSelect(compressedFile, preview)
    } catch (error) {
      console.error("图片处理失败:", error)
      alert("图片处理失败，请重试")
    } finally {
      setUploading(false)
    }
  }, [onImageSelect])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleClick = useCallback(() => {
    if (!loading && !uploading) {
      fileInputRef.current?.click()
    }
  }, [loading, uploading])

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onImageRemove()
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [onImageRemove])

  const isLoading = loading || uploading

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer",
          "hover:border-blue-400 hover:bg-blue-50",
          dragOver && "border-blue-400 bg-blue-50",
          isLoading && "cursor-not-allowed opacity-50",
          currentImage ? "border-green-300 bg-green-50" : "border-gray-300 bg-gray-50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isLoading}
        />

        {currentImage ? (
          <div className="relative">
            <img
              src={currentImage}
              alt="上传的图片"
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              disabled={isLoading}
            >
              <X className="w-4 h-4" />
            </button>
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-sm text-gray-600">处理图片中...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  {dragOver ? (
                    <Upload className="w-8 h-8 text-blue-600" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-blue-600" />
                  )}
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {dragOver ? "释放以上传图片" : "点击或拖拽上传图片"}
                </p>
                {description && (
                  <p className="text-sm text-gray-500">{description}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
