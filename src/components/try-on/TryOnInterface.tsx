"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { ImageUpload } from "@/components/upload/ImageUpload"
import { ResultDisplay } from "@/components/try-on/ResultDisplay"
import { LoadingState } from "@/components/try-on/LoadingState"
import { EmptyState } from "@/components/try-on/EmptyState"
import { Sparkles, ArrowRight, User, Glasses, AlertCircle, X } from "lucide-react"
import Link from "next/link"
import { analytics, getUserType } from "@/lib/analytics"

interface ErrorState {
  message: string
  type: 'quota' | 'processing' | 'generic'
  statusCode?: number
}

export function TryOnInterface() {
  const { data: session, update } = useSession()
  const [userImage, setUserImage] = useState<{ file: File; preview: string } | null>(null)
  const [glassesImage, setGlassesImage] = useState<{ file: File; preview: string } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{ imageUrl: string; taskId: string } | null>(null)
  const [currentStep, setCurrentStep] = useState<"upload" | "select" | "process" | "result">("upload")
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [processingMessage, setProcessingMessage] = useState("AI is processing your try-on request...")
  const [error, setError] = useState<ErrorState | null>(null)

  // Get quota info from session
  const remainingTrials = session?.user?.remainingTrials ?? 0
  const hasQuota = remainingTrials > 0

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

            // 🔥 关键修复：Try-on完成后刷新session，确保显示最新的使用次数和credits余额
            console.log('✅ Try-on completed: Refreshing session to update usage count...')
            update().catch((error) => {
              console.error('❌ Failed to refresh session after try-on:', error)
            })
          } else if (task.status === "failed") {
            alert(task.errorMessage || "Processing failed, please try again")
            setCurrentStep("select")
            setIsProcessing(false)
            setCurrentTaskId(null)
            clearInterval(pollInterval)
          } else if (task.status === "processing") {
            setProcessingMessage("Analyzing...")
          }
        }
      } catch (error) {
        console.error("Failed to check task status:", error)
      }
    }, 1000) // Check every 1 second for faster response

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
    setError(null)

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
        const taskData = data.data

        // Check if task is already completed (synchronous processing)
        if (taskData.status === "completed" && taskData.resultImageUrl) {
          // Task completed immediately, display result
          setResult({
            imageUrl: taskData.resultImageUrl,
            taskId: taskData.taskId
          })
          setCurrentStep("result")
          setIsProcessing(false)

          // Refresh session to update usage count
          console.log('✅ Try-on completed: Refreshing session to update usage count...')
          update().catch((error) => {
            console.error('❌ Failed to refresh session after try-on:', error)
          })
        } else {
          // Task still processing, start polling
          setCurrentTaskId(taskData.taskId)
          setProcessingMessage("Processing...")
          // Keep isProcessing=true for polling to continue
        }
      } else {
        // Handle API errors with specific error types
        const errorMessage = data.error || "Try-on failed"
        const isQuotaError = response.status === 403 && errorMessage.includes("quota")

        setError({
          message: errorMessage,
          type: isQuotaError ? 'quota' : 'generic',
          statusCode: response.status
        })

        setCurrentStep("select")
        setIsProcessing(false)
      }
    } catch (error) {
      console.error("Try-on failed:", error)
      setError({
        message: "An unexpected error occurred. Please try again.",
        type: 'generic'
      })
      setCurrentStep("select")
      setIsProcessing(false)
    }
  }

  const handleTryAgain = () => {
    setResult(null)
    setCurrentTaskId(null)
    setCurrentStep("select")  // Return to step 2 (select glasses) instead of step 1, keeping uploaded photos
  }

  const canProceed = userImage && glassesImage

  // Error Modal Component
  const ErrorModal = () => {
    if (!error) return null

    const isQuotaError = error.type === 'quota'

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className={`p-4 border-b ${isQuotaError ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className={`w-5 h-5 ${isQuotaError ? 'text-red-600' : 'text-orange-600'}`} />
                <h3 className={`font-semibold ${isQuotaError ? 'text-red-900' : 'text-orange-900'}`}>
                  {isQuotaError ? 'No Try-Ons Available' : 'Try-On Failed'}
                </h3>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className={`text-sm mb-4 ${isQuotaError ? 'text-red-800' : 'text-gray-700'}`}>
              {error.message}
            </p>

            {isQuotaError && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-800">
                  <strong>💡 Tip:</strong> You can purchase Credits or upgrade to Standard membership to continue using try-ons.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50 flex gap-3">
            <button
              onClick={() => setError(null)}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            {isQuotaError && (
              <Link
                href="/pricing"
                onClick={() => {
                  const creditsPurchased = (session?.user as any)?.creditsPurchased || 0
                  const creditsUsed = (session?.user as any)?.creditsUsed || 0
                  const creditsRemaining = creditsPurchased - creditsUsed
                  const userType = getUserType(
                    session?.user?.isPremiumActive || false,
                    creditsRemaining,
                    !!session
                  )
                  analytics.trackQuotaExhaustedCTA('error_modal', userType)
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                View Plans
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Error Modal */}
      <ErrorModal />
      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${currentStep !== "upload" ? "text-green-600" : "text-blue-600"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep !== "upload" ? "bg-green-100" : "bg-blue-100"
            }`}>
              <User className="w-4 h-4" />
            </div>
            <span className="ml-2 font-medium">Photo</span>
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
            <span className="ml-2 font-medium">Glasses</span>
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
            <span className="ml-2 font-medium">Try-On</span>
          </div>
        </div>
      </div>

      {/* Main Content: Left-Right Layout (Desktop) / Top-Bottom Layout (Mobile) */}
      <div className="grid lg:grid-cols-[400px_1fr] gap-8">
        {/* Result Preview Area - Shows first on mobile, right on desktop */}
        {/* Height matches left side: 300px (photo) + 20px (gap) + 180px (glasses) = 500px */}
        <div className="h-[500px] overflow-hidden border-2 border-gray-300 border-dashed rounded-lg lg:order-2 bg-gray-50 flex flex-col">
          {isProcessing ? (
            <LoadingState message={processingMessage} />
          ) : result ? (
            <div className="p-6 h-full flex flex-col">
              <ResultDisplay
                resultImageUrl={result.imageUrl}
                taskId={result.taskId}
                onTryAgain={handleTryAgain}
              />
            </div>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Photo Uploads - Shows second on mobile, left on desktop */}
        <div className="space-y-5 lg:order-1">
          {/* User Photo Upload */}
          <ImageUpload
            onImageSelect={handleUserImageSelect}
            onImageRemove={handleUserImageRemove}
            currentImage={userImage?.preview}
            label="Your Photo"
            description="Clear front-facing photo"
            loading={isProcessing}
            height="h-[300px]"
            iconType="user"
          />

          {/* Glasses Photo Upload */}
          <ImageUpload
            onImageSelect={handleGlassesImageSelect}
            onImageRemove={handleGlassesImageRemove}
            currentImage={glassesImage?.preview}
            label="Glasses"
            description="Clear image of glasses"
            loading={isProcessing}
            height="h-[180px]"
            iconType="glasses"
          />
        </div>
      </div>

      {/* Action Button */}
      {currentStep !== "result" && (
        <div className="flex flex-col items-center gap-4 mt-8">
          <button
            onClick={handleStartTryOn}
            disabled={!canProceed || isProcessing || !hasQuota}
            title={!hasQuota ? "No remaining try-ons. Please upgrade." : ""}
            className="flex items-center px-8 py-3 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin" />
                {processingMessage}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Try On
              </>
            )}
          </button>

          {/* Quota warning when no quota */}
          {!hasQuota && !isProcessing && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>No remaining try-ons</span>
              <Link
                href="/pricing"
                onClick={() => {
                  const creditsPurchased = (session?.user as any)?.creditsPurchased || 0
                  const creditsUsed = (session?.user as any)?.creditsUsed || 0
                  const creditsRemaining = creditsPurchased - creditsUsed
                  const userType = getUserType(
                    session?.user?.isPremiumActive || false,
                    creditsRemaining,
                    !!session
                  )
                  analytics.trackQuotaExhaustedCTA('try_on', userType)
                }}
                className="font-semibold underline hover:text-red-700"
              >
                Upgrade now
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
