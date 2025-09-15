"use client"

import { useState, useCallback, ReactNode } from "react"
import { cn } from "@/utils/cn"

interface DragDropZoneProps {
  onFileDrop: (files: File[]) => void
  accept?: string
  multiple?: boolean
  disabled?: boolean
  className?: string
  children: ReactNode
}

export function DragDropZone({
  onFileDrop,
  accept = "image/*",
  multiple = false,
  disabled = false,
  className,
  children
}: DragDropZoneProps) {
  const [dragOver, setDragOver] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (disabled) return
    
    setDragCounter(prev => prev + 1)
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (disabled) return
    
    setDragCounter(prev => {
      const newCounter = prev - 1
      if (newCounter === 0) {
        setDragOver(false)
      }
      return newCounter
    })
  }, [disabled])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (disabled) return
    
    setDragOver(false)
    setDragCounter(0)
    
    const files = Array.from(e.dataTransfer.files)
    
    if (files.length > 0) {
      // 过滤文件类型
      const acceptedFiles = files.filter(file => {
        if (accept === "image/*") {
          return file.type.startsWith("image/")
        }
        
        const acceptedTypes = accept.split(",").map(type => type.trim())
        return acceptedTypes.includes(file.type)
      })
      
      if (acceptedFiles.length > 0) {
        onFileDrop(multiple ? acceptedFiles : [acceptedFiles[0]])
      }
    }
  }, [onFileDrop, accept, multiple, disabled])

  return (
    <div
      className={cn(
        "relative transition-all duration-200",
        dragOver && !disabled && "ring-2 ring-blue-400 ring-opacity-50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      
      {dragOver && !disabled && (
        <div className="absolute inset-0 bg-blue-100 bg-opacity-80 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <div className="text-blue-600 text-lg font-medium mb-2">
              释放文件以上传
            </div>
            <div className="text-blue-500 text-sm">
              {multiple ? "支持多个文件" : "单个文件"}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
