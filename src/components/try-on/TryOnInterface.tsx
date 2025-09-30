"use client"

import { useState, useEffect } from "react"
import { ImageUpload } from "@/components/upload/ImageUpload"
import { ResultDisplay } from "@/components/try-on/ResultDisplay"
import { Sparkles, ArrowRight, User, Glasses } from "lucide-react"
import { TryOnRequest } from "@/types"

export function TryOnInterface() {
  const [userImage, setUserImage] = useState<{ file: File; preview: string } | null>(null)
  const [glassesImage, setGlassesImage] = useState<{ file: File; preview: string } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{ imageUrl: string; taskId: string } | null>(null)
  const [currentStep, setCurrentStep] = useState<"upload" | "select" | "process" | "result">("upload")
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [processingMessage, setProcessingMessage] = useState("AI is processing your try-on request...")

  // Poll task status
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
            alert(task.errorMessage || "AI processing failed, please try again")
            setCurrentStep("select")
            setIsProcessing(false)
            setCurrentTaskId(null)
            clearInterval(pollInterval)
          } else if (task.status === "processing") {
            setProcessingMessage("AI is analyzing your photo and glasses...")
          }
        }
      } catch (error) {
        console.error("Failed to check task status:", error)
      }
    }, 2000) // Check every 2 seconds

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
  }

  const handleGlassesImageRemove = () => {
    setGlassesImage(null)
  }

  const handleStartTryOn = async () => {
    if (!userImage || !glassesImage) {
      return
    }

    setIsProcessing(true)
    setCurrentStep("process")

    try {
      const formData = new FormData()
      formData.append("userImage", userImage.file)
      formData.append("glassesImage", glassesImage.file)

      const response = await fetch("/api/try-on", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setCurrentTaskId(data.data.taskId)
        setProcessingMessage("AI is processing your try-on request...")
        // Don't set result immediately, wait for polling to get completion status
      } else {
        throw new Error(data.error || "Try-on failed")
      }
    } catch (error) {
      console.error("Try-on failed:", error)
      alert("Try-on failed, please try again")
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

  const canProceed = userImage && glassesImage

  return (
    <div className="max-w-6xl mx-auto">
      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${currentStep !== "upload" ? "text-green-600" : "text-blue-600"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep !== "upload" ? "bg-green-100" : "bg-blue-100"
            }`}>
              <User className="w-4 h-4" />
            </div>
            <span className="ml-2 font-medium">Upload Photo</span>
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
            <span className="ml-2 font-medium">Select Glasses</span>
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
            <span className="ml-2 font-medium">AI Try-On</span>
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
          {/* Left: User Photo Upload */}
          <div className="space-y-6">
            <ImageUpload
              onImageSelect={handleUserImageSelect}
              onImageRemove={handleUserImageRemove}
              currentImage={userImage?.preview}
              label="Upload Your Photo"
              description="Please upload a clear front-facing photo with your face clearly visible"
              loading={isProcessing}
            />
          </div>

          {/* Right: Glasses Upload */}
          <div className="space-y-6">
            <ImageUpload
              onImageSelect={handleGlassesImageSelect}
              onImageRemove={handleGlassesImageRemove}
              currentImage={glassesImage?.preview}
              label="Upload Glasses Image"
              description="Please upload a clear image of the glasses you want to try on"
              loading={isProcessing}
            />
          </div>
        </div>
      )}

      {/* Action Button */}
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
                Start AI Try-On
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
