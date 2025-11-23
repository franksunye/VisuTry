"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, X, Image as ImageIcon, Loader2, User, Glasses, Shirt, Footprints, Watch } from "lucide-react"
import { validateImageFile, compressImage, createImagePreview } from "@/utils/image"
import { cn } from "@/utils/cn"
import { logger } from "@/lib/logger"

interface ImageUploadProps {
  onImageSelect: (file: File, preview: string) => void
  onImageRemove: () => void
  currentImage?: string
  loading?: boolean
  className?: string
  label?: string
  description?: string
  accept?: string
  height?: string
  iconType?: "image" | "user" | "glasses" | "outfit" | "shoes" | "accessories"
}

export function ImageUpload({
  onImageSelect,
  onImageRemove,
  currentImage,
  loading = false,
  className,
  label = "Upload Image",
  description = "JPEG, PNG, or WebP",
  accept = "image/jpeg,image/png,image/webp",
  height,
  iconType = "image"
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
      // Compress image
      const compressedFile = await compressImage(file)

      // Create preview
      const preview = await createImagePreview(compressedFile)
      
      onImageSelect(compressedFile, preview)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error("Image processing failed:", error)
      logger.error('general', 'Image processing failed', err)
      alert("Image processing failed, please try again")
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

  const getIcon = () => {
    switch (iconType) {
      case "user":
        return <User className="w-7 h-7 text-blue-600" />
      case "glasses":
        return <Glasses className="w-7 h-7 text-blue-600" />
      case "outfit":
        return <Shirt className="w-7 h-7 text-blue-600" />
      case "shoes":
        return <Footprints className="w-7 h-7 text-blue-600" />
      case "accessories":
        return <Watch className="w-7 h-7 text-blue-600" />
      default:
        return <ImageIcon className="w-7 h-7 text-blue-600" />
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer",
          "hover:border-blue-400 hover:bg-blue-50",
          dragOver && "border-blue-400 bg-blue-50",
          isLoading && "cursor-not-allowed opacity-50",
          currentImage ? "border-green-300 bg-green-50" : "border-gray-300 bg-gray-50",
          height
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
          aria-label={label}
        />

        {currentImage ? (
          <div className="relative h-full">
            <img
              src={currentImage}
              alt={`Uploaded ${label?.toLowerCase() || 'image'}`}
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
              disabled={isLoading}
              aria-label={`Remove ${label?.toLowerCase() || 'image'}`}
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
          <div className="h-full flex items-center justify-center p-6">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-sm text-gray-600">Processing image...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  {dragOver ? (
                    <Upload className="w-7 h-7 text-blue-600" />
                  ) : (
                    getIcon()
                  )}
                </div>
                {description && (
                  <p className="text-lg font-semibold text-gray-900 mb-1">{description}</p>
                )}
                <p className="text-base font-medium text-gray-600">
                  {dragOver ? "Drop to upload" : "Click or drag to upload"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
