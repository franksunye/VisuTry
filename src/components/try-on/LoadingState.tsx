"use client"

import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"

interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = "AI is generating your try-on result..." }: LoadingStateProps) {
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[500px] p-8">
      {/* Shimmer Skeleton */}
      <div className="w-full max-w-md aspect-square bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg mb-6" />
      
      {/* Loading Icon */}
      <div className="flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
      </div>
      
      {/* Message */}
      <p className="text-lg font-medium text-gray-700 mb-2 text-center">
        {message}
      </p>
      
      {/* Spinner */}
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
      
      {/* Elapsed Time */}
      <p className="text-sm text-gray-500">
        Elapsed time: {elapsedTime}s
      </p>
    </div>
  )
}

