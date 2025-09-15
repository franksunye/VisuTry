"use client"

import { useState, useEffect } from "react"
import { ImageUpload } from "@/components/upload/ImageUpload"
import { FrameSelector } from "@/components/try-on/FrameSelector"
import { ResultDisplay } from "@/components/try-on/ResultDisplay"
import { Sparkles, ArrowRight, User, Glasses } from "lucide-react"
import { TryOnRequest } from "@/types"

export function TryOnInterface() {
  const [userImage, setUserImage] = useState<{ file: File; preview: string } | null>(null)
  const [glassesImage, setGlassesImage] = useState<{ file: File; preview: string } | null>(null)
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{ imageUrl: string; taskId: string } | null>(null)
  const [currentStep, setCurrentStep] = useState<"upload" | "select" | "process" | "result">("upload")
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [processingMessage, setProcessingMessage] = useState("AI正在处理您的试戴请求...")

  // 轮询检查任务状态
  useEffect(() => {
    if (!currentTaskId || !isProcessing) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/try-on/${currentTaskId}`)
        const data = await response.json()

        if (data.success) {
          const task = data.data

          if (task.status === "completed" && task.resultImageUrl) {
            setResult({
              imageUrl: task.resultImageUrl,
              taskId: task.id
            })
            setCurrentStep("result")
            setIsProcessing(false)
            setCurrentTaskId(null)
            clearInterval(pollInterval)
          } else if (task.status === "failed") {
            alert(task.errorMessage || "AI处理失败，请重试")
            setCurrentStep("select")
            setIsProcessing(false)
            setCurrentTaskId(null)
            clearInterval(pollInterval)
          } else if (task.status === "processing") {
            setProcessingMessage("AI正在分析您的照片和眼镜...")
          }
        }
      } catch (error) {
        console.error("检查任务状态失败:", error)
      }
    }, 2000) // 每2秒检查一次

    return () => clearInterval(pollInterval)
  }, [currentTaskId, isProcessing])

  const handleUserImageSelect = (file: File, preview: string) => {
    setUserImage({ file, preview })
    if (currentStep === "upload") {
      setCurrentStep("select")
    }
  }

  const handleUserImageRemove = () => {
    setUserImage(null)
    setCurrentStep("upload")
  }

  const handleGlassesImageSelect = (file: File, preview: string) => {
    setGlassesImage({ file, preview })
    setSelectedFrameId(null)
  }

  const handleGlassesImageRemove = () => {
    setGlassesImage(null)
  }

  const handleFrameSelect = (frameId: string) => {
    setSelectedFrameId(frameId)
    setGlassesImage(null)
  }

  const handleStartTryOn = async () => {
    if (!userImage || (!glassesImage && !selectedFrameId)) {
      return
    }

    setIsProcessing(true)
    setCurrentStep("process")

    try {
      const formData = new FormData()
      formData.append("userImage", userImage.file)
      
      if (glassesImage) {
        formData.append("glassesImage", glassesImage.file)
      } else if (selectedFrameId) {
        formData.append("frameId", selectedFrameId)
      }

      const response = await fetch("/api/try-on", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setCurrentTaskId(data.data.taskId)
        setProcessingMessage("AI正在处理您的试戴请求...")
        // 不立即设置结果，等待轮询获取完成状态
      } else {
        throw new Error(data.error || "试戴失败")
      }
    } catch (error) {
      console.error("试戴失败:", error)
      alert("试戴失败，请重试")
      setCurrentStep("select")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTryAgain = () => {
    setResult(null)
    setCurrentTaskId(null)
    setCurrentStep("upload")
  }

  const canProceed = userImage && (glassesImage || selectedFrameId)

  return (
    <div className="max-w-6xl mx-auto">
      {/* 步骤指示器 */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${currentStep !== "upload" ? "text-green-600" : "text-blue-600"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep !== "upload" ? "bg-green-100" : "bg-blue-100"
            }`}>
              <User className="w-4 h-4" />
            </div>
            <span className="ml-2 font-medium">上传照片</span>
          </div>
          
          <ArrowRight className="w-4 h-4 text-gray-400" />
          
          <div className={`flex items-center ${
            currentStep === "select" ? "text-blue-600" : 
            ["process", "result"].includes(currentStep) ? "text-green-600" : "text-gray-400"
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === "select" ? "bg-blue-100" : 
              ["process", "result"].includes(currentStep) ? "bg-green-100" : "bg-gray-100"
            }`}>
              <Glasses className="w-4 h-4" />
            </div>
            <span className="ml-2 font-medium">选择眼镜</span>
          </div>
          
          <ArrowRight className="w-4 h-4 text-gray-400" />
          
          <div className={`flex items-center ${
            currentStep === "process" ? "text-blue-600" : 
            currentStep === "result" ? "text-green-600" : "text-gray-400"
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === "process" ? "bg-blue-100" : 
              currentStep === "result" ? "bg-green-100" : "bg-gray-100"
            }`}>
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="ml-2 font-medium">AI试戴</span>
          </div>
        </div>
      </div>

      {currentStep === "result" && result ? (
        <ResultDisplay
          resultImageUrl={result.imageUrl}
          taskId={result.taskId}
          onTryAgain={handleTryAgain}
        />
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* 左侧：用户照片上传 */}
          <div className="space-y-6">
            <ImageUpload
              onImageSelect={handleUserImageSelect}
              onImageRemove={handleUserImageRemove}
              currentImage={userImage?.preview}
              label="上传您的照片"
              description="请上传清晰的正面照片，确保面部清楚可见"
              loading={isProcessing}
            />
          </div>

          {/* 右侧：眼镜选择 */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">选择眼镜款式</h3>
              
              {/* 自定义上传 */}
              <div className="mb-6">
                <ImageUpload
                  onImageSelect={handleGlassesImageSelect}
                  onImageRemove={handleGlassesImageRemove}
                  currentImage={glassesImage?.preview}
                  label="上传自定义眼镜"
                  description="或者从下方预设款式中选择"
                  loading={isProcessing}
                />
              </div>

              {/* 预设框架选择器 */}
              <FrameSelector
                selectedFrameId={selectedFrameId}
                onFrameSelect={handleFrameSelect}
                disabled={isProcessing || !!glassesImage}
              />
            </div>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      {currentStep !== "result" && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleStartTryOn}
            disabled={!canProceed || isProcessing}
            className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {processingMessage}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                开始AI试戴
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
