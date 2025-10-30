"use client"

import { useEffect, useState } from "react"

interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = "Generating your result..." }: LoadingStateProps) {
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      {/* Shimmer Skeleton with Spinner Overlay */}
      <div className="relative w-full max-w-sm h-80 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg mb-6">
        {/* Centered Spinner */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>

      {/* Message */}
      <p className="text-base font-medium text-gray-700 mb-2 text-center">
        {message}
      </p>

      {/* Elapsed Time */}
      <p className="text-sm text-gray-500">
        Processing time: {elapsedTime}s
      </p>
    </div>
  )
}

