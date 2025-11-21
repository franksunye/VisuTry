"use client"

import { ImageIcon } from "lucide-react"
import { TryOnType, getTryOnConfig } from "@/config/try-on-types"

interface EmptyStateProps {
  message?: string
  type?: TryOnType
}

export function EmptyState({ message, type = 'GLASSES' }: EmptyStateProps) {
  const config = getTryOnConfig(type)
  const displayMessage = message || config.emptyStateMessage

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <ImageIcon className="w-10 h-10 text-gray-400" />
      </div>

      <p className="text-base text-gray-500 max-w-md">
        {displayMessage}
      </p>
    </div>
  )
}

